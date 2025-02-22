import React from 'react';
import { ChevronRight, Clock, FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '../ui/card';
import clsx from 'clsx';

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
        isOpen ? 'w-full md:w-64' : 'w-0 overflow-hidden'
      }`}
    >
      <div className="h-full flex flex-col min-w-[16rem]">
        <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-primary-200/30 bg-background-300/20">
          <h2 className="text-base font-title text-text-700 font-semibold">Past Analyses</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-accent/10 transition-colors duration-200 text-text-700 hover:text-text-900 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-col h-full">
          <div className="flex-none p-3">
            <Button
              onClick={onCreateNew}
              className="w-full flex items-center justify-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white py-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Analysis
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {!analyses || analyses.length === 0 ? (
              <div className="p-3 text-center text-primary-600 text-sm">
                No analyses yet. Create your first one!
              </div>
            ) : (
              analyses.map((analysis) => (
                <Card
                  key={analysis.id}
                  className={clsx("group mb-2 cursor-pointer transition-all border border-primary-900/20 rounded-lg bg-primary-300/30 hover:bg-primary-400/40", analysis.id === selectedAnalysisId && "bg-primary-400/60 hover:bg-primary-400/60 hover:cursor-default")}
                  onClick={() => onSelectAnalysis(analysis.id)}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-primary-900">
                        {analysis.patientName}
                      </h3>
                      <ChevronRight className={clsx("w-4 h-4 text-primary-400 group-hover:text-primary-900 transition-all", analysis.id === selectedAnalysisId && "text-primary-900" )} />
                    </div>
                    
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-primary-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(analysis.date).toLocaleDateString()}</span>
                    </div>

                    {analysis.symptoms && (
                      <div className="mt-1.5 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-primary-500 mt-0.5" />
                        <p className="text-xs text-primary-700 line-clamp-1">
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