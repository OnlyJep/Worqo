// API Configuration
// This file centralizes all API endpoint URLs
// In production (Render), it will use the current origin
// In development, it will use localhost:8000

// Get API base URL from environment variable or use current origin
// For Render deployment, it automatically uses the Render URL (window.location.origin)
// For local development, it defaults to http://127.0.0.1:8000
const getApiBaseUrl = () => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const currentHost = window.location.origin;
    // Use current origin (works for both localhost and Render)
    // This way it automatically adapts to the deployment URL
    return currentHost;
  }
  
  // Fallback for server-side rendering (shouldn't happen in this app)
  return process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present and ensure it starts with /api/
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  if (!cleanEndpoint.startsWith('api/')) {
    cleanEndpoint = `api/${cleanEndpoint}`;
  }
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper function to get storage URL
export const getStorageUrl = (path) => {
  if (!path) return null;
  
  // If path already starts with http, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If path starts with images/, return as is (static asset)
  if (path.startsWith('images/')) {
    return path;
  }
  
  // Otherwise, prepend storage URL
  return `${API_BASE_URL}/storage/${path}`;
};

export default {
  API_BASE_URL,
  getApiUrl,
  getStorageUrl,
};

