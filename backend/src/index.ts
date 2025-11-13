// src/index.ts

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { handleScanRequest } from './controllers/scanController';

const app = express();
const port = 4000;

// --- Middleware Setup ---

// Enable Cross-Origin Resource Sharing (allows frontend to call backend)
app.use(cors());

// Configure Multer to store uploaded files in memory (as a Buffer)
// This is secure as it avoids writing potentially malicious files to disk.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Route Setup ---

/**
 * Main API endpoint for scanning.
 * - 'upload.single('emailFile')': This is middleware that intercepts
 * a file upload from a form field named 'emailFile'.
 * - 'handleScanRequest': This is our controller function that runs
 * after multer is finished.
 */
app.post('/scan', upload.single('emailFile'), handleScanRequest);

// --- Start Server ---
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});