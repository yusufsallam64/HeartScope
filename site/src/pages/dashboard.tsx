import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/lib/layouts';
import NewAnalysis from '@/lib/components/dashboard/NewAnalysis';
import AnalysisDetail from '@/lib/components/dashboard/AnalysisDetail';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { FrontendAnalysis as Analysis } from '@/lib/db/types';
import { Plus, Loader2 } from 'lucide-react';

const SidebarSkeleton = () => {
  return (
    <div className="fixed md:static top-16 bg-background-100/50 backdrop-blur-xl border-r border-primary-200/30 shadow-lg transition-all duration-300 h-[calc(100vh-4rem)] w-full md:w-64">
      <div className="h-full flex flex-col min-w-[16rem]">
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-primary-200/30 bg-background-300/20">
          <div className="h-6 w-32 bg-primary-200/50 rounded animate-pulse" />
        </div>

        <div className="flex flex-col h-full">
          {/* New Analysis Button */}
          <div className="flex-none p-3">
            <Button
              disabled
              className="w-full flex items-center justify-center gap-1.5 bg-primary-400/50 text-white py-2 text-sm font-medium cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              New Analysis
            </Button>
          </div>

          {/* Skeleton Cards */}
          <div className="flex-1 overflow-y-auto px-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="mb-2 p-3 border border-primary-900/20 rounded-lg bg-primary-300/30"
              >
                {/* Title */}
                <div className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-primary-200/50 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-primary-200/50 rounded animate-pulse" />
                </div>

                {/* Date */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 bg-primary-200/50 rounded-full animate-pulse" />
                  <div className="h-3.5 w-20 bg-primary-200/50 rounded animate-pulse" />
                </div>

                {/* Symptoms */}
                <div className="mt-1.5 flex items-start gap-1.5">
                  <div className="h-3.5 w-3.5 bg-primary-200/50 rounded animate-pulse" />
                  <div className="h-3.5 w-32 bg-primary-200/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AnalysisDetailSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-4">
          {/* Patient Info Section */}
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Medical Images Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 bg-background bg-opacity-90 flex flex-col items-center justify-center z-50">
      <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      <p className="mt-4 text-lg text-primary-600 font-medium">Loading analysis...</p>
    </div>
  );
};

const Dashboard = () => {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>();
  const [view, setView] = useState<'new' | 'detail'>('new');
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const currentAnalysis = analyses.find((analysis) => analysis.id === selectedAnalysisId);
  const session = useSession();

  useEffect(() => {
    if (session?.data?.user.id) {
      fetchAnalyses();
    }
  }, [session?.data?.user.id]);

  useEffect(() => {
    const { id } = router.query;
    if (id && typeof id === 'string' && analyses.length > 0) {
      handleSelectAnalysis(id);
    }
  }, [router.query, analyses]);

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
      setIsRedirecting(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedAnalysisId(undefined);
    setView('new');
    setIsRedirecting(false);
    router.push('/dashboard', undefined, { shallow: true });
  };

  const handleSelectAnalysis = (id: string) => {
    setSelectedAnalysisId(id);
    setView('detail');
  };

  const handleAnalysisCreated = async () => {
    await fetchAnalyses();
  };

  const handleRedirectStart = () => {
    setIsRedirecting(true);
  };

  const SidebarComponent = React.lazy(() => import('@/lib/components/header/Sidebar'));

  // Main content rendering
  const renderContent = () => {
    if (isRedirecting) {
      return <LoadingSpinner />;
    }

    return (
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
          <NewAnalysis 
            onSuccess={handleAnalysisCreated}
            onRedirectStart={handleRedirectStart}
          />
        ) : isLoading ? (
          <LoadingSpinner />
        ) : currentAnalysis ? (
          <AnalysisDetail 
            analysis={currentAnalysis}
            onDelete={async () => {
              await fetchAnalyses();
              handleCreateNew();
            }}
          />
        ) : (
          <div>No analysis selected</div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        <React.Suspense fallback={<SidebarSkeleton />}>
          <SidebarComponent
            onCreateNew={handleCreateNew}
            onSelectAnalysis={handleSelectAnalysis}
            selectedAnalysisId={selectedAnalysisId}
            analyses={analyses}
            isLoading={isLoading}
          />
        </React.Suspense>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
