import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./../../../sass/components/_login.scss";
import Loader from "../LoaderContent/loader";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    console.log("Login attempted with:", { email, password, rememberMe });

    setTimeout(() => {
      window.location.href = "/homepage";
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-image-section"></div>
          <div className="login-content">
            <div className="login-header">
              <h2 className="login-title">Login to Your Account</h2>
              <p className="login-subtitle">See what’s going on with your business</p>
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
                  type={showPassword ? "text" : "password"}
                  className="login-password-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="login-options-group">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" className="login-submit-btn" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="login-signup">
              <p>
                Not Registered Yet?{" "}
                <Link to="/register" className="login-signup-link">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;