// src/scanners/headerScanner.ts
// --- (This file is completely REPLACED) ---

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
  const SPOOF_SCORE = 90;     // Mismatch is highly suspicious

  let confidence = 0;

  // Check 1: SPF/DKIM/DMARC Failure
  const authResults = headers.get('authentication-results') as string | undefined;
  if (authResults) {
    if (authResults.includes('spf=fail') || authResults.includes('dkim=fail') || authResults.includes('dmarc=fail')) {
      detections.push({
        filename: 'Email authentication failed (SPF, DKIM, or DMARC)',
        status: 'Virus Detected'
      });
      confidence = Math.max(confidence, AUTH_FAIL_SCORE);
    }
  }

  // Check 2: From/Return-Path Mismatch (Spoofing)
  const fromHeader = headers.get('from') as { value: { address: string }[] } | undefined;
  const returnPathHeader = headers.get('return-path') as { value: { address: string }[] } | undefined;

  if (fromHeader && fromHeader.value[0]?.address && returnPathHeader && returnPathHeader.value[0]?.address) {
    const fromDomain = fromHeader.value[0].address.split('@')[1];
    const returnPathAddress = returnPathHeader.value[0].address;
    const returnPathDomain = returnPathAddress.split('@')[1];

    if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
      detections.push({
        filename: `Spoofing detected: "From" header (${fromDomain}) mismatches "Return-Path" (${returnPathDomain})`,
        status: 'Virus Detected'
      });
      confidence = Math.max(confidence, SPOOF_SCORE);
    }
  }

  const threatCount = detections.length;
  return {
    scannerName: 'Header Phishing Scanner',
    detections: detections,
    confidence: confidence,
    details: threatCount > 0 ? `Found ${threatCount} threat(s)` : 'No spoofing detected'
  };
}