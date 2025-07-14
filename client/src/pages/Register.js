import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', mobile: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (auth.loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const handleChange = e => {
    if (e && e.target && e.target.name) {
      setForm(f => ({ ...f, [e.target.name]: e.target.value }));
      setErrors(err => ({ ...err, [e.target.name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.username) errs.username = 'Username is required';
    
    // Email validation
    if (!form.email) errs.email = 'Email is required';
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        errs.email = 'Please enter a valid email address';
      }
    }
    
    // Mobile validation
    if (!form.mobile) errs.mobile = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(form.mobile)) {
      errs.mobile = 'Mobile number must be exactly 10 digits';
    }
    
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Registration successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
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
          <span className="text-lg text-gray-700 font-medium">Create your account</span>
          <p className="text-sm text-gray-600 mt-1">Enter your details to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            autoComplete="username"
            className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            placeholder="yourname@example.com"
            className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <Input
            label="Mobile Number"
            name="mobile"
            type="tel"
            value={form.mobile}
            onChange={handleChange}
            error={errors.mobile}
            autoComplete="tel"
            placeholder="Enter 10 digit mobile number"
            maxLength="10"
            pattern="[0-9]*"
            inputMode="numeric"
            className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="new-password"
            className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          
          <Button 
            type="submit" 
            loading={loading} 
            className="w-full mt-2 bg-gradient-to-r from-primary-600 to-pink-500 hover:from-primary-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Create Account
          </Button>
        </form>

        <div className="text-center mt-4 text-sm">
          Already have an account? <a href="/login" className="text-primary-600 hover:underline font-semibold">Login</a>
        </div>
      </div>
    </div>
  );
} 