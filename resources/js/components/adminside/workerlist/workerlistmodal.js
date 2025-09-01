import React, { useState, useEffect, useRef } from "react";
import "./../../../../sass/components/workermodal.scss";

const credentialOptions = [
  { value: "Resume/CV", label: "Resume / Curriculum Vitae (CV)" },
  { value: "Birth Certificate", label: "Birth Certificate (PSA-issued)" },
  { value: "Barangay Clearance", label: "Barangay Clearance" },
  { value: "Police Clearance", label: "Police Clearance" },
  { value: "NBI Clearance", label: "NBI Clearance" },
  { value: "Medical Certificate", label: "Medical Certificate / Health Certificate" },
  { value: "SSS Number", label: "SSS Number (Social Security System)" },
  { value: "PhilHealth Number", label: "PhilHealth Number" },
  { value: "Pag-IBIG Number", label: "Pag-IBIG Number (HDMF)" },
  { value: "TIN", label: "TIN (Tax Identification Number)" },
  { value: "Valid Government ID", label: "Valid Government ID (e.g., Passport, Driver’s License, Voter’s ID, UMID, National ID)" },
];

const WorkerModal = ({ onClose, onSubmit, isEdit, initialData, genders, suffixes }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middlename: "",
    last_name: "",
    suffix_id: "",
    email: "",
    password: "",
    gender_id: "",
    contact_number: "",
    street: "",
    city: "Butuan City",
    province: "Agusan Del Norte",
    postal_code: "8600",
    country: "Philippines",
    profile_img: null,
    work_type: "",
    credentials: [],
    role_id: "1",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [newCredential, setNewCredential] = useState({ name: "", photo: null });
  const profileImgRef = useRef(null);
  const credentialFileRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        first_name: initialData.first_name || "",
        middlename: initialData.middlename || "",
        last_name: initialData.last_name || "",
        suffix_id: initialData.suffix_id ? String(initialData.suffix_id) : "",
        email: initialData.email || "",
        password: "",
        gender_id: initialData.gender_id ? String(initialData.gender_id) : "",
        contact_number: initialData.contact_number || "",
        street: initialData.street || "",
        city: initialData.city || "Butuan City",
        province: initialData.province || "Agusan Del Norte",
        postal_code: initialData.postal_code || "8600",
        country: initialData.country || "Philippines",
        profile_img: null,
        work_type: initialData.work_type || "",
        credentials: initialData.credentials || [],
        role_id: "1",
      });
      setApiError("");
      setErrors({});
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEdit, initialData]);

  const handleInputChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;

    if (field === "contact_number" && value && !/^\d*$/.test(value)) {
      return;
    }

    if (field === "first_name" || field === "last_name") {
      const newData = { ...formData, [field]: value };
      newData.username = `${newData.first_name}.${newData.last_name}`.toLowerCase();
      setFormData(newData);
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setApiError("");
      return;
    }

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

  const handleNewCredentialChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;

    if (field === "photo" && value) {
      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
        ].includes(value.type)
      ) {
        setErrors((prev) => ({
          ...prev,
          new_credential_photo: "Credential must be PDF, Word, JPG, or PNG",
        }));
        return;
      }
      if (value.size > 2048 * 1024) {
        setErrors((prev) => ({
          ...prev,
          new_credential_photo: "Credential file must not exceed 2 MB",
        }));
        return;
      }
    }

    setNewCredential((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "" }));
  };

  const addCredential = () => {
    if (!newCredential.name) {
      setErrors((prev) => ({ ...prev, new_credential_name: "Please select a credential type" }));
      return;
    }
    if (!newCredential.photo) {
      setErrors((prev) => ({ ...prev, new_credential_photo: "Please upload a credential file" }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      credentials: [...prev.credentials, newCredential],
    }));
    setNewCredential({ name: "", photo: null });
    setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "" }));
    if (credentialFileRef.current) {
      credentialFileRef.current.value = "";
    }
  };

  const removeCredential = (index) => {
    setFormData((prev) => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index),
    }));
    setErrors((prev) => ({ ...prev, credentials: "" }));
  };

  const removeProfileImg = () => {
    setFormData((prev) => ({ ...prev, profile_img: null }));
    setErrors((prev) => ({ ...prev, profile_img: "" }));
    if (profileImgRef.current) {
      profileImgRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name) newErrors.first_name = "First name is required";
    if (!formData.last_name) newErrors.last_name = "Last name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!isEdit && !formData.password) {
      newErrors.password = "Password is required";
    } else if (!isEdit && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters with 1 uppercase letter and 1 digit";
    }
    if (!formData.gender_id) newErrors.gender_id = "Gender is required";
    if (!formData.work_type) newErrors.work_type = "Work type is required";
    if (formData.contact_number && !/^\d{10,15}$/.test(formData.contact_number)) {
      newErrors.contact_number = "Contact number must be 10-15 digits";
    }
    if (formData.credentials.some((cred) => !cred.name)) {
      newErrors.credentials = "Credential type is required for each uploaded file";
    }
    if (formData.credentials.some((cred) => !cred.photo)) {
      newErrors.credentials = "Credential file is required for each selected type";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submitData = new FormData();
    submitData.append("first_name", formData.first_name || "");
    submitData.append("last_name", formData.last_name || "");
    submitData.append("email", formData.email || "");
    submitData.append("gender_id", formData.gender_id || "");
    submitData.append("work_type", formData.work_type || "");
    submitData.append("role_id", formData.role_id);

    if (formData.middlename !== null && formData.middlename !== "") submitData.append("middlename", formData.middlename);
    if (formData.suffix_id) submitData.append("suffix_id", formData.suffix_id);
    if (formData.contact_number) submitData.append("contact_number", formData.contact_number);
    if (formData.street) submitData.append("street", formData.street);
    if (formData.city) submitData.append("city", formData.city);
    if (formData.province) submitData.append("province", formData.province);
    if (formData.postal_code) submitData.append("postal_code", formData.postal_code);
    if (formData.country) submitData.append("country", formData.country);
    if (formData.profile_img) submitData.append("profile_img", formData.profile_img);
    if (formData.password && (isEdit ? formData.password : true)) submitData.append("password", formData.password);

    formData.credentials.forEach((cred, index) => {
      submitData.append(`credentials[${index}][name]`, cred.name);
      submitData.append(`credentials[${index}][photo]`, cred.photo);
    });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await onSubmit(submitData, abortController.signal);
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
        setApiError(error.response?.data?.error || "An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="worker-modal-overlay">
      <div className="worker-modal">
        <h2>{isEdit ? "Edit Worker" : "Add New Worker"}</h2>
        {apiError && <div className="error">{apiError}</div>}
        {Object.keys(errors).length > 0 && (
          <div className="error">
            {Object.entries(errors).map(([field, message]) => (
              <div key={field}>{message}</div>
            ))}
          </div>
        )}
        <form className="worker-modal-content" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange(e, "first_name")}
                required
              />
              {errors.first_name && <span className="error">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="middlename">Middle Name (optional)</label>
              <input
                id="middlename"
                type="text"
                value={formData.middlename}
                onChange={(e) => handleInputChange(e, "middlename")}
              />
              {errors.middlename && <span className="error">{errors.middlename}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange(e, "last_name")}
                required
              />
              {errors.last_name && <span className="error">{errors.last_name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="suffix_id">Suffix (optional)</label>
              <select
                id="suffix_id"
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
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange(e, "email")}
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
                required={!isEdit}
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender_id">Gender</label>
              <select
                id="gender_id"
                value={formData.gender_id}
                onChange={(e) => handleInputChange(e, "gender_id")}
                required
              >
                <option value="">Select Gender</option>
                {(genders || []).map((gender) => (
                  <option key={gender.id} value={gender.id}>
                    {gender.name || gender.gender_name}
                  </option>
                ))}
              </select>
              {errors.gender_id && <span className="error">{errors.gender_id}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="work_type">Work Type</label>
              <select
                id="work_type"
                value={formData.work_type}
                onChange={(e) => handleInputChange(e, "work_type")}
                required
              >
                <option value="">Select Work Type</option>
                <option value="part-time">Part Time</option>
                <option value="full-time">Full Time</option>
                <option value="one-time">One Time</option>
              </select>
              {errors.work_type && <span className="error">{errors.work_type}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_number">Contact Number</label>
              <input
                id="contact_number"
                type="tel"
                value={formData.contact_number}
                onChange={(e) => handleInputChange(e, "contact_number")}
                placeholder="1234567890"
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
              />
              {errors.street && <span className="error">{errors.street}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input id="city" type="text" value={formData.city} disabled />
            </div>
            <div className="form-group">
              <label htmlFor="province">Province</label>
              <input id="province" type="text" value={formData.province} disabled />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="postal_code">Postal Code</label>
              <input id="postal_code" type="text" value={formData.postal_code} disabled />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <input id="country" type="text" value={formData.country} disabled />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="profile_img">Profile Picture (optional)</label>
            <input
              id="profile_img"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => handleInputChange(e, "profile_img")}
              ref={profileImgRef}
            />
            {formData.profile_img && (
              <div className="profile-img-preview">
                <img src={URL.createObjectURL(formData.profile_img)} alt="Profile Preview" />
                <button type="button" onClick={removeProfileImg}>Remove</button>
              </div>
            )}
            {errors.profile_img && <span className="error">{errors.profile_img}</span>}
          </div>
          <div className="form-group">
            <label>Credentials (optional)</label>
            <div className="credential-section">
              <select
                value={newCredential.name}
                onChange={(e) => handleNewCredentialChange(e, "name")}
                className="credential-dropdown"
              >
                <option value="">Choose a credential</option>
                {credentialOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {newCredential.name && (
                <div>
                  <label>Upload {newCredential.name} (required)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={(e) => handleNewCredentialChange(e, "photo")}
                    ref={credentialFileRef}
                  />
                  <button type="button" onClick={addCredential}>Add Credential</button>
                </div>
              )}
              <div>
                {formData.credentials.map((cred, index) => (
                  <div key={index}>
                    {cred.name}: {cred.photo?.name || "No file selected"}
                    <button type="button" onClick={() => removeCredential(index)}>Remove</button>
                  </div>
                ))}
              </div>
              {errors.credentials && <span className="error">{errors.credentials}</span>}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="role_id">Role</label>
            <select id="role_id" value={formData.role_id} disabled>
              <option value="1">Worker</option>
            </select>
          </div>
          <div className="worker-modal-buttons">
            <button className="cancel-button" type="button" onClick={onClose}>Cancel</button>
            <button className="submit-button" type="submit">{isEdit ? "Update" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkerModal;