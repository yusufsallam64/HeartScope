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
    id: string;
    patientName: string;
    age: number;
    date: string;
    medicalHistory: string;
    currentMedications: string;
    symptoms: string;
    images: string[];
    analyzedImages: string[]; 
}