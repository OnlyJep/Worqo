import React, { useState } from 'react';
import './../../../sass/components/browse.scss'; // Updated SCSS import
import Headerz from "../HeaderContent/Headerz";
import AllListing from '../ShopGrids/all_list';
import { IconChevronDown } from '@tabler/icons-react';

const Browse = () => { // Renamed from Shop to Browse
  const [selectedCategories, setSelectedCategories] = useState(["All"]);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [selectedSortOption, setSelectedSortOption] = useState("Sort by");

  const sortOptions = ["Featured", "Newest", "Price: High-Low", "Price: Low-High"];

  const handleCategoryChange = (category) => {
    if (category === "All") {
      setSelectedCategories(["All"]);
    } else {
      let updatedCategories = selectedCategories.includes(category)
        ? selectedCategories.filter((cat) => cat !== category)
        : [...selectedCategories, category];

      updatedCategories = updatedCategories.filter((cat) => cat !== "All");

      if (updatedCategories.length === 0) {
        updatedCategories = ["All"];
      }

      setSelectedCategories(updatedCategories);
    }
  };

  const handleSortOptionClick = (option) => {
    setSelectedSortOption(option);
    setIsSortDropdownOpen(false);
  };

  const itemCount = 24;

  return (
    <div className="browse"> {/* Updated class name */}
      <Headerz />

      <div className="advertisement-banner">
        <div className="ad-placeholder"></div>
      </div>

      <div className="browse-content"> {/* Updated class name */}
        <h2 className="category-title">Furniture ({itemCount})</h2>

        <div className="content-wrapper">
          <div className="sidebar">
            <h3>Product Category</h3>
            <div className="category-list">
              <label className="category-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("All")}
                  onChange={() => handleCategoryChange("All")}
                />
                <span>All</span>
              </label>
              <label className="category-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Furniture")}
                  onChange={() => handleCategoryChange("Furniture")}
                />
                <span>Furniture</span>
              </label>
              <label className="category-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Electronics")}
                  onChange={() => handleCategoryChange("Electronics")}
                />
                <span>Electronics</span>
              </label>
              <label className="category-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Clothing")}
                  onChange={() => handleCategoryChange("Clothing")}
                />
                <span>Clothing</span>
              </label>
              <label className="category-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Books")}
                  onChange={() => handleCategoryChange("Books")}
                />
                <span>Books</span>
              </label>
              <label className="category-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Sports Equipment")}
                  onChange={() => handleCategoryChange("Sports Equipment")}
                />
                <span>Sports Equipment</span>
              </label>
              <label className="category-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("Trending")}
                  onChange={() => handleCategoryChange("Trending")}
                />
                <span>Trending</span>
              </label>
            </div>
          </div>

          <div className="items-section">
            <div className="items-header">
              <div className="filters">
                <div className="sort-wrapper">
                  <div
                    className="sort-by"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  >
                    <span>{selectedSortOption}</span>
                    <IconChevronDown className="sort-icon" />
                  </div>
                  {isSortDropdownOpen && (
                    <div className="sort-dropdown">
                      {sortOptions.map((option) => (
                        <div
                          key={option}
                          className="sort-option"
                          onClick={() => handleSortOptionClick(option)}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="items-grid">
              <AllListing />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse; // Updated export