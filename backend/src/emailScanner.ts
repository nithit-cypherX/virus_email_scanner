// src/emailScanner.ts
// --- (This file is completely REPLACED) ---

import { simpleParser } from 'mailparser';
import { FullScanReport, ScanDetail, Detection, VectorResult } from './types';

// Import our individual scanners
import { scanHeaders } from './scanners/headerScanner';
import { scanBody } from './scanners/bodyScanner';
import { scanLinks } from './scanners/linkScanner';
import { scanAttachment } from './scanners/attachmentScanner';

/**
 * NEW: Calculates the overall risk score.
 * Logic: The overall risk is the *highest* risk found by any scanner.
 */
function calculateOverallRisk(vectors: VectorResult[]): { score: number, level: 'Low' | 'Medium' | 'High' } {
  let maxScore = 0;
  for (const vector of vectors) {
    if (vector.confidence > maxScore) {
      maxScore = vector.confidence;
    }
  }

  let level: 'Low' | 'Medium' | 'High' = 'Low';
  if (maxScore >= 90) {
    level = 'High';
  } else if (maxScore >= 40) {
    level = 'Medium';
  }

  return { score: maxScore, level: level };
}

/**
 * Orchestrates the entire email scan process.
 * @param emailBuffer The raw .eml file buffer from the API request.
 * @returns A Promise resolving to the FullScanReport.
 */
export async function scanEmailFile(emailBuffer: Buffer): Promise<FullScanReport> {
  
  const parsedEmail = await simpleParser(emailBuffer);

  // === 1. RUN ALL SCANNERS ===
  // Call each scanner and get its VectorResult
  const headerResult = scanHeaders(parsedEmail);
  const bodyResult = scanBody(parsedEmail);
  const linkResult = scanLinks(parsedEmail);
  
  // Handle attachments
  const attachmentResults: VectorResult[] = [];
  if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
    for (const attachment of parsedEmail.attachments) {
      // We scan each attachment, but will group them into one "Attachment" vector
      const result = await scanAttachment(attachment);
      attachmentResults.push(result);
    }
  }

  // Combine all attachment results into one main vector
  const allAttachmentDetections = attachmentResults.flatMap(r => r.detections);
  const attachmentVector: VectorResult = {
    scannerName: 'Attachment Scanner',
    detections: allAttachmentDetections,
    confidence: allAttachmentDetections.length > 0 ? 100 : 0,
    details: allAttachmentDetections.length > 0 ? `Found ${allAttachmentDetections.length} threat(s)` : 'No threats found'
  };

  const allVectors = [headerResult, bodyResult, linkResult, attachmentVector];

  // === 2. BUILD THE FINAL REPORT ===
  
  // Calculate the "Headline" score
  const { score: overallRiskScore, level: riskLevel } = calculateOverallRisk(allVectors);

  // Collect all 'ScanDetail' items for the "Details" list
  const allScans: ScanDetail[] = allVectors.map(v => ({
    scanner: v.scannerName,
    status: v.confidence > 0 ? 'Virus Detected' : 'Clean',
    details: v.details,
    confidence: v.confidence
  }));

  // Collect all 'Detection' items for the "Detection Details" list
  const allDetections: Detection[] = allVectors.flatMap(v => v.detections);
  
  const totalDetections = allDetections.length;

  const report: FullScanReport = {
    summary: {
      overallRiskScore: overallRiskScore,
      riskLevel: riskLevel,
      totalDetections: totalDetections,
      totalScans: allVectors.length
    },
    scans: allScans,
    detections: allDetections
  };
  
  return report;
}