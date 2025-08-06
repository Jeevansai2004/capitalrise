import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import LootForm from '../components/LootForm';
import toast from 'react-hot-toast';
import AdminChatBox from '../components/AdminChatBox';
import { useAuth } from '../context/AuthContext';
import moment from 'moment-timezone';

const TABS = [
  { key: 'loots', label: 'Loots' },
  { key: 'clients', label: 'Clients' },
  { key: 'customers', label: 'Customers' },
  { key: 'pending-referrals', label: 'Pending Referrals' },
  { key: 'restricted', label: 'Restricted Accounts' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'withdrawals', label: 'Withdrawals' },
  { key: 'issues', label: 'Issues' },
  { key: 'withdrawal-password-requests', label: 'Withdrawal Password Requests' },
  { key: 'credentials', label: 'Credentials' },
  { key: 'chat', label: 'Chat' },
];

export default function AdminDashboard() {
  const { token } = useAuth();
  const [tab, setTab] = useState('loots');
  const [loots, setLoots] = useState([]);
  const [clients, setClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetails, setClientDetails] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [issues, setIssues] = useState([]);
  const [showLootModal, setShowLootModal] = useState(false);
  const [editingLoot, setEditingLoot] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [allCredentials, setAllCredentials] = useState([]);
  const [credentialsError, setCredentialsError] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUserForBlock, setSelectedUserForBlock] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [clientsSummary, setClientsSummary] = useState([]);
  const [selectedClientCustomers, setSelectedClientCustomers] = useState([]);
  const [selectedClientForCustomers, setSelectedClientForCustomers] = useState(null);
  const [showCustomersModal, setShowCustomersModal] = useState(false);
  const [pendingReferrals, setPendingReferrals] = useState([]);
  const [withdrawalPasswordRequests, setWithdrawalPasswordRequests] = useState([]);
  const [showWithdrawalPasswordModal, setShowWithdrawalPasswordModal] = useState(false);
  const [selectedWithdrawalRequest, setSelectedWithdrawalRequest] = useState(null);
  const [newWithdrawalPassword, setNewWithdrawalPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'loots') fetchLoots();
    if (tab === 'clients') fetchClients();
    if (tab === 'customers') fetchClientsSummary();
    if (tab === 'pending-referrals') fetchPendingReferrals();
    if (tab === 'restricted') {
      fetchBlockedUsers();
      fetchDeletedUsers();
    }
    if (tab === 'analytics') fetchAnalytics();
    if (tab === 'withdrawals') fetchWithdrawals();
    if (tab === 'issues') fetchIssues();
    if (tab === 'withdrawal-password-requests') fetchWithdrawalPasswordRequests();
    if (tab === 'credentials') {
      setShowCredentials(false);
      setAdminPassword('');
      setCredentialsError('');
    }
  }, [tab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLoots = async () => {
    try {
      const res = await fetch('/api/admin/loots', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) setLoots(data.data);
    } catch (error) {
      console.error('Error fetching loots:', error);
    }
  };

  const fetchClients = async () => {
    const res = await fetch('/api/admin/clients', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setClients(data.data);
  };

  const fetchAnalytics = async () => {
    const res = await fetch('/api/admin/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setAnalytics(data.data);
  };

  const fetchWithdrawals = async () => {
    const res = await fetch('/api/admin/withdrawals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setWithdrawals(data.data);
  };

  const fetchIssues = async () => {
    const res = await fetch('/api/admin/issues', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setIssues(data.data);
  };

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/admin/blocked-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) setBlockedUsers(data.data);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const fetchDeletedUsers = async () => {
    try {
      const res = await fetch('/api/admin/deleted-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) setDeletedUsers(data.data);
    } catch (error) {
      console.error('Error fetching deleted users:', error);
    }
  };

  const fetchClientsSummary = async () => {
    try {
      const res = await fetch('/api/admin/clients-customers-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) setClientsSummary(data.data);
    } catch (error) {
      console.error('Error fetching clients summary:', error);
    }
  };

  const fetchClientCustomers = async (clientId) => {
    try {
      const res = await fetch(`/api/admin/client-customers?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) setSelectedClientCustomers(data.data);
    } catch (error) {
      console.error('Error fetching client customers:', error);
    }
  };

  const fetchPendingReferrals = async () => {
    try {
      const res = await fetch('/api/admin/pending-referrals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) setPendingReferrals(data.data);
    } catch (error) {
      console.error('Error fetching pending referrals:', error);
    }
  };

  const fetchWithdrawalPasswordRequests = async () => {
    try {
      const res = await fetch('/api/admin/withdrawal-password-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) setWithdrawalPasswordRequests(data.data);
    } catch (error) {
      console.error('Error fetching withdrawal password requests:', error);
    }
  };

  const handleApproveReferral = async (referralId) => {
    try {
      const res = await fetch(`/api/admin/approve-referral/${referralId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Referral approved! Client account has been credited.');
      fetchPendingReferrals();
    } catch (err) {
      toast.error(err.message || 'Approval failed');
    }
  };

  const handleRejectReferral = async (referralId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      const res = await fetch(`/api/admin/reject-referral/${referralId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Referral rejected successfully!');
      fetchPendingReferrals();
    } catch (err) {
      toast.error(err.message || 'Rejection failed');
    }
  };

  const handleViewClient = async client => {
    setSelectedClient(client);
    setShowClientModal(true);
    const res = await fetch(`/api/admin/clients/${client.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) setClientDetails(data.data);
  };

  const handleWithdrawalAction = async (id, status) => {
    let notes = '';
    let reference_number = '';
    
    if (status === 'rejected') {
      notes = prompt('Enter rejection reason:');
      if (notes === null) return; // User cancelled
    } else if (status === 'approved') {
      reference_number = prompt('Enter reference number (numbers only):');
      if (reference_number === null) return; // User cancelled
      if (!reference_number || !/^\d+$/.test(reference_number)) {
        toast.error('Reference number is required and must contain only numbers');
        return;
      }
    }
    
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status, notes, reference_number }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`Withdrawal ${status}`);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleCreateLoot = () => {
    setEditingLoot(null);
    setShowLootModal(true);
  };

  const handleEditLoot = (loot) => {
    setEditingLoot(loot);
    setShowLootModal(true);
  };

  const handleLootSuccess = () => {
    setShowLootModal(false);
    setEditingLoot(null);
    fetchLoots();
  };

  const handleDeleteLoot = async (id) => {
    if (!window.confirm('Are you sure you want to delete this loot?')) return;
    try {
      const res = await fetch(`/api/admin/loots/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Loot deleted successfully!');
      fetchLoots();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleIssueAction = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/issues/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success('Issue status updated successfully!');
      fetchIssues();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleCredentialsAccess = async () => {
    if (adminPassword !== 'admin123') {
      setCredentialsError('Invalid admin password');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      setAllCredentials(data.data);
      setShowCredentials(true);
      setCredentialsError('');
      toast.success('Credentials accessed successfully');
    } catch (err) {
      setCredentialsError(err.message || 'Failed to fetch credentials');
      toast.error(err.message || 'Failed to fetch credentials');
    }
  };

  const handleBlockUser = async (userId, reason) => {
    try {
      const res = await fetch(`/api/admin/block-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      fetchClients();
      if (tab === 'restricted') {
        fetchBlockedUsers();
      }
      setShowBlockModal(false);
      setSelectedUserForBlock(null);
      setBlockReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const res = await fetch(`/api/admin/unblock-user/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(data.message);
      fetchClients();
      if (tab === 'restricted') {
        fetchBlockedUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to unblock user');
    }
  };

  const openBlockModal = (user) => {
    setSelectedUserForBlock(user);
    setBlockReason('');
    setShowBlockModal(true);
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE user "${username}" and all their data? This action cannot be undone.`)) {
      return;
    }
    
    // Double confirmation for safety
    if (!window.confirm(`FINAL WARNING: This will permanently delete user "${username}" and ALL their data including investments, referrals, withdrawals, and balance. This action is irreversible. Are you absolutely sure?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success(`User "${username}" has been deleted and all data cleared`);
      fetchClients(); // Refresh the clients list
      if (tab === 'restricted') {
        fetchDeletedUsers(); // Refresh the deleted users list
      }
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleViewClientCustomers = async (client) => {
    setSelectedClientForCustomers(client);
    setShowCustomersModal(true);
    await fetchClientCustomers(client.id);
  };

  const handleUpdateWithdrawalPassword = async () => {
    if (!newWithdrawalPassword || newWithdrawalPassword.length < 4) {
      toast.error('Password must be at least 4 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/update-withdrawal-password/${selectedWithdrawalRequest.user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ new_withdrawal_password: newWithdrawalPassword })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast.success('Withdrawal password updated successfully');
      setShowWithdrawalPasswordModal(false);
      setSelectedWithdrawalRequest(null);
      setNewWithdrawalPassword('');
      fetchWithdrawalPasswordRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to update withdrawal password');
    } finally {
      setLoading(false);
    }
  };

  const openWithdrawalPasswordModal = (request) => {
    setSelectedWithdrawalRequest(request);
    setNewWithdrawalPassword('');
    setShowWithdrawalPasswordModal(true);
  };

  // Removed all leaderboard functions

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto py-8 px-2">
        <div className="flex gap-2 mb-6 border-b">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${tab === t.key ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-primary-600'}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div>
          {tab === 'loots' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Loots</h2>
                <Button variant="primary" onClick={handleCreateLoot}>Create New Loot</Button>
              </div>
              {loots.length === 0 ? (
                <div className="text-gray-500">No loots available.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded shadow">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Title</th>
                        <th className="px-4 py-2">Description</th>
                        <th className="px-4 py-2">Max Amount</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Created</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loots.map(loot => (
                        <tr key={loot.id} className="border-t">
                          <td className="px-4 py-2">{loot.title}</td>
                          <td className="px-4 py-2">{loot.description}</td>
                          <td className="px-4 py-2">₹{loot.max_amount}</td>
                          <td className="px-4 py-2">
                            <span className={`badge ${loot.is_active ? 'badge-success' : 'badge-warning'}`}>
                              {loot.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-2">{moment.utc(loot.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                          <td className="px-4 py-2 flex gap-2">
                            <Button variant="primary" size="sm" onClick={() => handleEditLoot(loot)}>Edit</Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteLoot(loot.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {tab === 'clients' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Clients</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Username</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Balance</th>
                      <th className="px-4 py-2">Total Earned</th>
                      <th className="px-4 py-2">Offers</th>
                      <th className="px-4 py-2">Referrals</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id} className={`border-t ${client.is_blocked ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-2">{client.username}</td>
                        <td className="px-4 py-2">{client.email}</td>
                        <td className="px-4 py-2">
                          <span className={`badge ${client.is_blocked ? 'badge-danger' : 'badge-success'}`}>
                            {client.is_blocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-2">₹{client.balance}</td>
                        <td className="px-4 py-2">₹{client.total_earned}</td>
                        <td className="px-4 py-2">{client.total_investments}</td>
                        <td className="px-4 py-2">{client.total_referrals}</td>
                        <td className="px-4 py-2 flex gap-2">
                          <Button variant="primary" onClick={() => handleViewClient(client)} size="sm">View</Button>
                          <Button variant="info" onClick={() => handleViewClientCustomers(client)} size="sm">Customers</Button>
                          {client.is_blocked ? (
                            <Button variant="success" onClick={() => handleUnblockUser(client.id)} size="sm">Unblock</Button>
                          ) : (
                            <Button variant="danger" onClick={() => openBlockModal(client)} size="sm">Block</Button>
                          )}
                          <Button 
                            variant="danger" 
                            onClick={() => handleDeleteUser(client.id, client.username)} 
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showClientModal && clientDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded shadow w-full max-w-2xl overflow-y-auto max-h-[90vh]">
                    <h2 className="text-lg font-bold mb-2">Client: {selectedClient.username}</h2>
                    <div className="mb-2 text-sm text-gray-600">Email: {selectedClient.email}</div>
                    <div className="mb-2 text-sm text-gray-600">UPI ID: {clientDetails.client.upi_id || 'Not set'}</div>
                    <div className="mb-2 text-sm text-gray-600">Balance: ₹{clientDetails.client.balance}</div>
                    <div className="mb-2 text-sm text-gray-600">Total Earned: ₹{clientDetails.client.total_earned}</div>
                    <button
                      className="bg-primary-600 text-white px-3 py-1 rounded mb-4"
                      onClick={async () => {
                        const amount = prompt('Enter amount to credit to this client:');
                        if (!amount || isNaN(amount) || Number(amount) <= 0) return;
                        try {
                          const res = await fetch('/api/admin/credit', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ user_id: selectedClient.id, amount: Number(amount) })
                          });
                          const data = await res.json();
                          if (!data.success) throw new Error(data.message);
                          toast.success('Balance credited!');
                          setClientDetails(prev => ({
                            ...prev,
                            client: {
                              ...prev.client,
                              balance: data.data.balance
                            }
                          }));
                          fetchClients();
                        } catch (err) {
                          toast.error(err.message || 'Credit failed');
                        }
                      }}
                    >
                      Credit Balance
                    </button>
                    <h3 className="font-semibold mt-4 mb-1">Custom Offers</h3>
                    <div className="overflow-x-auto mb-2">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr>
                            <th className="px-2 py-1">Loot</th>
                            <th className="px-2 py-1">Customer Pays</th>
                            <th className="px-2 py-1">Client Earns</th>
                            <th className="px-2 py-1">Total</th>
                            <th className="px-2 py-1">Referrals</th>
                            <th className="px-2 py-1">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientDetails.investments.map(inv => (
                            <tr key={inv.id} className="border-t">
                              <td className="px-2 py-1">{inv.loot_title}</td>
                              <td className="px-2 py-1">₹{inv.customer_amount || inv.amount}</td>
                              <td className="px-2 py-1">₹{inv.earn_amount || 0}</td>
                              <td className="px-2 py-1">₹{inv.total_amount || inv.amount}</td>
                              <td className="px-2 py-1">{inv.referral_count || 0}</td>
                              <td className="px-2 py-1">{moment.utc(inv.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <h3 className="font-semibold mt-4 mb-1">Withdrawals</h3>
                    <div className="overflow-x-auto mb-2">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr>
                            <th className="px-2 py-1">Amount</th>
                            <th className="px-2 py-1">UPI</th>
                            <th className="px-2 py-1">Status</th>
                            <th className="px-2 py-1">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientDetails.withdrawals.map(wd => (
                            <tr key={wd.id} className="border-t">
                              <td className="px-2 py-1">₹{wd.amount}</td>
                              <td className="px-2 py-1">{wd.upi_id || '-'}</td>
                              <td className="px-2 py-1">{wd.status}</td>
                              <td className="px-2 py-1">{moment.utc(wd.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button className="flex-1" variant="secondary" onClick={() => setShowClientModal(false)}>Close</Button>
                      <Button 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white" 
                        onClick={() => {
                          setShowClientModal(false);
                          handleDeleteUser(selectedClient.id, selectedClient.username);
                        }}
                      >
                        Delete User
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'customers' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Client Customers</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Client Name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Total Loots</th>
                      <th className="px-4 py-2">Total Customers</th>
                      <th className="px-4 py-2">Total Amount</th>
                      <th className="px-4 py-2">Last Customer</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientsSummary.map(client => (
                      <tr key={client.id} className="border-t">
                        <td className="px-4 py-2">{client.username}</td>
                        <td className="px-4 py-2">{client.email}</td>
                        <td className="px-4 py-2">{client.total_loots || 0}</td>
                        <td className="px-4 py-2">{client.total_customers || 0}</td>
                        <td className="px-4 py-2">₹{client.total_amount || 0}</td>
                        <td className="px-4 py-2">
                          {client.last_customer_date ? 
                            moment.utc(client.last_customer_date).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A') : 
                            'No customers yet'
                          }
                        </td>
                        <td className="px-4 py-2">
                          <Button 
                            variant="primary" 
                            onClick={() => handleViewClientCustomers(client)} 
                            size="sm"
                            disabled={!client.total_customers}
                          >
                            View Customers
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showCustomersModal && selectedClientForCustomers && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white p-6 rounded shadow w-full max-w-4xl overflow-y-auto max-h-[90vh]">
                    <h2 className="text-lg font-bold mb-4">Customers for {selectedClientForCustomers.username}</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white rounded shadow">
                        <thead>
                          <tr>
                            <th className="px-4 py-2">Loot Title</th>
                            <th className="px-4 py-2">Customer UPI</th>
                            <th className="px-4 py-2">Customer Name</th>
                            <th className="px-4 py-2">Customer Mobile</th>
                            <th className="px-4 py-2">Amount</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClientCustomers.map(customer => (
                            <tr key={customer.id} className="border-t">
                              <td className="px-4 py-2">{customer.loot_title}</td>
                              <td className="px-4 py-2 font-mono text-sm">{customer.customer_upi}</td>
                              <td className="px-4 py-2">{customer.customer_name || '-'}</td>
                              <td className="px-4 py-2">{customer.customer_mobile || '-'}</td>
                              <td className="px-4 py-2">₹{customer.amount}</td>
                              <td className="px-4 py-2">
                                <span className={`badge ${customer.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                  {customer.status}
                                </span>
                              </td>
                              <td className="px-4 py-2">{moment.utc(customer.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button className="flex-1" variant="secondary" onClick={() => setShowCustomersModal(false)}>Close</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'pending-referrals' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Pending Referrals</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-blue-800">
                      Referral Approval Process
                    </h4>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>Customers are redirected to investment opportunities immediately after submitting their UPI ID. 
                      Approving these referrals will credit the client's account and count the referral.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Client</th>
                      <th className="px-4 py-2">Loot Title</th>
                      <th className="px-4 py-2">Customer Earns</th>
                      <th className="px-4 py-2">Client Earns</th>
                      <th className="px-4 py-2">Customer UPI</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Referral Code</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReferrals.map(referral => (
                      <tr key={referral.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2">{referral.client_name}</td>
                        <td className="px-4 py-2">{referral.loot_title}</td>
                        <td className="px-4 py-2">₹{referral.customer_amount ?? referral.amount}</td>
                        <td className="px-4 py-2">₹{referral.earn_amount || '-'}</td>
                        <td className="px-4 py-2">{referral.customer_upi}</td>
                        <td className="px-4 py-2">₹{referral.amount}</td>
                        <td className="px-4 py-2">{referral.referral_code}</td>
                        <td className="px-4 py-2">{moment.utc(referral.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                        <td className="px-4 py-2">
                          <div className="flex flex-row gap-2">
                            <Button 
                              variant="success" 
                              onClick={() => handleApproveReferral(referral.id)} 
                              size="sm"
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="danger" 
                              onClick={() => handleRejectReferral(referral.id)} 
                              size="sm"
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pendingReferrals.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No pending referrals found.
                </div>
              )}
            </div>
          )}
          {tab === 'restricted' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Restricted Accounts</h2>
              
              {/* Blocked Accounts Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-orange-600">Blocked Accounts</h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-orange-800">
                        Blocked Accounts
                      </h4>
                      <div className="mt-1 text-sm text-orange-700">
                        <p>These accounts are temporarily blocked. All data is preserved and accounts can be unblocked.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded shadow">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Username</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Mobile</th>
                        <th className="px-4 py-2">Balance</th>
                        <th className="px-4 py-2">Total Earned</th>
                        <th className="px-4 py-2">Created At</th>
                        <th className="px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedUsers.map(user => (
                        <tr key={user.id} className="border-t bg-orange-50">
                          <td className="px-4 py-2">{user.username}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">{user.mobile || '-'}</td>
                          <td className="px-4 py-2">₹{user.balance || 0}</td>
                          <td className="px-4 py-2">₹{user.total_earned || 0}</td>
                          <td className="px-4 py-2">{moment.utc(user.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                          <td className="px-4 py-2">
                            <Button 
                              variant="success" 
                              size="sm" 
                              onClick={() => handleUnblockUser(user.id)}
                            >
                              Unblock
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {blockedUsers.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-4 py-4 text-center text-gray-500">
                            No blocked accounts found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deleted Accounts Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-600">Deleted Accounts</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">
                        Deleted Accounts
                      </h4>
                      <div className="mt-1 text-sm text-red-700">
                        <p>These accounts have been deleted. All data has been cleared except username, email, mobile number, and balance information.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded shadow">
                    <thead>
                      <tr>
                        <th className="px-4 py-2">Username</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Mobile</th>
                        <th className="px-4 py-2">Balance</th>
                        <th className="px-4 py-2">Total Earned</th>
                        <th className="px-4 py-2">Deleted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedUsers.map(user => (
                        <tr key={user.id} className="border-t bg-red-50">
                          <td className="px-4 py-2">{user.username}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2">{user.mobile || '-'}</td>
                          <td className="px-4 py-2">₹{user.deleted_balance || 0}</td>
                          <td className="px-4 py-2">₹{user.deleted_total_earned || 0}</td>
                          <td className="px-4 py-2">{moment.utc(user.deleted_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                        </tr>
                      ))}
                      {deletedUsers.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                            No deleted accounts found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {tab === 'analytics' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Platform Analytics</h2>
              {analytics ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="card p-4"><div className="text-xs text-gray-500">Total Clients</div><div className="text-2xl font-bold">{analytics.overview.totalClients}</div></div>
                  <div className="card p-4"><div className="text-xs text-gray-500">Total Loots</div><div className="text-2xl font-bold">{analytics.overview.totalLoots}</div></div>
                  <div className="card p-4"><div className="text-xs text-gray-500">Total Offers</div><div className="text-2xl font-bold">{analytics.overview.totalInvestments}</div></div>
                  <div className="card p-4"><div className="text-xs text-gray-500">Total Referrals</div><div className="text-2xl font-bold">{analytics.overview.totalReferrals}</div></div>
                  <div className="card p-4"><div className="text-xs text-gray-500">Total Earned</div><div className="text-2xl font-bold">₹{analytics.overview.totalEarned}</div></div>
                  <div className="card p-4"><div className="text-xs text-gray-500">Pending Withdrawals</div><div className="text-2xl font-bold">{analytics.overview.pendingWithdrawals}</div></div>
                </div>
              ) : <div>Loading...</div>}
              <h3 className="font-semibold mt-6 mb-2">Recent Offers</h3>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full text-xs bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">User</th>
                      <th className="px-2 py-1">Loot</th>
                      <th className="px-2 py-1">Amount</th>
                      <th className="px-2 py-1">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.recentActivities?.investments?.map(inv => (
                      <tr key={inv.id} className="border-t">
                        <td className="px-2 py-1">{inv.username}</td>
                        <td className="px-2 py-1">{inv.loot_title}</td>
                        <td className="px-2 py-1">
                          {inv.customer_amount ? (
                            <span title={`Customer: ₹${inv.customer_amount}, Earn: ₹${inv.earn_amount}`}>
                              ₹{inv.customer_amount} + ₹{inv.earn_amount}
                            </span>
                          ) : (
                            `₹${inv.amount}`
                          )}
                        </td>
                        <td className="px-2 py-1">{moment.utc(inv.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="font-semibold mt-6 mb-2">Recent Referrals</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-2 py-1">User</th>
                      <th className="px-2 py-1">Loot</th>
                      <th className="px-2 py-1">Amount</th>
                      <th className="px-2 py-1">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.recentActivities?.referrals?.map(ref => (
                      <tr key={ref.id} className="border-t">
                        <td className="px-2 py-1">{ref.username}</td>
                        <td className="px-2 py-1">{ref.loot_title}</td>
                        <td className="px-2 py-1">₹{ref.amount}</td>
                        <td className="px-2 py-1">{moment.utc(ref.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'withdrawals' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Withdrawal Requests</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">User</th>
                                              <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Amount</th>
                        <th className="px-4 py-2">UPI</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Reference</th>
                        <th className="px-4 py-2">Notes</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map(wd => (
                      <tr key={wd.id} className="border-t">
                        <td className="px-4 py-2">{wd.username}</td>
                                                  <td className="px-4 py-2">{wd.email}</td>
                          <td className="px-4 py-2">₹{wd.amount}</td>
                          <td className="px-4 py-2">{wd.upi_id || '-'}</td>
                          <td className="px-4 py-2">{wd.status}</td>
                          <td className="px-4 py-2">{wd.reference_number || '-'}</td>
                          <td className="px-4 py-2">{wd.notes || '-'}</td>
                        <td className="px-4 py-2">{moment.utc(wd.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                        <td className="px-4 py-2 flex gap-2">
                          {wd.status === 'pending' && (
                            <>
                              <Button variant="success" size="sm" onClick={() => handleWithdrawalAction(wd.id, 'approved')}>Approve</Button>
                              <Button variant="danger" size="sm" onClick={() => handleWithdrawalAction(wd.id, 'rejected')}>Reject</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'issues' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Password Reset Requests</h2>
                <a 
                  href="/credentials" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  View Credentials
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Username</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2">Password</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(issue => (
                      <tr key={issue.id} className="border-t">
                        <td className="px-4 py-2">{issue.username}</td>
                        <td className="px-4 py-2">{issue.email}</td>
                        <td className="px-4 py-2">{issue.mobile || '-'}</td>
                        <td className="px-4 py-2 font-mono text-sm">{issue.password}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            issue.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">{moment.utc(issue.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                        <td className="px-4 py-2">
                          {issue.status === 'pending' && (
                            <Button 
                              variant="success" 
                              size="sm" 
                              onClick={() => handleIssueAction(issue.id, 'completed')}
                            >
                              Mark Complete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'withdrawal-password-requests' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Withdrawal Password Requests</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Username</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Mobile</th>
                      <th className="px-4 py-2">Password</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalPasswordRequests.map(issue => (
                      <tr key={issue.id} className="border-t">
                        <td className="px-4 py-2">{issue.username}</td>
                        <td className="px-4 py-2">{issue.email}</td>
                        <td className="px-4 py-2">{issue.mobile || '-'}</td>
                        <td className="px-4 py-2 font-mono text-sm">{issue.password}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            issue.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">{moment.utc(issue.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}</td>
                        <td className="px-4 py-2">
                          {issue.status === 'pending' && (
                            <Button 
                              variant="success" 
                              size="sm" 
                              onClick={() => openWithdrawalPasswordModal(issue)}
                            >
                              Update Password
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {tab === 'credentials' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Client Credentials</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Secure Access Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This page contains sensitive client information. Please enter the admin password to view credentials.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
                <Button 
                  variant="primary" 
                  onClick={handleCredentialsAccess}
                  disabled={!adminPassword.trim()}
                >
                  Access Credentials
                </Button>
                {credentialsError && (
                  <div className="mt-3 text-red-600 text-sm">
                    {credentialsError}
                  </div>
                )}
                {showCredentials && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">All Client Credentials</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white rounded shadow">
                        <thead>
                          <tr>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Username</th>
                            <th className="px-4 py-2">Email</th>
                            <th className="px-4 py-2">Mobile</th>
                            <th className="px-4 py-2">Password</th>
                            <th className="px-4 py-2">Balance</th>
                            <th className="px-4 py-2">Total Earned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allCredentials.map(client => (
                            <tr key={client.id} className="border-t">
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  client.type === 'new_registration' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {client.type === 'new_registration' ? 'New Registration' : 'Existing User'}
                                </span>
                              </td>
                              <td className="px-4 py-2">{client.username}</td>
                              <td className="px-4 py-2">{client.email}</td>
                              <td className="px-4 py-2">{client.mobile || '-'}</td>
                              <td className="px-4 py-2 font-mono text-sm">{client.password}</td>
                              <td className="px-4 py-2">₹{client.balance || 0}</td>
                              <td className="px-4 py-2">₹{client.total_earned || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {tab === 'chat' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Admin Chat</h2>
              <AdminChatBox />
            </div>
          )}
          {/* Leaderboard Management Tab */}
          {/* Removed Leaderboard Management Tab */}
        </div>
      </div>
      
      {/* Loot Modal */}
      {showLootModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold mb-4">
              {editingLoot ? 'Edit Loot' : 'Create New Loot'}
            </h2>
            <LootForm
              loot={editingLoot}
              onSuccess={handleLootSuccess}
              onCancel={() => {
                setShowLootModal(false);
                setEditingLoot(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && selectedUserForBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Block User</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to block <strong>{selectedUserForBlock.username}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                This will prevent the user from logging in until you unblock them.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter reason for blocking..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows="3"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="danger" 
                onClick={() => handleBlockUser(selectedUserForBlock.id, blockReason)}
                className="flex-1"
              >
                Block User
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedUserForBlock(null);
                  setBlockReason('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Password Update Modal */}
      {showWithdrawalPasswordModal && selectedWithdrawalRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Update Withdrawal Password</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to update the withdrawal password for <strong>{selectedWithdrawalRequest.username}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-4">
                This will change the password for this user's withdrawal requests.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Withdrawal Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter new withdrawal password"
                value={newWithdrawalPassword}
                onChange={(e) => setNewWithdrawalPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                onClick={handleUpdateWithdrawalPassword}
                disabled={loading || !newWithdrawalPassword.trim()}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setShowWithdrawalPasswordModal(false);
                  setSelectedWithdrawalRequest(null);
                  setNewWithdrawalPassword('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 