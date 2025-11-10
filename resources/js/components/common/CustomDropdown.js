import React, { useState, useRef, useEffect } from 'react';
import { IconChevronDown } from '@tabler/icons-react';

const CustomDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  required = false,
  searchable = false,
  id = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const dropdownOptionsListRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle scroll inside dropdown - prevent closing when scrolling the list
  const handleDropdownScroll = (e) => {
    // Stop propagation to prevent window scroll handlers from closing dropdown
    e.stopPropagation();
  };
  
  // Handle wheel events inside dropdown
  const handleDropdownWheel = (e) => {
    // Always stop propagation when scrolling inside dropdown
    // This prevents the wheel event from reaching window scroll handlers
    e.stopPropagation();
  };
  
  // Close dropdown on page scroll (window/document level only) or resize
  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => {
      // Always close on resize to prevent positioning issues
      setIsOpen(false);
    };
    
    // Only listen to scroll on window/document level (not capture phase)
    // Scroll events on individual scrollable elements (like dropdown-options-list)
    // don't bubble to window, so they won't trigger this handler
    // This means scrolling inside the dropdown won't close it
    const handleWindowScroll = () => {
      // This only fires on actual page/window scroll, not on element scroll
      setIsOpen(false);
    };
    
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && searchable) {
        // Focus search input when opening
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOptionClick = (optionValue, e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  // Filter options based on search term
  let filteredOptions = searchable && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // If no results found and search term exists, check if "Others" option exists
  // and show only "Others" as fallback
  const othersOption = options.find(option => option.value === 'Others' || option.label === 'Others');
  if (searchable && searchTerm && filteredOptions.length === 0 && othersOption) {
    filteredOptions = [othersOption];
  }

  return (
    <div className={`custom-dropdown ${className} ${isOpen ? 'dropdown-open' : ''}`} ref={dropdownRef}>
      <div 
        id={id || undefined}
        className={`dropdown-trigger ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle(e);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        <span className="dropdown-value">
          {displayValue}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
          <IconChevronDown size={16} />
        </span>
      </div>
      {isOpen && !disabled && (
        <div 
          className="dropdown-menu"
          ref={dropdownMenuRef}
          onScroll={handleDropdownScroll}
          onWheel={handleDropdownWheel}
        >
          {searchable && (
            <div className="dropdown-search-container">
              <input
                ref={searchInputRef}
                type="text"
                className="dropdown-search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('');
                    setIsOpen(false);
                  }
                  e.stopPropagation();
                }}
              />
            </div>
          )}
          <div 
            className="dropdown-options-list"
            ref={dropdownOptionsListRef}
            onScroll={handleDropdownScroll}
            onWheel={handleDropdownWheel}
          >
            {filteredOptions.map(option => (
              <div
                key={option.value}
                className={`dropdown-item ${value === option.value ? 'selected' : ''}`}
                onClick={(e) => handleOptionClick(option.value, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOptionClick(option.value, e);
                  }
                }}
                tabIndex={0}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;