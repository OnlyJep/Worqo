import React, { useState, useEffect, useRef } from "react";
import "./../../../../sass/components/employermodal.scss";

const EmployerModal = ({ onClose, onSubmit, isEdit, initialData, genders, suffixes }) => {
  const [formData, setFormData] = useState({
    company_name: "",
    company_phone: "",
    company_email: "",
    company_address: "",
    username: "",
    email: "",
    password: "",
    role_id: "2",
    first_name: "",
    middlename: "",
    last_name: "",
    suffix_id: "",
    gender_id: "",
    contact_number: "",
    street: "",
    city: "Butuan City",
    province: "Agusan Del Norte",
    postal_code: "8600",
    country: "Philippines",
    profile_img: null,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        company_name: initialData.company_name || "",
        company_phone: initialData.company_phone || "",
        company_email: initialData.company_email || "",
        company_address: initialData.company_address || "",
        username: initialData.username || "",
        email: initialData.email || "",
        password: "",
        role_id: "2",
        first_name: initialData.first_name || "",
        middlename: initialData.middlename || "",
        last_name: initialData.last_name || "",
        suffix_id: initialData.suffix_id || "",
        gender_id: initialData.gender_id || "",
        contact_number: initialData.contact_number || "",
        street: initialData.street || "",
        city: initialData.city || "Butuan City",
        province: initialData.province || "Agusan Del Norte",
        postal_code: initialData.postal_code || "8600",
        country: initialData.country || "Philippines",
        profile_img: null,
      });
      setApiError("");
      setErrors({});
    }

    // Cleanup function to abort pending requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEdit, initialData]);

  const handleInputChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;

    if ((field === "company_phone" || field === "contact_number") && value) {
      if (!/^\d*$/.test(value)) return;
    }

    if (field === "first_name" || field === "last_name") {
      const newData = { ...formData, [field]: value };
      newData.username = `${newData.first_name}.${newData.last_name}`.toLowerCase();
      setFormData(newData);
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setApiError("");
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setApiError("");
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, profile_img: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.company_name) newErrors.company_name = "Company name is required";
    if (!formData.company_email) newErrors.company_email = "Company email is required";
    if (!formData.email) newErrors.email = "User email is required";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!isEdit && !formData.password) newErrors.password = "Password is required";
    if (formData.company_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
      newErrors.company_email = "Invalid company email format";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid user email format";
    }
    if (formData.company_phone && !/^\d{10,15}$/.test(formData.company_phone)) {
      newErrors.company_phone = "Company phone must be 10-15 digits";
    }
    if (formData.contact_number && !/^\d{10,15}$/.test(formData.contact_number)) {
      newErrors.contact_number = "Contact number must be 10-15 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = new FormData();
    // Always include required fields
    submitData.append("company_name", formData.company_name || "");
    submitData.append("company_email", formData.company_email || "");
    submitData.append("email", formData.email || "");
    submitData.append("first_name", formData.first_name || "");
    submitData.append("last_name", formData.last_name || "");

    // Include optional fields if they have values
    if (formData.company_phone) submitData.append("company_phone", formData.company_phone);
    if (formData.company_address) submitData.append("company_address", formData.company_address);
    if (formData.username) submitData.append("username", formData.username);
    if (formData.password && (isEdit ? formData.password : true)) submitData.append("password", formData.password);
    if (formData.middlename !== null && formData.middlename !== "") submitData.append("middlename", formData.middlename);
    if (formData.suffix_id) submitData.append("suffix_id", formData.suffix_id);
    if (formData.gender_id) submitData.append("gender_id", formData.gender_id);
    if (formData.contact_number) submitData.append("contact_number", formData.contact_number);
    if (formData.street) submitData.append("street", formData.street);
    if (formData.city) submitData.append("city", formData.city);
    if (formData.province) submitData.append("province", formData.province);
    if (formData.postal_code) submitData.append("postal_code", formData.postal_code);
    if (formData.country) submitData.append("country", formData.country);
    if (formData.profile_img) submitData.append("profile_img", formData.profile_img);

    // Always include role_id
    submitData.append("role_id", formData.role_id);

    // Log FormData for debugging
    for (let [key, value] of submitData.entries()) {
      console.log(`${key}: ${value}`);
    }

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      await onSubmit(submitData, abortControllerRef.current.signal);
      setApiError("");
      setErrors({});
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return;
      }
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
        setApiError("Please correct the errors in the form: " + JSON.stringify(error.response.data.errors));
      } else {
        setApiError(error.response?.data?.message || "An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="employermodal-overlay">
      <div className="employermodal">
        <h2>{isEdit ? "Edit Employer" : "Add New Employer"}</h2>
        {apiError && <div className="error api-error">{apiError}</div>}
        {Object.keys(errors).length > 0 && (
          <div className="error validation-errors">
            {Object.entries(errors).map(([field, message]) => (
              <div key={field}>{message}</div>
            ))}
          </div>
        )}
        <form className="employermodal-content" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange(e, "company_name")}
                required
              />
              {errors.company_name && <span className="error">{errors.company_name}</span>}
            </div>
            <div className="form-group">
              <label>Company Phone</label>
              <input
                type="tel"
                value={formData.company_phone}
                onChange={(e) => handleInputChange(e, "company_phone")}
                placeholder="1234567890"
              />
              {errors.company_phone && <span className="error">{errors.company_phone}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Company Email</label>
              <input
                type="email"
                value={formData.company_email}
                onChange={(e) => handleInputChange(e, "company_email")}
                required
              />
              {errors.company_email && <span className="error">{errors.company_email}</span>}
            </div>
            <div className="form-group">
              <label>Company Address</label>
              <input
                type="text"
                value={formData.company_address}
                onChange={(e) => handleInputChange(e, "company_address")}
              />
              {errors.company_address && <span className="error">{errors.company_address}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange(e, "first_name")}
                required
              />
              {errors.first_name && <span className="error">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label>Middle Name (optional)</label>
              <input
                type="text"
                value={formData.middlename}
                onChange={(e) => handleInputChange(e, "middlename")}
              />
              {errors.middlename && <span className="error">{errors.middlename}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange(e, "last_name")}
                required
              />
              {errors.last_name && <span className="error">{errors.last_name}</span>}
            </div>
            <div className="form-group">
              <label>Suffix (optional)</label>
              <select
                value={formData.suffix_id}
                onChange={(e) => handleInputChange(e, "suffix_id")}
              >
                <option value="">None</option>
                {(suffixes || []).map((suffix) => (
                  <option key={suffix.id} value={suffix.id}>
                    {suffix.suffix_name || suffix.name}
                  </option>
                ))}
              </select>
              {errors.suffix_id && <span className="error">{errors.suffix_id}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Number</label>
              <input
                type="tel"
                value={formData.contact_number}
                onChange={(e) => handleInputChange(e, "contact_number")}
                placeholder="1234567890"
              />
              {errors.contact_number && <span className="error">{errors.contact_number}</span>}
            </div>
            <div className="form-group">
              <label>Street</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => handleInputChange(e, "street")}
              />
              {errors.street && <span className="error">{errors.street}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input type="text" value={formData.city} disabled />
            </div>
            <div className="form-group">
              <label>Province</label>
              <input type="text" value={formData.province} disabled />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Postal Code</label>
              <input type="text" value={formData.postal_code} disabled />
            </div>
            <div className="form-group">
              <label>Country</label>
              <input type="text" value={formData.country} disabled />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange(e, "email")}
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>{isEdit ? "New Password (optional)" : "Password"}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange(e, "password")}
              required={!isEdit}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select
              value={formData.gender_id}
              onChange={(e) => handleInputChange(e, "gender_id")}
            >
              <option value="">Select Gender</option>
              {(genders || []).map((gender) => (
                <option key={gender.id} value={gender.id}>
                  {gender.gender_name}
                </option>
              ))}
            </select>
            {errors.gender_id && <span className="error">{errors.gender_id}</span>}
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={formData.role_id} disabled>
              <option value="2">Employer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Profile Picture (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleInputChange(e, "profile_img")}
              ref={fileInputRef}
            />
            {formData.profile_img && (
              <div className="profile-img-preview">
                <img src={URL.createObjectURL(formData.profile_img)} alt="Preview" />
                <button type="button" onClick={removeImage}>
                  Remove
                </button>
              </div>
            )}
            {errors.profile_img && <span className="error">{errors.profile_img}</span>}
          </div>
          <div className="employermodal-buttons">
            <button className="submit-button" type="submit">
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

export default EmployerModal;