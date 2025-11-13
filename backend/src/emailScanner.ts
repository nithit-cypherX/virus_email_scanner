// src/emailScanner.ts
// This is the "Orchestrator" file.

// 'simpleParser' is a great tool from 'mailparser'
// It turns the raw .eml file buffer into a simple JavaScript object.
import { simpleParser } from 'mailparser';
// We import the "blueprints" for our data from types.ts
import { FullScanReport, ScanDetail, Detection, VectorResult } from './types';

// Import our individual "worker" scanners
import { scanHeaders } from './scanners/headerScanner';
import { scanBody } from './scanners/bodyScanner';
import { scanLinks } from './scanners/linkScanner';
import { scanAttachment } from './scanners/attachmentScanner';

/**
 * Calculates the overall risk score.
 * This is your "one-drop-of-poison" rule from Slide 7.
 * Logic: The overall risk is the *highest* risk found by any scanner.
 * For example, if scores are [0, 75, 0, 0], the max score is 75.
 */
function calculateOverallRisk(vectors: VectorResult[]): { score: number, level: 'Low' | 'Medium' | 'High' } {
  let maxScore = 0;
  // Loop through all the results from the scanners
  for (const vector of vectors) {
    // If this scanner's score is higher than the current max...
    if (vector.confidence > maxScore) {
      // ...it becomes the new max.
      maxScore = vector.confidence;
    }
  }

  // Turn the final number score (0-100) into a simple category.
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

  // Use mailparser to read the file buffer
  const parsedEmail = await simpleParser(emailBuffer);

  // === 1. RUN ALL SCANNERS ===
  // Call each scanner and get its VectorResult
  // These three are fast and run first.
  const headerResult = scanHeaders(parsedEmail);
  const bodyResult = scanBody(parsedEmail);
  const linkResult = scanLinks(parsedEmail);

  // Attachment scanning is 'async' (it might take time),
  // so we handle it carefully.
  const attachmentResults: VectorResult[] = [];
  if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
    // Loop through every attachment
    for (const attachment of parsedEmail.attachments) {
      // We 'await' the scan for *each* attachment.
      const result = await scanAttachment(attachment);
      attachmentResults.push(result);
    }
  }

  // Combine all attachment results into one main "vector"
  // (This makes the report cleaner: "Attachment Scanner" instead of 5 different ones)
  const allAttachmentDetections = attachmentResults.flatMap(r => r.detections);
  const attachmentVector: VectorResult = {
    scannerName: 'Attachment Scanner',
    detections: allAttachmentDetections,
    confidence: allAttachmentDetections.length > 0 ? 100 : 0, // Simplified: 100 if any threat, 0 if not.
    details: allAttachmentDetections.length > 0 ? `Found ${allAttachmentDetections.length} threat(s)` : 'No threats found'
  };

  // Create a list of all 4 main vector results
  const allVectors = [headerResult, bodyResult, linkResult, attachmentVector];

  // === 2. BUILD THE FINAL REPORT ===

  // Calculate the "Headline" score using our function from above.
  const { score: overallRiskScore, level: riskLevel } = calculateOverallRisk(allVectors);

  // Collect all 'ScanDetail' items for the "Analysis Breakdown" list on the UI
  const allScans: ScanDetail[] = allVectors.map(v => ({
    scanner: v.scannerName,
    status: v.confidence > 0 ? 'Virus Detected' : 'Clean',
    details: v.details,
    confidence: v.confidence
  }));

  // Collect all 'Detection' items for the "Detection Details" list on the UI
  const allDetections: Detection[] = allVectors.flatMap(v => v.detections);

  const totalDetections = allDetections.length;

  // Build the final object that we will send to the frontend.
  // This object *must* match the 'FullScanReport' type.
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

  // Send the finished report back to 'scanController.ts'
  return report;
}