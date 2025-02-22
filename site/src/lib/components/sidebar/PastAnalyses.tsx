import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight, FileText, Plus } from 'lucide-react';

interface Analysis {
  id: string;
  patientName: string;
  date: string;
  age: number;
  symptoms: string;
}

interface PastAnalysesProps {
  onCreateNew: () => void;
  onSelectAnalysis: (id: string) => void;
  selectedAnalysisId?: string;
}

const PastAnalyses: React.FC<PastAnalysesProps> = ({
  onCreateNew,
  onSelectAnalysis,
  selectedAnalysisId
}) => {
  // This would normally come from an API call
  const analyses: Analysis[] = [
    {
      id: '1',
      patientName: 'John Doe',
      date: '2025-02-22',
      age: 45,
      symptoms: 'Chest pain, shortness of breath'
    },
    {
      id: '2',
      patientName: 'Jane Smith',
      date: '2025-02-21',
      age: 32,
      symptoms: 'Dizziness, fatigue'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4">
        <Button
          onClick={onCreateNew}
          className="w-full flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white"
        >
          <Plus className="w-4 h-4" />
          New Analysis
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {analyses.map((analysis) => (
          <Card
            key={analysis.id}
            className={`m-2 cursor-pointer transition-colors duration-200 hover:bg-primary-50 ${
              selectedAnalysisId === analysis.id ? 'bg-primary-100 border-primary-500' : 'bg-white'
            }`}
            onClick={() => onSelectAnalysis(analysis.id)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary-900">
                  {analysis.patientName}
                </h3>
                <ChevronRight className="w-5 h-5 text-primary-500" />
              </div>
              
              <div className="mt-2 flex items-center gap-2 text-sm text-primary-600">
                <Clock className="w-4 h-4" />
                <span>{analysis.date}</span>
              </div>
              
              <div className="mt-2 flex items-start gap-2">
                <FileText className="w-4 h-4 text-primary-500 mt-1" />
                <p className="text-sm text-primary-700 line-clamp-2">
                  {analysis.symptoms}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PastAnalyses;