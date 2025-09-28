import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Headerz from "./Headerz";
import Footer from "../FooterContent/footer";
import Loader from "../LoaderContent/loader";
import "./../../../sass/components/Service.scss";
import searchIcon from "../../../sass/img/search.svg";
import { message } from "antd";

const BrowseLaborCategories = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [collars, setCollars] = useState([]);
  const [selectedCollar, setSelectedCollar] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [visibleCount, setVisibleCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const authToken = localStorage.getItem("auth_token");
      const headers = authToken
        ? { Authorization: `Bearer ${authToken}`, Accept: "application/json" }
        : { Accept: "application/json" };

      const [servicesResponse, collarsResponse] = await Promise.all([
        axios.get("http://127.0.0.1:8000/api/services", {
          params: {
            search: searchTerm,
            color_collar_id: selectedCollar,
            page: pagination.currentPage,
            limit: visibleCount,
          },
          headers,
          signal,
          timeout: 10000,
        }),
        axios.get("http://127.0.0.1:8000/api/collars", {
          headers,
          signal,
          timeout: 5000,
        }),
      ]);
      setServices(servicesResponse.data.services || []);
      setPagination({
        currentPage: servicesResponse.data.pagination.currentPage,
        totalPages: servicesResponse.data.pagination.totalPages,
      });
      setCollars(collarsResponse.data.collars || []);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error fetching data:", error.response?.data || error.message);
      setError(
        error.response?.status === 401
          ? "Please log in to view labor categories."
          : "Failed to fetch data. Please try again later."
      );
      setServices([]);
      setCollars([]);
      message.error(error.response?.status === 401 ? "Please log in." : "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [searchTerm, selectedCollar, pagination.currentPage, visibleCount]);

  const handleViewWorkersClick = async (serviceName, colorCollarName, serviceSkills) => {
    try {
      // Get skill names from the service
      const skillNames = serviceSkills ? serviceSkills.map(skill => skill.name) : [];
      
      if (skillNames.length === 0) {
        message.warning("No skills found for this service.");
        return;
      }

      // Get current user ID to exclude from results
      const currentUserId = JSON.parse(localStorage.getItem("user") || '{}')?.id;

        // Fetch workers with the specific skills and ACCEPTED status
      const authToken = localStorage.getItem("auth_token");
      const headers = authToken
        ? { Authorization: `Bearer ${authToken}`, Accept: "application/json" }
        : { Accept: "application/json" };

      console.log('Searching for workers with skills:', skillNames);
      
      const response = await axios.get("http://127.0.0.1:8000/api/workers/by-skills", {
        params: {
          skill_names: skillNames.join(','),
          page: 1,
          limit: 20,
          exclude_user_id: currentUserId // Exclude current user
        },
        headers,
        timeout: 10000,
      });

      console.log('API Response:', response.data);
      const workers = response.data.workers || [];
      
      if (workers.length === 0) {
        console.log('No workers found with skills:', skillNames);
        message.info(`No workers found with skills: ${skillNames.join(', ')}`);
        return;
      }

      console.log('Navigating to browse with workers:', workers.length);
      console.log('Navigation state:', {
        filteredWorkers: workers,
        serviceName: serviceName,
        skillNames: skillNames,
        totalWorkers: response.data.pagination.totalItems
      });

      // Navigate to browse page with filtered workers data
      navigate('/browse', {
        state: {
          filteredWorkers: workers,
          serviceName: serviceName,
          skillNames: skillNames,
          totalWorkers: response.data.pagination.totalItems
        }
      });

    } catch (error) {
      console.error("Error fetching workers by skills:", error.response?.data || error.message);
      message.error("Failed to fetch workers. Please try again later.");
    }
  };

  const handleShowMore = () => {
    if (pagination.currentPage < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
    setVisibleCount((prev) => prev + 4);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination({ ...pagination, currentPage: 1 });
    setVisibleCount(8);
  };

  const handleCollarChange = (e) => {
    setSelectedCollar(e.target.value);
    setPagination({ ...pagination, currentPage: 1 });
    setVisibleCount(8);
  };

  return (
    <div className="service-page">
      {loading && <Loader />}
      <Headerz />
      <main className="service-content">
        <div className="service-container">
          <section className="service-intro">
            <h1 className="service-headline">Hands-On Talent, Tailored to Your Needs</h1>
            <p className="service-subtitle">
              Connect with workers who get the job done—skilled, service-based, or administrative.
            </p>
            <div className="hero-search">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search"
                  className="search-input"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <button className="search-button" aria-label="Search">
                  <img src={searchIcon} alt="Search" />
                </button>
              </div>
            </div>
          </section>

          <div className="section-header">
            <h2 className="section-title">Browse Labor Categories</h2>
            <div className="filter-control">
              <select
                className="collar-select"
                value={selectedCollar}
                onChange={handleCollarChange}
              >
                <option value="">All Collars</option>
                {collars.length > 0 ? (
                  collars.map((collar) => (
                    <option key={collar.id} value={collar.id}>
                      {collar.name || "Unnamed Collar"}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No collars available
                  </option>
                )}
              </select>
            </div>
          </div>

          <div className="services-grid">
            {error ? (
              <p className="error-message">{error}</p>
            ) : services.length > 0 ? (
              services.map((service, index) => {
                // Find the corresponding collar to get collar_img
                const collar = collars.find((c) => c.id === service.color_collar_id);
                return (
                  <div className="service-card" key={index}>
                    <div className="card-image">
                      {service.service_image ? (
                        <img
                          src={`http://127.0.0.1:8000/storage/${service.service_image}`}
                          alt={service.name || "Service"}
                        />
                      ) : (
                        <img src={searchIcon} alt="Placeholder" />
                      )}
                    </div>
                    <h3>{service.name || "N/A"}</h3>
                    <p>{service.description || "N/A"}</p>
                    <div className="service-badge">
                      {collar && collar.collar_img ? (
                        <img
                          src={`http://127.0.0.1:8000/storage/${collar.collar_img}`}
                          alt={service.color_collar_name || "Collar"}
                          className="badge-icon"
                        />
                      ) : null}
                      <span className="badge-text">{service.color_collar_name || "N/A"}</span>
                    </div>
                    <button
                      className="service-cta-btn"
                      onClick={() => handleViewWorkersClick(service.name, service.color_collar_name, service.skills)}
                    >
                      View Available Workers &gt;&gt;
                    </button>
                  </div>
                );
              })
            ) : (
              <p>No labor categories found</p>
            )}
          </div>

          <div className="show-more-wrap">
            <button
              type="button"
              className="show-more-btn"
              onClick={handleShowMore}
              disabled={visibleCount >= services.length && pagination.currentPage >= pagination.totalPages}
            >
              {visibleCount >= services.length && pagination.currentPage >= pagination.totalPages
                ? "Nothing more"
                : "Show More"}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BrowseLaborCategories;