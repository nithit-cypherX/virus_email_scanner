// src/main.tsx

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'; // NEW
import './index.css';
import App from './App.tsx';
import ResultsPage from './pages/ResultsPage.tsx'; // NEW

// NEW: Define our routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // The upload page
  },
  {
    path: '/results',
    element: <ResultsPage />, // The new results page
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} /> {/* UPDATED */}
  </StrictMode>
);