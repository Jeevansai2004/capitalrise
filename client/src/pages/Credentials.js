import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import moment from 'moment-timezone';

export default function Credentials() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.user || auth.user.role !== 'admin') {
      navigate('/login');
    }
  }, [auth.user, navigate]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== 'Jeevan@123') {
      setError('Incorrect password');
      return;
    }
    setIsAuthenticated(true);
    fetchCredentials();
  };

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/credentials', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setCredentials(data.data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch credentials');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.user || auth.user.role !== 'admin') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
        <div className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-2xl p-8 border border-white/30 flex flex-col gap-4 backdrop-blur-sm">
          <div className="mb-4 text-center">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-pink-500 bg-clip-text text-transparent">Credentials Access</span>
          </div>
          <div className="mb-2 text-center">
            <span className="text-lg text-gray-700 font-medium">Enter password to view client credentials</span>
          </div>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <Input
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              autoComplete="current-password"
              className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            <Button type="submit" className="w-full mt-2 bg-gradient-to-r from-primary-600 to-pink-500 hover:from-primary-700 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md">
              Access Credentials
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Client Credentials</h1>
            <Button
              onClick={() => navigate('/admin')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Admin
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading credentials...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Password
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {credentials.map((credential) => (
                    <tr key={credential.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {credential.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {credential.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {credential.mobile || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {credential.password}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {moment.utc(credential.created_at).tz('Asia/Kolkata').format('DD/MM/YYYY h:mm A')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 