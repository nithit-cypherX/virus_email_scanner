// src/App.tsx
// This is the main "Upload" page.

import React, { useState } from 'react';
// 'useNavigate' is the new way to change pages in 'react-router-dom'
import { useNavigate } from 'react-router-dom';

function App() {
  // --- State Variables (The component's "memory") ---
  // 'useState' is a React "Hook"
  // 1. Remembers the file the user selected
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 2. Remembers any error message to show
  const [error, setError] = useState<string | null>(null);
  // 3. Remembers if we are currently waiting for the backend
  const [isScanning, setIsScanning] = useState(false);

  // Get the 'navigate' function from the router
  const navigate = useNavigate();

  // Runs when the user selects a file from the "Choose File" dialog
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null); // Clear any old errors
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Runs when the user clicks the "Scan" button
  const handleUpload = async () => {
    // 1. Validation (frontend-side)
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }
    if (!selectedFile.name.endsWith('.eml')) {
      setError('Error: Please upload a .eml file.');
      return;
    }

    // 2. Prepare for Upload
    // 'FormData' is the standard way to send files to an API
    const formData = new FormData();
    formData.append('emailFile', selectedFile); // 'emailFile' must match the backend 'upload.single()'

    setError(null);
    setIsScanning(true); // Show "Scanning..." text on the button

    // 3. Send to Backend
    // We use a 'try...catch' block for error handling
    try {
      // 'fetch' is the browser's built-in tool for API calls
      const response = await fetch('http://localhost:4000/scan', {
        method: 'POST',
        body: formData, // Send the file
      });

      const data = await response.json(); // Read the JSON report from the server

      if (!response.ok) {
        // The server sent an error (e.g., 400 or 500)
        setError(data.error || 'Something went wrong.');
      } else {
        // 4. Success!
        // This is the key: navigate to the '/results' page
        // and pass the 'data.results' (the FullScanReport)
        // using the 'state' object.
        navigate('/results', { state: { results: data.results } });
      }
    } catch (err) {
      // This 'catch' block runs if the *network* fails
      // (e.g., the backend server is not running)
      console.error(err);
      setError('Unable to connect to the backend server.');
    } finally {
      // This 'finally' block runs *no matter what* (success or error)
      setIsScanning(false); // Hide "Scanning..." text
    }
  };

  // --- This is the JSX (HTML) for the page ---
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-900 text-gray-300 p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-center text-4xl font-bold text-blue-400 mb-4">
          🛡️ Email Virus Scanner
        </h1>
        <p className="text-center text-lg text-gray-400 mb-8">
          Upload a <code className="text-blue-300">.eml</code> file to scan its attachments.
        </p>

        {/* The file upload box */}
        <label
          htmlFor="file-upload"
          className="mb-4 block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 p-8 text-center text-gray-500 hover:border-gray-500 hover:bg-gray-700"
        >
          {/* This text changes based on 'selectedFile' */}
          {selectedFile ? (
            <span className="text-green-400">Selected: {selectedFile.name}</span>
          ) : (
            <span>Click or Drag to Upload File</span>
          )}
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* The "Scan" button */}
        <button
          onClick={handleUpload}
          // The button is disabled if no file is selected OR if it's scanning
          disabled={!selectedFile || isScanning}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {/* This text changes based on 'isScanning' */}
          {isScanning ? 'Scanning...' : 'Scan Email'}
        </button>

        {/* --- Results Area --- */}
        <div className="mt-8">
          {/* Error Message */}
          {/* This 'div' only appears if 'error' is not null */}
          {error && (
            <div className="rounded-md bg-red-900 p-4 text-center text-red-200">
              {error}
            </div>
          )}

          {/* The detailed results are now on a different page */}
        </div>
      </div>
    </div>
  );
}

export default App;