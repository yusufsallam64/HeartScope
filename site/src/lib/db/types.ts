import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export interface FrontendAnalysis {
  patientName: string;
  age: number;
  date: string;
  symptoms: string;
  medicalHistory: string;
  currentMedications: string;
  images: string[];
  analyzedImages: string[];
  openAIResults: {
    risk_score: number;
    risk_category: "Low" | "Moderate" | "High" | "Critical";
    diagnosis_confidence: number;
    blockage_validation: {
      location: string;
      severity: number;
      confidence: number;
    };
    risk_factors: Array<{
      factor: string;
      impact: number;
    }>;
    recommendations: string[];
  };
}