import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaUser, FaCheckCircle, FaTrash, FaEye } from "react-icons/fa";
import { IconSearch, IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_workerlist.scss";
import WorkerModal from "./workerlistmodal.js";

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

const getFullName = (worker) => {
  const { first_name, middlename, last_name, suffix } = worker;
  let fullName = `${first_name || ""} ${middlename ? middlename + " " : ""}${last_name || ""}`;
  if (suffix) fullName += ` ${suffix}`;
  return fullName.trim() || "N/A";
};

const WorkerList = () => {
  const [workers, setWorkers] = useState([
    {
      id: 1,
      first_name: "John",
      middlename: "A",
      last_name: "Doe",
      suffix: null,
      email: "john.doe@example.com",
      work_type: "full-time",
      credentials: ["CPR Certified", "First Aid"],
      gender: "Male",
      role_id: 2,
      role_name: "Worker",
      created_at: "2025-01-01T10:00:00Z",
      updated_at: "2025-02-01T12:00:00Z",
      archived: false,
    },
    {
      id: 2,
      first_name: "Jane",
      middlename: null,
      last_name: "Smith",
      suffix: "Jr",
      email: "jane.smith@example.com",
      work_type: "part-time",
      credentials: ["OSHA Certified"],
      gender: "Female",
      role_id: 2,
      role_name: "Worker",
      created_at: "2025-03-15T09:30:00Z",
      updated_at: "2025-04-01T11:00:00Z",
      archived: false,
    },
    {
      id: 3,
      first_name: "Mike",
      middlename: "B",
      last_name: "Johnson",
      suffix: null,
      email: "mike.johnson@example.com",
      work_type: "one-time",
      credentials: ["Welding Certificate", "Safety Training"],
      gender: "Male",
      role_id: 2,
      role_name: "Worker",
      created_at: "2025-05-10T14:00:00Z",
      updated_at: "2025-06-01T15:00:00Z",
      archived: true,
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [workerToArchive, setWorkerToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [workerToEdit, setWorkerToEdit] = useState(null);
  const navigate = useNavigate();

  const filteredWorkers = workers.filter((worker) => {
    const fullName = getFullName(worker).toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || worker.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArchived = worker.archived === showArchived;
    return matchesSearch && matchesArchived;
  });

  const toggleSelectWorker = (workerId) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedWorkers.length === filteredWorkers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers(filteredWorkers.map((worker) => worker.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedWorkers([]);
  };

  const handleArchiveClick = (worker) => {
    setWorkerToArchive(worker);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = () => {
    if (!workerToArchive) return;
    setWorkers((prevWorkers) =>
      prevWorkers.map((worker) =>
        worker.id === workerToArchive.id ? { ...worker, archived: true } : worker
      )
    );
    setIsConfirmModalOpen(false);
    setWorkerToArchive(null);
  };

  const handleRestoreWorker = (workerId) => {
    setWorkers((prevWorkers) =>
      prevWorkers.map((worker) =>
        worker.id === workerId ? { ...worker, archived: false } : worker
      )
    );
  };

  const handleBulkAction = (action) => {
    if (selectedWorkers.length === 0) return;
    setWorkers((prevWorkers) =>
      prevWorkers.map((worker) =>
        selectedWorkers.includes(worker.id)
          ? { ...worker, archived: action === "archive" }
          : worker
      )
    );
    setSelectedWorkers([]);
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setWorkerToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (worker) => {
    setWorkerToEdit({
      ...worker,
      first_name: worker.first_name || "",
      middlename: worker.middlename || "",
      last_name: worker.last_name || "",
      suffix: worker.suffix || "",
      email: worker.email || "",
      gender: worker.gender || "",
      work_type: worker.work_type || "part-time",
      credentials: worker.credentials || [],
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setWorkerToEdit(null);
  };

  const handleWorkerAdd = (newWorker) => {
    const addedWorker = {
      id: workers.length + 1,
      first_name: newWorker.first_name,
      middlename: newWorker.middlename || null,
      last_name: newWorker.last_name,
      suffix: newWorker.suffix || null,
      email: newWorker.email,
      work_type: newWorker.work_type,
      credentials: newWorker.credentials || [],
      gender: newWorker.gender || null,
      role_id: 2,
      role_name: "Worker",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };
    setWorkers((prevWorkers) => [addedWorker, ...prevWorkers]);
    setIsModalOpen(false);
  };

  const handleWorkerUpdate = (updatedWorker) => {
    setWorkers((prevWorkers) =>
      prevWorkers.map((worker) =>
        worker.id === workerToEdit.id
          ? {
              ...worker,
              first_name: updatedWorker.first_name,
              middlename: updatedWorker.middlename || null,
              last_name: updatedWorker.last_name,
              suffix: updatedWorker.suffix || null,
              email: updatedWorker.email,
              work_type: updatedWorker.work_type,
              credentials: updatedWorker.credentials || [],
              gender: updatedWorker.gender || null,
              updated_at: new Date().toISOString(),
            }
          : worker
      )
    );
    setIsModalOpen(false);
    setIsEditMode(false);
    setWorkerToEdit(null);
  };

  const workersPerPage = 5;
  const totalPages = Math.ceil(filteredWorkers.length / workersPerPage);
  const currentWorkers = filteredWorkers.slice(
    (pagination.currentPage - 1) * workersPerPage,
    pagination.currentPage * workersPerPage
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
          pageNumbers.push(
            <span key="start-ellipsis" className="ellipsis">
              ...
            </span>
          );
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
          pageNumbers.push(
            <span key="end-ellipsis" className="ellipsis">
              ...
            </span>
          );
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
      <AdminSidebar activeItem="Worker List" />
      <TopNavbar />
      <div className="workerlist-dashboard">
        <div className="workerlist-content">
          <h2>{showArchived ? "Archived Workers" : "Worker List"}</h2>
          <div className="workerlist-header">
            <div className="left-actions">
              <div className="search-container">
                <IconSearch size={20} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search Workers"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="right-actions">
              {selectedWorkers.length > 0 && (
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
          <div className="workerlist-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedWorkers.length === filteredWorkers.length && filteredWorkers.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Full Name</th>
                  <th>Work Type</th>
                  <th>Credentials</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {currentWorkers.length > 0 ? (
                  currentWorkers.map((worker) => (
                    <tr key={worker.id}>
                      <td>
                        <div className="action-icons">
                          <span
                            onClick={() => toggleSelectWorker(worker.id)}
                            style={{ cursor: "pointer" }}
                          >
                            {selectedWorkers.includes(worker.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreWorker(worker.id)}
                            />
                          ) : (
                            <FaTrash
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(worker)}
                            />
                          )}
                          <FaUser
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(worker)}
                          />
                        </div>
                      </td>
                      <td className="username-cell">{getFullName(worker)}</td>
                      <td>
                        {worker.work_type
                          ? worker.work_type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
                          : "N/A"}
                      </td>
                      <td>{worker.credentials?.length > 0 ? worker.credentials.join(", ") : "None"}</td>
                      <td>{worker.email || "N/A"}</td>
                      <td>{formatDate(worker.created_at)}</td>
                      <td>{formatDate(worker.updated_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>{`No ${showArchived ? "archived" : "active"} workers found`}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="workerlist-pagination">
            <span>{`Page ${pagination.currentPage} of ${totalPages}`}</span>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              &lt;
            </button>
            {renderPagination()}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= totalPages}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
      {isConfirmModalOpen && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Are you sure?</h3>
            <p>{`Do you want to archive "${getFullName(workerToArchive)}"?`}</p>
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
        <WorkerModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleWorkerUpdate : handleWorkerAdd}
          isEdit={isEditMode}
          initialData={workerToEdit}
        />
      )}
    </div>
  );
};

export default WorkerList;