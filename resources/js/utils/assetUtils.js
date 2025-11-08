/**
 * Utility functions for handling static assets (images, SVGs, etc.)
 * Ensures all assets are accessible from the production URL
 */

/**
 * Get the full URL for a static asset in the public directory
 * @param {string} assetPath - The asset path relative to public/ (e.g., 'images/defpfp.svg' or '/images/defpfp.svg')
 * @returns {string} Full URL to the asset
 */
export const getAssetUrl = (assetPath) => {
  if (!assetPath) {
    return '';
  }
  
  // Remove leading slash if present (we'll add it back)
  const cleanPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
  
  // Get the base URL (production or local)
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.REACT_APP_URL || 'http://127.0.0.1:8000');
  
  // Return full URL with leading slash
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Get the full URL for an image in the public/images directory
 * @param {string} imageName - The image filename (e.g., 'defpfp.svg')
 * @returns {string} Full URL to the image
 */
export const getImageUrl = (imageName) => {
  if (!imageName) {
    return getAssetUrl('images/defpfp.svg');
  }
  
  // If already a full path, return as-is
  if (imageName.startsWith('http://') || imageName.startsWith('https://')) {
    return imageName;
  }
  
  // If already includes 'images/', use as-is
  if (imageName.includes('images/')) {
    return getAssetUrl(imageName);
  }
  
  // Otherwise, assume it's in images/ directory
  return getAssetUrl(`images/${imageName}`);
};

/**
 * Get the full URL for an asset in the public/img directory
 * @param {string} assetPath - The asset path (e.g., 'profiles/123.jpg')
 * @returns {string} Full URL to the asset
 */
export const getImgUrl = (assetPath) => {
  if (!assetPath) {
    return '';
  }
  
  const cleanPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.REACT_APP_URL || 'http://127.0.0.1:8000');
  
  return `${baseUrl}/img/${cleanPath}`;
};

