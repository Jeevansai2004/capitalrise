import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LootForm({ loot = null, onSuccess, onCancel }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    title: loot?.title || '',
    description: loot?.description || '',
    max_amount: loot?.max_amount || '',
    redirect_url: loot?.redirect_url || '',
    is_active: loot?.is_active !== false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.max_amount || isNaN(form.max_amount) || Number(form.max_amount) <= 0) {
      errs.max_amount = 'Valid amount is required';
    }
    if (!form.redirect_url.trim()) errs.redirect_url = 'Redirect URL is required';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const url = loot ? `/api/admin/loots/${loot.id}` : '/api/admin/loots';
      const method = loot ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      toast.success(loot ? 'Loot updated successfully!' : 'Loot created successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="Enter loot title"
      />
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className={`input min-h-[100px] ${errors.description ? 'border-danger-500' : ''}`}
          placeholder="Enter loot description"
        />
        {errors.description && <p className="text-danger-600 text-xs mt-1">{errors.description}</p>}
      </div>
      
      <Input
        label="Maximum Amount (₹)"
        name="max_amount"
        type="number"
        min="1"
        value={form.max_amount}
        onChange={handleChange}
        error={errors.max_amount}
        placeholder="Enter maximum amount"
      />
      
      <Input
        label="Redirect URL"
        name="redirect_url"
        type="url"
        value={form.redirect_url}
        onChange={handleChange}
        error={errors.redirect_url}
        placeholder="https://example.com"
      />
      
      <div className="flex items-center">
        <input
          type="checkbox"
          name="is_active"
          checked={form.is_active}
          onChange={handleChange}
          className="mr-2"
        />
        <label className="text-sm">Active</label>
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" loading={loading} className="flex-1">
          {loot ? 'Update Loot' : 'Create Loot'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
} 