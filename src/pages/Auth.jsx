import React, { useState } from 'react';
import './Auth.css';
import BookLogo from '../components/BookLogo';
import { Eye, EyeOff, User, Mail, Lock, ShieldCheck } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const Auth = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    userId: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [isCheckingUserId, setIsCheckingUserId] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);

  // Debounced User ID and Email Check
  React.useEffect(() => {
    if (!isSignUp) return;

    const uIdController = new AbortController();
    const emailController = new AbortController();
    let uIdTimeout, emailTimeout;

    if (formData.userId.length >= 3) {
      setIsCheckingUserId(true);
      uIdTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/check-userid/${formData.userId}`, {
            signal: uIdController.signal
          });
          const data = await res.json();
          setErrors(prev => ({
            ...prev,
            userId: data.available ? null : 'This User ID is already taken'
          }));
        } catch (err) {
          if (err.name !== 'AbortError') console.error('UserID check failed');
        } finally {
          setIsCheckingUserId(false);
        }
      }, 500);
    }

    if (formData.email.endsWith('@gmail.com') && formData.email.length > 10) {
      emailTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/check-email/${formData.email}`, {
            signal: emailController.signal
          });
          const data = await res.json();
          setErrors(prev => ({
            ...prev,
            email: data.available ? null : 'This Email is already registered'
          }));
        } catch (err) {
          if (err.name !== 'AbortError') console.error('Email check failed');
        }
      }, 800);
    }

    return () => {
      clearTimeout(uIdTimeout);
      clearTimeout(emailTimeout);
      uIdController.abort();
      emailController.abort();
    };
  }, [formData.userId, formData.email, isSignUp]);

  const validateField = (name, value) => {
    let err = null;

    if (name === 'username') {
      const parts = value.trim().split(/\s+/);
      if (parts.length < 2) {
        err = 'Enter at least First and Last name';
      }
    }

    if (name === 'email') {
      if (!value.endsWith('@gmail.com')) {
        err = 'Must be a valid @gmail.com address';
      }
    }

    if (name === 'password') {
      let strength = 0;
      if (value.length >= 6) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^a-zA-Z0-9]/.test(value)) strength++;
      setPasswordStrength(strength);
    }

    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        err = 'Passwords do not match';
      }
    }

    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    if (isSignUp) validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Final validation check
    const hasErrors = Object.values(errors).some(error => error !== null);
    if (isSignUp && hasErrors) {
      setError('Please fix the errors before signing up');
      return;
    }

    setLoading(true);

    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/signin';
      const body = isSignUp
        ? { username: formData.username, userId: formData.userId, email: formData.email, password: formData.password }
        : { userId: formData.userId, password: formData.password };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      if (onLogin) {
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card neon-border">
        <div className="auth-header">
          <div className="title-wrapper">
            <BookLogo size="48px" className="auth-book-logo" />
            <h1 className="main-title">
              {isSignUp ? 'Initialize' : 'Authorize'} <span className="gm-text">GM</span>
            </h1>
          </div>
          <p className="auth-subtitle">{isSignUp ? 'Sequence your cognitive profile' : 'Reconnect to the GM nexus'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className={`input-field ${errors.username ? 'field-error' : ''}`} style={{ '--index': 1 }}>
              <User size={18} className="field-icon" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="First Middle Last Name"
                required
              />
              <div className="input-glow"></div>
              {errors.username && <span className="error-tip">{errors.username}</span>}
            </div>
          )}

          <div className={`input-field ${errors.userId ? 'field-error' : ''}`} style={{ '--index': 2 }}>
            <ShieldCheck size={18} className="field-icon" />
            <input
              type="text"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="user_id"
              required
            />
            <div className="input-glow"></div>
            {isCheckingUserId && <div className="field-loader"></div>}
            {errors.userId && <span className="error-tip">{errors.userId}</span>}
          </div>

          {isSignUp && (
            <div className={`input-field ${errors.email ? 'field-error' : ''}`} style={{ '--index': 3 }}>
              <Mail size={18} className="field-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address (@gmail.com)"
                required
              />
              <div className="input-glow"></div>
              {errors.email && <span className="error-tip">{errors.email}</span>}
            </div>
          )}

          <div className="password-group" style={{ '--index': 4 }}>
            <div className="input-field">
              <Lock size={18} className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="password-toggle-minimal"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <div className="input-glow"></div>
            </div>
            {isSignUp && (
              <div className="strength-meter">
                <div className={`strength-bar level-${passwordStrength}`}></div>
              </div>
            )}
          </div>

          {isSignUp && (
            <div className={`input-field ${errors.confirmPassword ? 'field-error' : ''}`} style={{ '--index': 5 }}>
              <Lock size={18} className="field-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
              />
              <div className="input-glow"></div>
              {errors.confirmPassword && <span className="error-tip">{errors.confirmPassword}</span>}
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}>
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      <div className="auth-background">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
      </div>
    </div>
  );
};

export default Auth;
