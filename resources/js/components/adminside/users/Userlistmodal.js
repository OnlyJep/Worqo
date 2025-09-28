import React, { useState, useEffect, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import "./../../../../sass/components/usermodal.scss";
import { dispatchProfileImageUpdate } from "../../../utils/profileImageUtils";

const UserModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || "",
    middlename: initialData?.middlename || "",
    last_name: initialData?.last_name || "",
    suffix_id: initialData?.suffix_id ? String(initialData.suffix_id) : "",
    email: initialData?.email || "",
    password: "",
    role_id: initialData?.role_id ? String(initialData.role_id) : "",
    gender_id: initialData?.gender_id ? String(initialData.gender_id) : "",
    contact_number: initialData?.contact_number || "",
    street: initialData?.street || "",
    city: initialData?.city || "Butuan City",
    province: initialData?.province || "Agusan Del Norte",
    postal_code: initialData?.postal_code || "8600",
    country: initialData?.country || "Philippines",
    profile_img: null,
    image_url: initialData?.image_url || null,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [roles, setRoles] = useState([]);
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
        const [rolesRes, gendersRes, suffixesRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/roles/all", {
            headers: { Authorization: `Bearer ${authToken}` },
            signal: abortControllerRef.current.signal,
          }).catch((err) => {
            console.error("Roles fetch error:", err.response?.data || err.message);
            throw err;
          }),
          axios.get("http://127.0.0.1:8000/api/genders", {
            headers: { Authorization: `Bearer ${authToken}` },
            signal: abortControllerRef.current.signal,
          }).catch((err) => {
            console.error("Genders fetch error:", err.response?.data || err.message);
            throw err;
          }),
          axios.get("http://127.0.0.1:8000/api/suffixes", {
            headers: { Authorization: `Bearer ${authToken}` },
            signal: abortControllerRef.current.signal,
          }).catch((err) => {
            console.error("Suffixes fetch error:", err.response?.data || err.message);
            throw err;
          }),
        ]);

        console.log("Roles response:", rolesRes.data);
        const rolesData = rolesRes.data?.roles && Array.isArray(rolesRes.data.roles) ? rolesRes.data.roles : [];
        setRoles(rolesData);
        setGenders(Array.isArray(gendersRes.data) ? gendersRes.data : []);
        setSuffixes(Array.isArray(suffixesRes.data) ? suffixesRes.data : []);
        if (rolesData.length === 0) {
          setApiError("No roles available. Please contact the administrator.");
        }
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
        role_id: initialData.role_id ? String(initialData.role_id) : "",
        gender_id: initialData.gender_id ? String(initialData.gender_id) : "",
        contact_number: initialData.contact_number || "",
        street: initialData.street || "",
        city: initialData.city || "Butuan City",
        province: initialData.province || "Agusan Del Norte",
        postal_code: initialData.postal_code || "8600",
        country: initialData.country || "Philippines",
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
    // Prevent changes to locked fields
    if (["city", "province", "postal_code", "country"].includes(field)) {
      return;
    }
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
    if (field === "contact_number" && value && !/^\+?[\d\s-]*$/.test(value)) {
      return;
    }
    if (field === "postal_code" && value && !/^[A-Za-z0-9\s-]*$/.test(value)) {
      return;
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
      ? ["first_name", "last_name", "email", "role_id", "gender_id"]
      : ["first_name", "last_name", "email", "password", "role_id", "gender_id"];

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
    if (formData.role_id && !roles.some((role) => String(role.id) === String(formData.role_id))) {
      newErrors.role_id = "Please select a valid role";
    }
    if (formData.suffix_id && !suffixes.some((suffix) => String(suffix.id) === String(formData.suffix_id))) {
      newErrors.suffix_id = "Please select a valid suffix";
    }
    if (formData.contact_number && !/^\+?[\d\s-]{7,20}$/.test(formData.contact_number)) {
      newErrors.contact_number = "Invalid contact number format";
    }
    if (formData.postal_code && !/^[A-Za-z0-9\s-]{3,20}$/.test(formData.postal_code)) {
      newErrors.postal_code = "Invalid postal code format";
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
            : `Failed to ${isEdit ? "update" : "create"} user: ${error.response?.data?.message || error.message}`
        );
      }
    }
  };

  return (
    <div className="usermodal-overlay">
      <div className="usermodal">
        <h2>{isEdit ? "Edit User" : "Add New User"}</h2>
        {apiError && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{apiError}</div>}
        {Object.keys(errors).length > 0 && (
          <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>
            {Object.entries(errors).map(([field, message]) => (
              <div key={field}>{message}</div>
            ))}
          </div>
        )}
        <form className="usermodal-content" onSubmit={handleSubmit}>
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
            <label htmlFor="role_id">Role</label>
            <select
              id="role_id"
              value={formData.role_id}
              onChange={(e) => handleInputChange(e, "role_id")}
              disabled={isLoading || roles.length === 0}
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
            {errors.role_id && <span className="error">{errors.role_id}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="contact_number">Contact Number</label>
            <input
              id="contact_number"
              type="text"
              value={formData.contact_number}
              onChange={(e) => handleInputChange(e, "contact_number")}
              placeholder="Contact Number (optional)"
            />
            {errors.contact_number && <span className="error">{errors.contact_number}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="street">Street</label>
            <input
              id="street"
              type="text"
              value={formData.street}
              onChange={(e) => handleInputChange(e, "street")}
              placeholder="Street (optional)"
            />
            {errors.street && <span className="error">{errors.street}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              id="city"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange(e, "city")}
              placeholder="City"
              readOnly
            />
            {errors.city && <span className="error">{errors.city}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="province">Province</label>
            <input
              id="province"
              type="text"
              value={formData.province}
              onChange={(e) => handleInputChange(e, "province")}
              placeholder="Province"
              readOnly
            />
            {errors.province && <span className="error">{errors.province}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="postal_code">Postal Code</label>
            <input
              id="postal_code"
              type="text"
              value={formData.postal_code}
              onChange={(e) => handleInputChange(e, "postal_code")}
              placeholder="Postal Code"
              readOnly
            />
            {errors.postal_code && <span className="error">{errors.postal_code}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange(e, "country")}
              placeholder="Country"
              readOnly
            />
            {errors.country && <span className="error">{errors.country}</span>}
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
          <div className="usermodal-buttons">
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

export default UserModal;