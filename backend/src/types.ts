// src/types.ts
// --- (This file is completely REPLACED) ---

/**
 * Represents a single detection found during a scan.
 * (This interface is unchanged)
 */
export interface Detection {
  filename: string;
  status: 'Clean' | 'Virus Detected';
}

/**
 * Represents the summary result from one of the individual scanners.
 * (This interface is unchanged)
 */
export interface ScanDetail {
  scanner: string;
  status: 'Clean' | 'Virus Detected';
  details: string;
  confidence: number;
}

/**
 * NEW: A standard object returned by all individual scanners.
 * This holds the results *before* they are put into the final report.
 */
export interface VectorResult {
  scannerName: string;
  detections: Detection[];
  confidence: number;
  details: string;
}

/**
 * The complete, final report object that is sent to the frontend.
 * --- UPDATED ---
 */
export interface FullScanReport {
  summary: {
    // NEW: The "Headline" score (0-100)
    overallRiskScore: number;
    // NEW: The "Headline" category
    riskLevel: 'Low' | 'Medium' | 'High';
    totalDetections: number;
    totalScans: number;
  };
  // This 'scans' array will be built from the VectorResults
  scans: ScanDetail[];
  // This 'detections' array will be built from the VectorResults
  detections: Detection[];
}