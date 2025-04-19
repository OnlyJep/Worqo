import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './../../../../sass/components/products.scss';
import { IconMenu2, IconLogout, IconUserCircle, IconChevronDown, IconSettings, IconEdit, IconArchive, IconRestore, IconSearch, IconX } from '@tabler/icons-react';
import Sidebar from './../adminsidebar/adminsidebar';

// Utility to format date as MM/DD/YYYY HH:mm:ss
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
};

const Products = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Wooden Chair',
      image: 'https://via.placeholder.com/50',
      seller_name: 'John Doe',
      price: 49.99,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Smartphone',
      image: 'https://via.placeholder.com/50',
      seller_name: 'Jane Smith',
      price: 299.99,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  const [modalProduct, setModalProduct] = useState({
    id: null,
    name: '',
    image: '',
    image_file: null,
    seller_name: '',
    price: ''
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const dropdownRef = useRef(null);
  const modalInputRef = useRef(null);
  const navigate = useNavigate();

  // Debug modal state changes
  useEffect(() => {
    console.log('Modal state: isModalOpen=', isModalOpen, 'isConfirmModalOpen=', isConfirmModalOpen, 'isImagePopupOpen=', isImagePopupOpen);
    if (isModalOpen) {
      console.log('Add/Edit modal rendered with fields:', {
        image: modalProduct.image ? 'Present (base64)' : modalProduct.image_file ? 'File selected' : 'Empty',
        name: modalProduct.name ? 'Present' : 'Empty',
        seller_name: modalProduct.seller_name ? 'Present' : 'Empty',
        price: modalProduct.price ? 'Present' : 'Empty'
      });
    }
  }, [isModalOpen, isConfirmModalOpen, isImagePopupOpen, modalProduct]);

  // Reset page, search query, and selected products when switching tabs
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedProducts([]);
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

  // Handle file selection for product image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setModalProduct({
          ...modalProduct,
          image: reader.result,
          image_file: file
        });
        console.log('Product image selected:', file.name);
      };
      reader.readAsDataURL(file);
    } else {
      setModalProduct({
        ...modalProduct,
        image: '',
        image_file: null
      });
      console.log('Product image cleared');
    }
  };

  // Handle individual checkbox change
  const handleCheckboxChange = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle "Select All" checkbox change
  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      const currentPageProductIds = paginatedProducts.map(product => product.id);
      setSelectedProducts(currentPageProductIds);
    } else {
      setSelectedProducts([]);
    }
  };

  // Bulk archive selected products
  const bulkArchiveSelected = () => {
    console.log('Initiating bulk archive for products:', selectedProducts);
    openConfirmModal(
      () => {
        console.log('Bulk archiving products:', selectedProducts);
        setProducts(products.map(product =>
          selectedProducts.includes(product.id) ? { ...product, archived: true } : product
        ));
        setSelectedProducts([]);
        const filtered = products.filter(product => activeTab === 'active' ? !product.archived : product.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive ${selectedProducts.length} selected product${selectedProducts.length > 1 ? 's' : ''}?`
    );
  };

  // Bulk restore selected products
  const bulkRestoreSelected = () => {
    console.log('Initiating bulk restore for products:', selectedProducts);
    openConfirmModal(
      () => {
        console.log('Bulk restoring products:', selectedProducts);
        setProducts(products.map(product =>
          selectedProducts.includes(product.id) ? { ...product, archived: false } : product
        ));
        setSelectedProducts([]);
        const filtered = products.filter(product => activeTab === 'active' ? !product.archived : product.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to restore ${selectedProducts.length} selected product${selectedProducts.length > 1 ? 's' : ''}?`
    );
  };

  // Open add modal
  const openAddModal = () => {
    console.log('Opening add modal');
    setModalProduct({
      id: null,
      name: '',
      image: '',
      image_file: null,
      seller_name: '',
      price: ''
    });
    setIsModalOpen(true);
    setTimeout(() => modalInputRef.current?.focus(), 100);
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
  const initiateEdit = (product) => {
    console.log('Initiating edit for:', product.name);
    openConfirmModal(
      () => {
        console.log('Confirmed edit for:', product.name);
        setModalProduct({
          ...product,
          image_file: null
        });
        setIsModalOpen(true);
        setTimeout(() => modalInputRef.current?.focus(), 100);
      },
      `Are you sure you want to edit '${product.name}'?`
    );
  };

  // Archive with confirmation
  const archiveProduct = (id, name) => {
    console.log('Initiating archive for:', name);
    openConfirmModal(
      () => {
        console.log('Archiving:', name);
        setProducts(products.map(product =>
          product.id === id ? { ...product, archived: true } : product
        ));
        setSelectedProducts(prev => prev.filter(productId => productId !== id));
        const filtered = products.filter(product => activeTab === 'active' ? !product.archived : product.archived);
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      },
      `Are you sure you want to archive '${name}'?`
    );
  };

  // Restore with confirmation
  const restoreProduct = (id, name) => {
    console.log('Initiating restore for:', name);
    openConfirmModal(
      () => {
        console.log('Restoring:', name);
        setProducts(products.map(product =>
          product.id === id ? { ...product, archived: false } : product
        ));
        setSelectedProducts(prev => prev.filter(productId => productId !== id));
        const filtered = products.filter(product => activeTab === 'active' ? !product.archived : product.archived);
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
    setModalProduct({
      id: null,
      name: '',
      image: '',
      image_file: null,
      seller_name: '',
      price: ''
    });
  };

  // Handle add/edit form submission
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalProduct.name.trim() || !modalProduct.seller_name.trim() || !modalProduct.price || isNaN(modalProduct.price) || modalProduct.price <= 0) {
      console.log('Invalid input, submission blocked');
      return;
    }

    const now = new Date().toISOString();
    console.log('Submitting product:', modalProduct.name);
    if (modalProduct.id) {
      setProducts(products.map(product =>
        product.id === modalProduct.id ? {
          ...product,
          name: modalProduct.name,
          image: modalProduct.image || 'https://via.placeholder.com/50',
          seller_name: modalProduct.seller_name,
          price: parseFloat(modalProduct.price),
          updated_at: now
        } : product
      ));
    } else {
      const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
      setProducts([...products, {
        id: newId,
        name: modalProduct.name,
        image: modalProduct.image || 'https://via.placeholder.com/50',
        seller_name: modalProduct.seller_name,
        price: parseFloat(modalProduct.price),
        archived: false,
        created_at: now,
        updated_at: now
      }]);
    }
    closeModal();
    const filtered = products.filter(product => activeTab === 'active' ? !product.archived : product.archived);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  // Filter products by tab and search query
  const filteredProducts = products.filter(product =>
    (activeTab === 'active' ? !product.archived : product.archived) &&
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Check if all products on the current page are selected
  const allSelected = paginatedProducts.length > 0 && paginatedProducts.every(product => selectedProducts.includes(product.id));

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      console.log('Changing to page:', page);
      setCurrentPage(page);
      setSelectedProducts([]);
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
            <h1>Products Management</h1>
            <button className="menu-toggle" onClick={toggleSidebar}>
              <IconMenu2 />
            </button>
          </div>

          <div className="products-management">
            <div className="table-controls">
              <div className="controls-left">
                <button className="add-button" onClick={openAddModal}>
                  Add Product
                </button>
                {selectedProducts.length > 0 && activeTab === 'active' && (
                  <button className="archive-selected-button" onClick={bulkArchiveSelected}>
                    Archive Selected
                  </button>
                )}
                {selectedProducts.length > 0 && activeTab === 'archived' && (
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
              <table className="products-table">
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
                    <th>Price</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length ? (
                    paginatedProducts.map(product => (
                      <tr
                        key={product.id}
                        className={selectedProducts.includes(product.id) ? 'selected-row' : ''}
                      >
                        <td>
                          <div className="actions-cell">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => handleCheckboxChange(product.id)}
                            />
                            {activeTab === 'active' ? (
                              <>
                                <button
                                  className="action-button edit"
                                  onClick={() => initiateEdit(product)}
                                  title="Edit"
                                >
                                  <IconEdit size={20} />
                                </button>
                                <button
                                  className="action-button archive"
                                  onClick={() => archiveProduct(product.id, product.name)}
                                  title="Archive"
                                >
                                  <IconArchive size={20} />
                                </button>
                              </>
                            ) : (
                              <button
                                className="action-button restore"
                                onClick={() => restoreProduct(product.id, product.name)}
                                title="Restore"
                              >
                                <IconRestore size={20} />
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <img
                            src={product.image || 'https://via.placeholder.com/30'}
                            alt="Product"
                            className="product-image-table"
                            onClick={() => openImagePopup(product.image || 'https://via.placeholder.com/30')}
                          />
                        </td>
                        <td>{product.name}</td>
                        <td>{product.seller_name}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>{formatDate(product.created_at)}</td>
                        <td>{formatDate(product.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No {activeTab} products
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
          <div className="product-modal">
            <h2>{modalProduct.id ? 'Edit Product' : 'Add Product'}</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label htmlFor="product-image">Product Image</label>
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {modalProduct.image && (
                  <img
                    src={modalProduct.image}
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
                  value={modalProduct.name}
                  onChange={(e) => setModalProduct({ ...modalProduct, name: e.target.value })}
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
                  value={modalProduct.seller_name}
                  onChange={(e) => setModalProduct({ ...modalProduct, seller_name: e.target.value })}
                  placeholder="Enter seller name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="price">Price</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  value={modalProduct.price}
                  onChange={(e) => setModalProduct({ ...modalProduct, price: e.target.value })}
                  placeholder="Enter price"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="submit-button">{modalProduct.id ? 'Save' : 'Add'}</button>
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

export default Products;