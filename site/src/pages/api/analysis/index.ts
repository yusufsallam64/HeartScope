import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { AnalysisService } from '@/lib/db/analysisservice';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import fetch from 'node-fetch';
import FormData from 'form-data';
import OpenAI from 'openai';

import { z } from 'zod'; 
import { zodResponseFormat } from "openai/helpers/zod";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface FastAPIAnalysisResult {
  filename: string;
  annotations: any[]; // Replace with proper type from FastAPI response
  visualization_path: string | null;
}

interface FastAPIResponse {
  results: FastAPIAnalysisResult[];
}

interface ResponseData {
  message: string;
  analysisId?: string;
  fastApiResults?: FastAPIAnalysisResult[];
  openAIResults?: OpenAIAnalysisResult;
}

async function processImagesWithFastAPI(images: Buffer[]): Promise<FastAPIResponse> {
  try {
    const formData = new FormData();
    
    // Append each image buffer to the FormData
    images.forEach((imageBuffer, index) => {
      formData.append('files', imageBuffer, {
        filename: `image${index}.jpg`,
        contentType: 'image/jpeg',
      });
    });

    const response = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`FastAPI Error: ${response.statusText}`);
    }

    return (await response.json()) as FastAPIResponse;
  } catch (error) {
    console.error('FastAPI processing error:', error);
    throw new Error('Failed to process images with FastAPI service');
  }
}

// Define Zod schemas for our types
const BlockageValidation = z.object({
  location: z.string().describe("Name of the affected artery"),
  severity: z.number().describe("Percentage of blockage"),
  confidence: z.number().describe("Confidence in blockage assessment from 0-100")
});

const RiskFactor = z.object({
  factor: z.string().describe("Name of the risk factor"),
  impact: z.number().describe("Impact score of this risk factor (0-10)")
});

const MedicalAnalysis = z.object({
  risk_score: z.number().describe("Risk score from 0-100"),
  risk_category: z.enum(["Low", "Moderate", "High", "Critical"])
    .describe("Risk category based on score: Low (0-20), Moderate (21-40), High (41-60), Critical (>60)"),
  diagnosis_confidence: z.number().describe("Confidence in diagnosis from 0-100"),
  blockage_validation: BlockageValidation,
  risk_factors: z.array(RiskFactor),
  recommendations: z.array(z.string()).describe("Prioritized list of clinical recommendations")
});

// Create type from schema
type OpenAIAnalysisResult = z.infer<typeof MedicalAnalysis>;

async function processWithOpenAI(patientData: any, fastApiResults: FastAPIAnalysisResult[]): Promise<OpenAIAnalysisResult> {
  try {
    const systemPrompt = `You are an AI medical analysis system specializing in cardiovascular disease diagnosis validation.
You analyze patient data, vision model results, and risk factors to provide comprehensive diagnosis validation.
Follow the RAG pipeline workflow to analyze the data and provide structured recommendations.`;

    const userPrompt = `
**Input Data Integration**:
1. Vision Model Output (FastAPI Analysis):
  ${fastApiResults.map(result => `- Image: ${result.filename}, Annotations: ${result.annotations}`).join('\n')}

2. Patient Data:
- Demographics: Age ${patientData.age}, Name: ${patientData.name}
- Current Symptoms: ${patientData.symptoms}
- Medical History: ${patientData.medicalHistory}
- Current Medications: ${patientData.currentMedications}

Please analyze this data following the RAG pipeline workflow for cardiovascular disease diagnosis validation.`;

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt }
          ]
        }
      ],
      response_format: zodResponseFormat(MedicalAnalysis, "medical_analysis")
    });

    // Parse is no longer needed as the beta interface handles it
    const result = completion.choices[0].message.parsed;

    // Still check for refusal and errors
    if (completion.choices[0].finish_reason === "length") {
      throw new Error("Response was truncated due to length");
    }

    if (!result) {
      throw new Error("No content in OpenAI response");
    }

    return result;

  } catch (error) {
    console.error('OpenAI processing error:', error);
    throw new Error('Failed to process analysis with OpenAI');
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
    
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { 
      name, 
      age, 
      symptoms, 
      medicalHistory, 
      currentMedications, 
      images 
    } = req.body;

    if (!name || !age || !images?.length) {
      return res.status(400).json({ 
        message: 'Missing required fields. Name, age, and at least one image are required.' 
      });
    }

    // Convert base64 images to buffers
    const imageBuffers = images.map((image: string) => {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    });

    // 1. Process images through FastAPI first
    const fastAPIResults = await processImagesWithFastAPI(imageBuffers);

    // Get analyzed images with visualizations from FastAPI
    const analyzedImages = await Promise.all(
      fastAPIResults.results
        .filter(result => result.visualization_path !== null)
        .map(async result => {
          const response = await fetch(`http://localhost:8000${result.visualization_path}`);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString('base64');
          const mimeType = 'image/jpeg';
          return `data:${mimeType};base64,${base64}`;
        })
    );

    // 2. Process with OpenAI using both original data and FastAPI results
    const openAIResults = await processWithOpenAI({
      name,
      age,
      symptoms,
      medicalHistory,
      currentMedications,
      analyzedImages
    }, fastAPIResults.results);

    // Prepare patient info
    const patientInfo = {
      name,
      age,
      symptoms: symptoms || '',
      medicalHistory: medicalHistory || '',
      currentMedications: currentMedications || '',
      fastApiResults: fastAPIResults.results,
      openAIResults,
      analyzedImages
    };
  
    // Save everything to MongoDB
    const analysisId = await AnalysisService.createAnalysis(
      patientInfo,
      images,
      new ObjectId(session.user.id)
    );

    // Return success response with all data
    return res.status(200).json({
      message: 'Analysis saved successfully',
      analysisId: analysisId.toString(),
      fastApiResults: fastAPIResults.results,
      openAIResults: openAIResults
    });

  } catch (error) {
    console.error('Analysis error:', error);
    if (error instanceof Error) {
      return res.status(500).json({ 
        message: `Internal server error: ${error.message}` 
      });
    }
    return res.status(500).json({ 
      message: 'Internal server error' 
    });
  }
}