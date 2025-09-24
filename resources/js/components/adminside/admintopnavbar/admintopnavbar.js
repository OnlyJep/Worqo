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
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Handle click outside for dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      const response = await fetch("http://127.0.0.1:8000/api/logout", {
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
        localStorage.clear();
        setUser(null);
        setIsDropdownOpen(false);
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Logout error:", error.message);
      // Proceed with logout even if there's an error
      localStorage.clear();
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

  return (
    <header className="top-navbar">
      {isLoading && <Loader />}
      <div className="profile" ref={dropdownRef}>
        <img
          src={imageError || !user?.profile_img ? "/default-profile.png" : user.profile_img}
          alt="Profile"
          className="profile-icon"
          onError={handleImageError}
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