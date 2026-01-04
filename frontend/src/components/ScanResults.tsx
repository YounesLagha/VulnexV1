'use client';

import { Shield, Server, Globe, Brain, FileText, ChevronRight, AlertTriangle, List } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ScoreRing from './ScoreRing';
import ModuleCard from './ModuleCard';
import HeadersDisplay from './HeadersDisplay';
import SslResults from './SslResults';

interface HeaderInfo {
  present: boolean;
  value?: string;
  secure: boolean;
  weight: number;
  recommendation?: string;
}

interface ScanResultsProps {
  result: {
    url: string;
    mode: string;
    score: number;
    analysis: string;
    scanId: string | null;
    details?: {
      headers?: {
        headers: {
          [headerName: string]: HeaderInfo;
        };
        score: number;
        scannedAt: string;
        missingHeaders: string[];
        recommendations: string[];
      };
      ssl?: any; // SslScanResult from backend
    };
  };
}

export default function ScanResults({ result }: ScanResultsProps) {
  const [showHeaders, setShowHeaders] = useState(true);

  const getRiskLevel = (score: number): 'secure' | 'warning' | 'critical' => {
    if (score >= 80) return 'secure';
    if (score >= 50) return 'warning';
    return 'critical';
  };

  const riskLevel = getRiskLevel(result.score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">Scan Report</h2>
          <p className="text-sm text-slate-400 font-mono">{result.url}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          New Scan
        </button>
      </motion.div>

      {/* Score and Status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-10"
      >
        <div className="flex flex-col lg:flex-row items-center gap-10">
          <ScoreRing score={result.score} size={180} strokeWidth={14} />
          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Security Score</h3>
            <p className="text-slate-400 mb-6">
              {result.details?.ssl
                ? 'Overall security score (HTTP headers + SSL/TLS)'
                : 'Security score based on HTTP headers analysis'
              }
            </p>
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <span className="badge badge-info">
                HTTP Headers
              </span>
              {result.details?.ssl && (
                <span className="badge badge-secure">
                  SSL/TLS
                </span>
              )}
              {result.mode === 'free' && (
                <span className="badge bg-slate-800/50 text-slate-500 border-slate-700/50 text-xs">
                  Limited Scan
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* HTTP Headers Detail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <List className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">HTTP Security Headers</h3>
              <p className="text-xs text-slate-500">Detailed analysis of security headers</p>
            </div>
          </div>
          <button
            onClick={() => setShowHeaders(!showHeaders)}
            className="btn-ghost text-xs"
          >
            {showHeaders ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showHeaders && <HeadersDisplay headersData={result.details?.headers?.headers} />}
      </motion.div>

      {/* SSL/TLS Section */}
      {result.details?.ssl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <SslResults result={result.details.ssl} />
        </motion.div>
      )}

      {/* Modules Grid - Masqué (fonctionnalités non implémentées) */}
      {false && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModuleCard
            icon={Globe}
            title="Network Ports"
            status="secure"
            comingSoon
          />
          <ModuleCard
            icon={Shield}
            title="Technologies Detected"
            status="warning"
            comingSoon
          />
          <ModuleCard
            icon={Server}
            title="DNS Security"
            status="secure"
            comingSoon
          />
        </div>
      )}

      {/* Security Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">Security Recommendations</h3>
        </div>
        <div className="bg-slate-950/50 rounded-lg p-5 border border-slate-800/60">
          <pre className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
            {result.analysis}
          </pre>
        </div>
      </motion.div>

      {/* Upgrade CTA (Free Mode) */}
      {result.mode === 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 border-violet-500/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-blue-500/5 opacity-50"></div>
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-violet-400" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">
                Unlock Full Security Analysis
              </h3>
              <p className="text-sm text-slate-400">
                Detailed risk analysis with priority-based recommendations, scan history tracking, and actionable remediation steps
              </p>
            </div>
            <a href="/register" className="btn-primary">
              Create Free Account
            </a>
          </div>
        </motion.div>
      )}

      {/* Warning Notice */}
      {riskLevel === 'critical' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-5 bg-red-500/5 border-red-500/30"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-1">Critical Security Issues Detected</h4>
              <p className="text-xs text-slate-400">
                Immediate action recommended to improve your security posture
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
