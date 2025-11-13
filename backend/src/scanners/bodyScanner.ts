// src/scanners/bodyScanner.ts
// Scans for "Social Engineering" keywords.

import { ParsedMail } from 'mailparser';
// This is the "fuzzy matching" library. It finds typos.
import * as levenshtein from 'fast-levenshtein';
// We get the list of "bad word sets" from the brain.
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

  // We only scan if there is plain text to read
  if (parsedEmail.text) {
    // 1. Clean the text and break it into "tokens"
    const bodyText = parsedEmail.text.toLowerCase(); // 'Urgent' -> 'urgent'
    const tokens = new Set(
      bodyText
        .replace(/[^a-z0-9\s]/g, ' ') // Remove all punctuation
        .split(/\s+/)                 // Split by spaces
        .filter(word => word.length > 0) // Remove empty words
    );

    // This is the "fuzzy matching" setting (Slide 9)
    // 0 = exact match, 1 = allows one typo (e.g., "passwrd")
    const FUZZY_DISTANCE_THRESHOLD = 1;

    // 2. Loop through each 'Set' from the database
    // (e.g., new Set(["password", "expired", "update"]))
    for (const keywordSet of maliciousKeywordSets) {
      let hitsFound = 0; // How many keywords from *this set* have we found?

      // 3. Loop through each keyword *in that set*
      for (const keyword of keywordSet) {
        let keywordFound = false;
        // 4. Compare the keyword against every token in the email
        for (const token of tokens) {
          // Calculate the "fuzzy distance" (e.g., levenshtein.get("password", "passwrd") = 1)
          const distance = levenshtein.get(keyword, token);
          if (distance <= FUZZY_DISTANCE_THRESHOLD) {
            keywordFound = true; // We found a match (or a typo)!
            break; // Stop checking tokens, go to next keyword
          }
        }
        if (keywordFound) {
          hitsFound++; // We found one of the keywords in this set.
        }
      }

      // 5. Check if we found *all* the keywords in this set
      if (hitsFound === keywordSet.size) {
        const phrase = `Phishing keywords detected: (${[...keywordSet].join(', ')})`;
        detections.push({
          filename: phrase,
          status: 'Virus Detected'
        });
        confidence = Math.max(confidence, KEYWORD_SET_SCORE);
        break; // We found a match, no need to check other keyword sets
      }
    }
  }

  // Return the final result for *this scanner*
  return {
    scannerName: 'Email Body Scanner',
    detections: detections,
    confidence: confidence, // Will be 0 or 75
    details: confidence > 0 ? 'Malicious keywords found' : 'No threats found'
  };
}