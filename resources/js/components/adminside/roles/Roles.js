import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../../sass/components/roles.scss';
import { IconMenu2, IconLogout, IconUserCircle, IconChevronDown, IconSettings, IconEdit, IconArchive, IconRestore } from '@tabler/icons-react';
import Sidebar from './../adminsidebar/adminsidebar';

// Utility to format date as MM/DD/YYYY HH:mm:ss
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const Roles = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [roles, setRoles] = useState([
    { id: 1, name: 'Admin', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: 'Customer', archived: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);
  const [modalRole, setModalRole] = useState({ id: null, name: '' });
  const [activeTab, setActiveTab] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const modalInputRef = useRef(null);
  const navigate = useNavigate();

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state: isModalOpen=', isModalOpen, 'isConfirmModalOpen=', isConfirmModalOpen);
  }, [isModalOpen, isConfirmModalOpen]);

  // Reset page and selected roles when switching tabs
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRoles([]);
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
  const handleCheckboxChange = (roleId) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Handle "Select All" checkbox change
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const currentPageRoleIds = paginatedRoles.map(role => role.id);
      setSelectedRoles(currentPageRoleIds);
    } else {
      setSelectedRoles([]);
    }
  };

  // Bulk archive selected roles
  const bulkArchiveSelected = () => {
    console.log('Initiating bulk archive for roles:', selectedRoles);
    openConfirmModal(
      () => {
        console.log('Bulk archiving roles:', selectedRoles);
        setRoles(roles.map(r =>
          selectedRoles.includes(r.id) ? { ...r, archived: true } : r
        ));
        setSelectedRoles([]);
        const filtered = roles.filter(r => activeTab === 'active' ? !r.archived : r.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive ${selectedRoles.length} selected role${selectedRoles.length > 1 ? 's' : ''}?`
    );
  };

  // Bulk restore selected roles
  const bulkRestoreSelected = () => {
    console.log('Initiating bulk restore for roles:', selectedRoles);
    openConfirmModal(
      () => {
        console.log('Bulk restoring roles:', selectedRoles);
        setRoles(roles.map(r =>
          selectedRoles.includes(r.id) ? { ...r, archived: false } : r
        ));
        setSelectedRoles([]);
        const filtered = roles.filter(r => activeTab === 'active' ? !r.archived : r.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to restore ${selectedRoles.length} selected role${selectedRoles.length > 1 ? 's' : ''}?`
    );
  };

  // Open add modal
  const openAddModal = () => {
    console.log('Opening add modal');
    setModalRole({ id: null, name: '' });
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
  const initiateEdit = (role) => {
    console.log('Initiating edit for:', role.name);
    openConfirmModal(
      () => {
        console.log('Confirmed edit for:', role.name);
        setModalRole(role);
        setIsModalOpen(true);
        setTimeout(() => modalInputRef.current?.focus(), 100);
      },
      `Are you sure you want to edit '${role.name}'?`
    );
  };

  // Archive with confirmation
  const archiveRole = (id, name) => {
    console.log('Initiating archive for:', name);
    openConfirmModal(
      () => {
        console.log('Archiving:', name);
        setRoles(roles.map(r =>
          r.id === id ? { ...r, archived: true } : r
        ));
        setSelectedRoles(prev => prev.filter(roleId => roleId !== id));
        const filtered = roles.filter(r => activeTab === 'active' ? !r.archived : r.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive '${name}'?`
    );
  };

  // Restore with confirmation
  const restoreRole = (id, name) => {
    console.log('Initiating restore for:', name);
    openConfirmModal(
      () => {
        console.log('Restoring:', name);
        setRoles(roles.map(r =>
          r.id === id ? { ...r, archived: false } : r
        ));
        setSelectedRoles(prev => prev.filter(roleId => roleId !== id));
        const filtered = roles.filter(r => activeTab === 'active' ? !r.archived : r.archived);
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
    setModalRole({ id: null, name: '' });
  };

  // Handle add/edit form submission
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalRole.name.trim()) {
      console.log('Empty name, submission blocked');
      return;
    }

    const now = new Date().toISOString();
    console.log('Submitting role:', modalRole.name);
    if (modalRole.id) {
      setRoles(roles.map(r =>
        r.id === modalRole.id ? { ...r, name: modalRole.name, updated_at: now } : r
      ));
    } else {
      const newId = roles.length ? Math.max(...roles.map(r => r.id)) + 1 : 1;
      setRoles([...roles, { id: newId, name: modalRole.name, archived: false, created_at: now, updated_at: now }]);
    }
    closeModal();
    const filtered = roles.filter(r => activeTab === 'active' ? !r.archived : r.archived);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  // Filter roles by tab
  const filteredRoles = roles.filter(r =>
    activeTab === 'active' ? !r.archived : r.archived
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRoles = filteredRoles.slice(startIndex, startIndex + itemsPerPage);

  // Check if all roles on the current page are selected
  const allSelected = paginatedRoles.length > 0 && paginatedRoles.every(role => selectedRoles.includes(role.id));

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      console.log('Changing to page:', page);
      setCurrentPage(page);
      setSelectedRoles([]);
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
            <h1>Roles Management</h1>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <IconMenu2 />
            </button>
          </div>

          <div className="roles-management">
            <div className="table-controls">
              <div className="controls-left">
                <button className="add-button" onClick={openAddModal}>
                  Add Role
                </button>
                {selectedRoles.length > 0 && activeTab === 'active' && (
                  <button className="archive-selected-button" onClick={bulkArchiveSelected}>
                    Archive Selected
                  </button>
                )}
                {selectedRoles.length > 0 && activeTab === 'archived' && (
                  <button className="restore-selected-button" onClick={bulkRestoreSelected}>
                    Restore Selected
                  </button>
                )}
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

            <div className="table-container">
              <table className="roles-table">
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
                    <th>Role Name</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRoles.length ? (
                    paginatedRoles.map(role => (
                      <tr
                        key={role.id}
                        className={selectedRoles.includes(role.id) ? 'selected-row' : ''}
                      >
                        <td>
                          <div className="actions-cell">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role.id)}
                              onChange={() => handleCheckboxChange(role.id)}
                            />
                            {activeTab === 'active' ? (
                              <>
                                <button
                                  className="action-button edit"
                                  onClick={() => initiateEdit(role)}
                                  title="Edit"
                                >
                                  <IconEdit size={20} />
                                </button>
                                <button
                                  className="action-button archive"
                                  onClick={() => archiveRole(role.id, role.name)}
                                  title="Archive"
                                >
                                  <IconArchive size={20} />
                                </button>
                              </>
                            ) : (
                              <button
                                className="action-button restore"
                                onClick={() => restoreRole(role.id, role.name)}
                                title="Restore"
                              >
                                <IconRestore size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>{role.name}</td>
                        <td>{formatDate(role.created_at)}</td>
                        <td>{formatDate(role.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">
                        No {activeTab} roles
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
            <h2>{modalRole.id ? 'Edit Role' : 'Add Role'}</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label htmlFor="role-name">Role Name</label>
                <input
                  id="role-name"
                  type="text"
                  value={modalRole.name}
                  onChange={(e) => setModalRole({ ...modalRole, name: e.target.value })}
                  ref={modalInputRef}
                  placeholder="Enter role name"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="submit-button">{modalRole.id ? 'Save' : 'Add'}</button>
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

export default Roles;