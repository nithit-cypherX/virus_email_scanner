// src/scanners/attachmentScanner.ts
// Scans attachments for viruses using "fuzzy hashing".

import { Attachment } from 'mailparser';
// 'ssdeep' is the fuzzy hashing library
import * as ssdeep from 'ssdeep.js';
// 'JSZip' is the library that can read .zip files
import * as JSZip from 'jszip';
// We get the list of "virus "DNA"" from the brain
import { virusSignatures } from '../signatureDatabase';
import { Detection, VectorResult } from '../types';

// The 'ssdeep.similarity' score must be *above* this to be a "match"
const VIRUS_SIMILARITY_THRESHOLD = 80;

// A helper "blueprint" for storing results *during* the scan
interface FileScanResult {
  filename: string;
  isVirus: boolean;
  similarityScore: number; // The (0-100) score for this one file
}

/**
 * Internal recursive function to scan file content.
 * "Recursive" means the function can call *itself*.
 * This is how it scans a ZIP file inside another ZIP file.
 *
 * @param filename The file's name (e.g., "archive.zip > inner.zip > virus.exe")
 * @param content The file's data (Buffer)
 * @param scanResults This list is *filled up* by this function
 */
async function scanAttachmentContent(
  filename: string,
  content: Buffer,
  scanResults: FileScanResult[]
) {
  // Check 1: Is this file a ZIP file?
  if (filename.endsWith('.zip')) {
    try {
      // Load the ZIP file into memory
      const zip = await JSZip.loadAsync(content);
      // Loop over every file *inside* the ZIP
      for (const zipEntryName in zip.files) {
        if (zip.files[zipEntryName].dir) continue; // Skip folders

        // Get the data for the inner file
        const fileBuffer = await zip.files[zipEntryName].async('nodebuffer');
        const innerFilename = `${filename} > ${zipEntryName}`;

        // Recurse!
        // Call this *same function* on the inner file.
        await scanAttachmentContent(innerFilename, fileBuffer, scanResults);
      }
    } catch (error) {
      console.error(`Could not scan zip file ${filename}:`, error);
    }
  } else {
    // Check 2: It's a normal file. Scan it.

    // 1. Generate the fuzzy hash (the file's "DNA")
    const fileFuzzyHash = ssdeep.digest(content.toString('binary'));

    let highestScore = 0;

    // 2. Compare this file's "DNA" against *all* signatures in our database
    for (const virusHash of virusSignatures) {
      // 'ssdeep.similarity' returns a score from 0 to 100
      const score = ssdeep.similarity(fileFuzzyHash, virusHash);
      if (score > highestScore) {
        highestScore = score; // Track the highest similarity
      }
    }

    // 3. Add the detailed result for this one file
    scanResults.push({
      filename: filename,
      isVirus: highestScore > VIRUS_SIMILARITY_THRESHOLD,
      similarityScore: highestScore
    });
  }
}

/**
 * Scans a single email attachment for malware.
 * This is the main function called by the "Orchestrator".
 * It returns a VectorResult where 'confidence' is the highest similarity score found.
 */
export async function scanAttachment(
  attachment: Attachment
): Promise<VectorResult> {
  // This array will be filled by the 'scanAttachmentContent' function
  const allFileScans: FileScanResult[] = [];
  const filename = attachment.filename || 'unknown_file';

  if (attachment.content) {
    // Start the recursive scan
    await scanAttachmentContent(filename, attachment.content, allFileScans);
  }

  // --- Reporting Logic ---
  // Now, 'allFileScans' is full of results. Let's summarize them.

  let maxConfidence = 0; // The highest similarity score found (e.g., 95)
  const virusHits: Detection[] = [];

  for (const scan of allFileScans) {
    // Find the highest similarity score from all files scanned
    if (scan.similarityScore > maxConfidence) {
      maxConfidence = scan.similarityScore;
    }

    // If it *is* a virus (above threshold), add it to the detection list
    if (scan.isVirus) {
      virusHits.push({
        // Add the similarity score to the detection details for the UI
        filename: `${scan.filename} (Similarity: ${scan.similarityScore}%)`,
        status: 'Virus Detected'
      });
    }
  }

  // Return the final result for *this scanner*
  return {
    scannerName: 'Attachment Scanner',
    detections: virusHits,
    // The confidence *is* the highest similarity score.
    // This lets the 'emailScanner' use this score in the 'calculateOverallRisk'
    confidence: maxConfidence,
    details: virusHits.length > 0 ? `Found ${virusHits.length} threat(s)` : 'No threats found'
  };
}