// src/controllers/scanController.ts

import { Request, Response } from 'express';
import { scanEmailFile } from '../emailScanner';

/**
 * Handles the incoming API request for '/scan'.
 *
 * How it works:
 * 1. Validates that a file was uploaded and is a .eml file.
 * 2. Gets the file buffer from the request (which multer put in memory).
 * 3. Calls the 'scanEmailFile' orchestrator to do the scan.
 * 4. Returns a 200 OK with the JSON report on success.
 * 5. Returns a 400 or 500 error on failure.
 *
 * @param req The Express Request object.
 * @param res The Express Response object.
 */
export const handleScanRequest = async (req: Request, res: Response) => {
  console.log("File received!");

  // === 1. Validation ===
  if (!req.file) {
    console.log("Error: No file was uploaded.");
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (!req.file.originalname.endsWith('.eml')) {
    console.log("Error: Invalid file type.");
    return res.status(400).json({ error: 'Please upload a .eml file.' });
  }

  // === 2. Scan Logic ===
  try {
    const emailBuffer = req.file.buffer;
    const results = await scanEmailFile(emailBuffer);

    // 3. Success Response
    console.log('Scan complete. Results:', results);
    res.json({ results });

  } catch (error) {
    // 4. Error Response
    console.error('Scanning failed:', error);
    res.status(500).json({ error: 'Failed to read or scan the email file.' });
  }
};