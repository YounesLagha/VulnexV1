'use client';

import { useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';

interface ScanFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function ScanForm({ onSubmit, isLoading }: ScanFormProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="glass-card p-8 relative overflow-hidden">
        {/* Scanning Indicator - Static for performance */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-500/50"></div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              disabled={isLoading}
              className="premium-input pl-12 text-base h-14"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="btn-primary h-14 px-8 whitespace-nowrap flex items-center justify-center gap-2 min-w-[160px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Start Scan</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Test Examples */}
        <div className="mt-6 pt-6 divider">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-semibold">Quick Test</p>
          <div className="flex flex-wrap gap-2">
            {[
              { domain: 'github.com', label: 'GitHub' },
              { domain: 'google.com', label: 'Google' },
              { domain: 'cloudflare.com', label: 'Cloudflare' }
            ].map(({ domain, label }) => (
              <button
                key={domain}
                type="button"
                onClick={() => setUrl(`https://${domain}`)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-violet-400 rounded-lg border border-slate-700/50 hover:border-violet-500/30 transition-all disabled:opacity-50 font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
