import { NextApiRequest, NextApiResponse } from 'next';
import { ObjectId } from 'mongodb';
import { AnalysisService } from '@/lib/db/analysisservice';
import { DatabaseService } from '@/lib/db/service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user session
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from database
    const user = await DatabaseService.getUserByEmail(session.user.email);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Fetch all analyses for the user
    const analyses = await AnalysisService.getAnalysisByUser(user._id);

    // Format the analyses for the frontend
    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis._id.toHexString(),
      patientName: analysis.patientInfo.name,
      age: parseInt(analysis.patientInfo.age),
      date: analysis.createdAt.toISOString(),
      medicalHistory: analysis.patientInfo.medicalHistory,
      currentMedications: analysis.patientInfo.currentMedications,
      symptoms: analysis.patientInfo.symptoms,
      images: analysis.images,
      analyzedImages: analysis.patientInfo.analyzedImages || []
  }));


    console.log('Fetched analyses:', formattedAnalyses);

    return res.status(200).json(formattedAnalyses);
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}