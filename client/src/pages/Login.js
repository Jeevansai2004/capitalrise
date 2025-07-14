import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  if (auth.loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const { login } = auth;

  const handleChange = e => {
    if (e && e.target && e.target.name) {
      setForm(f => ({ ...f, [e.target.name]: e.target.value }));
      setErrors(err => ({ ...err, [e.target.name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      login(data.data.token, data.data.user);
      toast.success('Login successful!');
      if (data.data.user.role === 'admin') {
        navigate('/admin');
      } else {
        // Check if user needs to setup withdrawal
        if (!data.data.user.has_setup_withdrawal) {
          navigate('/withdrawal-setup');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async e => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Email is required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      setForgotError('Please enter a valid email address');
      return;
    }
    
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!data.success) {
        // Check if it's a 404 error (email not found)
        if (res.status === 404) {
          setForgotError('No account found with this email address. Please check your email or create a new account.');
        } else {
          throw new Error(data.message);
        }
        return;
      }
      toast.success('Password reset request submitted! You will receive your password via email.');
      setShowForgotPassword(false);
      setForgotEmail('');
    } catch (err) {
      setForgotError(err.message || 'Failed to submit request');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-2xl p-8 border border-white/30 flex flex-col gap-4 backdrop-blur-sm">
        {/* Logo */}
        <div className="mb-4 text-center">
          <span className="text-5xl font-extrabold bg-gradient-to-r from-primary-600 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">Capital Rise</span>
        </div>
        {/* Welcome message */}
        <div className="mb-2 text-center">
          <span className="text-lg text-gray-700 font-medium">Welcome! Please sign in to continue</span>
        </div>
        
        {!showForgotPassword ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              autoComplete="email"
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            <Button type="submit" loading={loading} className="w-full mt-2 bg-gradient-to-r from-primary-600 to-pink-500 hover:from-primary-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md">
              Login
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-primary-600 hover:underline text-sm font-medium"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Forgot Password</h3>
              <p className="text-sm text-gray-600 mt-1">Enter your email address to receive your password</p>
            </div>
            <Input
              label="Email"
              name="forgotEmail"
              type="email"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              error={forgotError}
              autoComplete="email"
              placeholder="yourname@example.com"
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            {forgotError && forgotError.includes('No account found') && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
                <a 
                  href="/register" 
                  className="text-primary-600 hover:text-primary-700 underline text-sm font-medium"
                >
                  Create a new account
                </a>
              </div>
            )}
            <Button type="submit" loading={forgotLoading} className="w-full mt-2 bg-gradient-to-r from-primary-600 to-pink-500 hover:from-primary-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md">
              Submit Request
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail('');
                  setForgotError('');
                }}
                className="text-gray-600 hover:underline text-sm font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center mt-4 text-sm">
          Don&apos;t have an account? <a href="/register" className="text-primary-600 hover:underline font-semibold">Register</a>
        </div>
      </div>
    </div>
  );
}
