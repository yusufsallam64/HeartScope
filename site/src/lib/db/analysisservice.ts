import { ObjectId } from 'mongodb';
import { getCollection } from './client';

export interface PatientInfo {
  analyzedImages?: string[];
  name: string;
  age: string;
  symptoms: string;
  medicalHistory: string;
  currentMedications: string;
  
}

export interface Analysis {
  _id: ObjectId;
  patientInfo: PatientInfo;
  images: string[];
  analyzedImages: string[];
  userId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  openAIResults: any;
}

export class AnalysisService {
  static async createAnalysis(
    patientInfo: PatientInfo,
    images: string[],
    openAIResults: any,
    userId: ObjectId
  ): Promise<ObjectId> {
    const analyses = await getCollection<Analysis>('analyses');
    
    const analysis: Omit<Analysis, '_id'> = {
      patientInfo,
      images,
      analyzedImages: [],
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      openAIResults: openAIResults || {}
    };

    const result = await analyses.insertOne(analysis as Analysis);
    return result.insertedId;
  }

  static async getAnalysisByUser(userId: ObjectId): Promise<Analysis[]> {
    const analyses = await getCollection<Analysis>('analyses');
    return analyses.find({ userId }).toArray();
  }

  static async getAnalysisById(analysisId: ObjectId): Promise<Analysis | null> {
    const analyses = await getCollection<Analysis>('analyses');
    return analyses.findOne({ _id: analysisId });
  }

  static async updateAnalysis(
    analysisId: ObjectId,
    updates: Partial<Omit<Analysis, '_id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    const analyses = await getCollection<Analysis>('analyses');
    await analyses.updateOne(
      { _id: analysisId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      }
    );
  }

  static async deleteAnalysis(analysisId: ObjectId): Promise<void> {
    const analyses = await getCollection<Analysis>('analyses');
    await analyses.deleteOne({ _id: analysisId });
  }
}