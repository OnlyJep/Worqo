import React, { useState, useEffect, useRef } from "react";
import { Select } from "antd";
import "./../../../../sass/components/workermodal.scss";
import axios from "axios";

const { Option } = Select;

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

const WorkerModal = ({ onClose, onSubmit, isEdit, initialData, genders, suffixes, skills }) => {
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
    skills_id: [],
    credentials: [],
    role_id: "1",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [newCredential, setNewCredential] = useState({ credentials_name: "", credentials_photo: null });
  const profileImgRef = useRef(null);
  const credentialFileRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    isMountedRef.current = true;

    if (isEdit && initialData) {
      setFormData({
        first_name: initialData.profile?.first_name || "",
        middlename: initialData.profile?.middlename || "",
        last_name: initialData.profile?.last_name || "",
        suffix_id: initialData.profile?.suffix_id ? String(initialData.profile.suffix_id) : "",
        email: initialData.email || "",
        password: "",
        gender_id: initialData.profile?.gender_id ? String(initialData.profile.gender_id) : "",
        contact_number: initialData.profile?.contact_number || "",
        street: initialData.profile?.street || "",
        city: initialData.profile?.city || "Butuan City",
        province: initialData.profile?.province || "Agusan Del Norte",
        postal_code: initialData.profile?.postal_code || "8600",
        country: initialData.profile?.country || "Philippines",
        profile_img: initialData.profile?.profile_img || null,
        work_type: initialData.worker?.work_type || "",
        skills_id: initialData.worker?.skills_id || [],
        credentials: Array.isArray(initialData.worker?.credentials_name) && Array.isArray(initialData.worker?.credentials_photo)
          ? initialData.worker.credentials_name.map((name, index) => ({
              credentials_name: name || "",
              credentials_photo: initialData.worker.credentials_photo[index] || null,
            }))
          : [],
        role_id: "1",
      });
      if (isMountedRef.current) {
        setApiError("");
        setErrors({});
      }
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isEdit, initialData]);

  const handleInputChange = (e, field) => {
    const value = e.target?.type === "file" ? e.target.files[0] : e.target?.value || e;
    if (field === "contact_number" && value && !/^\+?[\d\s-]*$/.test(value)) {
      return;
    }

    if (field === "first_name" || field === "last_name") {
      if (isMountedRef.current) {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
        setApiError("");
      }
      return;
    }

    if (field === "profile_img" && value) {
      if (value.size > 2048 * 1024) {
        if (isMountedRef.current) {
          setErrors((prev) => ({ ...prev, profile_img: "Image must not exceed 2 MB" }));
        }
        return;
      }
      if (!["image/jpeg", "image/png", "image/jpg"].includes(value.type)) {
        if (isMountedRef.current) {
          setErrors((prev) => ({ ...prev, profile_img: "Image must be JPEG, PNG, or JPG" }));
        }
        return;
      }
    }

    if (field === "skills_id") {
      if (isMountedRef.current) {
        setFormData((prev) => ({ ...prev, skills_id: value }));
        setErrors((prev) => ({ ...prev, skills_id: "" }));
        setApiError("");
      }
      return;
    }

    if (isMountedRef.current) {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
      setApiError("");
    }
  };

  const handleNewCredentialChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    if (field === "credentials_photo" && value) {
      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/jpeg",
          "image/png",
        ].includes(value.type)
      ) {
        if (isMountedRef.current) {
          setErrors((prev) => ({
            ...prev,
            new_credential_photo: "Credential must be PDF, Word, JPG, or PNG",
          }));
        }
        return;
      }
      if (value.size > 2048 * 1024) {
        if (isMountedRef.current) {
          setErrors((prev) => ({
            ...prev,
            new_credential_photo: "Credential file must not exceed 2 MB",
          }));
        }
        return;
      }
    }

    if (isMountedRef.current) {
      setNewCredential((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "" }));
    }
  };

  const addCredential = () => {
    if (!newCredential.credentials_name) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, new_credential_name: "Please select a credential type" }));
      }
      return;
    }
    if (!newCredential.credentials_photo) {
      if (isMountedRef.current) {
        setErrors((prev) => ({ ...prev, new_credential_photo: "Please upload a credential file" }));
      }
      return;
    }
    if (isMountedRef.current) {
      setFormData((prev) => ({
        ...prev,
        credentials: [...prev.credentials, newCredential],
      }));
      setNewCredential({ credentials_name: "", credentials_photo: null });
      setErrors((prev) => ({ ...prev, new_credential_name: "", new_credential_photo: "" }));
      if (credentialFileRef.current) {
        credentialFileRef.current.value = "";
      }
    }
  };

  const removeCredential = (index) => {
    if (isMountedRef.current) {
      setFormData((prev) => ({
        ...prev,
        credentials: prev.credentials.filter((_, i) => i !== index),
      }));
      setErrors((prev) => ({ ...prev, credentials: "" }));
    }
  };

  const removeProfileImg = () => {
    if (isMountedRef.current) {
      setFormData((prev) => ({ ...prev, profile_img: null }));
      setErrors((prev) => ({ ...prev, profile_img: "" }));
      if (profileImgRef.current) {
        profileImgRef.current.value = "";
      }
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
    } else if (formData.password && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      newErrors.password = "Password must be at least 8 characters with 1 uppercase letter and 1 digit";
    }
    if (!formData.gender_id) newErrors.gender_id = "Gender is required";
    if (!formData.work_type) newErrors.work_type = "Work type is required";
    if (formData.contact_number && !/^\+?[\d\s-]{7,20}$/.test(formData.contact_number)) {
      newErrors.contact_number = "Contact number must be 7-20 digits, spaces, or hyphens";
    }
    if (!formData.skills_id || formData.skills_id.length === 0) {
      newErrors.skills_id = "At least one skill is required";
    }
    if (isMountedRef.current) {
      setErrors(newErrors);
    }
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
    (formData.skills_id || []).forEach((skillId) => {
      submitData.append("skills_id[]", skillId);
    });

    if (formData.middlename) submitData.append("middlename", formData.middlename);
    if (formData.suffix_id) submitData.append("suffix_id", formData.suffix_id);
    if (formData.contact_number) submitData.append("contact_number", formData.contact_number);
    if (formData.street) submitData.append("street", formData.street);
    if (formData.city) submitData.append("city", formData.city);
    if (formData.province) submitData.append("province", formData.province);
    if (formData.postal_code) submitData.append("postal_code", formData.postal_code);
    if (formData.country) submitData.append("country", formData.country);
    if (formData.password) {
      submitData.append("password", formData.password);
    }

    if (formData.profile_img && formData.profile_img instanceof File) {
      submitData.append("profile_img", formData.profile_img);
    }

    if (formData.credentials.length > 0) {
      formData.credentials.forEach((cred, index) => {
        submitData.append(`credentials[${index}][credentials_name]`, cred.credentials_name);
        if (cred.credentials_photo instanceof File) {
          submitData.append(`credentials[${index}][credentials_photo]`, cred.credentials_photo);
        }
      });
    }

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
        console.log("Validation errors:", error.response?.data?.errors);
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
          setApiError("Please correct the errors in the form.");
        } else {
          setApiError(error.response?.data?.error || "An error occurred. Please try again.");
        }
      }
    }
  };

  const isGendersLoaded = Array.isArray(genders);
  const isSuffixesLoaded = Array.isArray(suffixes);
  const isSkillsLoaded = Array.isArray(skills);
  const isImageFile = (path) => /\.(jpg|jpeg|png)$/i.test(path);

  return (
    <div className="worker-modal-overlay">
      <div className="worker-modal">
        <h2>{isEdit ? "Edit Worker" : "Add New Worker"}</h2>
        {apiError && <div className="error">{apiError}</div>}
        {!isGendersLoaded || !isSuffixesLoaded || !isSkillsLoaded ? (
          <div className="error">Error: Gender, suffix, or skills data not loaded. Please try again later.</div>
        ) : (
          <form className="worker-modal-form" onSubmit={handleSubmit}>
            <div className="worker-modal-content">
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
                    className="credential-dropdown"
                  >
                    <option value="">None</option>
                    {suffixes.map((suffix) => (
                      <option key={suffix.id} value={String(suffix.id)}>
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
                    className="credential-dropdown"
                    required
                  >
                    <option value="">Select Gender</option>
                    {genders.map((gender) => (
                      <option key={gender.id} value={String(gender.id)}>
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
                    className="credential-dropdown"
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
                  <label htmlFor="skills_id">Skills</label>
                  <Select
                    id="skills_id"
                    mode="multiple"
                    value={formData.skills_id}
                    onChange={(value) => handleInputChange(value, "skills_id")}
                    placeholder="Select skills"
                    allowClear
                    className="credential-dropdown"
                    required
                  >
                    {skills.map((skill) => (
                      <Option key={skill.id} value={String(skill.id)}>
                        {skill.name}
                      </Option>
                    ))}
                  </Select>
                  {errors.skills_id && <span className="error">{errors.skills_id}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="contact_number">Contact Number</label>
                  <input
                    id="contact_number"
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange(e, "contact_number")}
                    placeholder="+123-456-7890"
                  />
                  {errors.contact_number && <span className="error">{errors.contact_number}</span>}
                </div>
              </div>
              <div className="form-row">
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
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input id="city" type="text" value={formData.city} disabled />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="province">Province</label>
                  <input id="province" type="text" value={formData.province} disabled />
                </div>
                <div className="form-group">
                  <label htmlFor="postal_code">Postal Code</label>
                  <input id="postal_code" type="text" value={formData.postal_code} disabled />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <input id="country" type="text" value={formData.country} disabled />
                </div>
                <div className="form-group">
                  <label htmlFor="role_id">Role</label>
                  <select id="role_id" value={formData.role_id} disabled className="credential-dropdown">
                    <option value="1">Worker</option>
                  </select>
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
                    {typeof formData.profile_img === "string" ? (
                      <img
                        src={`http://127.0.0.1:8000/storage/${formData.profile_img}`}
                        alt="Profile Preview"
                      />
                    ) : (
                      <img
                        src={URL.createObjectURL(formData.profile_img)}
                        alt="Profile Preview"
                      />
                    )}
                    <button type="button" onClick={removeProfileImg}>Remove</button>
                  </div>
                )}
                {errors.profile_img && <span className="error">{errors.profile_img}</span>}
              </div>
              <div className="form-group">
                <label>Credentials (optional)</label>
                <div className="credential-section">
                  <select
                    value={newCredential.credentials_name}
                    onChange={(e) => handleNewCredentialChange(e, "credentials_name")}
                    className="credential-dropdown"
                  >
                    <option value="">Choose a credential</option>
                    {credentialOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {newCredential.credentials_name && (
                    <div className="credential-upload">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        onChange={(e) => handleNewCredentialChange(e, "credentials_photo")}
                        ref={credentialFileRef}
                      />
                      <button type="button" onClick={addCredential}>Add Credential</button>
                    </div>
                  )}
                  <div>
                    {formData.credentials.map((cred, index) => (
                      <div key={index} className="credential-item">
                        {cred.credentials_name}:{" "}
                        {typeof cred.credentials_photo === "string" ? (
                          isImageFile(cred.credentials_photo) ? (
                            <img
                              src={`http://127.0.0.1:8000/storage/${cred.credentials_photo}`}
                              alt={cred.credentials_name}
                            />
                          ) : (
                            <a href={`http://127.0.0.1:8000/storage/${cred.credentials_photo}`} download>
                              {cred.credentials_photo.split("/").pop()}
                            </a>
                          )
                        ) : (
                          cred.credentials_photo?.name || "No file selected"
                        )}
                        <button type="button" onClick={() => removeCredential(index)}>Remove</button>
                      </div>
                    ))}
                  </div>
                  {errors.credentials && <span className="error">{errors.credentials}</span>}
                  {errors.new_credential_name && <span className="error">{errors.new_credential_name}</span>}
                  {errors.new_credential_photo && <span className="error">{errors.new_credential_photo}</span>}
                </div>
              </div>
            </div>
            <div className="worker-modal-actions">
              <button className="cancel-button" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="submit-button" type="submit">
                {isEdit ? "Update" : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WorkerModal;