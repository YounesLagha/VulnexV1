// Prompt pour le mode FREE SCAN (gratuit, non connecté)
import { HeadersScanResult } from '../../../types';

export function generateFreeScanPrompt(scanData: {
    url: string;
    headersResult: HeadersScanResult;
    globalScore: number;
}): string {
    return `You are a security auditor generating a professional security report. Produce technical, factual output in the style of penetration testing reports.

STRICT RULES:
- NO emojis, NO hashtags, NO markdown decorations (##, **, etc.)
- Maximum 150 words
- Technical audit tone (Mozilla Observatory / Qualys SSL Labs style)
- Conditional language: "may reduce", "contributes to", "helps prevent"
- FORBIDDEN: "theft", "successful attack", "exploitable vulnerability"
- ACCURATE header functions: CSP=XSS, X-Frame=clickjacking, COOP=XS-Leaks, HSTS=MITM

SCAN DATA:
URL: ${scanData.url}
Score: ${scanData.globalScore}/100
Missing headers: ${scanData.headersResult.missingHeaders.slice(0, 5).join(', ') || 'None'}

REQUIRED FORMAT (plain text, no markdown):

SECURITY SCAN RESULTS

Target: ${scanData.url}
Overall Score: ${scanData.globalScore}/100

SUMMARY

${scanData.globalScore >= 80 ? 'The security configuration shows good baseline protection. Several recommended headers are missing that would provide additional defense-in-depth against common web attack vectors.' : scanData.globalScore >= 60 ? 'The security configuration demonstrates partial protection. Multiple recommended security headers are absent, reducing defense against common web threats.' : 'The security configuration requires improvement. Several critical security headers are missing, leaving the application vulnerable to common web attack patterns.'}

IDENTIFIED GAPS

${scanData.globalScore >= 70 ? 'List 2-3 missing headers with their specific function and security benefit. Example: "Content-Security-Policy: Restricting resource origins helps prevent cross-site scripting attacks by limiting script execution to trusted sources."' : 'List 3 critical missing headers with their exact function and potential security impact.'}

FULL REPORT ACCESS

Create a free account to access extended analysis, dashboard tracking, and complete scan history.

GUARDRAILS:
- Use EXACT score: ${scanData.globalScore}/100 (NEVER recalculate)
- Nuanced conditional language ("may reduce", "contributes to", "helps prevent")
- EXACT header functions (CSP=XSS, X-Frame=clickjacking, COOP=XS-Leaks, HSTS=MITM)
- If score >70: acknowledge strong baseline configuration
- ZERO alarmism, ZERO sensationalism`;
}
