import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight, FileText, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  analyses: Analysis[];
  isLoading: boolean;
}

const PastAnalyses: React.FC<PastAnalysesProps> = ({
  onCreateNew,
  onSelectAnalysis,
  selectedAnalysisId,
  analyses,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-none p-4">
          <Button
            disabled
            className="w-full flex items-center gap-2 bg-primary-500/50 text-white cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            New Analysis
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
        {!analyses || analyses.length === 0 ? (
          <div className="p-4 text-center text-primary-600">
            No analyses yet. Create your first one!
          </div>
        ) : (
          analyses.map((analysis) => (
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
                  <span>{new Date(analysis.date).toLocaleDateString()}</span>
                </div>
                
                {analysis.symptoms && (
                  <div className="mt-2 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-primary-500 mt-1" />
                    <p className="text-sm text-primary-700 line-clamp-2">
                      {analysis.symptoms}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PastAnalyses;