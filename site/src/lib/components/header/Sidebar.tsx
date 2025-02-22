import React from 'react';
import { ChevronRight, Clock, FileText, Plus, X } from 'lucide-react';
import PastAnalyses from '@/lib/components/sidebar/PastAnalyses';
import { Button } from '@/components/ui/button';
import { Card } from '../ui/card';

interface Analysis {
  id: string;
  patientName: string;
  date: string;
  age: number;
  symptoms: string;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onCreateNew: () => void;
  onSelectAnalysis: (id: string) => void;
  selectedAnalysisId?: string;
  analyses: Analysis[];
  isLoading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  onCreateNew,
  onSelectAnalysis,
  selectedAnalysisId,
  analyses,
  isLoading
}) => {
  return (
    <div
      className={`fixed md:static top-16 bg-background-100/50 backdrop-blur-xl border-r border-primary-200/30 shadow-lg transition-all duration-300 h-[calc(100vh-4rem)] ${
        isOpen ? 'w-full md:w-72' : 'w-0 overflow-hidden'
      }`}
    >
      <div className="h-full flex flex-col min-w-[18rem]">
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-primary-200/30 bg-background-300/20">
          <h2 className="text-lg font-title text-text-700 font-bold">Past Analyses</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-text-700 hover:text-text-900 md:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

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
      </div>
    </div>
  );
};

export default Sidebar;