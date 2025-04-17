import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./../../../sass/components/_login.scss";
import Loader from '../LoaderContent/loader'; // Import the Loader component

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Initial loading state

  useEffect(() => {
    // Simulate loading time for the page
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust as needed
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true); // Show loader when submitting
    console.log("Login attempted with:", { email, password });
    
    setTimeout(() => {
      window.location.href = "/homepage";
      setIsLoading(false);
    }, 1500); // Adjust as needed
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-content">
            <div className="login-header">
              <h2 className="login-title">Welcome back</h2>
              <p className="login-subtitle">Please login to access your account</p>
            </div>

            {error && <p className="login-error">{error}</p>}

            <form onSubmit={handleLogin} className="login-form-container">
              <div className="login-input-group">
                <input
                  type="email"
                  className="login-email-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-password-group">
                <input
                  type="password"
                  className="login-password-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Link to="/forgot-password" className="forgot-password">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="login-submit-btn" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="login-signup">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="login-signup-link">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <div className="login-image-section">
            {/* The SVG is applied as a background in SCSS */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;