import React, { useState, useRef } from "react";
import { FaCaretDown } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./../../../../sass/components/_topnavbar.scss";

const TopNavbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfileSettings = () => {
    navigate("/profile");
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsDropdownOpen(false);
    setTimeout(() => navigate("/login", { replace: true }), 200);
  };

  return (
    <div className="top-navbar">
      <div className="profile">
        <img
          src=""
          alt="Profile"
          className="profile-icon"
          onError={(e) => (e.target.src = "")}
        />
        <div
          className={`dropdown-toggle ${isDropdownOpen ? "open" : ""}`}
          ref={dropdownRef}
          onClick={toggleDropdown}
        >
          <FaCaretDown className="dropdown-icon" />
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <ul>
                <li onClick={handleProfileSettings}>Profile Settings</li>
                <li onClick={handleLogout}>Logout</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;