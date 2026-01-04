'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  ArrowLeft,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
  Brain,
  Download
} from 'lucide-react';
import ScoreRing from '@/components/ScoreRing';
import HeadersDisplay from '@/components/HeadersDisplay';
import SslResults from '@/components/SslResults';

interface ScanDetails {
  id: string;
  url: string;
  score: number;
  mode: string;
  scan_type: string;
  created_at: string;
  ai_analysis?: string;
  ai_tokens_used?: number;
  results?: {
    headers?: {
      [headerName: string]: {
        present: boolean;
        value?: string;
        secure: boolean;
        weight: number;
        recommendation?: string;
      };
    };
    ssl?: any; // SslScanResult
    score?: number;
    scannedAt?: string;
    missingHeaders?: string[];
    recommendations?: string[];
  };
}

export default function ScanDetailsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const scanId = params?.id as string;

  const [scan, setScan] = useState<ScanDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && token && scanId) {
      fetchScanDetails();
    }
  }, [user, token, scanId]);

  const fetchScanDetails = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scans/${scanId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('Scan details:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch scan details');
      }

      setScan(data.data);
    } catch (err) {
      console.error('Error fetching scan details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scan details');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative">
      {/* Static Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-violet-600/4 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-600/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 backdrop-blur-sm bg-black/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Shield className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">VULNEX</h1>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Security Platform</p>
              </div>
            </Link>

            <Link href="/dashboard" className="btn-ghost text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-8 bg-slate-700/50 rounded-lg w-3/4" />
                  <div className="h-5 bg-slate-700/30 rounded w-1/2" />
                </div>
                <div className="h-10 w-32 bg-slate-700/30 rounded-lg" />
              </div>
            </div>

            {/* Score Skeleton */}
            <div className="glass-card p-10">
              <div className="flex flex-col items-center">
                <div className="h-6 w-40 bg-slate-700/30 rounded mb-6" />
                <div className="w-[200px] h-[200px] bg-slate-700/20 rounded-full" />
                <div className="h-4 w-48 bg-slate-700/20 rounded mt-4" />
              </div>
            </div>

            {/* Content Skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 space-y-4">
                <div className="h-6 bg-slate-700/30 rounded w-1/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700/20 rounded w-full" />
                  <div className="h-4 bg-slate-700/20 rounded w-5/6" />
                  <div className="h-4 bg-slate-700/20 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="glass-card p-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
                <p className="text-slate-300">{error}</p>
                <Link href="/dashboard" className="btn-secondary mt-4 inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        ) : scan ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <h1 className="text-2xl font-black text-white truncate">{scan.url}</h1>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(scan.created_at).toLocaleString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <span className={`badge ${scan.mode === 'full' ? 'badge-info' : 'badge-warning'}`}>
                      {scan.mode === 'full' ? 'Full Scan' : 'Free Scan'}
                    </span>
                  </div>
                </div>

                <button className="btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Score Card */}
            <div className="glass-card p-10">
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold text-slate-200 mb-6">Security Score</h2>
                <ScoreRing score={scan.score} size={200} strokeWidth={16} />
                <p className="text-sm text-slate-400 mt-4">
                  Scanned at {new Date(scan.results?.scannedAt || scan.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Security Analysis */}
            {scan.ai_analysis && (
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Findings & Recommendations</h2>
                </div>
                <div className="bg-slate-950/50 rounded-lg p-6 border border-slate-800/60">
                  <pre className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {scan.ai_analysis}
                  </pre>
                </div>
                {scan.ai_tokens_used && (
                  <p className="text-xs text-slate-500 mt-4">
                    Analysis complexity: {scan.ai_tokens_used.toLocaleString()} tokens processed
                  </p>
                )}
              </div>
            )}

            {/* HTTP Headers Details */}
            {scan.results?.headers && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-6">HTTP Security Headers</h2>
                <HeadersDisplay headersData={scan.results.headers} />
              </div>
            )}

            {/* SSL/TLS Details */}
            {scan.results?.ssl && (
              <SslResults result={scan.results.ssl} />
            )}

            {/* Recommendations */}
            {scan.results?.recommendations && scan.results.recommendations.length > 0 && (
              <div className="glass-card p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Recommendations</h2>
                <div className="space-y-2">
                  {scan.results.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800/60">
                      <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
