// src/scanners/headerScanner.ts
// Scans for "Spoofing" and "Authentication" failures.

import { ParsedMail } from 'mailparser';
import { Detection, VectorResult } from '../types';

/**
 * Scans email headers for common phishing and spoofing indicators.
 * Returns a VectorResult with a confidence score.
 */
export function scanHeaders(parsedEmail: ParsedMail): VectorResult {
  const headers = parsedEmail.headers;
  const detections: Detection[] = [];

  // Weights for scoring
  const AUTH_FAIL_SCORE = 70; // SPF/DKIM fail is suspicious
  const SPOOF_SCORE = 90;     // Mismatch is highly suspicious (a "big red flag")

  let confidence = 0; // Start at 0 (clean)

  // Check 1: SPF/DKIM/DMARC Failure
  // These are systems that check if a server is *allowed* to send email for a domain.
  const authResults = headers.get('authentication-results') as string | undefined;
  if (authResults) {
    if (authResults.includes('spf=fail') || authResults.includes('dkim=fail') || authResults.includes('dmarc=fail')) {
      detections.push({
        filename: 'Email authentication failed (SPF, DKIM, or DMARC)',
        status: 'Virus Detected'
      });
      // Set the score to 70 (or keep it if it's already higher)
      confidence = Math.max(confidence, AUTH_FAIL_SCORE);
    }
  }

  // Check 2: From/Return-Path Mismatch (Spoofing) - (Slide 8)
  // 'From': Who the email *looks* like it's from (e.g., "billing@paypal.com")
  // 'Return-Path': Where a "bounce" reply *actually* goes (e.g., "scammer@evil.net")
  const fromHeader = headers.get('from') as { value: { address: string }[] } | undefined;
  const returnPathHeader = headers.get('return-path') as { value: { address: string }[] } | undefined;

  // This 'if' just makes sure both headers exist before we check them
  if (fromHeader && fromHeader.value[0]?.address && returnPathHeader && returnPathHeader.value[0]?.address) {
    // Get domain from "From" (e.g., "paypal.com")
    const fromDomain = fromHeader.value[0].address.split('@')[1];
    const returnPathAddress = returnPathHeader.value[0].address;
    // Get domain from "Return-Path" (e.g., "evil.net")
    const returnPathDomain = returnPathAddress.split('@')[1];

    // If the domains are valid but *do not match*...
    if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
      detections.push({
        filename: `Spoofing detected: "From" header (${fromDomain}) mismatches "Return-Path" (${returnPathDomain})`,
        status: 'Virus Detected'
      });
      // This is a "High Risk" finding, so set score to 90.
      confidence = Math.max(confidence, SPOOF_SCORE);
    }
  }

  const threatCount = detections.length;
  // Return the final result for *this scanner*
  return {
    scannerName: 'Header Phishing Scanner',
    detections: detections,
    confidence: confidence, // The final score for this scanner (0, 70, or 90)
    details: threatCount > 0 ? `Found ${threatCount} threat(s)` : 'No spoofing detected'
  };
}