'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  TrendingUp,
  Clock,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  Globe,
  Loader2
} from 'lucide-react';

interface Scan {
  id: string;
  url: string;
  score: number;
  mode: string;
  scan_type: string;
  created_at: string;
  ai_analysis?: string;
}

interface Stats {
  total_scans: number;
  average_score: number;
  last_scan_date: string | null;
}

export default function DashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [stats, setStats] = useState<Stats>({ total_scans: 0, average_score: 0, last_scan_date: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchScans();
    }
  }, [user, token]);

  const fetchScans = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/scans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('Scans response:', data); // Debug

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch scans');
      }

      // Le backend retourne { success: true, data: { scans, total, page, limit } }
      const scansList = data.data?.scans || [];
      setScans(scansList);

      // Calculer les stats
      const scans = scansList;
      const totalScans = scans.length;
      const avgScore = totalScans > 0
        ? Math.round(scans.reduce((sum: number, s: Scan) => sum + s.score, 0) / totalScans)
        : 0;
      const lastScan = totalScans > 0 ? scans[0].created_at : null;

      setStats({
        total_scans: totalScans,
        average_score: avgScore,
        last_scan_date: lastScan,
      });
    } catch (err) {
      console.error('Error fetching scans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load scans');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'badge-secure';
    if (score >= 50) return 'badge-warning';
    return 'badge-critical';
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
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Shield className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">VULNEX</h1>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Security Platform</p>
              </div>
            </Link>

            <Link href="/" className="btn-ghost text-sm flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Scan</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Your security scan history and statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Scans */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <BarChart3 className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Total Scans</h3>
            </div>
            <p className="text-3xl font-black text-white">{stats.total_scans}</p>
          </div>

          {/* Average Score */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Average Score</h3>
            </div>
            <p className={`text-3xl font-black ${getScoreColor(stats.average_score)}`}>
              {stats.average_score}/100
            </p>
          </div>

          {/* Last Scan */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Last Scan</h3>
            </div>
            <p className="text-lg font-semibold text-white">
              {stats.last_scan_date
                ? new Date(stats.last_scan_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'No scans yet'}
            </p>
          </div>
        </div>

        {/* Scans List */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">Recent Scans</h2>
            {scans.length > 0 && (
              <span className="text-sm text-slate-400">{scans.length} total</span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400 font-medium">Error</p>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
            </div>
          ) : scans.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">No scans yet</h3>
              <p className="text-slate-500 mb-6">Start scanning websites to see your history here</p>
              <Link href="/" className="btn-primary inline-flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Start Your First Scan</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {scans.map((scan) => (
                <Link
                  key={scan.id}
                  href={`/dashboard/${scan.id}`}
                  className="glass-card p-5 hover:border-violet-500/40 transition-all cursor-pointer block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <h3 className="text-sm font-semibold text-slate-200 truncate">{scan.url}</h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(scan.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <span className={`badge ${scan.mode === 'full' ? 'badge-info' : 'badge badge-warning'} text-xs`}>
                          {scan.mode === 'full' ? 'Full Scan' : 'Free Scan'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Score</p>
                        <p className={`text-2xl font-black ${getScoreColor(scan.score)}`}>
                          {scan.score}
                        </p>
                      </div>
                      <span className={`badge ${getScoreBadge(scan.score)}`}>
                        {scan.score >= 80 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : scan.score >= 50 ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>
                  </div>

                  {scan.ai_analysis && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60">
                      <p className="text-xs text-slate-400 line-clamp-2">{scan.ai_analysis}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
