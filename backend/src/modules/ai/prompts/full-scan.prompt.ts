// Prompt pour le mode FULL SCAN (premium, utilisateur connecté)
import { HeadersScanResult } from '../../../types';

export function generateFullScanPrompt(scanData: {
    url: string;
    headersResult: HeadersScanResult;
    globalScore: number;
}): string {
    return `You are a professional security auditor generating a technical security assessment report. Produce clear, objective analysis in the style of professional penetration testing reports.

STRICT FORMATTING RULES:
- NO emojis, NO hashtags
- NO markdown decorations (##, **, etc.) - use plain text with clear section headers
- Maximum 200 words total
- Focus on the 3 MOST IMPORTANT issues
- Provide SPECIFIC, ACTIONABLE recommendations
- Avoid unnecessary technical jargon

SCAN DATA:
Target URL: ${scanData.url}
Overall Score: ${scanData.globalScore}/100

CRITICAL MISSING HEADERS:
${scanData.headersResult.missingHeaders.join(', ') || 'None'}

TOP RECOMMENDATIONS:
${scanData.headersResult.recommendations.slice(0, 5).join('\n') || 'No major recommendations'}

═══════════════════════════════════════════

REQUIRED STRUCTURE (plain text format):

EXECUTIVE SUMMARY

[2-3 sentences describing the overall security state]
Risk Level: [CRITICAL / HIGH / MEDIUM / LOW]
Estimated Remediation Time: [X hours/days]

DETECTED ISSUES

1. [Most critical issue name]
Impact: [One sentence describing potential security consequence]
Recommendation: [Specific action to remediate]

2. [Second issue]
Impact: [One sentence]
Recommendation: [Specific action]

3. [Third issue]
Impact: [One sentence]
Recommendation: [Specific action]

POSITIVE FINDINGS

[List 2-3 properly configured security controls]

PRIORITY ACTIONS

1. CRITICAL - [Most important action]
2. HIGH - [Second action]
3. MEDIUM - [Third action]

═══════════════════════════════════════════

CRITICAL GUARDRAILS:
- Maximum 200 words total (be VERY concise)
- Focus on ACTIONABLE items, not theory
- Use EXACT score: ${scanData.globalScore}/100 (NEVER recalculate)
- Remain FACTUAL and NUANCED: avoid sensationalism
- DO NOT flag issues if the site has valid technical reasons (e.g., CDN, specific architecture)
- If score > 70: explicitly acknowledge good practices in place
- NO motivational language, NO encouragement - professional tone only`;
}
