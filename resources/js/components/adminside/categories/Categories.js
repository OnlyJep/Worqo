import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../../sass/components/categories.scss';
import { IconMenu2, IconLogout, IconUserCircle, IconChevronDown, IconSettings, IconEdit, IconArchive, IconRestore, IconSearch } from '@tabler/icons-react';
import Sidebar from './../adminsidebar/adminsidebar';

// Utility to format date as MM/DD/YYYY HH:mm:ss
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const Categories = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([
    { id: 1, name: 'Furniture', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: 'Electronics', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, name: 'Clothing', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 4, name: 'Books', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 5, name: 'Home Decor', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 6, name: 'Toys & Games', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 7, name: 'Sports Equipment', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);
  const [modalCategory, setModalCategory] = useState({ id: null, name: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const modalInputRef = useRef(null);
  const navigate = useNavigate();

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state: isModalOpen=', isModalOpen, 'isConfirmModalOpen=', isConfirmModalOpen);
  }, [isModalOpen, isConfirmModalOpen]);

  // Reset page, search query, and selected categories when switching tabs
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedCategories([]);
  }, [activeTab]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle profile settings navigation
  const handleProfileSettings = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsDropdownOpen(false);
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle individual checkbox change
  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle "Select All" checkbox change
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const currentPageCategoryIds = paginatedCategories.map(category => category.id);
      setSelectedCategories(currentPageCategoryIds);
    } else {
      setSelectedCategories([]);
    }
  };

  // Bulk archive selected categories
  const bulkArchiveSelected = () => {
    console.log('Initiating bulk archive for categories:', selectedCategories);
    openConfirmModal(
      () => {
        console.log('Bulk archiving categories:', selectedCategories);
        setCategories(categories.map(cat =>
          selectedCategories.includes(cat.id) ? { ...cat, archived: true } : cat
        ));
        setSelectedCategories([]);
        const filtered = categories.filter(cat => activeTab === 'active' ? !cat.archived : cat.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive ${selectedCategories.length} selected categorie${selectedCategories.length > 1 ? 's' : ''}?`
    );
  };

  // Bulk restore selected categories
  const bulkRestoreSelected = () => {
    console.log('Initiating bulk restore for categories:', selectedCategories);
    openConfirmModal(
      () => {
        console.log('Bulk restoring categories:', selectedCategories);
        setCategories(categories.map(cat =>
          selectedCategories.includes(cat.id) ? { ...cat, archived: false } : cat
        ));
        setSelectedCategories([]);
        const filtered = categories.filter(cat => activeTab === 'active' ? !cat.archived : cat.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to restore ${selectedCategories.length} selected categorie${selectedCategories.length > 1 ? 's' : ''}?`
    );
  };

  // Open add modal
  const openAddModal = () => {
    console.log('Opening add modal');
    setModalCategory({ id: null, name: '' });
    setIsModalOpen(true);
    setTimeout(() => modalInputRef.current?.focus(), 100);
  };

  // Open confirmation modal
  const openConfirmModal = (action, message) => {
    console.log('Opening confirm modal:', message);
    setConfirmAction(() => action);
    setConfirmMessage(message);
    setIsConfirmModalOpen(true);
  };

  // Close confirmation modal
  const closeConfirmModal = () => {
    console.log('Closing confirm modal');
    setIsConfirmModalOpen(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  // Confirm action
  const handleConfirm = () => {
    console.log('Confirming action');
    if (confirmAction) confirmAction();
    closeConfirmModal();
  };

  // Initiate edit with confirmation
  const initiateEdit = (category) => {
    console.log('Initiating edit for:', category.name);
    openConfirmModal(
      () => {
        console.log('Confirmed edit for:', category.name);
        setModalCategory(category);
        setIsModalOpen(true);
        setTimeout(() => modalInputRef.current?.focus(), 100);
      },
      `Are you sure you want to edit '${category.name}'?`
    );
  };

  // Archive with confirmation
  const archiveCategory = (id, name) => {
    console.log('Initiating archive for:', name);
    openConfirmModal(
      () => {
        console.log('Archiving:', name);
        setCategories(categories.map(cat =>
          cat.id === id ? { ...cat, archived: true } : cat
        ));
        setSelectedCategories(prev => prev.filter(catId => catId !== id));
        const filtered = categories.filter(cat => activeTab === 'active' ? !cat.archived : cat.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive '${name}'?`
    );
  };

  // Restore with confirmation
  const restoreCategory = (id, name) => {
    console.log('Initiating restore for:', name);
    openConfirmModal(
      () => {
        console.log('Restoring:', name);
        setCategories(categories.map(cat =>
          cat.id === id ? { ...cat, archived: false } : cat
        ));
        setSelectedCategories(prev => prev.filter(catId => catId !== id));
        const filtered = categories.filter(cat => activeTab === 'active' ? !cat.archived : cat.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to restore '${name}'?`
    );
  };

  // Close add/edit modal
  const closeModal = () => {
    console.log('Closing add/edit modal');
    setIsModalOpen(false);
    setModalCategory({ id: null, name: '' });
  };

  // Handle add/edit form submission
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalCategory.name.trim()) {
      console.log('Empty name, submission blocked');
      return;
    }

    const now = new Date().toISOString();
    console.log('Submitting category:', modalCategory.name);
    if (modalCategory.id) {
      setCategories(categories.map(cat =>
        cat.id === modalCategory.id ? { ...cat, name: modalCategory.name, updated_at: now } : cat
      ));
    } else {
      const newId = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1;
      setCategories([...categories, { id: newId, name: modalCategory.name, archived: false, created_at: now, updated_at: now }]);
    }
    closeModal();
    const filtered = categories.filter(cat => activeTab === 'active' ? !cat.archived : cat.archived);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  // Filter categories by tab and search query
  const filteredCategories = categories.filter(cat =>
    (activeTab === 'active' ? !cat.archived : cat.archived) &&
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + itemsPerPage);

  // Check if all categories on the current page are selected
  const allSelected = paginatedCategories.length > 0 && paginatedCategories.every(category => selectedCategories.includes(category.id));

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      console.log('Changing to page:', page);
      setCurrentPage(page);
      setSelectedCategories([]);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="admin-container">
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-profile" ref={dropdownRef}>
            <div className="profile-wrapper" onClick={toggleDropdown}>
              <IconUserCircle className="profile-picture" />
              <div className="arrow-badge">
                <IconChevronDown className="arrow-icon" />
              </div>
            </div>
            <div className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
              <button className="dropdown-item" onClick={handleProfileSettings}>
                <IconSettings className="dropdown-icon" />
                Profile Settings
              </button>
              <button className="dropdown-item" onClick={handleLogout}>
                <IconLogout className="dropdown-icon" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Categories Management</h1>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <IconMenu2 />
            </button>
          </div>

          <div className="categories-management">
            <div className="table-controls">
              <div className="controls-left">
                <button className="add-button" onClick={openAddModal}>
                  Add Category
                </button>
                {selectedCategories.length > 0 && activeTab === 'active' && (
                  <button className="archive-selected-button" onClick={bulkArchiveSelected}>
                    Archive Selected
                  </button>
                )}
                {selectedCategories.length > 0 && activeTab === 'archived' && (
                  <button className="restore-selected-button" onClick={bulkRestoreSelected}>
                    Restore Selected
                  </button>
                )}
              </div>
              <div className="controls-right">
                <div className="search-container">
                  <IconSearch className="search-icon" size={20} />
                  <input
                    type="text"
                    className="search-bar"
                    placeholder="Search by category name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="tabs">
                  <button
                    className={`tab ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                  >
                    Active
                  </button>
                  <button
                    className={`tab ${activeTab === 'archived' ? 'active' : ''}`}
                    onClick={() => setActiveTab('archived')}
                  >
                    Archived
                  </button>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="categories-table">
                <thead>
                  <tr>
                    <th>
                      <div className="actions-header">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          title="Select All"
                        />
                        Actions
                      </div>
                    </th>
                    <th>Category Name</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.length ? (
                    paginatedCategories.map(category => (
                      <tr
                        key={category.id}
                        className={selectedCategories.includes(category.id) ? 'selected-row' : ''}
                      >
                        <td>
                          <div className="actions-cell">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleCheckboxChange(category.id)}
                            />
                            {activeTab === 'active' ? (
                              <>
                                <button
                                  className="action-button edit"
                                  onClick={() => initiateEdit(category)}
                                  title="Edit"
                                >
                                  <IconEdit size={20} />
                                </button>
                                <button
                                  className="action-button archive"
                                  onClick={() => archiveCategory(category.id, category.name)}
                                  title="Archive"
                                >
                                  <IconArchive size={20} />
                                </button>
                              </>
                            ) : (
                              <button
                                className="action-button restore"
                                onClick={() => restoreCategory(category.id, category.name)}
                                title="Restore"
                              >
                                <IconRestore size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{category.name}</td>
                        <td>{formatDate(category.created_at)}</td>
                        <td>{formatDate(category.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">
                        No {activeTab} categories
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination-container">
              <div className="page-identifier">
                Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
              </div>
              <div className="pagination-controls">
                <button
                  className="page-button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    className={`page-button ${page === currentPage ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="page-button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{modalCategory.id ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label htmlFor="category-name">Category Name</label>
                <input
                  id="category-name"
                  type="text"
                  value={modalCategory.name}
                  onChange={(e) => setModalCategory({ ...modalCategory, name: e.target.value })}
                  ref={modalInputRef}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="submit-button">{modalCategory.id ? 'Save' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h2>Confirm</h2>
            <p>{confirmMessage}</p>
            <div className="modal-actions">
              <button className="cancel-button" onClick={closeConfirmModal}>Cancel</button>
              <button className="submit-button" onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;