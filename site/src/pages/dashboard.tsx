import React, { useState } from 'react';
import { DashboardLayout } from '@/lib/layouts';
import NewAnalysis from '@/lib/components/dashboard/NewAnalysis';
import AnalysisDetail from '@/lib/components/dashboard/AnalysisDetail';
import { Menu, Sidebar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>();
  const [view, setView] = useState<'new' | 'detail'>('new');

  const handleCreateNew = () => {
    setSelectedAnalysisId(undefined);
    setView('new');
  };

  const handleSelectAnalysis = (id: string) => {
    setSelectedAnalysisId(id);
    setView('detail');
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onCreateNew={handleCreateNew}
          onSelectAnalysis={handleSelectAnalysis}
          selectedAnalysisId={selectedAnalysisId}
        />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              
              <h1 className="text-3xl font-bold text-primary-900">
                {view === 'new' ? 'New Analysis' : 'Analysis Details'}
              </h1>
            </div>

            {view === 'new' ? (
              <NewAnalysis />
            ) : (
              <AnalysisDetail id={selectedAnalysisId} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;