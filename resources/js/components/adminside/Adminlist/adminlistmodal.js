import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import "./../../../../sass/components/adminmodal.scss";

const AdminModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || "",
    middlename: initialData?.middlename || "",
    last_name: initialData?.last_name || "",
    suffix_id: initialData?.suffix_id ? String(initialData.suffix_id) : "",
    email: initialData?.email || "",
    password: "",
    gender_id: initialData?.gender_id ? String(initialData.gender_id) : "",
    profile_img: null,
    image_url: initialData?.image_url || null,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [genders, setGenders] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const authToken = localStorage.getItem("auth_token");
        if (!authToken) {
          throw new Error("No auth token found. Please log in.");
        }
        const [gendersRes, suffixesRes] = await Promise.all([
          axios.get(`/api/genders`, {
            headers: { Authorization: `Bearer ${authToken}` },
            signal: abortControllerRef.current.signal,
          }).catch((err) => {
            console.error("Genders fetch error:", err.response?.data || err.message);
            throw err;
          }),
          axios.get(`/api/suffixes`, {
            headers: { Authorization: `Bearer ${authToken}` },
            signal: abortControllerRef.current.signal,
          }).catch((err) => {
            console.error("Suffixes fetch error:", err.response?.data || err.message);
            throw err;
          }),
        ]);

        setGenders(Array.isArray(gendersRes.data) ? gendersRes.data : []);
        setSuffixes(Array.isArray(suffixesRes.data) ? suffixesRes.data : []);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching dropdown data:", error.response?.data || error.message);
        setApiError(
          error.message === "No auth token found. Please log in."
            ? error.message
            : "Failed to load dropdown data. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    if (isEdit && initialData) {
      setFormData({
        first_name: initialData.first_name || "",
        middlename: initialData.middlename || "",
        last_name: initialData.last_name || "",
        suffix_id: initialData.suffix_id ? String(initialData.suffix_id) : "",
        email: initialData.email || "",
        password: "",
        gender_id: initialData.gender_id ? String(initialData.gender_id) : "",
        profile_img: null,
        image_url: initialData.image_url || null,
      });
      setErrors({});
      setApiError("");
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEdit, initialData]);

  const handleInputChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    if (field === "profile_img" && value) {
      if (value.size > 2048 * 1024) {
        setErrors((prev) => ({ ...prev, profile_img: "Image must not exceed 2 MB" }));
        return;
      }
      if (!["image/jpeg", "image/png", "image/jpg"].includes(value.type)) {
        setErrors((prev) => ({ ...prev, profile_img: "Image must be JPEG, PNG, or JPG" }));
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, profile_img: null, image_url: null }));
    setErrors((prev) => ({ ...prev, profile_img: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = isEdit
      ? ["first_name", "last_name", "email", "gender_id"]
      : ["first_name", "last_name", "email", "password", "gender_id"];

    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field] === "") {
        newErrors[field] = `${field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} is required`;
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!isEdit && formData.password && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters with 1 uppercase letter and 1 digit";
    }
    if (formData.gender_id && !genders.some((gender) => String(gender.id) === String(formData.gender_id))) {
      newErrors.gender_id = "Please select a valid gender";
    }
    if (formData.suffix_id && !suffixes.some((suffix) => String(suffix.id) === String(formData.suffix_id))) {
      newErrors.suffix_id = "Please select a valid suffix";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) return;

    abortControllerRef.current = new AbortController();
    try {
      await onSubmit(formData, abortControllerRef.current.signal);
      setApiError("");
      setErrors({});
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      console.error("Error submitting form:", error.response?.data || error.message);
      if (error.response?.data?.messages) {
        setErrors(error.response.data.messages);
        setApiError("Please correct the errors in the form.");
      } else {
        setApiError(
          error.response?.status === 401
            ? "Unauthorized: Please log in again."
            : `Failed to ${isEdit ? "update" : "create"} admin: ${error.response?.data?.message || error.message}`
        );
      }
    }
  };

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>{isEdit ? "Edit Admin" : "Add New Admin"}</h2>
        {apiError && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{apiError}</div>}
        {Object.keys(errors).length > 0 && (
          <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
            {Object.entries(errors).map(([field, message]) => (
              <div key={field}>{message}</div>
            ))}
          </div>
        )}
        <form className="adminmodal-content" onSubmit={handleSubmit}>
          <div className="form-group name-row">
            <div className="name-field">
              <label htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange(e, "first_name")}
                placeholder="First Name"
                required
              />
              {errors.first_name && <span className="error">{errors.first_name}</span>}
            </div>
            <div className="name-field">
              <label htmlFor="middlename">Middle Name</label>
              <input
                id="middlename"
                type="text"
                value={formData.middlename}
                onChange={(e) => handleInputChange(e, "middlename")}
                placeholder="Middle Name (optional)"
              />
              {errors.middlename && <span className="error">{errors.middlename}</span>}
            </div>
            <div className="name-field">
              <label htmlFor="last_name">Last Name</label>
              <input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange(e, "last_name")}
                placeholder="Last Name"
                required
              />
              {errors.last_name && <span className="error">{errors.last_name}</span>}
            </div>
            <div className="name-field">
              <label htmlFor="suffix_id">Suffix</label>
              <select
                id="suffix_id"
                value={formData.suffix_id}
                onChange={(e) => handleInputChange(e, "suffix_id")}
                disabled={isLoading || suffixes.length === 0}
              >
                <option value="">None</option>
                {suffixes.map((suffix) => (
                  <option key={suffix.id} value={suffix.id}>
                    {suffix.suffix_name || "None"}
                  </option>
                ))}
              </select>
              {errors.suffix_id && <span className="error">{errors.suffix_id}</span>}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange(e, "email")}
              placeholder="Enter email address"
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">{isEdit ? "New Password (optional)" : "Password"}</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange(e, "password")}
              placeholder={isEdit ? "New password (optional)" : "Enter password"}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="gender_id">Gender</label>
            <select
              id="gender_id"
              value={formData.gender_id}
              onChange={(e) => handleInputChange(e, "gender_id")}
              disabled={isLoading || genders.length === 0}
              required
            >
              <option value="">Select Gender</option>
              {genders.map((gender) => (
                <option key={gender.id} value={gender.id}>
                  {gender.name || gender.gender_name}
                </option>
              ))}
            </select>
            {errors.gender_id && <span className="error">{errors.gender_id}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="profile_img">Profile Picture (optional)</label>
            <input
              id="profile_img"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => handleInputChange(e, "profile_img")}
              ref={fileInputRef}
            />
            {(formData.profile_img || formData.image_url) && (
              <div className="profile-img-preview">
                <img
                  src={
                    formData.profile_img
                      ? URL.createObjectURL(formData.profile_img)
                      : formData.image_url || "https://via.placeholder.com/100"
                  }
                  alt="Profile Preview"
                  className="preview-img"
                  style={{ width: "100px", height: "100px", objectFit: "contain" }}
                />
                <button className="remove-img-button" type="button" onClick={removeImage}>
                  <FaTimes size={16} />
                </button>
              </div>
            )}
            {errors.profile_img && <span className="error">{errors.profile_img}</span>}
          </div>
          <div className="adminmodal-buttons">
            <button
              className="submit-button"
              type="submit"
              disabled={isLoading}
            >
              {isEdit ? "Update" : "Create"}
            </button>
            <button className="cancel-button" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;