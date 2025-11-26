'use client';

import { useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import MindMapCanvas from '@/components/mindmaps/MindMapCanvas';
import { studentProjectsApi, type MindMapDetail } from '@/lib/api/studentProjects';
import { format } from 'date-fns';

function MindMapPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mindMapId = Number(params.id);
  const projectId = searchParams.get('projectId');

  const { data, isLoading, isError, refetch } = useQuery<MindMapDetail>({
    queryKey: ['mind-map', mindMapId],
    queryFn: () => studentProjectsApi.getMindMap(mindMapId),
    enabled: Number.isFinite(mindMapId),
  });

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: 'Nodes',
        value: data.node_count ?? data.nodes.length,
      },
      {
        label: 'Category',
        value: data.category || 'Uncategorized',
      },
      {
        label: 'Created',
        value: data.created_at ? format(new Date(data.created_at), 'MMM d, yyyy • h:mm a') : 'Unknown',
      },
    ];
  }, [data]);

  const goBack = () => {
    if (projectId) {
      router.push(`/student-hub/${projectId}`);
      return;
    }
    router.back();
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col gap-4">
            <button
              onClick={goBack}
              className="inline-flex items-center text-sm text-gray-700 hover:text-indigo-600 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to project
            </button>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{data?.title || 'Mind Map'}</h1>
                  <p className="text-gray-600">{data?.central_idea || 'Visual knowledge map'}</p>
                </div>
                <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
              {stats.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {stats.map((stat) => (
                    <Card key={stat.label} className="p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
                      <p className="text-xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-24">
              <LoadingSpinner />
            </div>
          )}

          {isError && (
            <Alert type="error">
              Failed to load mind map.{' '}
              <button onClick={() => refetch()} className="underline">
                Try again
              </button>
            </Alert>
          )}

          {data && (
            <>
              <MindMapCanvas nodes={data.nodes} edges={data.edges} centralIdea={data.central_idea} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Key Concepts</h2>
                    <p className="text-sm text-gray-600">
                      Magical anchors generated from your PDF. Tap one to focus when revising.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.key_concepts?.length ? (
                      data.key_concepts.map((concept, index) => (
                        <div
                          key={String((concept as any).id ?? index)}
                          className="p-4 rounded-xl border border-gray-200 bg-indigo-50 hover:shadow-sm transition-all"
                        >
                          <p className="text-sm font-semibold text-indigo-900">
                            {String((concept as any).label ?? (concept as any).id ?? `Concept ${index + 1}`)}
                          </p>
                          {concept.definition && (
                            <p className="mt-2 text-sm text-gray-700">{concept.definition}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">No key concepts were returned by the model.</p>
                    )}
                  </div>
                </Card>

                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-1">Next steps</h2>
                      <p className="text-sm text-gray-600">Actionable prompts for your next study sprint.</p>
                    </div>
                  </div>
                  <ol className="space-y-3 list-decimal list-inside text-sm text-gray-700">
                    {data.recommended_next_steps?.length ? (
                      data.recommended_next_steps.map((step, index) => (
                        <li key={`${step}-${index}`} className="leading-relaxed">
                          {step}
                        </li>
                      ))
                    ) : (
                      <li>No follow-up suggestions were generated.</li>
                    )}
                  </ol>
                </Card>
              </div>

              {data.callouts?.length ? (
                <Card className="p-6 space-y-3">
                  <h2 className="text-lg font-semibold text-gray-900">Callouts & insights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.callouts.map((callout, index) => (
                      <div key={`${callout.title ?? index}`} className="p-4 rounded-lg border border-indigo-100 bg-white shadow-sm">
                        <p className="text-sm font-semibold text-indigo-700">{callout.title ?? 'Insight'}</p>
                        <p className="mt-1 text-sm text-gray-700">{callout.body ?? callout.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function MindMapPage() {
  return (
    <ProtectedRoute>
      <MindMapPageContent />
    </ProtectedRoute>
  );
}

