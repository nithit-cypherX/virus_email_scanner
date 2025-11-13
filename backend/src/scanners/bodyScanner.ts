// src/scanners/bodyScanner.ts
// --- (This file is completely REPLACED) ---

import { ParsedMail } from 'mailparser';
import * as levenshtein from 'fast-levenshtein';
import { maliciousKeywordSets } from '../signatureDatabase';
import { Detection, VectorResult } from '../types';

/**
 * Scans the email's text body for sets of malicious keywords.
 * Returns a VectorResult with a confidence score.
 */
export function scanBody(parsedEmail: ParsedMail): VectorResult {
  const detections: Detection[] = [];
  const KEYWORD_SET_SCORE = 75; // Finding a set is a high-confidence phishing attempt
  let confidence = 0;

  if (parsedEmail.text) {
    const bodyText = parsedEmail.text.toLowerCase();
    const tokens = new Set(
      bodyText
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 0)
    );
    
    const FUZZY_DISTANCE_THRESHOLD = 1;

    for (const keywordSet of maliciousKeywordSets) {
      let hitsFound = 0;
      
      for (const keyword of keywordSet) {
        let keywordFound = false;
        for (const token of tokens) {
          const distance = levenshtein.get(keyword, token);
          if (distance <= FUZZY_DISTANCE_THRESHOLD) {
            keywordFound = true;
            break;
          }
        }
        if (keywordFound) {
          hitsFound++;
        }
      }
      
      if (hitsFound === keywordSet.size) {
        const phrase = `Phishing keywords detected: (${[...keywordSet].join(', ')})`;
        detections.push({
          filename: phrase,
          status: 'Virus Detected'
        });
        confidence = Math.max(confidence, KEYWORD_SET_SCORE);
        break; 
      }
    }
  }

  return {
    scannerName: 'Email Body Scanner',
    detections: detections,
    confidence: confidence,
    details: confidence > 0 ? 'Malicious keywords found' : 'No threats found'
  };
}