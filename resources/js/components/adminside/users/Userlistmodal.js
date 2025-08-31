import React, { useState, useEffect, useRef } from "react";
import "./../../../../sass/components/usermodal.scss";
import axios from "axios";

const UserModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middlename: "",
    last_name: "",
    suffix_id: "",
    email: "",
    password: "",
    role_id: "",
    gender_id: "",
    contact_number: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
    country: "",
    profile_img: null,
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [roles, setRoles] = useState([]);
  const [genders, setGenders] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);
  const isSubmitting = useRef(false);
  const mounted = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    mounted.current = true;
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
          }),
          axios.get("http://127.0.0.1:8000/api/genders", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          axios.get("http://127.0.0.1:8000/api/suffixes", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);
        if (mounted.current) {
          setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
          setGenders(Array.isArray(gendersRes.data) ? gendersRes.data : []);
          setSuffixes(Array.isArray(suffixesRes.data) ? suffixesRes.data : []);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", {
          message: error.message,
          status: error.response?.status,
          details: error.response?.data,
        });
        if (mounted.current) {
          setErrors({
            general:
              error.message === "No auth token found. Please log in."
                ? error.message
                : "Failed to load dropdown data. Please try again.",
          });
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    if (isEdit && initialData) {
      const initialFormData = {
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
        city: initialData.city || "",
        province: initialData.province || "",
        postal_code: initialData.postal_code || "",
        country: initialData.country || "",
        profile_img: null,
      };
      if (mounted.current) {
        setFormData(initialFormData);
      }
      console.log("Initial data received:", initialData);
      console.log("Initial form data set:", initialFormData);
    }

    return () => {
      mounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isEdit, initialData]);

  useEffect(() => {
    if (isEdit && initialData && !isLoading && genders.length > 0 && roles.length > 0) {
      const validGenderId = genders.some((g) => String(g.id) === String(initialData.gender_id))
        ? String(initialData.gender_id)
        : "";
      const validRoleId = roles.some((r) => String(r.id) === String(initialData.role_id))
        ? String(initialData.role_id)
        : "";
      if (mounted.current) {
        setFormData((prev) => ({
          ...prev,
          gender_id: validGenderId,
          role_id: validRoleId,
        }));
      }
    }
  }, [isEdit, initialData, isLoading, genders, roles]);

  const handleInputChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    if (field === "profile_img" && value) {
      if (value.size > 2048 * 1024) {
        if (mounted.current) {
          setErrors((prev) => ({ ...prev, profile_img: "Image must not exceed 2 MB" }));
        }
        return;
      }
      if (!["image/jpeg", "image/png", "image/jpg"].includes(value.type)) {
        if (mounted.current) {
          setErrors((prev) => ({ ...prev, profile_img: "Image must be JPEG, PNG, or JPG" }));
        }
        return;
      }
    }
    if (mounted.current) {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    console.log(`Updated ${field}:`, value);
  };

  const removeImage = () => {
    if (mounted.current) {
      setFormData((prev) => ({ ...prev, profile_img: null }));
      setErrors((prev) => ({ ...prev, profile_img: "" }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['first_name', 'last_name', 'email', 'role_id', 'gender_id'];

    requiredFields.forEach((field) => {
      const value = isEdit ? (formData[field] || initialData?.[field]) : formData[field];
      if (!value || value === "") {
        newErrors[field] = `${field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`;
      }
    });

    if (!isEdit && !formData.password) {
      newErrors.password = "Password is required for new users";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.password && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
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

    if (mounted.current) {
      setErrors(newErrors);
    }
    console.log("Validation errors:", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting.current || isLoading) {
      console.log("Submission or loading in progress, ignoring.");
      return;
    }

    console.log("Form data before validation:", formData);

    if (!validateForm()) {
      console.log("Client-side validation failed:", errors);
      return;
    }

    const authToken = localStorage.getItem("auth_token");
    if (!authToken) {
      if (mounted.current) {
        setErrors({ general: "No auth token found. Please log in." });
      }
      console.log("No auth token found.");
      return;
    }

    isSubmitting.current = true;
    if (mounted.current) {
      setErrors({});
      setSuccessMessage("");
    }

    try {
      const submitData = new FormData();
      submitData.append("first_name", formData.first_name || initialData?.first_name || "");
      submitData.append("middlename", formData.middlename ?? "");
      submitData.append("last_name", formData.last_name || initialData?.last_name || "");
      submitData.append("gender_id", formData.gender_id || initialData?.gender_id || "");
      submitData.append("suffix_id", formData.suffix_id ?? "");
      submitData.append("role_id", formData.role_id || initialData?.role_id || "");
      submitData.append("email", formData.email || initialData?.email || "");
      submitData.append("contact_number", formData.contact_number ?? "");
      submitData.append("street", formData.street ?? "");
      submitData.append("city", formData.city ?? "");
      submitData.append("province", formData.province ?? "");
      submitData.append("postal_code", formData.postal_code ?? "");
      submitData.append("country", formData.country ?? "");
      if (formData.password) submitData.append("password", formData.password);
      if (formData.profile_img) {
        submitData.append("profile_img", formData.profile_img);
      } else if (isEdit && formData.profile_img === null && initialData?.profile_img) {
        submitData.append("profile_img", "");
      }

      const formDataObj = {};
      submitData.forEach((value, key) => {
        formDataObj[key] = value instanceof File ? value.name : value;
      });
      console.log("Sending data:", { data: formDataObj });

      let response;
      if (isEdit) {
        response = await axios.put(
          `http://127.0.0.1:8000/api/users/${initialData?.id}`,
          submitData,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
      } else {
        response = await axios.post(
          "http://127.0.0.1:8000/api/users",
          submitData,
          {
            headers: {
              Accept: "application/json",
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
      }

      console.log("Server response:", response.data);

      if (response.status === (isEdit ? 200 : 201) && mounted.current) {
        if (isEdit && response.data.message === "No changes were made") {
          setSuccessMessage("No changes were made");
        } else {
          await onSubmit(response.data.user);
          setSuccessMessage(isEdit ? "User updated successfully" : "User created successfully");
        }
        timeoutRef.current = setTimeout(() => {
          if (mounted.current) {
            setSuccessMessage("");
            onClose();
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting form:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (mounted.current) {
        const errorData = error.response?.data?.messages || error.response?.data || {
          general: `Failed to ${isEdit ? "update" : "create"} user`,
        };
        setErrors(errorData);
      }
    } finally {
      isSubmitting.current = false;
    }
  };

  return (
    <div className="usermodal-overlay">
      <div className="usermodal">
        <h2>{isEdit ? "Edit User" : "Add New User"}</h2>
        {successMessage && <div className="success-message" style={{ color: "green", marginBottom: "10px" }}>{successMessage}</div>}
        {errors.general && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{errors.general}</div>}
        {Object.keys(errors)
          .filter((key) => key !== "general" && errors[key])
          .map((key) => (
            <div key={key} className="error-message" style={{ color: "red", marginBottom: "10px" }}>
              {errors[key]}
            </div>
          ))}
        <div className="usermodal-content">
          <div className="form-group name-row">
            <div className="name-field">
              <label htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange(e, "first_name")}
                placeholder="First Name"
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
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">{isEdit ? "New Password (Optional)" : "Password"}</label>
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
              placeholder="City (optional)"
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
              placeholder="Province (optional)"
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
              placeholder="Postal Code (optional)"
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
              placeholder="Country (optional)"
            />
            {errors.country && <span className="error">{errors.country}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="profile_img">Profile Picture</label>
            <input
              id="profile_img"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => handleInputChange(e, "profile_img")}
              ref={fileInputRef}
            />
            {formData.profile_img && (
              <div className="profile-img-preview">
                <img
                  src={URL.createObjectURL(formData.profile_img)}
                  alt="Profile Preview"
                  className="preview-img"
                />
                <button className="remove-img-button" onClick={removeImage}>
                  Remove Image
                </button>
              </div>
            )}
            {initialData?.profile_img && !formData.profile_img && (
              <div className="profile-img-preview">
                <img
                  src={`http://127.0.0.1:8000${initialData.profile_img}`}
                  alt="Current Profile"
                  className="preview-img"
                />
                <button className="remove-img-button" onClick={removeImage}>
                  Remove Image
                </button>
              </div>
            )}
            {errors.profile_img && <span className="error">{errors.profile_img}</span>}
          </div>
        </div>
        <div className="usermodal-buttons">
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting.current || isLoading}
          >
            {isEdit ? "Update" : "Create"}
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;