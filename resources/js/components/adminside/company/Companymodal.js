import React, { useState, useEffect, useRef } from "react";
import { Select } from "antd";
import { message } from "antd";
import "./../../../../sass/components/_companymodal.scss";

const { Option } = Select;

const CompanyModal = ({ onClose, onSubmit, isEdit, initialData, employers, workers }) => {
  const [formData, setFormData] = useState({
    company_name: initialData?.company_name || "",
    employer_id: initialData?.employer_id ? String(initialData.employer_id) : "",
    worker_ids: Array.isArray(initialData?.worker_ids) ? initialData.worker_ids.map(String) : [],
    street: initialData?.street || "",
    contact_number: initialData?.contact_number || "",
    city: "Butuan City",
    province: "Agusan Del Norte",
    postal_code: 8600,
    country: "Philippines",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    isMountedRef.current = true;

    // Log props and formData for debugging
    console.log("CompanyModal props:", { employers, workers, initialData });
    console.log("formData after initialization:", formData);

    // Check if data is loaded
    const validEmployers = Array.isArray(employers) && employers.length > 0;
    const validWorkers = Array.isArray(workers) && workers.length > 0;
    setDataLoaded(validEmployers && validWorkers);

    // Reset errors and API error
    if (isMountedRef.current) {
      setApiError("");
      setErrors({});
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [employers, workers, initialData]);

  const handleChange = (value, name) => {
    const fieldValue = typeof value === 'object' && value.target ? value.target.value : value;
    const fieldName = typeof value === 'object' && value.target ? value.target.name : name;

    if (fieldName === "contact_number" && fieldValue && !/^\+?[\d\s-]*$/.test(fieldValue)) {
      return;
    }

    if (isMountedRef.current) {
      setFormData((prev) => ({ ...prev, [fieldName]: fieldValue }));
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      setApiError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_name) newErrors.company_name = "Company name is required";
    if (!formData.employer_id) newErrors.employer_id = "Employer is required";
    if (!formData.street) newErrors.street = "Street is required";
    if (formData.contact_number && !/^\+?[\d\s-]{7,20}$/.test(formData.contact_number)) {
      newErrors.contact_number = "Contact number must be 7-20 digits, spaces, or hyphens";
    }

    if (isMountedRef.current) {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (typeof onSubmit !== 'function') {
      console.error("onSubmit is not a function:", onSubmit);
      setApiError("Submission handler is not available. Please try again.");
      return;
    }

    const submitData = new FormData();
    submitData.append("company_name", formData.company_name || "");
    submitData.append("employer_id", formData.employer_id || "");
    (formData.worker_ids || []).forEach((workerId) => {
      submitData.append("worker_ids[]", workerId);
    });
    submitData.append("street", formData.street || "");
    if (formData.contact_number) submitData.append("contact_number", formData.contact_number);
    submitData.append("city", formData.city);
    submitData.append("province", formData.province);
    submitData.append("postal_code", String(formData.postal_code));
    submitData.append("country", formData.country);

    console.log("FormData before submission:", {
      company_name: formData.company_name,
      employer_id: formData.employer_id,
      worker_ids: formData.worker_ids,
      street: formData.street,
      contact_number: formData.contact_number,
      city: formData.city,
      province: formData.province,
      postal_code: formData.postal_code,
      country: formData.country,
    });

    try {
      setIsLoading(true);
      await onSubmit(submitData, abortControllerRef.current.signal);
      if (isMountedRef.current) {
        setApiError("");
        setErrors({});
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      if (isMountedRef.current) {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
          setApiError("Please correct the errors in the form.");
        } else {
          setApiError(error.response?.data?.error || "An error occurred. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployerName = (employer) => {
    if (!employer || !employer.profile) {
      console.warn("Invalid employer or missing profile:", employer);
      return "Unknown Employer";
    }
    const { full_name, first_name, middlename, last_name, suffix } = employer.profile;
    const name = full_name || [first_name, middlename, last_name, suffix].filter(Boolean).join(" ") || "Unknown Employer";
    console.log("Employer name:", name, { employer });
    return name;
  };

  const getWorkerName = (worker) => {
    if (!worker || !worker.profile) {
      console.warn("Invalid worker or missing profile:", worker);
      return "Unknown Worker";
    }
    const { full_name, first_name, middlename, last_name, suffix } = worker.profile;
    const name = full_name || [first_name, middlename, last_name, suffix].filter(Boolean).join(" ") || "Unknown Worker";
    console.log("Worker name:", name, { worker });
    return name;
  };

  // Validate props to prevent rendering issues
  const validEmployers = Array.isArray(employers) ? employers : [];
  const validWorkers = Array.isArray(workers) ? workers : [];

  return (
    <div className="companymodal-overlay">
      <div className="companymodal">
        <h2>{isEdit ? "Edit Company" : "Add Company"}</h2>
        {apiError && (
          <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
            {apiError}
          </div>
        )}
        {!dataLoaded && (
          <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
            Loading employer and worker data. Please wait...
          </div>
        )}
        <div className="companymodal-content">
          <div className="form-group">
            <label>Company Name <span style={{ color: "red" }}>*</span></label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange(e, "company_name")}
              placeholder="Enter company name"
              required
              disabled={!dataLoaded || isLoading}
            />
            {errors.company_name && <span className="error">{errors.company_name}</span>}
          </div>
          <div className="form-group">
            <label>Employer <span style={{ color: "red" }}>*</span></label>
            <Select
              name="employer_id"
              value={formData.employer_id}
              onChange={(value) => handleChange(value, "employer_id")}
              placeholder="Select Employer"
              className="credential-dropdown"
              required
              disabled={!dataLoaded || validEmployers.length === 0 || isLoading}
            >
              {validEmployers.map((employer) => (
                <Option key={employer.id} value={String(employer.id)}>
                  {getEmployerName(employer)}
                </Option>
              ))}
            </Select>
            {errors.employer_id && <span className="error">{errors.employer_id}</span>}
          </div>
          <div className="form-group">
            <label>Hired Workers (optional)</label>
            <Select
              mode="multiple"
              name="worker_ids"
              value={formData.worker_ids}
              onChange={(value) => handleChange(value, "worker_ids")}
              placeholder="Select Hired Workers"
              allowClear
              className="credential-dropdown"
              disabled={!dataLoaded || validWorkers.length === 0 || isLoading}
            >
              {validWorkers.map((worker) => (
                <Option key={worker.id} value={String(worker.id)}>
                  {getWorkerName(worker)}
                </Option>
              ))}
            </Select>
            {errors.worker_ids && <span className="error">{errors.worker_ids}</span>}
          </div>
          <div className="form-group">
            <label>Street <span style={{ color: "red" }}>*</span></label>
            <input
              type="text"
              name="street"
              value={formData.street}
              onChange={(e) => handleChange(e, "street")}
              placeholder="Enter street"
              required
              disabled={!dataLoaded || isLoading}
            />
            {errors.street && <span className="error">{errors.street}</span>}
          </div>
          <div className="form-group">
            <label>Contact Number (optional)</label>
            <input
              type="text"
              name="contact_number"
              value={formData.contact_number}
              onChange={(e) => handleChange(e, "contact_number")}
              placeholder="Enter contact number"
              disabled={!dataLoaded || isLoading}
            />
            {errors.contact_number && <span className="error">{errors.contact_number}</span>}
          </div>
          <div className="form-group name-row">
            <div className="name-field">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                readOnly
                disabled
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
              />
            </div>
            <div className="name-field">
              <label>Province</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                readOnly
                disabled
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
              />
            </div>
          </div>
          <div className="form-group name-row">
            <div className="name-field">
              <label>Postal Code</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                readOnly
                disabled
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
              />
            </div>
            <div className="name-field">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                readOnly
                disabled
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed" }}
              />
            </div>
          </div>
        </div>
        <div className="companymodal-buttons">
          <button className="cancel-button" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="submit-button" onClick={handleSubmit} disabled={isLoading || !dataLoaded}>
            {isEdit ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyModal;