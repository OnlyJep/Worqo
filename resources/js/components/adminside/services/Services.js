import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminSidebar from "./../adminsidebar/adminsidebar";
import TopNavbar from "./../admintopnavbar/admintopnavbar";
import { FaSquare, FaCheckSquare, FaEdit, FaCheckCircle, FaArchive, FaEye } from "react-icons/fa";
import { IconPlus, IconArchive } from "@tabler/icons-react";
import "./../../../../sass/components/_userlist.scss";
import ServiceModal from "./Servicemodal";
import Loader from "./../../LoaderContent/loader";
import { message } from "antd";

const Services = () => {
  const [services, setServices] = useState([]);
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [serviceToArchive, setServiceToArchive] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState(null);
  const navigate = useNavigate();

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const [servicesResponse, skillsResponse] = await Promise.all([
        axios.get("/api/services", {
          params: { archived: showArchived, search: searchTerm, page: pagination.currentPage, limit: 5 },
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          signal,
          timeout: 10000,
        }),
        axios.get("/api/skills", {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          signal,
          timeout: 15000,
        }),
      ]);
      console.log("Skills Response:", skillsResponse.data);
      const skillsData = Array.isArray(skillsResponse.data) ? skillsResponse.data : skillsResponse.data.skills || [];
      setServices(servicesResponse.data.services || []);
      setPagination({
        currentPage: servicesResponse.data.pagination.currentPage,
        totalPages: servicesResponse.data.pagination.totalPages,
      });
      setSkills(skillsData);
      console.log("Skills State:", skillsData);
      setSelectedServices([]);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching data:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to fetch data. Please check the server or network."
      );
      setServices([]);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [searchTerm, showArchived, pagination.currentPage]);

  const handleServiceAdd = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const submitData = new FormData();
      submitData.append("name", formData.name || "");
      submitData.append("description", formData.description || "");
      submitData.append("color_collar_id", formData.color_collar_id || "");
      formData.skill_ids.forEach((id) => submitData.append("skill_ids[]", id));
      if (formData.service_image instanceof File) {
        submitData.append("service_image", formData.service_image);
      }

      const response = await axios.post("/api/services", submitData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      message.success("Service added successfully");
      await fetchData(signal);
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") throw error;
      console.error("Error adding service:", error.response?.data || error.message);
      throw error;
    }
  };

  const handleServiceUpdate = async (formData, signal) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      const submitData = new FormData();
      submitData.append("name", formData.name || "");
      submitData.append("description", formData.description || "");
      submitData.append("color_collar_id", formData.color_collar_id || "");
      formData.skill_ids.forEach((id) => submitData.append("skill_ids[]", id));
      if (formData.service_image instanceof File) {
        submitData.append("service_image", formData.service_image);
      } else if (formData.service_image === null && formData.image_url) {
        submitData.append("service_image", "");
      }
      submitData.append("_method", "PUT");

      const response = await axios.post(`/api/services/${serviceToEdit.id}`, submitData, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        timeout: 10000,
        signal,
      });
      setIsModalOpen(false);
      setIsEditMode(false);
      setServiceToEdit(null);
      message.success("Service updated successfully");
      await fetchData(signal);
      return response.data;
    } catch (error) {
      if (error.name === "AbortError") throw error;
      console.error("Error updating service:", error.response?.data || error.message);
      throw error;
    }
  };

  const toggleSelectService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map((service) => service.id));
    }
  };

  const handleToggleArchived = () => {
    setShowArchived((prev) => !prev);
    setPagination({ ...pagination, currentPage: 1 });
    setSelectedServices([]);
  };

  const handleArchiveClick = (service) => {
    setServiceToArchive(service);
    setIsConfirmModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!serviceToArchive) return;
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.patch(
        `/api/services/${serviceToArchive.id}/archive`,
        { archived: true },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 15000,
        }
      );
      setIsConfirmModalOpen(false);
      setServiceToArchive(null);
      message.success("Service archived successfully");
      const controller = new AbortController();
      await fetchData(controller.signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error archiving service:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to archive service. Please try again."
      );
    }
  };

  const handleRestoreService = async (serviceId) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.patch(
        `/api/services/${serviceId}/archive`,
        { archived: false },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 15000,
        }
      );
      message.success("Service restored successfully");
      const controller = new AbortController();
      await fetchData(controller.signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error restoring service:", error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : "Failed to restore service. Please try again."
      );
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedServices.length === 0) {
      message.warning("No services selected");
      return;
    }
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found. Please log in.");
      }
      await axios.post(
        "/api/services/bulk-archive",
        { service_ids: selectedServices, action },
        {
          headers: { Authorization: `Bearer ${authToken}`, Accept: "application/json" },
          timeout: 10000,
        }
      );
      setSelectedServices([]);
      message.success(`Services ${action}d successfully`);
      const controller = new AbortController();
      await fetchData(controller.signal);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(`Error ${action}ing services:`, error.response?.data || error.message);
      message.error(
        error.response?.status === 401
          ? "Unauthorized: Please log in again."
          : `Failed to ${action} services. Please try again.`
      );
    }
  };

  const handleAddNewClick = () => {
    setIsEditMode(false);
    setServiceToEdit({
      name: "",
      description: "",
      color_collar_id: "",
      skill_ids: [],
      service_image: null,
      image_url: null,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (service) => {
    setServiceToEdit({
      id: service.id,
      name: service.name || "",
      description: service.description || "",
      color_collar_id: service.color_collar_id ? String(service.color_collar_id) : "",
      skill_ids: service.skills ? service.skills.map((skill) => String(skill.id)) : [],
      service_image: null,
      image_url: service.service_image ? `http://127.0.0.1:8000/storage/${service.service_image}` : null,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setServiceToEdit(null);
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    if (pagination.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pageNumbers.push(
          <button
            key={i}
            className={pagination.currentPage === i ? "active" : ""}
            onClick={() => setPagination({ ...pagination, currentPage: i })}
          >
            {i}
          </button>
        );
      }
    } else {
      if (startPage > 1) {
        pageNumbers.push(
          <button key={1} onClick={() => setPagination({ ...pagination, currentPage: 1 })}>
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
            onClick={() => setPagination({ ...pagination, currentPage: i })}
          >
            {i}
          </button>
        );
      }

      if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis" className="ellipsis">...</span>);
        }
        pageNumbers.push(
          <button key={pagination.totalPages} onClick={() => setPagination({ ...pagination, currentPage: pagination.totalPages })}>
            {pagination.totalPages}
          </button>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div className="app">
      {loading && <Loader />}
      <AdminSidebar activeItem="Services" />
      <TopNavbar />
      <div className="userlist-dashboard">
        <div className="userlist-content">
          <h2>{showArchived ? "Archived Services" : "Services"}</h2>
          <div className="userlist-header">
            <div className="left-actions">
              <input
                type="text"
                className="search-input"
                placeholder="Search Services"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="right-actions">
              {selectedServices.length > 0 && (
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
          <div className="userlist-table">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="header-actions-icon">
                      <span onClick={toggleSelectAll} style={{ cursor: "pointer" }}>
                        {selectedServices.length === services.length && services.length > 0 ? (
                          <FaCheckSquare className="checkbox-icon" />
                        ) : (
                          <FaSquare className="checkbox-icon" />
                        )}
                      </span>
                      Actions
                    </div>
                  </th>
                  <th>Service Image</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Color Collar</th>
                  <th>Fetch Skills</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="loading-row">Loading services...</td>
                  </tr>
                ) : services.length > 0 ? (
                  services.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <div className="action-icons">
                          <span onClick={() => toggleSelectService(service.id)} style={{ cursor: "pointer" }}>
                            {selectedServices.includes(service.id) ? (
                              <FaCheckSquare className="checkbox-icon" size={16} />
                            ) : (
                              <FaSquare className="checkbox-icon" size={16} />
                            )}
                          </span>
                          {showArchived ? (
                            <FaCheckCircle
                              size={16}
                              className="restore-icon"
                              onClick={() => handleRestoreService(service.id)}
                            />
                          ) : (
                            <FaArchive
                              size={16}
                              className="delete-icon"
                              onClick={() => handleArchiveClick(service)}
                            />
                          )}
                          <FaEdit
                            size={16}
                            className="edit-icon"
                            onClick={() => handleEditClick(service)}
                          />
                        </div>
                      </td>
                      <td>
                        {service.service_image ? (
                          <img
                            src={`http://127.0.0.1:8000/storage/${service.service_image}`}
                            alt="Service"
                            className="service-img"
                            style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }}
                          />
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>{service.name || "N/A"}</td>
                      <td>{service.description || "N/A"}</td>
                      <td>{service.color_collar_name || "N/A"}</td>
                      <td>{service.skills ? service.skills.map((skill) => skill.name).join(", ") : "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No {showArchived ? "archived" : "active"} services found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="userlist-pagination">
            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
            <button
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
              disabled={pagination.currentPage <= 1}
            >
              {"<"}
            </button>
            {renderPagination()}
            <button
              onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
              disabled={pagination.currentPage >= pagination.totalPages}
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
            <p>Do you want to archive "{serviceToArchive?.name}"?</p>
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
        <ServiceModal
          onClose={handleModalClose}
          onSubmit={isEditMode ? handleServiceUpdate : handleServiceAdd}
          isEdit={isEditMode}
          initialData={serviceToEdit}
          skills={skills}
        />
      )}
    </div>
  );
};

export default Services;