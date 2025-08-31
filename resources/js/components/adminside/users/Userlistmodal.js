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

  useEffect(() => {
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
        setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
        setGenders(Array.isArray(gendersRes.data) ? gendersRes.data : []);
        setSuffixes(Array.isArray(suffixesRes.data) ? suffixesRes.data : []);
      } catch (error) {
        console.error("Error fetching dropdown data:", {
          message: error.message,
          status: error.response?.status,
          details: error.response?.data,
        });
        setErrors({ general: error.message === "No auth token found. Please log in." ? error.message : "Failed to load dropdown data. Please try again." });
      } finally {
        setIsLoading(false);
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
        profile_img: null,
      };
      setFormData(initialFormData);
      console.log("Initial data received:", initialData);
      console.log("Initial form data set:", initialFormData);
    }
  }, [isEdit, initialData]);

  useEffect(() => {
    if (isEdit && initialData && !isLoading && genders.length > 0 && roles.length > 0) {
      const validGenderId = genders.some((g) => String(g.id) === String(initialData.gender_id))
        ? String(initialData.gender_id)
        : "";
      const validRoleId = roles.some((r) => String(r.id) === String(initialData.role_id))
        ? String(initialData.role_id)
        : "";
      setFormData((prev) => ({
        ...prev,
        gender_id: validGenderId,
        role_id: validRoleId,
      }));
    }
  }, [isEdit, initialData, isLoading, genders, roles]);

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
    console.log(`Updated ${field}:`, value);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, profile_img: null }));
    setErrors((prev) => ({ ...prev, profile_img: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!isEdit) {
      // Strict validation for creating new users
      if (!formData.first_name) newErrors.first_name = "First name is required";
      if (!formData.last_name) newErrors.last_name = "Last name is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.role_id) newErrors.role_id = "Role is required";
      if (!formData.gender_id) newErrors.gender_id = "Gender is required";
      if (!formData.password) newErrors.password = "Password is required for new users";
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

    setErrors(newErrors);
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
      setErrors({ general: "No auth token found. Please log in." });
      console.log("No auth token found.");
      return;
    }

    isSubmitting.current = true;
    setErrors({});
    setSuccessMessage("");

    try {
      const submitData = new FormData();
      // Append fields only if they have changed or are required for create
      if (formData.first_name || !isEdit) submitData.append("first_name", formData.first_name);
      if (formData.middlename !== undefined) submitData.append("middlename", formData.middlename);
      if (formData.last_name || !isEdit) submitData.append("last_name", formData.last_name);
      if (formData.gender_id || !isEdit) submitData.append("gender_id", formData.gender_id);
      if (formData.suffix_id !== undefined) submitData.append("suffix_id", formData.suffix_id);
      if (formData.role_id || !isEdit) submitData.append("role_id", formData.role_id);
      if (formData.email || !isEdit) submitData.append("email", formData.email);
      if (formData.password) submitData.append("password", formData.password);
      if (formData.profile_img) submitData.append("profile_img", formData.profile_img);
      // Explicitly send empty profile_img to clear it
      if (isEdit && formData.profile_img === null && initialData?.profile_img) {
        submitData.append("profile_img", "");
      }

      const url = isEdit ? `http://127.0.0.1:8000/api/users/${initialData?.id}` : "http://127.0.0.1:8000/api/users";
      const method = isEdit ? "put" : "post";

      // Log FormData for debugging
      const formDataObj = {};
      submitData.forEach((value, key) => { formDataObj[key] = value instanceof File ? value.name : value; });
      console.log("Sending data:", { url, method, data: formDataObj });

      const response = await axios({
        method,
        url,
        data: submitData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log("Server response:", response.data);

      if (response.status === (isEdit ? 200 : 201)) {
        await onSubmit(response.data.user);
        setSuccessMessage(isEdit ? "User updated successfully" : "User created successfully");
        setErrors({});
        setTimeout(() => {
          setSuccessMessage("");
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting form:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      const errorData = error.response?.data?.messages || error.response?.data || { general: `Failed to ${isEdit ? "update" : "create"} user` };
      setErrors(errorData);
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
                  {gender.name || gender.gender_name} {/* Support both 'name' and 'gender_name' */}
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