import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LootCard from '../components/LootCard';
import BalanceCard from '../components/BalanceCard';
import ReferralCard from '../components/ReferralCard';
import Input from '../components/Input';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import ChatBox from '../components/ChatBox';
import moment from 'moment-timezone';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();
  const token = localStorage.getItem('token');
  const [loots, setLoots] = useState([]);
  const [balance, setBalance] = useState({ balance: 0, total_earned: 0 });
  const [investments, setInvestments] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [customOffers, setCustomOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentReferral, setCurrentReferral] = useState(null);
  
  // Modal states
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedLoot, setSelectedLoot] = useState(null);
  const [customerAmount, setCustomerAmount] = useState('');
  const [earnAmount, setEarnAmount] = useState('');
  const [investError, setInvestError] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  
  // Profile states
  const [changeUpiId, setChangeUpiId] = useState(false);
  const [changeWithdrawalPassword, setChangeWithdrawalPassword] = useState(false);
  const [upiForm, setUpiForm] = useState({ account_password: '', new_upi_id: '' });
  const [withdrawalForm, setWithdrawalForm] = useState({ current_withdrawal_password: '', new_withdrawal_password: '' });
  const [upiErrors, setUpiErrors] = useState({});
  const [withdrawalErrors, setWithdrawalErrors] = useState({});

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'my-offers', label: 'My Offers' },
    { key: 'withdrawals', label: 'Withdrawal History' },
    { key: 'referrals', label: 'Referral History' },
    { key: 'profile', label: 'Profile' }
  ];

  useEffect(() => {
    fetchLoots();
    fetchBalance();
    fetchInvestments();
    fetchReferrals();
    fetchWithdrawals();
    fetchCustomOffers();
  }, []);

  useEffect(() => {
    if (activeTab === 'my-offers') {
      fetchCustomOffers();
    }
  }, [activeTab]);

  const fetchLoots = async () => {
    if (!token) return;
    const res = await fetch('/api/client/loots', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      console.log('Loots fetched:', data.data);
      setLoots(data.data);
    } else {
      console.error('Failed to fetch loots:', data.message);
    }
  };
  const fetchBalance = async () => {
    if (!token) return;
    const res = await fetch('/api/client/balance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setBalance(data.data);
  };
  const fetchInvestments = async () => {
    if (!token) return;
    const res = await fetch('/api/client/investments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      console.log('Investments fetched:', data.data);
      setInvestments(data.data);
    } else {
      console.error('Failed to fetch investments:', data.message);
    }
  };
  const fetchReferrals = async () => {
    if (!token) return;
    const res = await fetch('/api/client/referrals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setReferrals(data.data);
  };

  const fetchCustomOffers = async () => {
    if (!token) return;
    const res = await fetch('/api/client/investments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      setCustomOffers(data.data);
    } else {
      console.error('Failed to fetch custom offers:', data.message);
    }
  };

  const fetchWithdrawals = async () => {
    if (!token) return;
    const res = await fetch('/api/client/withdrawals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setWithdrawals(data.data);
  };

  const handleInvest = (loot) => {
    setSelectedLoot(loot);
    setCustomerAmount('');
    setEarnAmount('');
    setInvestError('');
    setShowInvestModal(true);
  };

  const submitInvest = async (e) => {
    e.preventDefault();
    setInvestError('');
    
    // Validation
    if (!customerAmount || isNaN(customerAmount) || Number(customerAmount) <= 0) {
      setInvestError('Enter a valid customer amount');
      return;
    }
    
    if (!earnAmount || isNaN(earnAmount) || Number(earnAmount) <= 0) {
      setInvestError('Enter a valid earn amount');
      return;
    }
    
    const totalAmount = Number(customerAmount) + Number(earnAmount);
    
    if (totalAmount > selectedLoot.max_amount) {
      setInvestError(`Total amount (₹${totalAmount}) cannot exceed ₹${selectedLoot.max_amount}`);
      return;
    }
    
    if (Number(earnAmount) >= Number(customerAmount)) {
      setInvestError('Earn amount should be less than customer amount');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/client/invest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          loot_id: selectedLoot.id,
          customer_amount: Number(customerAmount),
          earn_amount: Number(earnAmount),
          total_amount: totalAmount
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast.success('Investment created successfully!');
      setShowInvestModal(false);
      fetchBalance();
      fetchInvestments();
      fetchCustomOffers();
      
      // Generate referral URL
      const referralUrl = `${window.location.origin}/referral/${data.data.referralCode}`;
      
      // Show referral link
      setCurrentReferral({
        referralUrl,
        lootTitle: selectedLoot.title,
        investmentAmount: totalAmount
      });
      
    } catch (err) {
      console.error('Investment error:', err);
      setInvestError(err.message || 'Investment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    setWithdrawAmount('');
    setWithdrawPassword('');
    setWithdrawError('');
    setShowWithdrawModal(true);
  };

  // Profile functions
  const handleWithdrawalPasswordChange = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!withdrawalForm.current_withdrawal_password) errs.current_withdrawal_password = 'Current password is required';
    if (!withdrawalForm.new_withdrawal_password) errs.new_withdrawal_password = 'New password is required';
    else if (withdrawalForm.new_withdrawal_password.length < 4) errs.new_withdrawal_password = 'New password must be at least 4 characters';

    if (Object.keys(errs).length) {
      setWithdrawalErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-withdrawal-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(withdrawalForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Withdrawal password changed successfully!');
      setChangeWithdrawalPassword(false);
      setWithdrawalForm({ current_withdrawal_password: '', new_withdrawal_password: '' });
      setWithdrawalErrors({});
    } catch (err) {
      toast.error(err.message || 'Failed to change withdrawal password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiIdChange = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!upiForm.account_password) errs.account_password = 'Account password is required';
    if (!upiForm.new_upi_id) errs.new_upi_id = 'New UPI ID is required';
    else if (upiForm.new_upi_id.length < 3) errs.new_upi_id = 'UPI ID must be at least 3 characters';
    
    if (Object.keys(errs).length) {
      setUpiErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-upi', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(upiForm),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('UPI ID changed successfully!');
      setChangeUpiId(false);
      setUpiForm({ account_password: '', new_upi_id: '' });
      setUpiErrors({});
      // Update user data in auth context
      auth.updateUser({ upi_id: upiForm.new_upi_id });
    } catch (err) {
      toast.error(err.message || 'Failed to change UPI ID');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotWithdrawalPassword = async () => {
    if (!auth.user?.email) {
      toast.error('Email not found. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-withdrawal-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: auth.user.email })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast.success('Withdrawal password reset request sent to admin. You will receive your new password soon.');
    } catch (error) {
      toast.error(error.message || 'Failed to send withdrawal password reset request');
    } finally {
      setLoading(false);
    }
  };

  const submitWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
      setWithdrawError('Enter a valid amount');
      return;
    }
    
    if (Number(withdrawAmount) > balance.balance) {
      setWithdrawError('Cannot withdraw more than balance');
      return;
    }
    
    if (!withdrawPassword || withdrawPassword.trim() === '') {
      setWithdrawError('Withdrawal password is required');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/client/withdraw', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          amount: withdrawAmount, 
          withdrawal_password: withdrawPassword.trim() 
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Withdrawal request submitted!');
      setShowWithdrawModal(false);
      fetchBalance();
      fetchWithdrawals();
    } catch (err) {
      setWithdrawError(err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto py-8 px-2">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b overflow-x-auto whitespace-nowrap scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 flex-shrink-0 ${activeTab === tab.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-primary-600'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <>
            <BalanceCard balance={balance.balance} totalEarned={balance.total_earned} onWithdraw={handleWithdraw} />
            {loots && loots.length > 0 ? (
              loots.map(loot => loot && loot.is_active && (
                <LootCard key={loot.id} loot={loot} onInvest={handleInvest} />
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No active offers available at the moment.
              </div>
            )}
            {currentReferral && (
              <ReferralCard 
                referralUrl={currentReferral.referralUrl}
                lootTitle={currentReferral.lootTitle}
                investmentAmount={currentReferral.investmentAmount}
              />
            )}
          </>
        )}
        {activeTab === 'withdrawals' && (
          <div className="grid gap-4">
            {withdrawals.length > 0 ? (
              withdrawals.map(withdrawal => (
                <div key={withdrawal.id} className="bg-white p-4 rounded-lg shadow-md">
                  <p><strong>Amount:</strong> ₹{withdrawal.amount}</p>
                  <p><strong>Status:</strong> {withdrawal.status}</p>
                  <p><strong>Date:</strong> {moment.utc(withdrawal.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm')}</p>
                  {withdrawal.status === 'completed' && (
                    <p><strong>Completed at:</strong> {moment.utc(withdrawal.completed_at).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm')}</p>
                  )}
                  {withdrawal.status === 'failed' && (
                    <p><strong>Failed at:</strong> {moment.utc(withdrawal.failed_at).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm')}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No withdrawals yet.
              </div>
            )}
          </div>
        )}
        {activeTab === 'referrals' && (
          <div className="grid gap-4">
            {referrals.length > 0 ? (
              referrals.map(referral => (
                <div key={referral.id} className="bg-white p-4 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{referral.loot_title}</h3>
                      <p className="text-sm text-gray-600">Referral Code: {referral.referral_code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      referral.status === 'completed' ? 'bg-green-100 text-green-800' :
                      referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {referral.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Amount: ₹{referral.amount}</p>
                    <p>Earn Amount: ₹{referral.earn_amount}</p>
                    <p>Date: {moment.utc(referral.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm')}</p>
                    {referral.status === 'rejected' && referral.rejection_reason && (
                      <p className="text-red-600 font-semibold mt-1">Reason: {referral.rejection_reason}</p>
                    )}
                  </div>
                  {referral.status === 'pending' && (
                    <div className="mt-2 text-xs text-gray-500">
                      Waiting for admin approval
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                No referrals yet. Create an investment to generate referral links!
              </div>
            )}
          </div>
        )}
        {activeTab === 'my-offers' && (
          <div className="grid gap-4">
            {customOffers.length > 0 ? (
              customOffers.map(offer => (
                <div key={offer.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{offer.loot_title}</h3>
                      <p className="text-sm text-gray-600">Created: {moment.utc(offer.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm')}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Active
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Customer Amount</p>
                      <p className="text-lg font-semibold text-green-600">₹{offer.customer_amount}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Your Earnings</p>
                      <p className="text-lg font-semibold text-blue-600">₹{offer.earn_amount}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-lg font-semibold">₹{offer.amount}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-gray-700">Referral Link:</label>
                      <span className="text-xs text-gray-500">Click to copy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/referral/${offer.referral_code}`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                        onFocus={(e) => e.target.select()}
                      />
                      <button
                        onClick={() => {
                          const textToCopy = `${window.location.origin}/referral/${offer.referral_code}`;
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(textToCopy)
                              .then(() => toast.success('Referral link copied!'))
                              .catch(() => toast.error('Failed to copy!'));
                          } else {
                            // Fallback for unsupported browsers
                            const tempInput = document.createElement('input');
                            tempInput.value = textToCopy;
                            document.body.appendChild(tempInput);
                            tempInput.select();
                            try {
                              document.execCommand('copy');
                              toast.success('Referral link copied!');
                            } catch (err) {
                              toast.error('Failed to copy!');
                            }
                            document.body.removeChild(tempInput);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No Custom Offers Yet</h3>
                <p className="text-sm">Create your first custom offer from the Dashboard to see it here!</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="w-full max-w-md mx-auto px-2 overflow-x-hidden space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
              {/* User Information */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border text-gray-900 w-full">
                      {auth.user?.username || 'Not set'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="bg-gray-50 px-3 py-2 rounded border text-gray-900 w-full">
                      {auth.user?.email || 'Not set'}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <div className="bg-gray-50 px-3 py-2 rounded border text-gray-900 w-full">
                    {auth.user?.mobile || 'Not set'}
                  </div>
                </div>
              </div>
              {/* UPI ID Section */}
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold mb-3">UPI Settings</h4>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current UPI ID</label>
                      <div className="bg-gray-50 px-3 py-2 rounded border text-gray-900 w-full">
                        {auth.user?.upi_id || 'Not set'}
                      </div>
                    </div>
                    {auth.user?.upi_id ? (
                      <Button onClick={() => setChangeUpiId(true)} className="mt-2 sm:mt-0 sm:ml-4 w-full sm:w-auto">
                        Update UPI ID
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 sm:ml-4 w-full">
                        <Input
                          type="text"
                          placeholder="Enter UPI ID"
                          value={upiForm.new_upi_id}
                          onChange={(e) => setUpiForm({ ...upiForm, new_upi_id: e.target.value })}
                          className="flex-1 w-full"
                        />
                        <Button onClick={handleUpiIdChange} disabled={!upiForm.new_upi_id.trim()} className="w-full sm:w-auto">
                          Set UPI ID
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Withdrawal Password Section */}
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold mb-3">Withdrawal Password</h4>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="bg-gray-50 px-3 py-2 rounded border text-gray-900 w-full">
                        **********
                      </div>
                    </div>
                    {/* Remove Change Withdrawal Password button, keep only forgot link */}
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to request a withdrawal password reset? This will notify the admin.')) {
                        handleForgotWithdrawalPassword();
                      }
                    }}
                  >
                    Forgot withdrawal password?
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Chat with Admin */}
      <div className="mt-12">
        <ChatBox />
      </div>

      {/* Investment Modal */}
      {showInvestModal && selectedLoot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Custom Investment</h3>
            <form onSubmit={submitInvest}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Amount (₹)</label>
                  <input
                    type="number"
                    value={customerAmount}
                    onChange={(e) => setCustomerAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter customer amount"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Earn Amount (₹)</label>
                  <input
                    type="number"
                    value={earnAmount}
                    onChange={(e) => setEarnAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter your earn amount"
                    min="1"
                    required
                  />
                </div>
                {investError && (
                  <div className="text-red-600 text-sm">{investError}</div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    loading={loading}
                    className="flex-1"
                  >
                    Create Investment
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowInvestModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
            <form onSubmit={submitWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  max={balance.balance}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Password</label>
                <Input
                  type="password"
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="Enter withdrawal password"
                  required
                />
              </div>
              {withdrawError && (
                <div className="text-red-600 text-sm">{withdrawError}</div>
              )}
              <div className="flex gap-2">
                <Button type="submit" loading={loading} className="flex-1">
                  Withdraw
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowWithdrawModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPI ID Update Modal */}
      {changeUpiId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Update UPI ID</h2>
            <form onSubmit={handleUpiIdChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Password</label>
                <Input
                  type="password"
                  value={upiForm.account_password}
                  onChange={(e) => setUpiForm({ ...upiForm, account_password: e.target.value })}
                  placeholder="Enter your account password"
                  required
                />
                {upiErrors.account_password && (
                  <div className="text-red-600 text-sm mt-1">{upiErrors.account_password}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New UPI ID</label>
                <Input
                  type="text"
                  value={upiForm.new_upi_id}
                  onChange={(e) => setUpiForm({ ...upiForm, new_upi_id: e.target.value })}
                  placeholder="Enter new UPI ID"
                  required
                />
                {upiErrors.new_upi_id && (
                  <div className="text-red-600 text-sm mt-1">{upiErrors.new_upi_id}</div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={loading} className="flex-1">
                  Update UPI ID
                </Button>
                <Button type="button" variant="secondary" onClick={() => setChangeUpiId(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}