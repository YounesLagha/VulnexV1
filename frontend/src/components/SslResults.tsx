'use client';

import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Calendar,
  FileKey,
  AlertCircle,
} from 'lucide-react';

interface CertificateInfo {
  valid: boolean;
  issuer: string;
  subject: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  daysUntilExpiration: number;
  selfSigned: boolean;
  signatureAlgorithm: string;
}

interface ProtocolInfo {
  name: string;
  version: string;
  enabled: boolean;
  secure: boolean;
}

interface CipherInfo {
  name: string;
  strength: number;
  secure: boolean;
}

interface VulnerabilityInfo {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affected?: string;
  fixed?: boolean;
  cveId?: string;
}

interface SslScanResult {
  score: number;
  grade: string;
  scannedAt: string;
  hasHttps: boolean;
  certificate?: CertificateInfo;
  protocols: ProtocolInfo[];
  ciphers: CipherInfo[];
  vulnerabilities: VulnerabilityInfo[];
}

interface SslResultsProps {
  result: SslScanResult;
}

export default function SslResults({ result }: SslResultsProps) {
  const getGradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-400';
    if (grade === 'B' || grade === 'C') return 'text-orange-400';
    return 'text-red-400';
  };

  const getGradeBadge = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'badge-secure';
    if (grade === 'B' || grade === 'C') return 'badge-warning';
    return 'badge-critical';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'badge-critical';
      case 'HIGH':
        return 'badge-warning';
      case 'MEDIUM':
        return 'badge-info';
      default:
        return 'badge';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="w-4 h-4" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!result.hasHttps) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Unlock className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">SSL/TLS Analysis</h3>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">HTTPS Not Available</p>
              <p className="text-xs text-red-300 mt-1">
                This website does not support HTTPS connections. All data transmitted is unencrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SSL Score & Grade */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6 text-violet-400" />
          <h3 className="text-xl font-bold text-white">SSL/TLS Analysis</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">SSL Score</p>
            <p className={`text-4xl font-black ${getGradeColor(result.grade)}`}>
              {result.score}/100
            </p>
          </div>
          <div className={`badge ${getGradeBadge(result.grade)} text-2xl font-black px-6 py-3`}>
            {result.grade}
          </div>
        </div>
      </div>

      {/* Certificate Information */}
      {result.certificate && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileKey className="w-5 h-5 text-violet-400" />
            <h4 className="text-lg font-bold text-white">Certificate</h4>
          </div>

          <div className="space-y-3">
            {/* Certificate Status */}
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
              <span className="text-sm text-slate-300">Status</span>
              <div className="flex items-center gap-2">
                {result.certificate.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">Valid</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">Invalid/Expired</span>
                  </>
                )}
              </div>
            </div>

            {/* Issuer */}
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
              <span className="text-sm text-slate-300">Issuer</span>
              <span className="text-sm font-semibold text-white">{result.certificate.issuer}</span>
            </div>

            {/* Subject */}
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
              <span className="text-sm text-slate-300">Subject</span>
              <span className="text-sm font-semibold text-white">{result.certificate.subject}</span>
            </div>

            {/* Expiration */}
            <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Expires In
              </span>
              <span
                className={`text-sm font-semibold ${
                  result.certificate.daysUntilExpiration < 30
                    ? 'text-red-400'
                    : result.certificate.daysUntilExpiration < 90
                    ? 'text-orange-400'
                    : 'text-green-400'
                }`}
              >
                {result.certificate.daysUntilExpiration} days
              </span>
            </div>

            {/* Self-Signed Warning */}
            {result.certificate.selfSigned && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-orange-400 font-medium">Self-Signed Certificate</p>
                    <p className="text-xs text-orange-300 mt-1">
                      This certificate is not verified by a trusted Certificate Authority
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Protocols */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-violet-400" />
          <h4 className="text-lg font-bold text-white">Supported Protocols</h4>
        </div>

        <div className="space-y-2">
          {result.protocols
            .filter((p) => p.enabled)
            .map((protocol) => (
              <div
                key={protocol.name}
                className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg"
              >
                <span className="text-sm text-slate-300">{protocol.name}</span>
                <div className="flex items-center gap-2">
                  {protocol.secure ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      protocol.secure ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {protocol.secure ? 'Secure' : 'Deprecated'}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Vulnerabilities */}
      {result.vulnerabilities.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h4 className="text-lg font-bold text-white">
              Vulnerabilities ({result.vulnerabilities.length})
            </h4>
          </div>

          <div className="space-y-3">
            {result.vulnerabilities.map((vuln, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  vuln.severity === 'CRITICAL'
                    ? 'bg-red-500/10 border-red-500/30'
                    : vuln.severity === 'HIGH'
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(vuln.severity)}
                    <div>
                      <h5 className="text-sm font-semibold text-white">{vuln.name}</h5>
                      {vuln.cveId && (
                        <p className="text-xs text-slate-400 mt-1">CVE: {vuln.cveId}</p>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${getSeverityBadge(vuln.severity)} text-xs`}>
                    {vuln.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300 ml-6">{vuln.description}</p>
                {vuln.affected && (
                  <p className="text-xs text-slate-400 ml-6 mt-1">Affected: {vuln.affected}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
