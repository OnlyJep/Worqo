import React, { useState, useEffect, useRef } from "react";
import "./../../../../sass/components/adminmodal.scss";

const AdminModal = ({ onClose, onSubmit, isEdit, initialData }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middlename: "",
    last_name: "",
    suffix: "",
    email: "",
    password: "",
    role_id: "3", // Updated to match backend role_id for Admin
    profile_img: null,
  });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        first_name: initialData.first_name || "",
        middlename: initialData.middlename || "",
        last_name: initialData.last_name || "",
        suffix: initialData.suffix || "",
        email: initialData.email || "",
        password: "",
        role_id: "3", // Updated to match backend role_id for Admin
        profile_img: null,
      });
    }
  }, [isEdit, initialData]);

  const handleInputChange = (e, field) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, profile_img: null }));
    setErrors((prev) => ({ ...prev, profile_img: "" }));
    if (fileInputRef.current) {
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
    if (!formData.role_id) newErrors.role_id = "Role is required";
    if (formData.profile_img && !formData.profile_img.type.startsWith("image/")) {
      newErrors.profile_img = "File must be an image";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = new FormData();
      submitData.append("first_name", formData.first_name);
      submitData.append("middlename", formData.middlename);
      submitData.append("last_name", formData.last_name);
      submitData.append("suffix", formData.suffix);
      submitData.append("email", formData.email);
      if (formData.password) submitData.append("password", formData.password);
      submitData.append("role_id", formData.role_id);
      if (formData.profile_img) submitData.append("profile_img", formData.profile_img);
      onSubmit(submitData);
    }
  };

  return React.createElement(
    "div",
    { className: "adminmodal-overlay" },
    React.createElement(
      "div",
      { className: "adminmodal" },
      React.createElement("h2", null, isEdit ? "Edit Admin" : "Add New Admin"),
      React.createElement(
        "div",
        { className: "adminmodal-content" },
        React.createElement(
          "div",
          { className: "form-group name-row" },
          React.createElement(
            "div",
            { className: "name-field" },
            React.createElement("label", { htmlFor: "first_name" }, "First Name"),
            React.createElement("input", {
              id: "first_name",
              type: "text",
              value: formData.first_name,
              onChange: (e) => handleInputChange(e, "first_name"),
              placeholder: "First Name",
              required: true,
            }),
            errors.first_name && React.createElement("span", { className: "error" }, errors.first_name)
          ),
          React.createElement(
            "div",
            { className: "name-field" },
            React.createElement("label", { htmlFor: "middlename" }, "Middle Name"),
            React.createElement("input", {
              id: "middlename",
              type: "text",
              value: formData.middlename,
              onChange: (e) => handleInputChange(e, "middlename"),
              placeholder: "Middle Name (optional)",
            })
          ),
          React.createElement(
            "div",
            { className: "name-field" },
            React.createElement("label", { htmlFor: "last_name" }, "Last Name"),
            React.createElement("input", {
              id: "last_name",
              type: "text",
              value: formData.last_name,
              onChange: (e) => handleInputChange(e, "last_name"),
              placeholder: "Last Name",
              required: true,
            }),
            errors.last_name && React.createElement("span", { className: "error" }, errors.last_name)
          ),
          React.createElement(
            "div",
            { className: "name-field" },
            React.createElement("label", { htmlFor: "suffix" }, "Suffix"),
            React.createElement(
              "select",
              {
                id: "suffix",
                value: formData.suffix,
                onChange: (e) => handleInputChange(e, "suffix"),
              },
              React.createElement("option", { value: "" }, "None"),
              React.createElement("option", { value: "Jr" }, "Jr"),
              React.createElement("option", { value: "Sr" }, "Sr"),
              React.createElement("option", { value: "II" }, "II"),
              React.createElement("option", { value: "III" }, "III"),
              React.createElement("option", { value: "IV" }, "IV")
            )
          )
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", { htmlFor: "email" }, "Email"),
          React.createElement("input", {
            id: "email",
            type: "email",
            value: formData.email,
            onChange: (e) => handleInputChange(e, "email"),
            placeholder: "Enter email address",
            required: true,
          }),
          errors.email && React.createElement("span", { className: "error" }, errors.email)
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", { htmlFor: "password" }, isEdit ? "New Password" : "Password"),
          React.createElement("input", {
            id: "password",
            type: "password",
            value: formData.password,
            onChange: (e) => handleInputChange(e, "password"),
            placeholder: isEdit ? "New password (optional)" : "Enter password",
            required: !isEdit,
          }),
          errors.password && React.createElement("span", { className: "error" }, errors.password)
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", { htmlFor: "role_id" }, "Role"),
          React.createElement(
            "select",
            {
              id: "role_id",
              value: formData.role_id,
              disabled: true,
            },
            React.createElement("option", { value: "3" }, "Admin") // Updated to match backend role_id
          ),
          errors.role_id && React.createElement("span", { className: "error" }, errors.role_id)
        ),
        React.createElement(
          "div",
          { className: "form-group" },
          React.createElement("label", { htmlFor: "profile_img" }, "Profile Picture (Optional)"),
          React.createElement("input", {
            id: "profile_img",
            type: "file",
            accept: "image/*",
            onChange: (e) => handleInputChange(e, "profile_img"),
            ref: fileInputRef,
          }),
          formData.profile_img && React.createElement(
            "div",
            { className: "profile-img-preview" },
            React.createElement("img", {
              src: URL.createObjectURL(formData.profile_img),
              alt: "Profile Preview",
              className: "preview-img",
            }),
            React.createElement(
              "button",
              { className: "remove-img-button", onClick: removeImage },
              "Remove Image"
            )
          ),
          errors.profile_img && React.createElement("span", { className: "error" }, errors.profile_img)
        )
      ),
      React.createElement(
        "div",
        { className: "adminmodal-buttons" },
        React.createElement(
          "button",
          { className: "submit-button", onClick: handleSubmit },
          isEdit ? "Update" : "Create"
        ),
        React.createElement(
          "button",
          { className: "cancel-button", onClick: onClose },
          "Cancel"
        )
      )
    )
  );
};

export default AdminModal;