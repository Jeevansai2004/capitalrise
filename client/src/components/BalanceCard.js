import React from 'react';
import Button from './Button';

export default function BalanceCard({ balance, totalEarned, onWithdraw }) {
  return (
    <div className="card mb-4">
      <div className="card-header flex items-center justify-between">
        <h2 className="text-lg font-semibold">Balance</h2>
      </div>
      <div className="card-body flex flex-col gap-2">
        <div className="text-2xl font-bold text-success-700">₹{balance?.toFixed(2) || '0.00'}</div>
        <div className="text-sm text-gray-500">Total Earned: ₹{totalEarned?.toFixed(2) || '0.00'}</div>
        {onWithdraw && <Button onClick={onWithdraw} variant="success" className="mt-2">Withdraw</Button>}
      </div>
    </div>
  );
} 