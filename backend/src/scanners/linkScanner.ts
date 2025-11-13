// src/scanners/linkScanner.ts
// Scans for malicious links (phishing).

import { ParsedMail } from 'mailparser';
// We get the list of "bad domains" from the brain.
import { maliciousDomains } from '../signatureDatabase';
import { Detection, VectorResult } from '../types';

/**
 * Scans the email body for malicious links.
 * Returns a VectorResult with a confidence score.
 */
export function scanLinks(parsedEmail: ParsedMail): VectorResult {
  const detections: Detection[] = [];
  const MALICIOUS_LINK_SCORE = 100; // Finding a bad link is 100% High Risk
  let confidence = 0;

  // Combine text and HTML body to make sure we find all links
  const allTextContent = (parsedEmail.text || '') + (parsedEmail.html || '');

  // This is a Regular Expression (Regex) that finds URLs
  const urlRegex = /(https?:\/\/[^\s"'<>]+)/g;
  const foundUrls = allTextContent.match(urlRegex) || [];
  // Use a 'Set' to only check each unique URL once
  const uniqueUrls = new Set(foundUrls);

  // Loop through every unique URL we found
  for (const url of uniqueUrls) {
    try {
      // Use the built-in 'URL' object to safely parse the link
      const urlObject = new URL(url);
      // Get the domain name (e.g., "www.google.com")
      let domain = urlObject.hostname;
      // Clean it (e.g., "www.google.com" -> "google.com")
      if (domain.startsWith('www.')) {
        domain = domain.slice(4);
      }

      // This is the "instant lookup" from Slide 10
      // Check if our Set of bad domains has this domain.
      if (maliciousDomains.has(domain)) {
        detections.push({
          filename: `Malicious Link: ${domain}`,
          status: 'Virus Detected'
        });
        confidence = Math.max(confidence, MALICIOUS_LINK_SCORE);
      }
    } catch (error) {
      // This 'catch' block handles broken/un-parseable URLs
      console.warn(`Could not parse URL: ${url}`);
    }
  }

  const threatCount = detections.length;
  // Return the final result for *this scanner*
  return {
    scannerName: 'Link Phishing Scanner',
    detections: detections,
    confidence: confidence, // Will be 0 or 100
    details: threatCount > 0 ? `Found ${threatCount} threat(s)` : 'No threats found'
  };
}