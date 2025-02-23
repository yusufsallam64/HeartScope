import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { AnalysisService } from '@/lib/db/analysisservice';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
// Import node-fetch explicitly
import fetch from 'node-fetch';
import FormData from 'form-data';

interface AnalysisResult {
  filename: string;
  annotations: any[]; // Replace with proper type from FastAPI response
  visualization_path: string | null;
}

interface FastAPIResponse {
  results: AnalysisResult[];
}

interface ResponseData {
  message: string;
  analysisId?: string;
  results?: AnalysisResult[];
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
      body: formData as any, // FormData from 'form-data' is compatible with node-fetch
      headers: formData.getHeaders() // Important: Include the FormData headers
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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Adjust this limit based on your needs
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
      // Remove the data:image/jpeg;base64, prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    });

    // Process images through FastAPI
    const fastAPIResults = await processImagesWithFastAPI(imageBuffers);

    // Prepare patient info
    const patientInfo = {
      name,
      age,
      symptoms: symptoms || '',
      medicalHistory: medicalHistory || '',
      currentMedications: currentMedications || '',
      analysisResults: fastAPIResults.results,
      // Convert visualization paths to base64
      analyzedImages: await Promise.all(
          fastAPIResults.results
              .filter(result => result.visualization_path !== null)
              .map(async result => {
                  const response = await fetch(`http://localhost:8000${result.visualization_path}`);
                  const arrayBuffer = await response.arrayBuffer();
                  const buffer = Buffer.from(arrayBuffer);
                  const base64 = buffer.toString('base64');
                  const mimeType = 'image/jpeg'; // Adjust if needed based on actual image type
                  return `data:${mimeType};base64,${base64}`;
              })
      )
  };
  
    // Save everything to MongoDB
    const analysisId = await AnalysisService.createAnalysis(
      patientInfo,
      images, // Original images
      new ObjectId(session.user.id)
    );

    // Return success response with all data
    return res.status(200).json({
      message: 'Analysis saved successfully',
      analysisId: analysisId.toString(),
      results: fastAPIResults.results
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