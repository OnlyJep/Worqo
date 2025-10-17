/**
 * Utility functions for handling profile image updates across components
 */

/**
 * Get the full URL for a profile image
 * @param {string} profileImgPath - The profile image path from database
 * @param {string} defaultPath - Default image path if no profile image
 * @returns {string} Full URL to the profile image
 */
export const getProfileImageUrl = (profileImgPath, defaultPath = 'images/defpfp.svg') => {
  if (!profileImgPath) {
    return defaultPath;
  }
  // If already a public image path, return as-is
  if (typeof profileImgPath === 'string' && profileImgPath.startsWith('images/')) {
    return profileImgPath;
  }
  return `http://127.0.0.1:8000/storage/${profileImgPath}`;
};

/**
 * Dispatch a custom event when profile image is updated
 * @param {Object} updatedUser - The updated user object with new profile image
 */
export const dispatchProfileImageUpdate = (updatedUser) => {
  const event = new CustomEvent('profileImageUpdated', {
    detail: updatedUser
  });
  document.dispatchEvent(event);
  
  // Also update localStorage as a backup
  localStorage.setItem('user', JSON.stringify(updatedUser));
};

/**
 * Update user profile image in localStorage and dispatch event
 * @param {string} newProfileImagePath - The new profile image path
 * @param {Object} currentUser - The current user object
 * @returns {Object} Updated user object
 */
export const updateProfileImage = (newProfileImagePath, currentUser) => {
  const updatedUser = {
    ...currentUser,
    profile_img: newProfileImagePath
  };
  
  dispatchProfileImageUpdate(updatedUser);
  return updatedUser;
};

/**
 * Handle successful profile image upload response
 * @param {Object} response - API response containing updated user data
 * @param {Object} currentUser - Current user object
 */
export const handleProfileImageUploadSuccess = (response, currentUser) => {
  if (response && response.data) {
    const updatedUser = {
      ...currentUser,
      ...response.data,
      profile_img: response.data.profile_img || response.data.image_url
    };
    dispatchProfileImageUpdate(updatedUser);
    return updatedUser;
  }
  return currentUser;
};
