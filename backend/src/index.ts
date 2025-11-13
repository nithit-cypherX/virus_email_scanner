// src/index.ts

// 'express' is the main framework for building the server
import express from 'express';
// 'cors' lets your React frontend (on port 3000) talk to your backend (on port 4000)
import cors from 'cors';
// 'multer' is a tool that helps handle file uploads
import multer from 'multer';
// This is the function we will call after a file is uploaded
import { handleScanRequest } from './controllers/scanController';

// Create the express app
const app = express();
const port = 4000;

// --- Middleware Setup ---

// Enable Cross-Origin Resource Sharing
// This tells the server "it's okay to accept requests from other websites" (like your React app)
app.use(cors());

// Configure Multer to store uploaded files in memory (as a Buffer)
// This is your "Core Concept Design"!
// The file is NOT saved to the hard drive. It stays in RAM.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Route Setup ---

/**
 * Main API endpoint for scanning.
 * This is the "address" the frontend will send its data to.
 *
 * - 'upload.single('emailFile')': This part "catches" the file.
 * It looks for a file sent with the name 'emailFile'.
 * It uses your 'memoryStorage' setting.
 *
 * - 'handleScanRequest': This is your function that runs *after*
 * multer has successfully received the file.
 */
app.post('/scan', upload.single('emailFile'), handleScanRequest);

// --- Start Server ---

// This command tells the server to start listening for requests on port 4000.
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});