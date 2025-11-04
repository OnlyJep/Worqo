import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './../../../sass/components/_login.scss';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }


    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }


        // Update user status to online (is_online = 1)
        const updatedUser = {
          ...data.user,
          is_online: 1,
          last_active_text: 'Online'
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch userLoggedIn event to notify other components
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { user: updatedUser }
        }));

        const userRole = Number(data.user.role_id);
        console.log('User Role:', userRole, 'Type:', typeof userRole);
        
        // Check if user role is valid and redirect accordingly
        if (!userRole || isNaN(userRole)) {
          setError('Invalid role: Role ID is missing or invalid');
          setIsLoading(false);
          return;
        }
        
        // Check if user is a worker (role_id 1) and redirect to homepage first
        if (userRole === 1) {
          setTimeout(() => {
            navigate('/homepage', { replace: true });
            setIsLoading(false);
          }, 500);
        } else if (userRole === 2) {
          setTimeout(() => {
            navigate('/homepage', { replace: true });
            setIsLoading(false);
          }, 500);
        } else if (userRole === 3) {
          // Admin role - redirect to admin panel
          setTimeout(() => {
            navigate('/admin', { replace: true });
            setIsLoading(false);
          }, 500);
        } else {
          setError(`Invalid role: Unknown role ID ${userRole}`);
          console.error('Unknown role_id:', userRole, 'Full user data:', data.user);
          setIsLoading(false);
        }
      } else {
        // Handle specific error for archived user
        if (data.message === 'Account is archived and cannot log in') {
          setError('Your account is locked. Please contact support.');
        } else {
          setError(data.message || 'Invalid email or password.');
        }
        setIsLoading(false);
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('No active session found.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        // Update user status to offline (is_online = 0) before removing from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const updatedUser = {
            ...userData,
            is_online: 0,
            last_active_text: 'Offline'
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('remembered_email');
        navigate('/login', { replace: true });
      } else {
        setError(data.message || 'Logout failed.');
      }
    } catch (error) {
      setError('An error occurred during logout.');
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
        <div className="login-card">
          <div className="login-image-section"></div>
          <div className="login-content">
            <div className="login-header">
              <h2 className="login-title">Login to Your Account</h2>
              <p className="login-subtitle">See what's going on with your business</p>
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
                  type={showPassword ? 'text' : 'password'}
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
              </div>

              <button type="submit" className="login-submit-btn" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="login-signup">
              <p>
                Not Registered Yet?{' '}
                <Link to="/register" className="login-signup-link">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Login;