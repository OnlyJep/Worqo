import React, { useState, useEffect, useRef } from "react";
import "./../../../../sass/components/usermodal.scss";
import Loader from "./../../LoaderContent/loader";
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
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [genders, setGenders] = useState([]);
  const [suffixes, setSuffixes] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rolesRes, gendersRes, suffixesRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/roles/all"),
          axios.get("http://127.0.0.1:8000/api/genders"),
          axios.get("http://127.0.0.1:8000/api/suffixes"),
        ]);
        setRoles(rolesRes.data || []);
        setGenders(gendersRes.data || []);
        setSuffixes(suffixesRes.data || []);
      } catch (error) {
        console.error("Error fetching dropdown data:", {
          roles: error.response?.data,
          genders: error.response?.data,
          suffixes: error.response?.data,
          message: error.message,
          status: error.response?.status,
        });
        setErrors({ general: "Failed to load dropdown data. Please try again." });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (isEdit && initialData) {
      setFormData({
        first_name: initialData.first_name || "",
        middlename: initialData.middlename || "",
        last_name: initialData.last_name || "",
        suffix_id: initialData.suffix_id ? initialData.suffix_id.toString() : "",
        email: initialData.email || "",
        password: "",
        role_id: initialData.role_id ? initialData.role_id.toString() : "",
        gender_id: initialData.gender_id ? initialData.gender_id.toString() : "",
        profile_img: null,
      });
    }
  }, [isEdit, initialData]);

  const handleInputChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    if (field === "profile_img" && value) {
      if (value.size > 2048 * 1024) {
        setErrors({ ...errors, profile_img: "Image must not exceed 2 MB" });
        return;
      }
      if (!["image/jpeg", "image/png", "image/jpg"].includes(value.type)) {
        setErrors({ ...errors, profile_img: "Image must be JPEG, PNG, or JPG" });
        return;
      }
    }
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  const removeImage = () => {
    setFormData({ ...formData, profile_img: null });
    setErrors({ ...errors, profile_img: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!isEdit && !formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.role_id || !roles.some(role => role.id.toString() === formData.role_id)) {
      newErrors.role_id = "Please select a valid role";
    }
    if (!formData.gender_id || !genders.some(gender => gender.id.toString() === formData.gender_id)) {
      newErrors.gender_id = "Please select a valid gender";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log("Validation failed:", errors);
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage("");
    try {
      const submitData = new FormData();
      submitData.append("first_name", formData.first_name.trim());
      submitData.append("middlename", formData.middlename.trim() || "");
      submitData.append("last_name", formData.last_name.trim());
      submitData.append("suffix_id", formData.suffix_id ? parseInt(formData.suffix_id) : "");
      submitData.append("email", formData.email.trim());
      if (formData.password) submitData.append("password", formData.password);
      submitData.append("role_id", parseInt(formData.role_id));
      submitData.append("gender_id", parseInt(formData.gender_id));
      if (formData.profile_img) submitData.append("profile_img", formData.profile_img);

      const url = isEdit ? `http://127.0.0.1:8000/api/users/${initialData.id}` : "http://127.0.0.1:8000/api/users";
      const method = isEdit ? "put" : "post";

      const response = await axios({
        method: method,
        url: url,
        data: submitData,
        headers: {
          "Accept": "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === (isEdit ? 200 : 201)) {
        await onSubmit(response.data.user);
        setSuccessMessage(isEdit ? "User updated successfully" : "User created successfully");
        setTimeout(() => {
          setSuccessMessage("");
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting form:", error.response?.data || error.message);
      const errorData = error.response?.data?.error || { general: `Failed to ${isEdit ? "update" : "create"} user` };
      setErrors(errorData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <div className="usermodal-overlay">
        <div className="usermodal">
          <h2>{isEdit ? "Edit User" : "Add New User"}</h2>
          {successMessage && <div className="success-message" style={{ color: "green", marginBottom: "10px" }}>{successMessage}</div>}
          {errors.general && <div className="error-message" style={{ color: "red", marginBottom: "10px" }}>{errors.general}</div>}
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
              <label htmlFor="password">{isEdit ? "New Password" : "Password"}</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange(e, "password")}
                placeholder={isEdit ? "New password (optional)" : "Enter password"}
                required={!isEdit}
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="gender_id">Gender</label>
              <select
                id="gender_id"
                value={formData.gender_id}
                onChange={(e) => handleInputChange(e, "gender_id")}
                required
                disabled={loading || genders.length === 0}
              >
                <option value="">Select Gender</option>
                {genders.map((gender) => (
                  <option key={gender.id} value={gender.id}>
                    {gender.gender_name}
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
                required
                disabled={loading || roles.length === 0}
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
                    src={`http://127.0.0.1:8000/${initialData.profile_img}`}
                    alt="Current Profile"
                    className="preview-img"
                  />
                </div>
              )}
              {errors.profile_img && <span className="error">{errors.profile_img}</span>}
            </div>
          </div>
          <div className="usermodal-buttons">
            <button className="submit-button" onClick={handleSubmit} disabled={loading || roles.length === 0 || genders.length === 0}>
              {isEdit ? "Update" : "Create"}
            </button>
            <button className="cancel-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserModal;