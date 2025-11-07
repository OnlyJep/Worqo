import React, { useState, useEffect, useRef } from "react";
import "./../../../../sass/components/employermodal.scss";

const EmployerModal = ({ onClose, onSubmit, isEdit, initialData, genders, suffixes }) => {
  const [formData, setFormData] = useState({
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
  const [existingImagePath, setExistingImagePath] = useState(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (isEdit && initialData) {
      // Preserve existing profile image path
      const profileImgPath = initialData.profile_img || null;
      if (isMountedRef.current) {
        setExistingImagePath(profileImgPath);
        
        setFormData({
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
          profile_img: null, // Will be set if user selects a new file
        });
        setApiError("");
        setErrors({});
      }
    } else {
      // Reset when adding new employer
      if (isMountedRef.current) {
        setExistingImagePath(null);
      }
    }

    // Cleanup function to abort pending requests
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEdit, initialData]);

  const handleInputChange = (e, field) => {
    if (!isMountedRef.current) return;
    
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;

    if (field === "contact_number" && value) {
      if (!/^\d*$/.test(value)) return;
    }

    if (field === "first_name" || field === "last_name") {
      const newData = { ...formData, [field]: value };
      newData.username = `${newData.first_name}.${newData.last_name}`.toLowerCase();
      if (isMountedRef.current) {
        setFormData(newData);
        setErrors((prev) => ({ ...prev, [field]: "" }));
        setApiError("");
      }
      return;
    }

    // When a new file is selected, clear the existing image path
    if (field === "profile_img" && value instanceof File) {
      if (isMountedRef.current) {
        setExistingImagePath(null);
      }
    }

    if (isMountedRef.current) {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setApiError("");
    }
  };

  const removeImage = () => {
    if (!isMountedRef.current) return;
    setFormData((prev) => ({ ...prev, profile_img: null }));
    setExistingImagePath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!isEdit && !formData.password) newErrors.password = "Password is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
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
    submitData.append("email", formData.email || "");
    submitData.append("first_name", formData.first_name || "");
    submitData.append("last_name", formData.last_name || "");

    // Include optional fields if they have values
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
          setApiError("Please correct the errors in the form: " + JSON.stringify(error.response.data.errors));
        } else {
          setApiError(error.response?.data?.message || "An error occurred. Please try again.");
        }
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
              <label htmlFor="employer_first_name">First Name</label>
              <input
                id="employer_first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange(e, "first_name")}
                required
              />
              {errors.first_name && <span className="error">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="employer_middlename">Middle Name (optional)</label>
              <input
                id="employer_middlename"
                name="middlename"
                type="text"
                value={formData.middlename}
                onChange={(e) => handleInputChange(e, "middlename")}
              />
              {errors.middlename && <span className="error">{errors.middlename}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employer_last_name">Last Name</label>
              <input
                id="employer_last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange(e, "last_name")}
                required
              />
              {errors.last_name && <span className="error">{errors.last_name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="employer_suffix_id">Suffix (optional)</label>
              <select
                id="employer_suffix_id"
                name="suffix_id"
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
              <label htmlFor="employer_contact_number">Contact Number</label>
              <input
                id="employer_contact_number"
                name="contact_number"
                type="tel"
                value={formData.contact_number}
                onChange={(e) => handleInputChange(e, "contact_number")}
                placeholder="1234567890"
              />
              {errors.contact_number && <span className="error">{errors.contact_number}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="employer_street">Street</label>
              <input
                id="employer_street"
                name="street"
                type="text"
                value={formData.street}
                onChange={(e) => handleInputChange(e, "street")}
              />
              {errors.street && <span className="error">{errors.street}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employer_city">City</label>
              <input id="employer_city" name="city" type="text" value={formData.city} disabled />
            </div>
            <div className="form-group">
              <label htmlFor="employer_province">Province</label>
              <input id="employer_province" name="province" type="text" value={formData.province} disabled />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employer_postal_code">Postal Code</label>
              <input id="employer_postal_code" name="postal_code" type="text" value={formData.postal_code} disabled />
            </div>
            <div className="form-group">
              <label htmlFor="employer_country">Country</label>
              <input id="employer_country" name="country" type="text" value={formData.country} disabled />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="employer_email">Email</label>
            <input
              id="employer_email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange(e, "email")}
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="employer_password">{isEdit ? "New Password (optional)" : "Password"}</label>
            <input
              id="employer_password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange(e, "password")}
              required={!isEdit}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="employer_gender_id">Gender</label>
            <select
              id="employer_gender_id"
              name="gender_id"
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
            <label htmlFor="employer_role_id">Role</label>
            <select id="employer_role_id" name="role_id" value={formData.role_id} disabled>
              <option value="2">Employer</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="employer_profile_img">Profile Picture (optional)</label>
            <input
              id="employer_profile_img"
              name="profile_img"
              type="file"
              accept="image/*"
              onChange={(e) => handleInputChange(e, "profile_img")}
              ref={fileInputRef}
            />
            {(formData.profile_img || existingImagePath) && (
              <div className="profile-img-preview">
                <img 
                  src={
                    formData.profile_img instanceof File
                      ? URL.createObjectURL(formData.profile_img)
                      : existingImagePath
                      ? `http://127.0.0.1:8000/storage/${existingImagePath}`
                      : null
                  } 
                  alt="Preview" 
                  onError={(e) => {
                    e.target.src = "/images/defpfp.svg";
                  }}
                />
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