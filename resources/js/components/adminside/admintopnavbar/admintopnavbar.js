import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaCaretDown, FaUserCog, FaSignOutAlt } from "react-icons/fa";
import "./../../../../sass/components/_topnavbar.scss";

const TopNavbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Dropdown toggled, isDropdownOpen:", !isDropdownOpen); // Debug log
    setIsDropdownOpen((prev) => !prev);
  };

  const handleProfileSettings = () => {
    setIsDropdownOpen(false);
    navigate("/profile");
  };

  const handleLogout = async () => {
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
        localStorage.removeItem("user");
        setUser(null);
        setIsDropdownOpen(false);
        navigate("/login", { replace: true });
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="top-navbar">
      <div className="profile" ref={dropdownRef}>
        <img
          src={imageError || !user?.profile_img ? "/default-profile.png" : user.profile_img}
          alt="Profile"
          className="profile-icon"
          onError={handleImageError}
        />
        <FaCaretDown
          className="dropdown-icon"
          onClick={toggleDropdown}
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
  );
};

export default TopNavbar;