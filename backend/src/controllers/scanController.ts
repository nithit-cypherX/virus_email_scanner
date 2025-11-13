// src/controllers/scanController.ts

import { Request, Response } from 'express';
// We import the main "conductor" function from our orchestrator file
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
 * @param req The Express Request object (contains info *from* the user, like the file)
 * @param res The Express Response object (used to send a reply *to* the user)
 */
export const handleScanRequest = async (req: Request, res: Response) => {
  console.log("File received!");

  // === 1. Validation ===
  // Check 1: Did the user upload *any* file?
  if (!req.file) {
    console.log("Error: No file was uploaded.");
    // 400 means "Bad Request" - the user made a mistake.
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Check 2: Was it a .eml file?
  if (!req.file.originalname.endsWith('.eml')) {
    console.log("Error: Invalid file type.");
    // 400 Bad Request again.
    return res.status(400).json({ error: 'Please upload a .eml file.' });
  }

  // === 2. Scan Logic ===
  // We use a 'try...catch' block. This is great error handling.
  // It means: "Try to do the scan, but if *anything* crashes,
  // jump to the 'catch' block and send a '500' error."
  try {
    // Get the file data from memory.
    // 'req.file.buffer' exists because we used 'multer.memoryStorage()'.
    const emailBuffer = req.file.buffer;

    // This is the big step!
    // We 'await' the results from the main scanner.
    const results = await scanEmailFile(emailBuffer);

    // 3. Success Response
    // If we get here, everything worked!
    console.log('Scan complete. Results:', results);
    // Send the final report back to the React frontend as JSON.
    res.json({ results });

  } catch (error) {
    // 4. Error Response
    // Something crashed (maybe the .eml file was broken and 'mailparser' failed).
    console.error('Scanning failed:', error);
    // 500 means "Internal Server Error" - the server made a mistake.
    res.status(500).json({ error: 'Failed to read or scan the email file.' });
  }
};