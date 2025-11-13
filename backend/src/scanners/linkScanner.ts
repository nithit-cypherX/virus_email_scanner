// src/scanners/linkScanner.ts
// --- (This file is completely REPLACED) ---

import { ParsedMail } from 'mailparser';
import { maliciousDomains } from '../signatureDatabase';
import { Detection, VectorResult } from '../types';

/**
 * Scans the email body for malicious links.
 * Returns a VectorResult with a confidence score.
 */
export function scanLinks(parsedEmail: ParsedMail): VectorResult {
  const detections: Detection[] = [];
  const MALICIOUS_LINK_SCORE = 100; // This is a 100% confirmation
  let confidence = 0;

  const allTextContent = (parsedEmail.text || '') + (parsedEmail.html || '');
  const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
  const foundUrls = allTextContent.match(urlRegex) || [];
  const uniqueUrls = new Set(foundUrls);

  for (const url of uniqueUrls) {
    try {
      const urlObject = new URL(url);
      let domain = urlObject.hostname;
      if (domain.startsWith('www.')) {
        domain = domain.slice(4);
      }
      
      if (maliciousDomains.has(domain)) {
        detections.push({
          filename: `Malicious Link: ${domain}`,
          status: 'Virus Detected'
        });
        confidence = Math.max(confidence, MALICIOUS_LINK_SCORE);
      }
    } catch (error) {
      console.warn(`Could not parse URL: ${url}`);
    }
  }

  const threatCount = detections.length;
  return {
    scannerName: 'Link Phishing Scanner',
    detections: detections,
    confidence: confidence,
    details: threatCount > 0 ? `Found ${threatCount} threat(s)` : 'No threats found'
  };
}