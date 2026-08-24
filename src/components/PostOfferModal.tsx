import React, { useState, useEffect } from 'react';
import { X, Gift, DollarSign, Link as LinkIcon, Building2, Tag, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { CATEGORIES } from '../categories';
import { useAuth } from './AuthContext';

interface PostOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offer: any) => Promise<void>;
}

export function PostOfferModal({ isOpen, onClose, onSubmit }: PostOfferModalProps) {
  const { user } = useAuth();
  const localEmail = localStorage.getItem('justbid_user_email');
  const isAuthenticated = !!user || !!localEmail;
  const activeEmail = user?.email || localEmail || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    url: '',
    description: '',
    offerText: '',
    worthValue: '',
    category: 'SEO & AI Visibility',
    discountCode: '',
    contactEmail: activeEmail,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (activeEmail) {
      setFormData(prev => ({ ...prev, contactEmail: activeEmail }));
    }
  }, [activeEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const email = (activeEmail || formData.contactEmail || '').trim();

      await onSubmit({
        companyName: formData.companyName,
        url: formData.url,
        description: formData.description,
        offerText: formData.offerText,
        worthValue: Number(formData.worthValue),
        category: formData.category,
        discountCode: formData.discountCode,
        contactEmail: email
      });

      // Save local session tracker
      if (email) {
        localStorage.setItem('justbid_user_email', email);
        if (!user) {
          const generatedId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem('justbid_account_id', generatedId);
        }
      }

      setShowSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to post offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-800 text-[11px] font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              1-Hour Flash Auction
            </div>
            <h2 className="text-lg font-bold text-zinc-900">List an Offer & Start Auction</h2>
            {user && (
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Posting as <strong className="text-zinc-800">{user.email}</strong>
              </p>
            )}
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto">
          {showSuccess ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Offer Submitted!</h3>
              <p className="text-sm text-zinc-600 max-w-sm mx-auto">
                Your auction for <strong className="text-zinc-900">{formData.companyName}</strong> has been submitted.
              </p>
              <div className="p-4 bg-orange-50 border border-orange-200/80 rounded-xl text-left text-xs text-orange-900 space-y-1">
                <p className="font-semibold">💡 Next steps:</p>
                <p>1. Our admin team verifies startup offers within minutes.</p>
                <p>2. You can track your auction and manage secret vouchers on your <strong>Dashboard</strong>.</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
              >
                Go to Auctions & Dashboard
              </button>
            </div>
          ) : (
            <form id="offer-form" onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Company Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Building2 size={15} />
                    </div>
                    <input
                      type="text"
                      name="companyName"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="e.g. Acme AI"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Website URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <LinkIcon size={15} />
                    </div>
                    <input
                      type="url"
                      name="url"
                      required
                      value={formData.url}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="https://acme.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Category</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  {CATEGORIES.filter(c => c.id !== 'All').map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* If authenticated, display current account indicator; otherwise ask for email only */}
              {isAuthenticated ? (
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Posting as: <strong className="text-zinc-900">{activeEmail}</strong></span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Signed In
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Business Email (For Dashboard & Verification)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      name="contactEmail"
                      required
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="founder@acme.com"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Short Description / Tagline</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none text-zinc-400">
                    <Tag size={15} />
                  </div>
                  <textarea
                    name="description"
                    required
                    maxLength={120}
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    placeholder="e.g. Automate your growth marketing with autonomous AI agents."
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">The Offer (Credits / Plan / Discount)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none text-zinc-400">
                    <Gift size={15} />
                  </div>
                  <textarea
                    name="offerText"
                    required
                    maxLength={150}
                    value={formData.offerText}
                    onChange={handleChange}
                    rows={2}
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                    placeholder="e.g. $10,000 API Credits + 1 Year Pro Team Plan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Secret Voucher / Promo Code</label>
                  <input
                    type="text"
                    name="discountCode"
                    required
                    value={formData.discountCode}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono"
                    placeholder="e.g. JUSTBID-100"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Hidden until won & paid.</p>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Retail Value ($)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <DollarSign size={15} />
                    </div>
                    <input
                      type="number"
                      name="worthValue"
                      required
                      min={1}
                      step={1}
                      value={formData.worthValue}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="5000"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">Estimated dollar value.</p>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        {!showSuccess && (
          <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="offer-form"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all shadow-[0_2px_8px_rgba(234,88,12,0.3)] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Launch Auction'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
