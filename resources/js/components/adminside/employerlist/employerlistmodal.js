import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import "./../../../../sass/components/employermodal.scss";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Compile keywords into a single regex for faster matching, prioritizing common ones
const credentialKeywords = {
  "BIR Registration": ["bir registration", "bureau of internal revenue"],
  "DTI Registration": ["dti registration", "department of trade and industry"],
  "SEC Registration": ["sec registration", "securities and exchange commission"],
  "Business Permit": ["business permit", "mayor's permit"],
  "Barangay Business Clearance": ["barangay business clearance"],
  "DOLE Registration": ["dole registration", "department of labor and employment"],
  "SSS Employer": ["sss employer", "social security system employer"],
  "PhilHealth Employer": ["philhealth employer"],
  "Pag-IBIG Employer": ["pag-ibig employer"],
  "Articles of Incorporation": ["articles of incorporation"],
  "By-Laws": ["by-laws"],
  "Treasurer's Affidavit": ["treasurer's affidavit"],
  "Unknown": [],
};

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

const EmployerModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    company_name: "",
    email: "",
    password: "",
    phone: "",
    owner: {
      first_name: "",
      middlename: "",
      last_name: "",
      suffix: "",
    },
    credentials: [],
    role_id: "3",
  });
  const [credentialTypes, setCredentialTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const fileCache = useRef(new Map());

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        company_name: initialData.company_name || "",
        email: initialData.email || "",
        password: "",
        phone: initialData.phone || "",
        owner: {
          first_name: initialData.owner?.first_name || "",
          middlename: initialData.owner?.middlename || "",
          last_name: initialData.owner?.last_name || "",
          suffix: initialData.owner?.suffix || "",
        },
        credentials: initialData.credentials || [],
        role_id: "3",
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
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleOwnerChange = (e, ownerField) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      owner: { ...prev.owner, [ownerField]: value },
    }));
    setErrors((prev) => ({ ...prev, [`owner_${ownerField}`]: "" }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, credentials: files }));
    setErrors((prev) => ({ ...prev, credentials: "" }));
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
    if (!formData.company_name) newErrors.company_name = "Company name is required";
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
    if (!formData.owner.first_name) newErrors.owner_first_name = "Owner first name is required";
    if (!formData.owner.last_name) newErrors.owner_last_name = "Owner last name is required";
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
        company_name: formData.company_name,
        email: formData.email,
        password: formData.password || null,
        phone: formData.phone || null,
        owner: formData.owner,
        credentials: credentialTypes.length > 0 ? credentialTypes : [],
        role_id: formData.role_id,
      };
      onSubmit(submitData);
      onClose();
    }
  };

  return (
    <div className="adminmodal-overlay">
      <div className="adminmodal">
        <h2>{isEdit ? "Edit Employer" : "Add New Employer"}</h2>
        <div className="adminmodal-content">
          <div className="form-group">
            <label htmlFor="company_name">Company Name</label>
            <input
              id="company_name"
              type="text"
              value={formData.company_name}
              onChange={(e) => handleInputChange(e, "company_name")}
              placeholder="Company Name"
              required
            />
            {errors.company_name && <span className="error">{errors.company_name}</span>}
          </div>
          <div className="form-group name-row">
            <div className="name-field">
              <label htmlFor="owner_first_name">Owner First Name</label>
              <input
                id="owner_first_name"
                type="text"
                value={formData.owner.first_name}
                onChange={(e) => handleOwnerChange(e, "first_name")}
                placeholder="First Name"
                required
              />
              {errors.owner_first_name && <span className="error">{errors.owner_first_name}</span>}
            </div>
            <div className="name-field">
              <label htmlFor="owner_middlename">Owner Middle Name</label>
              <input
                id="owner_middlename"
                type="text"
                value={formData.owner.middlename}
                onChange={(e) => handleOwnerChange(e, "middlename")}
                placeholder="Middle Name (optional)"
              />
            </div>
            <div className="name-field">
              <label htmlFor="owner_last_name">Owner Last Name</label>
              <input
                id="owner_last_name"
                type="text"
                value={formData.owner.last_name}
                onChange={(e) => handleOwnerChange(e, "last_name")}
                placeholder="Last Name"
                required
              />
              {errors.owner_last_name && <span className="error">{errors.owner_last_name}</span>}
            </div>
            <div className="name-field">
              <label htmlFor="owner_suffix">Owner Suffix</label>
              <select
                id="owner_suffix"
                value={formData.owner.suffix}
                onChange={(e) => handleOwnerChange(e, "suffix")}
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
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange(e, "phone")}
              placeholder="Enter phone number (optional)"
            />
          </div>
          <div className="form-group">
            <label htmlFor="credentials">Credentials (Upload Files)</label>
            <input
              id="credentials"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <div className="file-preview">
              {Array.from(formData.credentials).map((file, index) => (
                <div key={index} className="file-preview-item">
                  <span className="file-name">
                    {file.name} (
                    {credentialTypes[index] ? credentialTypes[index] : <span className="spinner">Detecting...</span>}
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
              <option value="3">Employer</option>
            </select>
            {errors.role_id && <span className="error">{errors.role_id}</span>}
          </div>
        </div>
        <div className="adminmodal-buttons">
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

export default EmployerModal;