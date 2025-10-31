import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { CaretDownOutlined } from '@ant-design/icons';
import "./../../../sass/components/_register.scss";
import { message } from 'antd';

const Register = () => {
  const [msgApi, contextHolder] = message.useMessage();
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    email: "",
    password: "",
    role: "",
    gender: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [suffixes, setSuffixes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [genders, setGenders] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Added for navigation

  useEffect(() => {
    // Clear auth token to ensure not logged in
    localStorage.removeItem('auth_token');

    const fetchData = async () => {
      try {
        // Fetch suffixes
        const suffixResponse = await fetch('http://127.0.0.1:8000/api/suffixes', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!suffixResponse.ok) {
          throw new Error(`Failed to fetch suffixes: ${suffixResponse.status}`);
        }
        const suffixData = await suffixResponse.json();
        setSuffixes(suffixData.filter(suffix => !suffix.archived));

        // Fetch roles
        const roleResponse = await fetch('http://127.0.0.1:8000/api/roles', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!roleResponse.ok) {
          throw new Error(`Failed to fetch roles: ${roleResponse.status}`);
        }
        const roleData = await roleResponse.json();
        setRoles(roleData); // Updated to handle flat array

        // Fetch genders
        const genderResponse = await fetch('http://127.0.0.1:8000/api/genders', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!genderResponse.ok) {
          throw new Error(`Failed to fetch genders: ${genderResponse.status}`);
        }
        const genderData = await genderResponse.json();
        setGenders([
          { value: "", label: "Select Gender", disabled: true },
          ...genderData.map(gender => ({
            value: gender.gender_name,
            label: gender.gender_name
          }))
        ]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setError(`Failed to load registration data: ${error.message}`);
        msgApi.error(`Failed to load data: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);


  const closeAlert = () => {};

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "password") {
      validatePassword(e.target.value);
    }
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    setPasswordError(
      !passwordRegex.test(password)
        ? "Password must contain at least 1 uppercase letter, 1 number, and 1 special character (@$!%*?&)."
        : ""
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.role ||
      !formData.gender
    ) {
      setError("Please fill in all required fields.");
      msgApi.warning('Please fill in all required fields.');
      return;
    }
    if (passwordError) {
      setError("Please fix password errors.");
      msgApi.warning('Please fix password errors.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          suffix: formData.suffix,
          email: formData.email,
          password: formData.password,
          role_id: formData.role,
          gender: formData.gender,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle validation errors or other errors
        const errorMessage = data.errors
          ? Object.values(data.errors).flat().join(", ")
          : data.error || "Registration failed";
        setError(errorMessage);
        msgApi.error(errorMessage);
      } else {
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          suffix: "",
          email: "",
          password: "",
          role: "",
          gender: "",
        });
        msgApi.success('Registration successful! Redirecting to login...');
        // Navigate to login page after 2 seconds
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("Registration failed: Network error");
      msgApi.error('Registration failed: Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
        <div className="register-card">
          <div className="register-image-section"></div>
          <div className="register-content">
            {contextHolder}
            {/* Ant Design message is used instead of inline alerts */}
            <div className="register-header">
              <h2 className="register-title">Create Your Account</h2>
              <p className="register-subtitle">Join us to get started</p>
            </div>

            {error && <p className="register-error">{error}</p>}
            {passwordError && <p className="register-error">{passwordError}</p>}

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
                    placeholder="Middle Name (optional)"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="register-row">
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
                  <select
                    name="suffix"
                    value={formData.suffix}
                    onChange={handleChange}
                  >
                    <option value="">Suffix (optional)</option>
                    {suffixes.map((suffix) => (
                      <option key={suffix.id} value={suffix.suffix_name}>
                        {suffix.suffix_name}
                      </option>
                    ))}
                  </select>
                </div>
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
              <div className="register-password-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              <div className="register-select-group">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
                <CaretDownOutlined className="select-icon" />
              </div>
              <div className="register-select-group">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  {genders.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
                <CaretDownOutlined className="select-icon" />
              </div>
              <button
                type="submit"
                className="register-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
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
        </div>
      </div>
  );
};

export default Register;