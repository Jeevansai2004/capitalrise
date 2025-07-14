import React, { useState, useEffect } from 'react';

export default function SMSStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSMSStatus();
  }, []);

  const checkSMSStatus = async () => {
    try {
      const response = await fetch('/api/auth/sms-status');
      const data = await response.json();
      setStatus(data.data);
    } catch (error) {
      console.error('Failed to check SMS status:', error);
      setStatus({
        configured: false,
        service: 'Unknown',
        message: 'Failed to check SMS service status'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 border ${
      status?.configured 
        ? 'bg-green-50 border-green-200' 
        : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            SMS Service Status
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {status?.message}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          status?.configured 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {status?.configured ? 'Configured' : 'Not Configured'}
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        Service: {status?.service}
      </div>
      {!status?.configured && (
        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Setup Required:</strong> Configure Twilio SMS service for production use. 
            See SMS_SETUP.md for instructions.
          </p>
        </div>
      )}
    </div>
  );
} 