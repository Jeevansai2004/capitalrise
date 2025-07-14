import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';

export default function ReferralLanding() {
  const { code } = useParams();
  const [details, setDetails] = useState(null);
  const [upi, setUpi] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDetails();
    fetchStats();
    // eslint-disable-next-line
  }, [code]);

  const fetchDetails = async () => {
    const res = await fetch(`/api/referral/${code}`);
    const data = await res.json();
    if (data.success) setDetails(data.data);
    else setError(data.message);
  };
  const fetchStats = async () => {
    const res = await fetch(`/api/referral/stats/${code}`);
    const data = await res.json();
    if (data.success) setStats(data.data);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!customerName.trim()) {
      setError('Name is required');
      return;
    }
    if (!customerMobile.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (!upi.trim()) {
      setError('UPI ID is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/referral/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          referral_code: code, 
          upi_id: upi,
          customer_name: customerName.trim(),
          customer_mobile: customerMobile.trim()
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast.success('UPI submitted successfully! Redirecting to investment opportunity...');
      
      // Redirect immediately to the investment URL
      if (data.data.redirect_url) {
        setTimeout(() => {
          window.location.href = data.data.redirect_url;
        }, 1500); // Small delay to show success message
      }
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (error) return <div className="flex flex-col items-center justify-center min-h-screen text-danger-600">{error}</div>;
  if (!details) return <div className="flex flex-col items-center justify-center min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-2">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-2 text-center">{details.loot_title}</h1>
        <div className="text-gray-600 text-center mb-4">by {details.client_name}</div>
        <div className="mb-6 text-center text-primary-700 font-semibold">Earn up to ₹{details.max_amount}!</div>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-sm text-gray-600 mb-4 text-center">
              * All fields are required
            </div>
            <Input
              label="Your Name *"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="Enter your name"
            />
            <Input
              label="Your Mobile *"
              value={customerMobile}
              onChange={e => setCustomerMobile(e.target.value)}
              placeholder="Enter your mobile number"
            />
            <Input
              label="Your UPI ID *"
              value={upi}
              onChange={e => setUpi(e.target.value)}
              error={error}
              autoFocus
              placeholder="Enter your UPI ID"
            />
            <Button type="submit" loading={loading} className="w-full">Submit &amp; Continue</Button>
          </form>
        ) : (
          <div className="text-success-700 text-center font-semibold">
            <div className="mb-2">Thank you for your submission!</div>
            <div className="text-sm text-gray-600">Your UPI ID has been submitted successfully.</div>
            <div className="text-sm text-gray-600 mt-2">Redirecting you to the investment opportunity...</div>
          </div>
        )}
        {stats && (
          <div className="mt-8 text-xs text-gray-500 text-center">
            <div>Total Referrals: {stats.total_referrals}</div>
            <div>Total Amount: ₹{stats.total_amount}</div>
          </div>
        )}
      </div>
    </div>
  );
} 