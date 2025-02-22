import type { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { AnalysisService } from '@/lib/db/analysisservice';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

type ResponseData = {
  message: string;
  analysisId?: string;
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

    const { name, age, symptoms, medicalHistory, currentMedications, images } = req.body;

    if (!name || !age || !images?.length) {
      return res.status(400).json({ 
        message: 'Missing required fields. Name, age, and at least one image are required.' 
      });
    }

    const patientInfo = {
      name,
      age,
      symptoms: symptoms || '',
      medicalHistory: medicalHistory || '',
      currentMedications: currentMedications || ''
    };

    const analysisId = await AnalysisService.createAnalysis(
      patientInfo,
      images,
      new ObjectId(session.user.id)
    );

    return res.status(200).json({
      message: 'Analysis saved successfully',
      analysisId: analysisId.toString()
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}