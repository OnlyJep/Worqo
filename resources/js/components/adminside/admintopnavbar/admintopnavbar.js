import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCaretDown, FaUserCog, FaSignOutAlt } from "react-icons/fa";
import "./../../../../sass/components/_topnavbar.scss";
import Loader from "../../LoaderContent/loader";

const Admintopnavbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      const userData = JSON.parse(storedUser);
      console.log("Loading user data on mount:", userData);
      console.log("Profile image path:", userData.profile_img);
      setUser(userData);
      // Initialize refresh key to ensure image loads properly
      setImageRefreshKey(1);
    }

    // Handle click outside for dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    // Listen for profile image updates from other components
    const handleProfileImageUpdate = (event) => {
      const updatedUser = event.detail;
      console.log("Profile image update event received:", updatedUser);
      if (updatedUser && updatedUser.id === user?.id) {
        console.log("Updating user data in Admintopnavbar");
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setImageError(false); // Reset image error state
        setImageRefreshKey(prev => prev + 1); // Force image refresh
      }
    };

    // Listen for localStorage changes (backup method)
    const handleStorageChange = (e) => {
      if (e.key === "user" && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue);
          if (updatedUser.id === user?.id) {
            setUser(updatedUser);
            setImageError(false);
            setImageRefreshKey(prev => prev + 1); // Force image refresh
          }
        } catch (error) {
          console.error("Error parsing updated user data:", error);
        }
      }
    };

    // Add focus event listener to refresh user data when window regains focus
    const handleWindowFocus = () => {
      refreshUserData();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("profileImageUpdated", handleProfileImageUpdate);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("profileImageUpdated", handleProfileImageUpdate);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [user?.id]);

  // Add periodic refresh to check for profile image updates
  useEffect(() => {
    const interval = setInterval(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser && user) {
        const userData = JSON.parse(storedUser);
        if (userData.profile_img !== user.profile_img) {
          console.log("Profile image changed, updating...");
          setUser(userData);
          setImageError(false);
          setImageRefreshKey(prev => prev + 1); // Force image refresh
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [user?.profile_img]);

  // Force refresh profile image when user data changes
  useEffect(() => {
    if (user?.profile_img) {
      console.log("User data changed, forcing profile image refresh");
      setImageRefreshKey(prev => prev + 1);
      setImageError(false); // Reset error state when user data changes
    }
  }, [user?.profile_img]);

  // Force refresh on component mount
  useEffect(() => {
    if (user?.profile_img) {
      console.log("Component mounted, forcing initial profile image refresh");
      setTimeout(() => {
        setImageRefreshKey(prev => prev + 1);
      }, 100); // Small delay to ensure component is fully mounted
    }
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleProfileSettings = () => {
    setIsDropdownOpen(false);
    setIsLoading(true);
    setTimeout(() => {
      navigate("/admin/profile");
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${window.location.origin}/api/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        localStorage.clear(); // Clear all local storage
        setUser(null);
        setIsDropdownOpen(false);
        navigate("/", { replace: true }); // Navigate to homepage
      } else {
        console.error("Logout failed: ", response.status, response.statusText);
        // Proceed with logout even if API call fails
        // Preserve profile completion flags before clearing localStorage
        const profileCompleteFlags = {};
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('isProfileComplete_') || key.includes('skillsStepCompleted_')) {
            profileCompleteFlags[key] = localStorage.getItem(key);
          }
        });
        
        localStorage.clear();
        
        // Restore profile completion flags
        Object.keys(profileCompleteFlags).forEach(key => {
          localStorage.setItem(key, profileCompleteFlags[key]);
        });
        
        setUser(null);
        setIsDropdownOpen(false);
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Logout error:", error.message);
      // Proceed with logout even if there's an error
      // Preserve profile completion flags before clearing localStorage
      const profileCompleteFlags = {};
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('isProfileComplete_') || key.includes('skillsStepCompleted_')) {
          profileCompleteFlags[key] = localStorage.getItem(key);
        }
      });
      
      localStorage.clear();
      
      // Restore profile completion flags
      Object.keys(profileCompleteFlags).forEach(key => {
        localStorage.setItem(key, profileCompleteFlags[key]);
      });
      
      setUser(null);
      setIsDropdownOpen(false);
      navigate("/", { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Function to refresh user data from localStorage
  const refreshUserData = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Refreshing user data
      setUser(userData);
      setImageError(false);
      setImageRefreshKey(prev => prev + 1); // Force image refresh
    }
  };

  // Function to get image URL with cache busting
  const getImageUrl = (profileImg) => {
    if (!profileImg) {
      return `${window.location.origin}/images/defpfp.svg`;
    }
    const imageUrl = `${window.location.origin}/storage/${profileImg}?v=${imageRefreshKey}`;
    return imageUrl;
  };

  return (
    <header className="top-navbar">
      {isLoading && <Loader />}
      <div className="profile" ref={dropdownRef}>
        <img
          src={imageError ? `${window.location.origin}/images/defpfp.svg` : getImageUrl(user?.profile_img)}
          alt="Profile"
          className="profile-icon"
          onError={handleImageError}
          onLoad={handleImageLoad}
          onClick={refreshUserData}
          style={{ cursor: 'pointer' }}
          title="Click to refresh profile image"
        />
        <div
          className={`dropdown-toggle ${isDropdownOpen ? "open" : ""}`}
          onClick={toggleDropdown}
        >
          <FaCaretDown
            className="dropdown-icon"
            role="button"
            aria-expanded={isDropdownOpen}
            aria-label="Toggle profile menu"
            style={{ cursor: "pointer" }}
          />
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <ul>
                <li onClick={handleProfileSettings}>
                  <FaUserCog className="menu-icon" /> Profile Settings
                </li>
                <li onClick={handleLogout}>
                  <FaSignOutAlt className="menu-icon" /> Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Admintopnavbar;