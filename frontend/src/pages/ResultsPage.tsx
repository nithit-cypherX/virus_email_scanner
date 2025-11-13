// src/pages/ResultsPage.tsx
// This is the "Results" page (Slide 12)

import { useLocation, useNavigate } from 'react-router-dom';

// --- Types ---
// In a real app, these would be in 'types.ts' and imported
// But for a simple page, it's okay to redefine them
interface ScanDetail {
  scanner: string;
  status: 'Clean' | 'Virus Detected';
  details: string;
  confidence: number;
}
interface Detection {
  filename: string;
  status: 'Clean' | 'Virus Detected';
}
interface FullScanReport {
  summary: {
    overallRiskScore: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    totalDetections: number;
    totalScans: number;
  };
  scans: ScanDetail[];
  detections: Detection[];
}

// --- Helper Functions ---

/**
 * This helper function returns the correct Tailwind CSS class names
 * based on the risk level. This keeps the HTML clean.
 */
function getRiskColors(level: 'Low' | 'Medium' | 'High') {
  switch (level) {
    case 'High':
      return {
        bg: 'bg-red-900',
        text: 'text-red-300',
        textStrong: 'text-red-400',
        badge: 'bg-red-500',
      };
    case 'Medium':
      return {
        bg: 'bg-yellow-900',
        text: 'text-yellow-300',
        textStrong: 'text-yellow-400',
        badge: 'bg-yellow-500',
      };
    case 'Low':
    default:
      return {
        bg: 'bg-green-900',
        text: 'text-green-300',
        textStrong: 'text-green-400',
        badge: 'bg-green-500',
      };
  }
}

/**
 * This helper returns a text color based on the confidence *number*.
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-red-400';
  if (confidence >= 40) return 'text-yellow-400';
  if (confidence > 0) return 'text-yellow-400'; // Any score > 0 is at least yellow
  return 'text-green-400';
}


// --- The Main Component ---

function ResultsPage() {
  const navigate = useNavigate();
  // 'useLocation' is the React Hook that lets us read the 'state'
  // that we passed in with 'navigate()' from the App.tsx page.
  const location = useLocation();

  // Get the report from the location state.
  const report = location.state?.results as FullScanReport | undefined;

  // --- Error Handling ---
  // What if the user visits '/results' directly without scanning?
  // The 'report' will be 'undefined'.
  if (!report) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-900 text-gray-300 p-4">
        <h1 className="text-2xl text-red-400">No scan results found.</h1>
        <button
          onClick={() => navigate('/')} // Go back to the homepage
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Scanner
        </button>
      </div>
    );
  }

  // --- Render the Report ---
  // If we get here, the 'report' object exists!
  const { summary, scans, detections } = report;
  // Get the color theme for this report
  const colors = getRiskColors(summary.riskLevel);

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-gray-900 text-gray-300 p-4 py-12">
      <div className="w-full max-w-lg">

        {/* === 1. The Main Summary "Headline" (UPDATED) === */}
        <div className={`mb-8 rounded-lg p-6 text-center ${colors.bg}`}>
          {/* The "Traffic Light" Category (e.g., "HIGH RISK") */}
          <h1 className={`text-4xl font-bold ${colors.textStrong}`}>
            {summary.riskLevel.toUpperCase()} RISK
          </h1>

          {/* This summary line is the sub-headline */}
          <p className={`text-lg ${colors.text} mt-3`}>
            {summary.totalDetections > 0
              ? `Found ${summary.totalDetections} threat(s) across ${summary.totalScans} scanners.`
              : 'No immediate threats were found.'
            }
          </p>
        </div>

        {/* === 2. The "Analysis Breakdown" List === */}
        <div className="rounded-md bg-gray-800 p-4 mb-8">
          <h3 className="mb-3 border-b border-gray-600 pb-2 text-lg font-semibold text-white">
            Analysis Breakdown
          </h3>
          <ul className="space-y-2">
            {/* Loop through the 'scans' array and create an 'li' for each one */}
            {scans.map((scan, index) => (
              <li
                key={index}
                className="flex justify-between items-center rounded bg-gray-700 p-3"
              >
                <div>
                  <span className="font-semibold text-gray-200">{scan.scanner}</span>
                  <p className="text-sm text-gray-400">{scan.details}</p>
                </div>
                <span
                  className={`text-xl font-bold ${getConfidenceColor(scan.confidence)}`}
                >
                  {/* Show the confidence number (e.g., "90%") */}
                  {scan.confidence}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* === 3. The Detailed Detections List === */}
        {/* This entire 'div' only shows if 'detections.length > 0' */}
        {detections.length > 0 && (
          <div className="rounded-md bg-gray-800 p-4">
            <h3 className="mb-3 border-b border-gray-600 pb-2 text-lg font-semibold text-white">
              Detection Details
            </h3>
            <ul className="space-y-2">
              {/* Loop through the 'detections' array */}
              {detections.map((detection, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center rounded bg-gray-700 p-3"
                >
                  <span className="font-mono text-sm text-red-300 break-all">
                    {/* Show the detection name (e.g., "Malicious Link: ...") */}
                    {detection.filename}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${colors.badge}`}>
                    DETECTED
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Scan Again Button */}
        <button
          onClick={() => navigate('/')} // Go back to the homepage
          className="mt-8 w-full rounded-md bg-blue-600 px-4 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
        >
          Scan Another File
        </button>

      </div>
    </div>
  );
}

export default ResultsPage;