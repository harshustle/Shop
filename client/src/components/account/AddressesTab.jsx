import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Home, Briefcase, CheckCircle2, X } from 'lucide-react';
import { API_URL } from '../../config';

const AddressesTab = ({ addresses = [], onAddressUpdated }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    label: 'Home',
    fullName: '',
    phoneNumber: '',
    streetAddress: '',
    apartment: '',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    postalCode: '226010',
    isDefault: true
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/account/addresses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowAddModal(false);
        setForm({
          label: 'Home',
          fullName: '',
          phoneNumber: '',
          streetAddress: '',
          apartment: '',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          postalCode: '226010',
          isDefault: false
        });
        if (onAddressUpdated) onAddressUpdated();
      }
    } catch (err) {
      console.error('Failed to save address:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this delivery address?')) return;
    try {
      const res = await fetch(`${API_URL}/api/account/addresses/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok && onAddressUpdated) {
        onAddressUpdated();
      }
    } catch (err) {
      console.error('Delete address error:', err);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <MapPin size={18} />
            </span>
            <span>My Addresses ({addresses.length})</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage multiple delivery points for home, office, and family members.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#00B074] hover:bg-[#009663] text-white rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-sm self-start sm:self-center"
        >
          <Plus size={14} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <MapPin size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No addresses saved</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
            Save your delivery address for lightning-fast 1-click checkout.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-[#00B074] text-white rounded-2xl text-xs font-bold transition shadow-sm"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`p-5 rounded-2xl border transition relative flex flex-col justify-between space-y-3 ${
                addr.isDefault 
                  ? 'border-[#00B074] bg-emerald-50/20 shadow-xs' 
                  : 'border-slate-200/80 bg-white hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      {addr.label === 'Work' || addr.label === 'Office' ? <Briefcase size={14} /> : <Home size={14} />}
                    </span>
                    <span className="text-xs font-black text-slate-900">{addr.label || 'Home'}</span>
                  </div>

                  {addr.isDefault && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>Default</span>
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">{addr.fullName}</p>
                  <p className="font-medium text-slate-500">{addr.streetAddress}{addr.apartment ? `, ${addr.apartment}` : ''}</p>
                  <p className="font-medium text-slate-500">{addr.city}, {addr.state} - {addr.postalCode}</p>
                  <p className="font-medium text-slate-700 pt-1">Phone: {addr.phoneNumber}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(addr._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Delete address"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Add Delivery Address</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                {['Home', 'Work', 'Other'].map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setForm({ ...form, label: lbl })}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      form.label === lbl 
                        ? 'bg-[#00B074] text-white border-[#00B074]' 
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">House / Flat / Floor / Building</label>
                <input
                  type="text"
                  value={form.apartment}
                  onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                  placeholder="Flat 402, Lotus Tower"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  required
                  value={form.streetAddress}
                  onChange={(e) => setForm({ ...form, streetAddress: e.target.value })}
                  placeholder="Main Road, Near Metro Station"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00B074]/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 text-[#00B074] rounded-md border-slate-300 focus:ring-[#00B074]"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Make this my default delivery address
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-black transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddressesTab;
