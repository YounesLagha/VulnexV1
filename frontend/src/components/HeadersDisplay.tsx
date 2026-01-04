'use client';

import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface HeaderInfo {
  present: boolean;
  value?: string;
  secure: boolean;
  weight: number;
  recommendation?: string;
}

interface HeadersDisplayProps {
  headersData?: {
    [headerName: string]: HeaderInfo;
  };
}

// Descriptions et severite des headers (alignées avec réalité sécurité)
const HEADER_INFO = {
  'Strict-Transport-Security': { description: 'Enforces HTTPS connections', severity: 'medium' as const }, // Downgrade: utile mais pas critique si déjà en HTTPS
  'Content-Security-Policy': { description: 'Prevents XSS attacks', severity: 'high' as const },
  'X-Frame-Options': { description: 'Prevents clickjacking', severity: 'high' as const },
  'X-Content-Type-Options': { description: 'Prevents MIME sniffing', severity: 'medium' as const },
  'Referrer-Policy': { description: 'Controls referrer information', severity: 'low' as const }, // Downgrade: privacy > sécurité
  'Permissions-Policy': { description: 'Controls browser features', severity: 'low' as const },
  'Cross-Origin-Opener-Policy': { description: 'Isolates browsing context', severity: 'low' as const }, // Downgrade: très spécifique
  'Cross-Origin-Embedder-Policy': { description: 'Controls resource loading', severity: 'low' as const }, // Downgrade: très spécifique
  'Cross-Origin-Resource-Policy': { description: 'Protects against cross-origin attacks', severity: 'low' as const }, // Downgrade: très spécifique
  'Set-Cookie': { description: 'Cookie security attributes', severity: 'high' as const },
};

export default function HeadersDisplay({ headersData }: HeadersDisplayProps) {
  if (!headersData) {
    return null;
  }

  // Transformer les donnees du backend en format utilisable
  const headers = Object.entries(headersData)
    .filter(([name]) => name !== 'Server' && name !== 'X-Powered-By') // Exclure les headers de penalite
    .map(([name, info]) => ({
      name,
      present: info.present,
      value: info.value,
      secure: info.secure,
      description: HEADER_INFO[name as keyof typeof HEADER_INFO]?.description || 'Security header',
      severity: HEADER_INFO[name as keyof typeof HEADER_INFO]?.severity || 'low',
      recommendation: info.recommendation,
    }));

  const presentHeaders = headers.filter(h => h.present);
  const missingHeaders = headers.filter(h => !h.present);

  return (
    <div className="space-y-6">
      {/* Present Headers */}
      {presentHeaders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <h4 className="text-sm font-semibold text-slate-200">
              Present Headers ({presentHeaders.length})
            </h4>
          </div>
          <div className="space-y-2">
            {presentHeaders.map((header) => (
              <div
                key={header.name}
                className="glass-card p-4 border-green-500/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <code className="text-sm font-semibold text-slate-200">
                        {header.name}
                      </code>
                    </div>
                    <p className="text-xs text-slate-400 ml-6">
                      {header.description}
                    </p>
                    {header.value && (
                      <code className="text-xs text-slate-500 ml-6 block mt-1 truncate max-w-lg">
                        {header.value}
                      </code>
                    )}
                    {!header.secure && header.recommendation && (
                      <p className="text-xs text-orange-400 ml-6 mt-1">
                        ⚠ {header.recommendation}
                      </p>
                    )}
                  </div>
                  <span className={`badge text-xs ${header.secure ? 'badge-secure' : 'badge-warning'}`}>
                    {header.secure ? 'Secure' : 'Needs Fix'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Headers */}
      {missingHeaders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-400" />
            <h4 className="text-sm font-semibold text-slate-200">
              Missing Headers ({missingHeaders.length})
            </h4>
          </div>
          <div className="space-y-2">
            {missingHeaders.map((header) => (
              <div
                key={header.name}
                className="glass-card p-4 border-red-500/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {header.severity === 'high' && (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      {header.severity === 'medium' && (
                        <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      )}
                      {header.severity === 'low' && (
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      )}
                      <code className="text-sm font-semibold text-slate-200">
                        {header.name}
                      </code>
                    </div>
                    <p className="text-xs text-slate-400 ml-6">
                      {header.description}
                    </p>
                    {header.recommendation && (
                      <p className="text-xs text-red-400 ml-6 mt-1">
                        💡 {header.recommendation}
                      </p>
                    )}
                  </div>
                  <span className={`badge text-xs ${
                    header.severity === 'high' ? 'badge-critical' :
                    header.severity === 'medium' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                    {header.severity === 'high' ? 'Critical' :
                     header.severity === 'medium' ? 'Important' :
                     'Recommended'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
