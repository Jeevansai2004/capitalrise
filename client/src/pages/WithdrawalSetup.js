import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function WithdrawalSetup() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ withdrawal_password: '', upi_id: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.user) {
      navigate('/login');
      return;
    }
    
    // If user has already setup withdrawal, redirect to dashboard
    if (auth.user.has_setup_withdrawal) {
      navigate('/dashboard');
    }
  }, [auth.user, navigate]);

  const handleChange = e => {
    if (e && e.target && e.target.name) {
      setForm(f => ({ ...f, [e.target.name]: e.target.value }));
      setErrors(err => ({ ...err, [e.target.name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.withdrawal_password) errs.withdrawal_password = 'Withdrawal password is required';
    else if (form.withdrawal_password.length < 4) errs.withdrawal_password = 'Withdrawal password must be at least 4 characters';
    if (!form.upi_id) errs.upi_id = 'UPI ID is required';
    else if (form.upi_id.length < 3) errs.upi_id = 'UPI ID must be at least 3 characters';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/setup-withdrawal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Withdrawal setup completed successfully!');
      // Update user data in auth context
      auth.updateUser({ 
        has_setup_withdrawal: true, 
        upi_id: form.upi_id 
      });
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-2xl p-8 border border-white/30 flex flex-col gap-4 backdrop-blur-sm">
        <div className="mb-4 text-center">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-pink-500 bg-clip-text text-transparent">Setup Withdrawal</span>
        </div>
        <div className="mb-2 text-center">
          <span className="text-lg text-gray-700 font-medium">Set your withdrawal password and UPI ID</span>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Withdrawal Password"
            name="withdrawal_password"
            type="password"
            value={form.withdrawal_password}
            onChange={handleChange}
            error={errors.withdrawal_password}
            autoComplete="new-password"
            placeholder="Enter withdrawal password (min 4 characters)"
            className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <Input
            label="UPI ID"
            name="upi_id"
            type="text"
            value={form.upi_id}
            onChange={handleChange}
            error={errors.upi_id}
            autoComplete="off"
            placeholder="Enter your UPI ID"
            className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <Button type="submit" loading={loading} className="w-full mt-2 bg-gradient-to-r from-primary-600 to-pink-500 hover:from-primary-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md">
            Complete Setup
          </Button>
        </form>
      </div>
    </div>
  );
} 