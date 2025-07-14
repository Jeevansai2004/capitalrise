import React from 'react';
import Button from './Button';

export default function LootCard({ loot, onInvest, disabled }) {
  const isDisabled = !loot.is_active;
  
  return (
    <div className="card mb-4">
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{loot.title}</h2>
          <p className="text-sm text-gray-500">Max: ₹{loot.max_amount}</p>
        </div>
        <span className={`badge ${loot.is_active ? 'badge-success' : 'badge-danger'}`}>
          {loot.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="card-body">
        <p className="mb-2 text-gray-700">{loot.description}</p>
        <Button 
          onClick={() => onInvest(loot)} 
          disabled={isDisabled} 
          variant={isDisabled ? 'secondary' : 'primary'}
          className="mt-2"
        >
          Do the Offer
        </Button>
      </div>
    </div>
  );
} 