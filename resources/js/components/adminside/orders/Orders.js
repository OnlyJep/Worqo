import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../../sass/components/orders.scss';
import { IconMenu2, IconLogout, IconUserCircle, IconChevronDown, IconSettings, IconEdit, IconArchive, IconRestore, IconSearch, IconX } from '@tabler/icons-react';
import Sidebar from './../adminsidebar/adminsidebar';

// Utility to format date as MM/DD/YYYY HH:mm:ss
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const Orders = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([
    {
      id: 1,
      product_name: 'Wooden Chair',
      product_image: 'https://via.placeholder.com/50',
      seller_name: 'John Doe',
      ordered_by: 'Alice Brown',
      status: 'Pending',
      archived: false,
      ordered_at: new Date().toISOString()
    },
    {
      id: 2,
      product_name: 'Smartphone',
      product_image: 'https://via.placeholder.com/50',
      seller_name: 'Jane Smith',
      ordered_by: 'Bob Johnson',
      status: 'Shipped',
      archived: false,
      ordered_at: new Date().toISOString()
    },
    {
      id: 3,
      product_name: 'Laptop',
      product_image: 'https://via.placeholder.com/50',
      seller_name: 'Alice Brown',
      ordered_by: 'Charlie Davis',
      status: 'Complete',
      archived: false,
      ordered_at: new Date().toISOString()
    }
  ]);
  const [modalOrder, setModalOrder] = useState({
    id: null,
    product_image: '',
    product_name: '',
    seller_name: '',
    ordered_by: '',
    status: ''
  });
  const [addModalOrder, setAddModalOrder] = useState({
    product_image: '',
    image_file: null,
    product_name: '',
    seller_name: '',
    ordered_by: '',
    status: 'Pending'
  });
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const modalInputRef = useRef(null);
  const navigate = useNavigate();

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state: isModalOpen=', isModalOpen, 'isAddModalOpen=', isAddModalOpen, 'isConfirmModalOpen=', isConfirmModalOpen, 'isImagePopupOpen=', isImagePopupOpen);
    if (isModalOpen) {
      console.log('Edit modal rendered with fields:', modalOrder);
    }
    if (isAddModalOpen) {
      console.log('Add modal rendered with fields:', addModalOrder);
    }
  }, [isModalOpen, isAddModalOpen, isConfirmModalOpen, isImagePopupOpen, modalOrder, addModalOrder]);

  // Reset page, search query, and selected orders when switching tabs
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedOrders([]);
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

  // Handle file selection for product image in Add modal
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAddModalOrder({
          ...addModalOrder,
          product_image: reader.result,
          image_file: file
        });
        console.log('Product image selected:', file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setAddModalOrder({
        ...addModalOrder,
        product_image: '',
        image_file: null
      });
      console.log('Product image cleared');
    }
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Handle "Select All" checkbox change
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const currentPageOrderIds = paginatedOrders.map(order => order.id);
      setSelectedOrders(currentPageOrderIds);
    } else {
      setSelectedOrders([]);
    }
  };

  // Bulk archive selected orders
  const bulkArchiveSelected = () => {
    console.log('Initiating bulk archive for orders:', selectedOrders);
    openConfirmModal(
      () => {
        console.log('Bulk archiving orders:', selectedOrders);
        setOrders(orders.map(order =>
          selectedOrders.includes(order.id) ? { ...order, archived: true } : order
        ));
        setSelectedOrders([]);
        const filtered = orders.filter(order => activeTab === 'active' ? !order.archived : order.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive ${selectedOrders.length} selected order${selectedOrders.length > 1 ? 's' : ''}?`
    );
  };

  // Bulk restore selected orders
  const bulkRestoreSelected = () => {
    console.log('Initiating bulk restore for orders:', selectedOrders);
    openConfirmModal(
      () => {
        console.log('Bulk restoring orders:', selectedOrders);
        setOrders(orders.map(order =>
          selectedOrders.includes(order.id) ? { ...order, archived: false } : order
        ));
        setSelectedOrders([]);
        const filtered = orders.filter(order => activeTab === 'active' ? !order.archived : order.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to restore ${selectedOrders.length} selected order${selectedOrders.length > 1 ? 's' : ''}?`
    );
  };

  // Open image popup
  const openImagePopup = (image) => {
    console.log('Opening image popup for:', image);
    setSelectedImage(image);
    setIsImagePopupOpen(true);
  };

  // Close image popup
  const closeImagePopup = () => {
    console.log('Closing image popup');
    setIsImagePopupOpen(false);
    setSelectedImage('');
  };

  // Open add modal
  const openAddModal = () => {
    console.log('Opening add modal');
    setAddModalOrder({
      product_image: '',
      image_file: null,
      product_name: '',
      seller_name: '',
      ordered_by: '',
      status: 'Pending'
    });
    setIsAddModalOpen(true);
    setTimeout(() => modalInputRef.current?.focus(), 100);
  };

  // Open edit modal
  const openEditModal = (order) => {
    console.log('Opening edit modal for order:', order.id);
    setModalOrder({
      id: order.id,
      product_image: order.product_image,
      product_name: order.product_name,
      seller_name: order.seller_name,
      ordered_by: order.ordered_by,
      status: order.status
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
  const initiateEdit = (order) => {
    console.log('Initiating edit for order:', order.id);
    openConfirmModal(
      () => {
        console.log('Confirmed edit for order:', order.id);
        openEditModal(order);
      },
      `Are you sure you want to edit the status of order #${order.id}?`
    );
  };

  // Archive with confirmation
  const archiveOrder = (id) => {
    console.log('Initiating archive for order:', id);
    openConfirmModal(
      () => {
        console.log('Archiving order:', id);
        setOrders(orders.map(order =>
          order.id === id ? { ...order, archived: true } : order
        ));
        setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
        const filtered = orders.filter(order => activeTab === 'active' ? !order.archived : order.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive order #${id}?`
    );
  };

  // Restore with confirmation
  const restoreOrder = (id) => {
    console.log('Initiating restore for order:', id);
    openConfirmModal(
      () => {
        console.log('Restoring order:', id);
        setOrders(orders.map(order =>
          order.id === id ? { ...order, archived: false } : order
        ));
        setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
        const filtered = orders.filter(order => activeTab === 'active' ? !order.archived : order.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to restore order #${id}?`
    );
  };

  // Close add modal
  const closeAddModal = () => {
    console.log('Closing add modal');
    setIsAddModalOpen(false);
    setAddModalOrder({
      product_image: '',
      image_file: null,
      product_name: '',
      seller_name: '',
      ordered_by: '',
      status: 'Pending'
    });
  };

  // Close edit modal
  const closeModal = () => {
    console.log('Closing edit modal');
    setIsModalOpen(false);
    setModalOrder({
      id: null,
      product_image: '',
      product_name: '',
      seller_name: '',
      ordered_by: '',
      status: ''
    });
  };

  // Handle add form submission
  const handleAddModalSubmit = (e) => {
    e.preventDefault();
    if (!addModalOrder.product_name.trim() || !addModalOrder.seller_name.trim() || !addModalOrder.ordered_by.trim() || !addModalOrder.status) {
      console.log('Invalid input, submission blocked');
      return;
    }

    const now = new Date().toISOString();
    console.log('Adding order:', addModalOrder);
    const newId = orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    setOrders([...orders, {
      id: newId,
      product_name: addModalOrder.product_name,
      product_image: addModalOrder.product_image || 'https://via.placeholder.com/50',
      seller_name: addModalOrder.seller_name,
      ordered_by: addModalOrder.ordered_by,
      status: addModalOrder.status,
      archived: false,
      ordered_at: now
    }]);
    closeAddModal();
    const filtered = orders.filter(order => activeTab === 'active' ? !order.archived : order.archived);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  // Handle edit form submission
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalOrder.status) {
      console.log('Invalid status, submission blocked');
      return;
    }

    console.log('Updating order status:', modalOrder);
    setOrders(orders.map(order =>
      order.id === modalOrder.id ? { ...order, status: modalOrder.status } : order
    ));
    closeModal();
  };

  // Filter orders by tab and search query
  const filteredOrders = orders.filter(order =>
    (activeTab === 'active' ? !order.archived : order.archived) &&
    order.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Check if all orders on the current page are selected
  const allSelected = paginatedOrders.length > 0 && paginatedOrders.every(order => selectedOrders.includes(order.id));

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      console.log('Changing to page:', page);
      setCurrentPage(page);
      setSelectedOrders([]);
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
            <h1>Orders Management</h1>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <IconMenu2 />
            </button>
          </div>

          <div className="orders-management">
            <div className="table-controls">
              <div className="controls-left">
                <button className="add-button" onClick={openAddModal}>
                  Add Order
                </button>
                {selectedOrders.length > 0 && activeTab === 'active' && (
                  <button className="archive-selected-button" onClick={bulkArchiveSelected}>
                    Archive Selected
                  </button>
                )}
                {selectedOrders.length > 0 && activeTab === 'archived' && (
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
                    placeholder="Search by product name..."
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
              <table className="orders-table">
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
                    <th>Product Image</th>
                    <th>Product Name</th>
                    <th>Seller Name</th>
                    <th>Ordered By</th>
                    <th>Status</th>
                    <th>Ordered At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.length ? (
                    paginatedOrders.map(order => (
                      <tr
                        key={order.id}
                        className={selectedOrders.includes(order.id) ? 'selected-row' : ''}
                      >
                        <td>
                          <div className="actions-cell">
                            <input
                              type="checkbox"
                              checked={selectedOrders.includes(order.id)}
                              onChange={() => handleCheckboxChange(order.id)}
                            />
                            {activeTab === 'active' ? (
                              <>
                                <button
                                  className="action-button edit"
                                  onClick={() => initiateEdit(order)}
                                  title="Edit Status"
                                >
                                  <IconEdit size={20} />
                                </button>
                                <button
                                  className="action-button archive"
                                  onClick={() => archiveOrder(order.id)}
                                  title="Archive"
                                >
                                  <IconArchive size={20} />
                                </button>
                              </>
                            ) : (
                              <button
                                className="action-button restore"
                                onClick={() => restoreOrder(order.id)}
                                title="Restore"
                              >
                                <IconRestore size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <img
                            src={order.product_image || 'https://via.placeholder.com/30'}
                            alt="Product"
                            className="product-image-table"
                            onClick={() => openImagePopup(order.product_image || 'https://via.placeholder.com/30')}
                          />
                        </td>
                        <td>{order.product_name}</td>
                        <td>{order.seller_name}</td>
                        <td>{order.ordered_by}</td>
                        <td>
                          <span className={`status ${order.status.toLowerCase()}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{formatDate(order.ordered_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No {activeTab} orders
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="order-modal">
            <h2>Add Order</h2>
            <form onSubmit={handleAddModalSubmit}>
              <div className="form-group">
                <label htmlFor="product-image">Product Image</label>
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {addModalOrder.product_image && (
                  <img
                    src={addModalOrder.product_image}
                    alt="Preview"
                    className="product-image-preview"
                  />
                )}
              </div>
              <div className="form-group">
                <label htmlFor="product-name">Product Name</label>
                <input
                  id="product-name"
                  type="text"
                  value={addModalOrder.product_name}
                  onChange={(e) => setAddModalOrder({ ...addModalOrder, product_name: e.target.value })}
                  ref={modalInputRef}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="seller-name">Seller Name</label>
                <input
                  id="seller-name"
                  type="text"
                  value={addModalOrder.seller_name}
                  onChange={(e) => setAddModalOrder({ ...addModalOrder, seller_name: e.target.value })}
                  placeholder="Enter seller name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="ordered-by">Ordered By</label>
                <input
                  id="ordered-by"
                  type="text"
                  value={addModalOrder.ordered_by}
                  onChange={(e) => setAddModalOrder({ ...addModalOrder, ordered_by: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="order-status">Status</label>
                <select
                  id="order-status"
                  value={addModalOrder.status}
                  onChange={(e) => setAddModalOrder({ ...addModalOrder, status: e.target.value })}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeAddModal}>Cancel</button>
                <button type="submit" className="submit-button">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="order-modal">
            <h2>Edit Order</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label htmlFor="edit-product-image">Product Image</label>
                <img
                  src={modalOrder.product_image || 'https://via.placeholder.com/70'}
                  alt="Product"
                  className="product-image-preview"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-product-name">Product Name</label>
                <input
                  id="edit-product-name"
                  type="text"
                  value={modalOrder.product_name}
                  readOnly
                  className="readonly"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-seller-name">Seller Name</label>
                <input
                  id="edit-seller-name"
                  type="text"
                  value={modalOrder.seller_name}
                  readOnly
                  className="readonly"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-ordered-by">Ordered By</label>
                <input
                  id="edit-ordered-by"
                  type="text"
                  value={modalOrder.ordered_by}
                  readOnly
                  className="readonly"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-order-status">Status</label>
                <select
                  id="edit-order-status"
                  value={modalOrder.status}
                  onChange={(e) => setModalOrder({ ...modalOrder, status: e.target.value })}
                  ref={modalInputRef}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="submit-button">Save</button>
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

      {/* Image Popup */}
      {isImagePopupOpen && (
        <div className="image-popup-overlay" onClick={closeImagePopup}>
          <div className="image-popup">
            <button className="close-button" onClick={closeImagePopup}>
              <IconX size={24} />
            </button>
            <img src={selectedImage} alt="Enlarged Product" className="enlarged-image" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;