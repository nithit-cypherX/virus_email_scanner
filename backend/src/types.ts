// src/types.ts
// This file defines the "shape" of all our data.

/**
 * Represents a single detection found during a scan.
 * This is for the "Detection Details" list.
 * Example: { filename: "Malicious Link: bad-site.com", status: "Virus Detected" }
 */
export interface Detection {
  filename: string;
  status: 'Clean' | 'Virus Detected';
}

/**
 * Represents the summary result from one of the individual scanners.
 * This is for the "Analysis Breakdown" list.
 * Example: { scanner: "Link Scanner", status: "Virus Detected", details: "Found 1 threat(s)", confidence: 100 }
 */
export interface ScanDetail {
  scanner: string;
  status: 'Clean' | 'Virus Detected';
  details: string;
  confidence: number;
}

/**
 * NEW: A standard object returned by *all* individual scanners (e.g., headerScanner.ts).
 * This is an *internal* type. The 'emailScanner.ts' file uses this to
 * build the final 'ScanDetail' and 'Detection' lists.
 */
export interface VectorResult {
  scannerName: string;   // "Header Phishing Scanner"
  detections: Detection[]; // List of all threats *this scanner* found
  confidence: number;    // This scanner's *own* score (0-100)
  details: string;       // "Found 1 threat(s)"
}

/**
 * The complete, final report object that is sent to the frontend.
 * This is the "blueprint" for the final JSON.
 */
export interface FullScanReport {
  // This part is for the "Headline" box (e.g., "HIGH RISK")
  summary: {
    overallRiskScore: number;     // The final score (e.g., 90)
    riskLevel: 'Low' | 'Medium' | 'High'; // The final category (e.g., "High")
    totalDetections: number;    // Total threats found (e.g., 2)
    totalScans: number;         // Always 4
  };
  // This is the array for the "Analysis Breakdown" list
  scans: ScanDetail[];
  // This is the array for the "Detection Details" list
  detections: Detection[];
}