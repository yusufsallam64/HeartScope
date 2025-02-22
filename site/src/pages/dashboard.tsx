import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/lib/layouts';
import NewAnalysis from '@/lib/components/dashboard/NewAnalysis';
import AnalysisDetail from '@/lib/components/dashboard/AnalysisDetail';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FrontendAnalysis as Analysis } from '@/lib/db/types';

const Dashboard = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>();
  const [view, setView] = useState<'new' | 'detail'>('new');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentAnalysis = analyses.find((analysis) => analysis.id === selectedAnalysisId);

  const session = useSession();

  useEffect(() => {
    fetchAnalyses();
  }, []);

  useEffect(() => {
    const { id } = router.query;
    if (id && typeof id === 'string') {
      handleSelectAnalysis(id);
    }
  }, [router.query]);

  const fetchAnalyses = async () => {
    try {
      const response = await fetch(`/api/analysis/${session?.data?.user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analyses');
      }
      const data = await response.json();
      setAnalyses(data);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedAnalysisId(undefined);
    setView('new');
    router.push('/dashboard', undefined, { shallow: true });
  };

  const handleSelectAnalysis = (id: string) => {
    setSelectedAnalysisId(id);
    setView('detail');
  };

  const handleAnalysisCreated = async () => {
    await fetchAnalyses();
  };

  const SidebarComponent = React.lazy(() => import('@/lib/components/header/Sidebar'));

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        <React.Suspense fallback={null}>
          <SidebarComponent
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            onCreateNew={handleCreateNew}
            onSelectAnalysis={handleSelectAnalysis}
            selectedAnalysisId={selectedAnalysisId}
            analyses={analyses}
            isLoading={isLoading}
          />
        </React.Suspense>

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
              <NewAnalysis onSuccess={handleAnalysisCreated} />
            ) : (
                currentAnalysis ? (
                  <AnalysisDetail 
                    analysis={currentAnalysis}
                    onDelete={async () => {
                      await fetchAnalyses();
                      handleCreateNew();
                    }}
                  />
                ) : (
                  <div>No analysis selected</div>
                )
              )
            }
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;