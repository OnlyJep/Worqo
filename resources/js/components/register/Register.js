import React, { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./../../../sass/components/_register.scss";
import Loader from '../LoaderContent/loader';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    gender: "",
    suffix: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 5000);
  };

  const closeAlert = () => {
    setAlert({ message: "", type: "" });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "password") {
      validatePassword(e.target.value);
    }
  };

  const validatePassword = (password) => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    setPasswordError(!hasUppercase || !hasNumber ? "Password must contain at least 1 uppercase letter and 1 number." : "");
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      showAlert("✅ Registration successful!", "success");
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        password: "",
        role: "",
        gender: "",
        suffix: "",
      });
      setIsLoading(false);
    }, 1500);
  };

  const roles = [
    { id: 1, role_name: "User" },
    { id: 2, role_name: "Admin" },
  ];

  const genders = [
    { id: 1, name: "Male" },
    { id: 2, name: "Female" },
    { id: 3, name: "Other" },
  ];

  return (
    <>
      {isLoading && <Loader />}
      <div className="register-wrapper">
        {alert.message && (
          <div className={`custom-alert ${alert.type}`}>
            {alert.message}
            <button className="alert-close-btn" onClick={closeAlert}>×</button>
          </div>
        )}
        <div className="register-card">
          <div className="register-content">
            <div className="register-header">
              <h2 className="register-title">Create New Account</h2>
              <p className="register-subtitle">Please fill in the details to register</p>
            </div>

            <form onSubmit={handleRegister} className="register-form-container">
              <div className="register-row">
                <div className="register-input-group">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="register-input-group">
                  <input
                    type="text"
                    name="middleName"
                    placeholder="Middle Name"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="register-input-group">
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="register-input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {passwordError && <p className="register-error">{passwordError}</p>}
              <div className="register-password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div className="register-input-group">
                <select name="role" value={formData.role} onChange={handleChange} required>
                  <option value="" disabled>Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.role_name}</option>
                  ))}
                </select>
              </div>
              <div className="register-input-group">
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="" disabled>Select Gender</option>
                  {genders.map(gender => (
                    <option key={gender.id} value={gender.id}>{gender.name}</option>
                  ))}
                </select>
              </div>
              <div className="register-input-group">
                <select name="suffix" value={formData.suffix} onChange={handleChange}>
                  <option value="">Suffix</option>
                  <option value="Jr.">Jr.</option>
                  <option value="Sr.">Sr.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                </select>
              </div>
              <button type="submit" className="register-submit-btn" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </form>
            <div className="register-login">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="register-login-link">
                  Login
                </Link>
              </p>
            </div>
          </div>
          <div className="register-image-section"></div>
        </div>
      </div>
    </>
  );
};

export default Register;