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
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const triggerRef = useRef(null);

  // Calculate dropdown menu position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 2, // 2px margin
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

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
  
  // Recalculate position on scroll or resize
  useEffect(() => {
    if (!isOpen) return;
    
    const updatePosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + 2,
          left: rect.left,
          width: rect.width
        });
      }
    };
    
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
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
        ref={triggerRef}
        className={`dropdown-trigger ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        tabIndex={disabled ? -1 : 0}
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
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            width: `${menuPosition.width}px`
          }}
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
          <div className="dropdown-options-list">
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