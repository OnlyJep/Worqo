import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_employerlist.scss";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const getFullName = (person) => {
  const { first_name, middlename, last_name, suffix } = person;
  let fullName = `${first_name || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;
  if (suffix) fullName += ` ${suffix}`;
  return fullName.trim() || "N/A";
};

const EmployerList = () => {
  const [employers, setEmployers] = useState([
    {
      id: 1,
      company_name: "TechCorp Inc.",
      email: "contact@techcorp.com",
      phone: "123-456-7890",
      credentials: ["ISO 9001", "BBB Accredited"],
      owner: {
        first_name: "Alice",
        middlename: null,
        last_name: "Brown",
        suffix: null,
      },
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-02-01T12:00:00Z",
      archived: false,
    },
    {
      id: 2,
      company_name: "BuildEasy LLC",
      email: "info@buildeasy.com",
      phone: "987-654-3210",
      credentials: ["LEED Certified"],
      owner: {
        first_name: "Bob",
        middlename: "C",
        last_name: "Davis",
        suffix: "Jr",
      },
      created_at: "2025-03-15T09:30:00Z",
      updated_at: "2025-04-01T11:00:00Z",
      archived: false,
    },
    {
      id: 3,
      company_name: "GreenWorks Co.",
      email: "support@greenworks.com",
      phone: "555-123-4567",
      credentials: ["EPA Certified", "Green Business"],
      owner: {
        first_name: "Carol",
        middlename: null,
        last_name: "Evans",
        suffix: null,
      },
      created_at: "2025-05-10T14:00:00Z",
      updated_at: "2025-06-01T15:00:00Z",
      archived: true,
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedEmployers, setSelectedEmployers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [employerToArchive, setEmployerToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [employerToEdit, setEmployerToEdit] = useState(null);
  const navigate = useNavigate();

  const filteredEmployers = employers.filter((employer) => {
    const ownerFullName = getFullName(employer.owner).toLowerCase();
    const matchesSearch =
      employer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ownerFullName.includes(searchTerm.toLowerCase());
    const matchesArchived = employer.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectEmployer = (employerId) => {
    setSelectedEmployers((prev) =>
      prev.includes(employerId)
        ? prev.filter((id) => id !== employerId)
        : [...prev, employerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedEmployers.length === filteredEmployers.length) {
      setSelectedEmployers([]);
    } else {
      setSelectedEmployers(filteredEmployers.map((employer) => employer.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedEmployers([]);
  };

  const handleArchiveClick = (employer) => {
    setEmployerToArchive(employer);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (!employerToArchive) return;
    setEmployers((prevEmployers) =>
      prevEmployers.map((employer) =>
        employer.id === employerToArchive.id ? { ...employer, archived: true } : employer
      )
    );
    setIsConfirmModalOpen(false);
    setEmployerToArchive(null);
  };

  const handleRestoreEmployer = (employerId) => {
    setEmployers((prevEmployers) =>
      prevEmployers.map((employer) =>
        employer.id === employerId ? { ...employer, archived: false } : employer
      )
    );
  };

  const handleBulkAction = (action) => {
    if (selectedEmployers.length === 0) return;
    setEmployers((prevEmployers) =>
      prevEmployers.map((employer) =>
        selectedEmployers.includes(employer.id)
          ? { ...employer, archived: action === "archive" }
          : employer
      )
    );
    setSelectedEmployers([]);
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setEmployerToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (employer) => {
    setEmployerToEdit({
      ...employer,
      company_name: employer.company_name || "",
      email: employer.email || "",
      phone: employer.phone || "",
      credentials: employer.credentials || [],
      owner: employer.owner || {
        first_name: "",
        middlename: "",
        last_name: "",
        suffix: "",
      },
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEmployerToEdit(null);
  };

  const handleEmployerAdd = (newEmployer) => {
    const addedEmployer = {
      id: employers.length + 1,
      company_name: newEmployer.company_name,
      email: newEmployer.email,
      phone: newEmployer.phone || null,
      credentials: newEmployer.credentials || [],
      owner: newEmployer.owner || {
        first_name: "Unknown",
        middlename: null,
        last_name: "Owner",
        suffix: null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };
    setEmployers((prevEmployers) => [addedEmployer, ...prevEmployers]);
    setIsModalOpen(false);
  };

  const handleEmployerUpdate = (updatedEmployer) => {
    setEmployers((prevEmployers) =>
      prevEmployers.map((employer) =>
        employer.id === employerToEdit.id
          ? {
              ...employer,
              company_name: updatedEmployer.company_name,
              email: updatedEmployer.email,
              phone: updatedEmployer.phone || null,
              credentials: updatedEmployer.credentials || [],
              owner: updatedEmployer.owner,
              updated_at: new Date().toISOString(),
            }
          : employer
      )
    );
    setIsModalOpen(false);
    setIsEditMode(false);
    setEmployerToEdit(null);
  };

  const employersPerPage = 5;
  const totalPages = Math.ceil(filteredEmployers.length / employersPerPage);
  const currentEmployers = filteredEmployers.slice(
    (pagination.currentPage - 1) * employersPerPage,
    pagination.currentPage * employersPerPage
  );

  const handlePageChange = (page) => {
    setPagination({ ...pagination, currentPage: page });
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={pagination.currentPage === i ? "active" : ""}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      if (startPage > 1) {
        pageNumbers.push(
          <button key={1} onClick={() => handlePageChange(1)}>
            1
          </button>
        );
        if (startPage > 2) {
          pageNumbers.push(<span key="start-ellipsis" className="ellipsis">...</span>);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={pagination.currentPage === i ? "active" : ""}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);
        }
        pageNumbers.push(
          <button key={totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="app">
      <AdminSidebar activeItem="Employer List" />
      <TopNavbar />
      <div className="employerlist-dashboard">
        <div className="employerlist-content">
          <h2>{showArchived ? "Archived Employers" : "Employer List"}</h2>
          <div className="employerlist-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Employers"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedEmployers.length > 0 && (
                <button
                  className="header-button archive-all-button"
                  onClick={() => handleBulkAction(showArchived ? "restore" : "archive")}
                >
                  <IconArchive size={20} className="button-icon" />
                  <span className="button-text">{showArchived ? "Restore All" : "Archive All"}</span>
                </button>
              )}
              <button className="header-button" onClick={handleAddNewClick}>
                <IconPlus size={20} className="button-icon" />
                <span className="button-text">Add New</span>
              </button>
              <button className="header-button" onClick={handleToggleArchived}>
                <FaEye size={20} className="button-icon" />
                <span className="button-text">{showArchived ? "View Active" : "View Archived"}</span>
              </button>
              </div>
            </div>
            <div className="employerlist-table">
              <table>
                <thead>
                  <tr>
                    <th>
                      <div className="header-actions-icon">
                        <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                          {selectedEmployers.length === filteredEmployers.length && filteredEmployers.length > 0 ? (
                            <FaCheckSquare className="checkbox-icon" />
                          ) : (
                            <FaSquare className="checkbox-icon" />
                          )}
                        </span>
                        Actions
                      </div>
                    </th>
                    <th>Company Name</th>
                    <th>Owner</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Credentials</th>
                    <th>Created At</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployers.length > 0 ? (
                    currentEmployers.map((employer) => (
                      <tr key={employer.id}>
                        <td data-label="Actions">
                          <div className="action-icons">
                            <span onClick={() => toggleSelectEmployer(employer.id)} style={{ cursor: "pointer" }}>
                              {selectedEmployers.includes(employer.id) ? (
                                <FaCheckSquare className="checkbox-icon" size={16} />
                              ) : (
                                <FaSquare className="checkbox-icon" size={16} />
                              )}
                            </span>
                            {showArchived ? (
                              <FaCheckCircle
                                size={16}
                                className="restore-icon"
                                onClick={() => handleRestoreEmployer(employer.id)}
                              />
                            ) : (
                              <FaTrash
                                size={16}
                                className="delete-icon"
                                onClick={() => handleArchiveClick(employer)}
                              />
                            )}
                            <FaUser
                              size={16}
                              className="edit-icon"
                              onClick={() => handleEditClick(employer)}
                            />
                          </div>
                        </td>
                        <td data-label="Company Name" className="company-name-cell">{employer.company_name || "N/A"}</td>
                        <td data-label="Owner" className="owner-cell">{getFullName(employer.owner)}</td>
                        <td data-label="Email">{employer.email || "N/A"}</td>
                        <td data-label="Phone">{employer.phone || "N/A"}</td>
                        <td data-label="Credentials">{employer.credentials?.length > 0 ? employer.credentials.join(", ") : "None"}</td>
                        <td data-label="Created At">{formatDate(employer.created_at)}</td>
                        <td data-label="Updated At">{formatDate(employer.updated_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8">No {showArchived ? "archived" : "active"} employers found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="employerlist-pagination">
              <span>Page {pagination.currentPage} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
              >
                {"<"}
              </button>
              {renderPagination()}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= totalPages}
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
        {isConfirmModalOpen && (
          <div className="confirm-modal-overlay">
            <div className="confirm-modal">
              <h3>Are you sure?</h3>
              <p>Do you want to archive "{employerToArchive?.company_name}"?</p>
              <div className="confirm-modal-buttons">
                <button className="confirm-button" onClick={handleArchiveConfirm}>
                  Yes, Archive
                </button>
                <button className="cancel-button" onClick={() => setIsConfirmModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {isModalOpen && (
          <EmployerModal
            onClose={handleModalClose}
            onSubmit={isEditMode ? handleEmployerUpdate : handleEmployerAdd}
            isEdit={isEditMode}
            initialData={employerToEdit}
          />
        )}
      </div>
    );
  };
  
  export default EmployerList;