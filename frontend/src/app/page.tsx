'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import ScanForm from '@/components/ScanForm';
import ScanResults from '@/components/ScanResults';

export default function Home() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const handleScan = async (url: string) => {
    setIsLoading(true);
    setScanResult(null);

    try {
      // Utiliser le mode 'full' si l'utilisateur est connecté
      const scanMode = user ? 'full' : 'free';

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Ajouter le token JWT si l'utilisateur est connecté
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, mode: scanMode }),
      });

      const data = await response.json();

      if (data.success) {
        setScanResult(data.data);
      } else {
        alert('Erreur lors du scan');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      {/* Static Background - No animations for performance */}
      <div className="fixed inset-0 -z-10">
        {/* Static Grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        {/* Static Ambient Orbs */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-violet-600/4 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-80 h-80 bg-blue-600/3 rounded-full blur-3xl" />
      </div>

      {/* Premium Header - Optimized */}
      <header className="sticky top-0 z-50 border-b border-slate-800/50 backdrop-blur-sm bg-black/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-violet-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient">VULNEX</h1>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Security Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="btn-ghost text-sm hidden sm:block">
                Documentation
              </button>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="btn-ghost text-sm hidden md:flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                    <User className="w-4 h-4 text-violet-400" />
                    <span className="text-sm text-slate-300">{user.email}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="btn-secondary text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!scanResult ? (
          /* Premium Landing View */
          <div className="relative py-20 md:py-32">
            {/* Background Decoration - Static for performance */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-72 h-72 bg-violet-600/8 rounded-full blur-3xl"></div>
              <div className="absolute top-40 right-10 w-96 h-96 bg-blue-600/6 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
              {/* Premium Badge */}
              <div className="flex justify-center mb-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-4 py-2 glass-card border-violet-500/30">
                  <div className="w-2 h-2 bg-violet-500 rounded-full opacity-80"></div>
                  <span className="text-sm font-semibold text-violet-300">
                    {user ? 'Full Scan Mode Enabled' : 'Expert Security Analysis'}
                  </span>
                </div>
              </div>

              {/* Hero Title */}
              <div className="text-center mb-8 space-y-6">
                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                  Enterprise-Grade
                  <br />
                  <span className="text-gradient">Security Scanning</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  Analyze your web application's security posture in seconds with automated insights and recommendations
                </p>
              </div>

              {/* Premium Scan Form */}
              <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <ScanForm onSubmit={handleScan} isLoading={isLoading} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <div className="metric-card text-center">
                  <div className="metric-value">&lt;3s</div>
                  <div className="metric-label">Average Scan Time</div>
                </div>
                <div className="metric-card text-center">
                  <div className="metric-value">100%</div>
                  <div className="metric-label">Automated Analysis</div>
                </div>
                <div className="metric-card text-center">
                  <div className="metric-value">/100</div>
                  <div className="metric-label">Security Score</div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Premium Results View */
          <div className="py-12">
            <ScanResults result={scanResult} />
          </div>
        )}
      </div>

      {/* Premium Footer */}
      <footer className="border-t border-slate-800/50 mt-32 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-violet-500 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-bold text-gradient text-lg">VULNEX</span>
              </div>
              <p className="text-sm text-slate-500">Professional security scanning platform for modern web applications.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-300 mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-violet-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-300 mb-3">Resources</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-violet-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-300 mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-violet-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-violet-400 transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="divider"></div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8">
            <p className="text-sm text-slate-500">
              © 2025 Vulnex Security Platform. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-violet-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-violet-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-violet-400 transition-colors">Legal</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
