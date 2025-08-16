import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import "./../../../../sass/components/workermodal.scss";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Compile keywords into a single regex for faster matching, prioritizing Diploma
const credentialKeywords = {
  "Diploma": ["diploma", "certificate of graduation"],
  "Barangay Clearance": ["barangay clearance", "brgy clearance"],
  "NBI Clearance": ["nbi clearance", "national bureau of investigation"],
  "Police Clearance": ["police clearance"],
  "Medical Certificate": ["medical certificate", "health certificate"],
  "Birth Certificate": ["birth certificate", "psa birth"],
  "Transcript of Records": ["transcript of records", "tor"],
  "SSS": ["sss", "social security system"],
  "TIN": ["tin", "tax identification number"],
  "Pag-IBIG": ["pag-ibig", "home development mutual fund"],
  "PhilHealth": ["philhealth"],
  "Passport": ["passport"],
  "Resume": ["resume", "curriculum vitae", "cv"],
  "Marriage Certificate": ["marriage certificate", "psa marriage"],
};

// Create a regex pattern for all keywords
const keywordRegex = new RegExp(
  Object.entries(credentialKeywords)
    .flatMap(([type, keywords]) => keywords.map(kw => `\\b${kw}\\b`))
    .join('|'),
  'i'
);

const detectType = (text) => {
  if (!text || !keywordRegex.test(text)) return 'Unknown';
  const lowerText = text.toLowerCase();
  for (const [type, keywords] of Object.entries(credentialKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return type;
    }
  }
  return 'Unknown';
};

// Downscale image to 300x300 pixels for faster OCR
const downscaleImage = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxDimension = 300;
      let { width, height } = img;
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        resolve(new File([blob], file.name, { type: file.type }));
      }, file.type);
    };
  });
};

const extractText = async (file) => {
  try {
    if (file.type === 'application/pdf') {
      const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file));
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1); // Limit to first page
      const content = await page.getTextContent();
      return content.items.map(item => item.str).join(' ');
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.slice(0, 5000); // Limit to 5000 characters
    } else if (file.type.startsWith('image/')) {
      const downscaledFile = await downscaleImage(file);
      const { data: { text } } = await Tesseract.recognize(URL.createObjectURL(downscaledFile), 'eng', {
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        tessedit_ocr_engine_mode: Tesseract.OEM.TESSERACT_ONLY,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',
      });
      return text;
    }
    return '';
  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    return '';
  }
};

// Debounce function to limit rapid file input processing
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const WorkerModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middlename: "",
    last_name: "",
    suffix: "",
    email: "",
    password: "",
    gender: "",
    work_type: "part-time",
    credentials: [],
    role_id: "2",
  });
  const [credentialTypes, setCredentialTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const fileCache = useRef(new Map()); // Cache for extracted text and types

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        first_name: initialData.first_name || "",
        middlename: initialData.middlename || "",
        last_name: initialData.last_name || "",
        suffix: initialData.suffix || "",
        email: initialData.email || "",
        password: "",
        gender: initialData.gender || "",
        work_type: initialData.work_type || "part-time",
        credentials: initialData.credentials || [],
        role_id: "2",
      });
      setCredentialTypes(initialData.credentials || []);
    }
  }, [isEdit, initialData]);

  useEffect(() => {
    const detectCredentials = debounce(async () => {
      const types = await Promise.all(Array.from(formData.credentials).map(async (file) => {
        const cacheKey = `${file.name}-${file.size}-${file.lastModified}`;
        if (fileCache.current.has(cacheKey)) {
          return fileCache.current.get(cacheKey).type;
        }
        const text = await extractText(file);
        const type = detectType(text);
        fileCache.current.set(cacheKey, { text, type });
        return type;
      }));
      setCredentialTypes(types);
    }, 300);

    if (formData.credentials.length > 0) {
      detectCredentials();
    } else {
      setCredentialTypes([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [formData.credentials]);

  const handleInputChange = (e, field) => {
    const value = e.target.type === "file" ? Array.from(e.target.files) : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const removeCredential = (index) => {
    setFormData((prev) => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index),
    }));
    setCredentialTypes((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, credentials: "" }));
    if (formData.credentials.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = "";
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
    } else if (!isEdit && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.work_type) newErrors.work_type = "Work type is required";
    if (!formData.role_id) newErrors.role_id = "Role is required";
    if (formData.credentials.some(file => !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'].includes(file.type))) {
      newErrors.credentials = "Credentials must be PDF, Word, JPG, or PNG";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        first_name: formData.first_name,
        middlename: formData.middlename || null,
        last_name: formData.last_name,
        suffix: formData.suffix || null,
        email: formData.email,
        password: formData.password || null,
        gender: formData.gender,
        work_type: formData.work_type,
        role_id: formData.role_id,
        credentials: credentialTypes.length > 0 ? credentialTypes : [],
      };
      onSubmit(submitData);
      onClose();
    }
  };

  return (
    <div className="worker-modal-overlay">
      <div className="worker-modal">
        <h2>{isEdit ? "Edit Worker" : "Add New Worker"}</h2>
        <div className="worker-modal-content">
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
              <label htmlFor="suffix">Suffix</label>
              <select
                id="suffix"
                value={formData.suffix}
                onChange={(e) => handleInputChange(e, "suffix")}
              >
                <option value="">None</option>
                <option value="Jr">Jr</option>
                <option value="Sr">Sr</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
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
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange(e, "gender")}
              required
            >
              <option value="" disabled>Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <span className="error">{errors.gender}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="work_type">Work Type</label>
            <select
              id="work_type"
              value={formData.work_type}
              onChange={(e) => handleInputChange(e, "work_type")}
              required
            >
              <option value="part-time">Part Time</option>
              <option value="full-time">Full Time</option>
              <option value="one-time">One Time</option>
            </select>
            {errors.work_type && <span className="error">{errors.work_type}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="credentials">Credentials (Upload Files)</label>
            <input
              id="credentials"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={(e) => handleInputChange(e, "credentials")}
              ref={fileInputRef}
            />
            <div className="file-preview">
              {Array.from(formData.credentials).map((file, index) => (
                <div key={index} className="file-preview-item">
                  <span className="file-name">
                    {file.name} (
                    {credentialTypes[index] === 'Unknown' && !credentialTypes[index]
                      ? <span className="spinner">Detecting...</span>
                      : `Detected: ${credentialTypes[index] || 'Unknown'}`}
                    )
                  </span>
                  <button
                    className="remove-file-button"
                    onClick={() => removeCredential(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {errors.credentials && <span className="error">{errors.credentials}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="role_id">Role</label>
            <select id="role_id" value={formData.role_id} disabled>
              <option value="2">Worker</option>
            </select>
            {errors.role_id && <span className="error">{errors.role_id}</span>}
          </div>
        </div>
        <div className="worker-modal-buttons">
          <button className="submit-button" onClick={handleSubmit}>
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

export default WorkerModal;