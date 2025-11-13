// src/scanners/attachmentScanner.ts
// --- (This file is completely REPLACED) ---

import { Attachment } from 'mailparser';
import * as ssdeep from 'ssdeep.js';
import * as JSZip from 'jszip';
import { virusSignatures } from '../signatureDatabase';
import { Detection, VectorResult } from '../types';

const VIRUS_SIMILARITY_THRESHOLD = 80; // Still the "detection" level

// NEW: A helper type to store results from the recursive scan
interface FileScanResult {
  filename: string;
  isVirus: boolean;
  similarityScore: number;
}

/**
 * Internal recursive function to scan file content.
 * It now populates a 'scanResults' list with detailed similarity scores.
 */
async function scanAttachmentContent(
  filename: string,
  content: Buffer,
  scanResults: FileScanResult[] // This list is populated by this function
) {
  if (filename.endsWith('.zip')) {
    try {
      const zip = await JSZip.loadAsync(content);
      for (const zipEntryName in zip.files) {
        if (zip.files[zipEntryName].dir) continue;
        
        const fileBuffer = await zip.files[zipEntryName].async('nodebuffer');
        const innerFilename = `${filename} > ${zipEntryName}`;

        // Recurse!
        await scanAttachmentContent(innerFilename, fileBuffer, scanResults);
      }
    } catch (error) {
      console.error(`Could not scan zip file ${filename}:`, error);
    }
  } else {
    // --- THIS IS THE NEW LOGIC ---
    // 1. Generate the fuzzy hash
    const fileFuzzyHash = ssdeep.digest(content.toString('binary'));
    
    let highestScore = 0;
    
    // 2. Compare against *all* signatures to find the *best match*
    for (const virusHash of virusSignatures) {
      const score = ssdeep.similarity(fileFuzzyHash, virusHash);
      if (score > highestScore) {
        highestScore = score; // Track the highest similarity
      }
    }

    // 3. Add the detailed result
    scanResults.push({
      filename: filename,
      isVirus: highestScore > VIRUS_SIMILARITY_THRESHOLD,
      similarityScore: highestScore
    });
  }
}

/**
 * Scans a single email attachment for malware.
 * Returns a VectorResult where 'confidence' is the highest similarity score found.
 */
export async function scanAttachment(
  attachment: Attachment
): Promise<VectorResult> {
  const allFileScans: FileScanResult[] = []; // Use our new helper type
  const filename = attachment.filename || 'unknown_file';
  
  if (attachment.content) {
    // This function will fill the 'allFileScans' array
    await scanAttachmentContent(filename, attachment.content, allFileScans);
  }

  // --- THIS IS THE NEW REPORTING LOGIC ---
  let maxConfidence = 0; // The highest similarity score found
  const virusHits: Detection[] = [];

  for (const scan of allFileScans) {
    // Find the highest similarity score from all files scanned
    if (scan.similarityScore > maxConfidence) {
      maxConfidence = scan.similarityScore;
    }
    
    // If it *is* a virus (above threshold), add it to the detection list
    if (scan.isVirus) {
      virusHits.push({
        // NEW: Add the similarity score to the detection details
        filename: `${scan.filename} (Similarity: ${scan.similarityScore}%)`,
        status: 'Virus Detected'
      });
    }
  }

  return {
    scannerName: 'Attachment Scanner',
    detections: virusHits,
    // The confidence IS the highest similarity score
    confidence: maxConfidence, 
    details: virusHits.length > 0 ? `Found ${virusHits.length} threat(s)` : 'No threats found'
  };
}