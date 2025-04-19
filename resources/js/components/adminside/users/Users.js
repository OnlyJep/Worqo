import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../../sass/components/users.scss';
import { IconMenu2, IconLogout, IconUserCircle, IconChevronDown, IconSettings, IconEdit, IconArchive, IconRestore, IconSearch } from '@tabler/icons-react';
import Sidebar from './../adminsidebar/adminsidebar';

// Utility to format date as MM/DD/YYYY HH:mm:ss
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const Users = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([
    {
      id: 1,
      username: 'admin@example.com',
      first_name: 'John',
      last_name: 'Doe',
      role: 'Admin',
      profile_picture: 'https://via.placeholder.com/50',
      address: '123 Main St',
      gender: 'Male',
      password: 'hashed_password_1',
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'customer@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'Customer',
      profile_picture: 'https://via.placeholder.com/50',
      address: '456 Elm St',
      gender: 'Female',
      password: 'hashed_password_2',
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  const [modalUser, setModalUser] = useState({
    id: null,
    username: '',
    first_name: '',
    last_name: '',
    role: '',
    profile_picture: '',
    profile_picture_file: null,
    address: '',
    gender: '',
    password: '',
    change_password: '',
    confirm_password: ''
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const modalInputRef = useRef(null);
  const navigate = useNavigate();

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state: isModalOpen=', isModalOpen, 'isConfirmModalOpen=', isConfirmModalOpen);
    if (isModalOpen) {
      console.log('Add/Edit modal rendered with fields:', {
        profile_picture: modalUser.profile_picture ? 'Present (base64)' : modalUser.profile_picture_file ? 'File selected' : 'Empty',
        username: modalUser.username ? 'Present' : 'Empty',
        first_name: modalUser.first_name ? 'Present' : 'Empty',
        last_name: modalUser.last_name ? 'Present' : 'Empty',
        role: modalUser.role ? 'Present' : 'Empty',
        address: modalUser.address ? 'Present' : 'Empty',
        gender: modalUser.gender ? 'Present' : 'Empty',
        password: modalUser.id ? 'N/A (Edit mode)' : modalUser.password ? 'Present' : 'Empty',
        change_password: modalUser.id ? (modalUser.change_password ? 'Present' : 'Empty') : 'N/A (Add mode)',
        confirm_password: modalUser.id ? (modalUser.confirm_password ? 'Present' : 'Empty') : 'N/A (Add mode)',
        scroll_enabled: 'overflow-y: auto set on .user-modal'
      });
    }
  }, [isModalOpen, isConfirmModalOpen, modalUser]);

  // Reset page, search query, and selected users when switching tabs
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedUsers([]);
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

  // Handle file selection for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setModalUser({
          ...modalUser,
          profile_picture: reader.result,
          profile_picture_file: file
        });
        console.log('Profile picture selected:', file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setModalUser({
        ...modalUser,
        profile_picture: '',
        profile_picture_file: null
      });
      console.log('Profile picture cleared');
    }
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle "Select All" checkbox change
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const currentPageUserIds = paginatedUsers.map(user => user.id);
      setSelectedUsers(currentPageUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  // Bulk archive selected users
  const bulkArchiveSelected = () => {
    console.log('Initiating bulk archive for users:', selectedUsers);
    openConfirmModal(
      () => {
        console.log('Bulk archiving users:', selectedUsers);
        setUsers(users.map(user =>
          selectedUsers.includes(user.id) ? { ...user, archived: true } : user
        ));
        setSelectedUsers([]);
        const filtered = users.filter(user => activeTab === 'active' ? !user.archived : user.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive ${selectedUsers.length} selected user${selectedUsers.length > 1 ? 's' : ''}?`
    );
  };

  // Bulk restore selected users
  const bulkRestoreSelected = () => {
    console.log('Initiating bulk restore for users:', selectedUsers);
    openConfirmModal(
      () => {
        console.log('Bulk restoring users:', selectedUsers);
        setUsers(users.map(user =>
          selectedUsers.includes(user.id) ? { ...user, archived: false } : user
        ));
        setSelectedUsers([]);
        const filtered = users.filter(user => activeTab === 'active' ? !user.archived : user.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to restore ${selectedUsers.length} selected user${selectedUsers.length > 1 ? 's' : ''}?`
    );
  };

  // Open add modal
  const openAddModal = () => {
    console.log('Opening add modal');
    setModalUser({
      id: null,
      username: '',
      first_name: '',
      last_name: '',
      role: '',
      profile_picture: '',
      profile_picture_file: null,
      address: '',
      gender: '',
      password: '',
      change_password: '',
      confirm_password: ''
    });
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
  const initiateEdit = (user) => {
    console.log('Initiating edit for:', user.username);
    openConfirmModal(
      () => {
        console.log('Confirmed edit for:', user.username);
        setModalUser({
          ...user,
          password: '',
          change_password: '',
          confirm_password: '',
          profile_picture_file: null
        });
        setIsModalOpen(true);
        setTimeout(() => modalInputRef.current?.focus(), 100);
      },
      `Are you sure you want to edit '${user.username}'?`
    );
  };

  // Archive with confirmation
  const archiveUser = (id, username) => {
    console.log('Initiating archive for:', username);
    openConfirmModal(
      () => {
        console.log('Archiving:', username);
        setUsers(users.map(user =>
          user.id === id ? { ...user, archived: true } : user
        ));
        setSelectedUsers(prev => prev.filter(userId => userId !== id));
        const filtered = users.filter(user => activeTab === 'active' ? !user.archived : user.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive '${username}'?`
    );
  };

  // Restore with confirmation
  const restoreUser = (id, username) => {
    console.log('Initiating restore for:', username);
    openConfirmModal(
      () => {
        console.log('Restoring:', username);
        setUsers(users.map(user =>
          user.id === id ? { ...user, archived: false } : user
        ));
        setSelectedUsers(prev => prev.filter(userId => userId !== id));
        const filtered = users.filter(user => activeTab === 'active' ? !user.archived : user.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to restore '${username}'?`
    );
  };

  // Close add/edit modal
  const closeModal = () => {
    console.log('Closing add/edit modal');
    setIsModalOpen(false);
    setModalUser({
      id: null,
      username: '',
      first_name: '',
      last_name: '',
      role: '',
      profile_picture: '',
      profile_picture_file: null,
      address: '',
      gender: '',
      password: '',
      change_password: '',
      confirm_password: ''
    });
  };

  // Handle add/edit form submission
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalUser.username.trim() || !modalUser.first_name.trim() || !modalUser.last_name.trim() || !modalUser.role || !modalUser.gender) {
      console.log('Required fields missing');
      return;
    }

    if (!modalUser.id && !modalUser.password.trim()) {
      console.log('Password required for new user');
      return;
    }

    if (modalUser.id && modalUser.change_password && modalUser.change_password !== modalUser.confirm_password) {
      console.log('Passwords do not match');
      return;
    }

    const now = new Date().toISOString();
    console.log('Submitting user:', modalUser.username);
    if (modalUser.id) {
      setUsers(users.map(user =>
        user.id === modalUser.id ? {
          ...user,
          username: modalUser.username,
          first_name: modalUser.first_name,
          last_name: modalUser.last_name,
          role: modalUser.role,
          profile_picture: modalUser.profile_picture || 'https://via.placeholder.com/50',
          address: modalUser.address,
          gender: modalUser.gender,
          password: modalUser.change_password ? modalUser.change_password : user.password,
          updated_at: now
        } : user
      ));
    } else {
      const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
      setUsers([...users, {
        id: newId,
        username: modalUser.username,
        first_name: modalUser.first_name,
        last_name: modalUser.last_name,
        role: modalUser.role,
        profile_picture: modalUser.profile_picture || 'https://via.placeholder.com/50',
        address: modalUser.address,
        gender: modalUser.gender,
        password: modalUser.password,
        archived: false,
        created_at: now,
        updated_at: now
      }]);
    }
    closeModal();
    const filtered = users.filter(user => activeTab === 'active' ? !user.archived : user.archived);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  // Filter users by tab and search query
  const filteredUsers = users.filter(user =>
    (activeTab === 'active' ? !user.archived : user.archived) &&
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Check if all users on the current page are selected
  const allSelected = paginatedUsers.length > 0 && paginatedUsers.every(user => selectedUsers.includes(user.id));

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      console.log('Changing to page:', page);
      setCurrentPage(page);
      setSelectedUsers([]);
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
            <h1>Users Management</h1>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <IconMenu2 />
            </button>
          </div>

          <div className="users-management">
            <div className="table-controls">
              <div className="controls-left">
                <button className="add-button" onClick={openAddModal}>
                  Add User
                </button>
                {selectedUsers.length > 0 && activeTab === 'active' && (
                  <button className="archive-selected-button" onClick={bulkArchiveSelected}>
                    Archive Selected
                  </button>
                )}
                {selectedUsers.length > 0 && activeTab === 'archived' && (
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
                    placeholder="Search by username..."
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
              <table className="users-table">
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
                    <th>Profile Picture</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length ? (
                    paginatedUsers.map(user => (
                      <tr
                        key={user.id}
                        className={selectedUsers.includes(user.id) ? 'selected-row' : ''}
                      >
                        <td>
                          <div className="actions-cell">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleCheckboxChange(user.id)}
                            />
                            {activeTab === 'active' ? (
                              <>
                                <button
                                  className="action-button edit"
                                  onClick={() => initiateEdit(user)}
                                  title="Edit"
                                >
                                  <IconEdit size={20} />
                                </button>
                                <button
                                  className="action-button archive"
                                  onClick={() => archiveUser(user.id, user.username)}
                                  title="Archive"
                                >
                                  <IconArchive size={20} />
                                </button>
                              </>
                            ) : (
                              <button
                                className="action-button restore"
                                onClick={() => restoreUser(user.id, user.username)}
                                title="Restore"
                              >
                                <IconRestore size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <img
                            src={user.profile_picture || 'https://via.placeholder.com/30'}
                            alt="Profile"
                            className="profile-picture-table"
                          />
                        </td>
                        <td>{user.username}</td>
                        <td>{user.role}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>{formatDate(user.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No {activeTab} users
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
          <div className="user-modal">
            <h2>{modalUser.id ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label htmlFor="profile-picture">Profile Picture</label>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {modalUser.profile_picture && (
                  <img
                    src={modalUser.profile_picture}
                    alt="Preview"
                    className="profile-picture-preview"
                  />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={modalUser.username}
                  onChange={(e) => setModalUser({ ...modalUser, username: e.target.value })}
                  ref={modalInputRef}
                  placeholder="Enter username or email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="first-name">First Name</label>
                <input
                  id="first-name"
                  type="text"
                  value={modalUser.first_name}
                  onChange={(e) => setModalUser({ ...modalUser, first_name: e.target.value })}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="last-name">Last Name</label>
                <input
                  id="last-name"
                  type="text"
                  value={modalUser.last_name}
                  onChange={(e) => setModalUser({ ...modalUser, last_name: e.target.value })}
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={modalUser.role}
                  onChange={(e) => setModalUser({ ...modalUser, role: e.target.value })}
                  required
                >
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  id="address"
                  type="text"
                  value={modalUser.address}
                  onChange={(e) => setModalUser({ ...modalUser, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={modalUser.gender}
                  onChange={(e) => setModalUser({ ...modalUser, gender: e.target.value })}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {modalUser.id ? (
                <>
                  <div className="form-group">
                    <label htmlFor="change-password">Change Password</label>
                    <input
                      id="change-password"
                      type="password"
                      value={modalUser.change_password}
                      onChange={(e) => setModalUser({ ...modalUser, change_password: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={modalUser.confirm_password}
                      onChange={(e) => setModalUser({ ...modalUser, confirm_password: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={modalUser.password}
                    onChange={(e) => setModalUser({ ...modalUser, password: e.target.value })}
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="submit-button">{modalUser.id ? 'Save' : 'Add'}</button>
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

export default Users;