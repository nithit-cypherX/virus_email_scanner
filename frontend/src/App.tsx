// src/App.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // NEW: Import useNavigate

// We no longer need the ScanResult interface here

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const navigate = useNavigate(); // NEW: Get the navigate function

  // Runs when the user selects a file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Runs when the user clicks the "Scan" button
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }
    if (!selectedFile.name.endsWith('.eml')) {
      setError('Error: Please upload a .eml file.');
      return;
    }

    const formData = new FormData();
    formData.append('emailFile', selectedFile);

    setError(null);
    setIsScanning(true);

    try {
      const response = await fetch('http://localhost:4000/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong.');
      } else {
        // NEW: Navigate to the results page and pass the data
        navigate('/results', { state: { results: data.results } });
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the backend server.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    // This is the main upload page (unchanged UI)
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-900 text-gray-300 p-4">
      <div className="w-full max-w-lg">
        <h1 className="text-center text-4xl font-bold text-blue-400 mb-4">
          🛡️ Email Virus Scanner
        </h1>
        <p className="text-center text-lg text-gray-400 mb-8">
          Upload a <code className="text-blue-300">.eml</code> file to scan its attachments.
        </p>
        <label
          htmlFor="file-upload"
          className="mb-4 block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 p-8 text-center text-gray-500 hover:border-gray-500 hover:bg-gray-700"
        >
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
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isScanning}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isScanning ? 'Scanning...' : 'Scan Email'}
        </button>

        {/* --- Results Area --- */}
        <div className="mt-8">
          {/* Error Message */}
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