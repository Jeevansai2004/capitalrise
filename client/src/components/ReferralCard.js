import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';

export default function ReferralCard({ referralUrl, lootTitle, investmentAmount }) {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h2 className="text-lg font-semibold">Referral Link</h2>
      </div>
      <div className="card-body flex flex-col gap-2">
        <div className="text-sm text-gray-700">{lootTitle}</div>
        {investmentAmount && (
          <div className="text-xs text-gray-500">Investment Amount: {investmentAmount}</div>
        )}
        <div className="flex items-center gap-2">
          <input
            className="input flex-1"
            value={referralUrl}
            readOnly
            onFocus={e => e.target.select()}
          />
          <CopyToClipboard text={referralUrl} onCopy={() => toast.success('Copied!')}>
            <button className="btn btn-primary">Copy</button>
          </CopyToClipboard>
        </div>
      </div>
    </div>
  );
} 