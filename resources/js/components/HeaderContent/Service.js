import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Headerz from "./Headerz";
import Footer from "../FooterContent/footer";
import "./../../../sass/components/Service.scss";
import searchIcon from "../../../sass/img/search.svg";
import { message } from "antd";

const BrowseLaborCategories = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [collars, setCollars] = useState([]);
  const [selectedCollar, setSelectedCollar] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [visibleCount, setVisibleCount] = useState(8); // Fixed limit per page
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchData = async (signal, currentPage = pagination.currentPage) => {
    if (!isMountedRef.current) return;
    
    try {
      setError(null);
      // Only clear services if we're on page 1 (not loading more)
      if (currentPage === 1) {
        setServices([]); // Clear previous data
      }
      
      const authToken = localStorage.getItem("auth_token");
      const headers = authToken
        ? { Authorization: `Bearer ${authToken}`, Accept: "application/json" }
        : { Accept: "application/json" };

      // Fetching data silently

      // Try to fetch services first, then collars
      let servicesResponse, collarsResponse;
      
      try {
        servicesResponse = await         axios.get("/api/services", {
          params: {
            search: searchTerm.trim(),
            color_collar_id: selectedCollar,
            page: currentPage,
            limit: visibleCount,
          },
          headers,
          signal,
          timeout: 30000,
        });
        // Services API call successful
      } catch (serviceError) {
        if (serviceError.name === 'CanceledError' || serviceError.code === 'ERR_CANCELED') {
          console.log("Services API call was canceled - this is normal");
          return;
        }
        console.error("Services API call failed:", serviceError);
        throw serviceError;
      }

      try {
        collarsResponse = await axios.get("/api/collars", {
          headers,
          signal,
          timeout: 30000,
        });
        // Collars API call successful
      } catch (collarError) {
        if (collarError.name === 'CanceledError' || collarError.code === 'ERR_CANCELED') {
          console.log("Collars API call was canceled - this is normal");
          collarsResponse = { data: { collars: [] } };
        } else {
          console.error("Collars API call failed:", collarError);
          // If collars fail, we can still show services
          collarsResponse = { data: { collars: [] } };
        }
      }

      if (!isMountedRef.current) return;

      // Data loaded successfully

      // Validate response data
      if (!servicesResponse.data) {
        throw new Error("Invalid response from services API");
      }

      // If loading more (page > 1), append to existing services, otherwise replace
      if (currentPage > 1) {
        setServices((prevServices) => [...prevServices, ...(servicesResponse.data.services || [])]);
      } else {
        setServices(servicesResponse.data.services || []);
      }
      setPagination({
        currentPage: servicesResponse.data.pagination?.currentPage || currentPage,
        totalPages: servicesResponse.data.pagination?.totalPages || 1,
      });
      setCollars(collarsResponse.data.collars || []);
      
      // Data successfully loaded
    } catch (error) {
      if (!isMountedRef.current) return;
      
      if (error.name === "AbortError" || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        console.log("Request was aborted - this is normal during search");
        return;
      }
      
      console.error("Error fetching data:", error.response?.data || error.message);
      
      // No retry logic to prevent overlapping requests
      
      const errorMessage = error.response?.status === 401
          ? "Please log in to view labor categories."
        : error.response?.status === 403
        ? "Access denied. Please check your permissions."
        : error.response?.status >= 500
        ? "Server error. Please try again later."
        : error.message?.includes('timeout')
        ? "Request timed out. Please try again."
        : "Failed to fetch data. Please try again later.";
      
      setError(errorMessage);
      setServices([]);
      setCollars([]);
      message.error(errorMessage);
    } finally {
      // No loading state changes
    }
  };

  const fetchSearchData = async (signal, currentPage = pagination.currentPage) => {
    if (!isMountedRef.current) return;
    
    try {
      setError(null);
      // Only clear services if we're on page 1 (not loading more)
      if (currentPage === 1) {
        setServices([]);
      }
      
      const authToken = localStorage.getItem("auth_token");
      const headers = authToken
        ? { Authorization: `Bearer ${authToken}`, Accept: "application/json" }
        : { Accept: "application/json" };

      // Fetching search data silently

      // Try to fetch services first, then collars
      let servicesResponse, collarsResponse;
      
      try {
        servicesResponse = await         axios.get("/api/services", {
          params: {
            search: searchTerm.trim(),
            color_collar_id: selectedCollar,
            page: currentPage,
            limit: visibleCount,
          },
          headers,
          signal,
          timeout: 30000,
        });
        // Services API call successful
      } catch (serviceError) {
        if (serviceError.name === 'CanceledError' || serviceError.code === 'ERR_CANCELED') {
          console.log("Services API call was canceled - this is normal");
          return;
        }
        console.error("Services API call failed:", serviceError);
        throw serviceError;
      }

      try {
        collarsResponse = await axios.get("/api/collars", {
          headers,
          signal,
          timeout: 30000,
        });
        // Collars API call successful
      } catch (collarError) {
        if (collarError.name === 'CanceledError' || collarError.code === 'ERR_CANCELED') {
          console.log("Collars API call was canceled - this is normal");
          collarsResponse = { data: { collars: [] } };
        } else {
          console.error("Collars API call failed:", collarError);
          // If collars fail, we can still show services
          collarsResponse = { data: { collars: [] } };
        }
      }

      if (!isMountedRef.current) return;

      // Search data loaded successfully

      // Validate response data
      if (!servicesResponse.data) {
        throw new Error("Invalid response from services API");
      }

      // If loading more (page > 1), append to existing services, otherwise replace
      if (currentPage > 1) {
        setServices((prevServices) => [...prevServices, ...(servicesResponse.data.services || [])]);
      } else {
        setServices(servicesResponse.data.services || []);
      }
      setPagination({
        currentPage: servicesResponse.data.pagination?.currentPage || currentPage,
        totalPages: servicesResponse.data.pagination?.totalPages || 1,
      });
      setCollars(collarsResponse.data.collars || []);
      
      // Search data successfully loaded
    } catch (error) {
      if (!isMountedRef.current) return;
      
      if (error.name === "AbortError") {
        console.log("Search request was aborted - this is normal during search");
        return;
      }
      
      console.error("Error fetching search data:", error.response?.data || error.message);
      
      // No retry logic to prevent overlapping requests
      
      const errorMessage = error.response?.status === 401
        ? "Please log in to view labor categories."
        : error.response?.status === 403
        ? "Access denied. Please check your permissions."
        : error.response?.status >= 500
        ? "Server error. Please try again later."
        : error.message?.includes('timeout')
        ? "Request timed out. Please try again."
        : "Failed to fetch search results. Please try again later.";
      
      setError(errorMessage);
      setServices([]);
      setCollars([]);
      message.error(errorMessage);
    } finally {
      // No loading state changes
    }
  };

  // Handle URL search parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      // URL search parameter found
      setSearchTerm(searchParam);
      setSearchInput(searchParam);
    } else {
      // Clear search if no URL parameter
      setSearchTerm("");
      setSearchInput("");
    }
  }, [location.search]);

  useEffect(() => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const fetchDataSafely = async () => {
      try {
        // Use fetchSearchData for search operations, fetchData for initial load
        const isSearchOperation = searchTerm && searchTerm.trim().length > 0;
        
        // Use the current pagination state from the dependency
        const currentPage = pagination.currentPage;
        
        if (isSearchOperation) {
          await fetchSearchData(controller.signal, currentPage);
        } else {
          await fetchData(controller.signal, currentPage);
        }
      } catch (error) {
        if (error.name !== "AbortError" && error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error("Error in fetchDataSafely:", error);
        }
      }
    };
    
    // Execute immediately - no delay
    if (isMountedRef.current) {
      fetchDataSafely();
    }
    
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, selectedCollar, pagination.currentPage, visibleCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
      
      const response = await axios.get("/api/workers/by-skills", {
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
    // Check if there are more pages to load
    if (pagination.currentPage < pagination.totalPages) {
      // Load next page - this will trigger the useEffect to fetch more data
      setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
  };

  const handleSearchSubmit = () => {
    const trimmedSearch = searchInput.trim();
    setSearchTerm(trimmedSearch);
    
    // Update URL
    if (trimmedSearch) {
      navigate(`/services?search=${encodeURIComponent(trimmedSearch)}`);
    } else {
      navigate('/services');
    }
    
    // Reset pagination for new search
    setPagination({ currentPage: 1, totalPages: 1 });
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleCollarChange = (e) => {
    setSelectedCollar(e.target.value);
    setPagination({ ...pagination, currentPage: 1 });
  };

  return (
    <div className="service-page">
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
                  value={searchInput}
                  onChange={handleSearchChange}
                  onKeyPress={handleSearchKeyPress}
                />
                <button className="search-button" aria-label="Search" onClick={handleSearchSubmit}>
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
                          src={`${window.location.origin}/storage/${service.service_image}`}
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
                          src={`${window.location.origin}/storage/${collar.collar_img}`}
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

          {(!error && services.length > 0) && (
            <div className="show-more-wrap">
              <button
                type="button"
                className="show-more-btn"
                onClick={handleShowMore}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                {pagination.currentPage >= pagination.totalPages
                  ? "Nothing more"
                  : "Show More"}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BrowseLaborCategories;