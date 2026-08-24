import React, { useState, useEffect } from 'react';
import { X, User, DollarSign, Mail, CheckCircle2, Gavel } from 'lucide-react';
import { Auction } from '../types';
import { useAuth } from './AuthContext';

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: Auction | null;
  onSubmit: (auctionId: string, bidderName: string, amount: number, email?: string) => Promise<void>;
}

export function PlaceBidModal({ isOpen, onClose, auction, onSubmit }: PlaceBidModalProps) {
  const { user } = useAuth();
  const localEmail = localStorage.getItem('justbid_user_email');
  const isAuthenticated = !!user || !!localEmail;
  const activeEmail = user?.email || localEmail || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    bidderName: activeEmail ? activeEmail.split('@')[0] : '',
    bidderEmail: activeEmail,
    amount: ''
  });

  const currentHighestBid = auction?.bids && auction.bids.length > 0 
    ? Math.max(...auction.bids.map(b => b.amount)) 
    : 0;

  // Minimum bid starts at $5; increases by $1 each time someone bids (currentHighestBid + 1)
  const minBid = currentHighestBid > 0 ? Math.max(5, currentHighestBid + 1) : 5;

  useEffect(() => {
    if (activeEmail) {
      setFormData(prev => ({
        ...prev,
        bidderEmail: activeEmail,
        bidderName: prev.bidderName || activeEmail.split('@')[0] || ''
      }));
    }
  }, [activeEmail]);

  useEffect(() => {
    if (auction) {
      const highest = auction.bids && auction.bids.length > 0 
        ? Math.max(...auction.bids.map(b => b.amount)) 
        : 0;
      const nextMin = highest > 0 ? Math.max(5, highest + 1) : 5;
      setFormData(prev => ({
        ...prev,
        amount: String(nextMin)
      }));
    }
  }, [auction?.id, auction?.bids?.length]);

  if (!isOpen || !auction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const email = (user?.email || formData.bidderEmail || '').trim();
      const bidderName = (formData.bidderName || email.split('@')[0] || 'Anonymous').trim();
      
      if (email) {
        localStorage.setItem('justbid_user_email', email);
        localStorage.setItem('justbid_user_name', bidderName);
        if (!user) {
          const generatedId = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_');
          localStorage.setItem('justbid_account_id', generatedId);
        }
      }

      await onSubmit(auction.id, bidderName, Number(formData.amount), email);
      setShowSuccess(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to place bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100/80 text-orange-800 text-[11px] font-semibold mb-1">
              <Gavel size={12} />
              Live Auction Bid
            </div>
            <h2 className="text-base font-bold text-zinc-900">Bid on {auction.companyName}</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {showSuccess ? (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Bid Placed Successfully!</h3>
              <p className="text-xs sm:text-sm text-zinc-600">
                You placed a <strong className="text-zinc-900 font-mono font-bold">${formData.amount}</strong> bid on <strong className="text-zinc-900">{auction.companyName}</strong>.
              </p>
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-left text-xs text-zinc-600">
                <p>Track your active bids on your <strong>Dashboard</strong>. If you win at the end of the 1-hour auction, you can complete payment and unlock the voucher code.</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <form id="place-bid-form" onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200/60">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-orange-800 mb-0.5">Offer Details</div>
                <h4 className="font-bold text-zinc-900 text-sm">{auction.offerText}</h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-600">
                  <span>Retail: <strong className="text-zinc-900 font-mono">${auction.worthValue.toLocaleString()}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="text-zinc-900">{auction.category}</strong></span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Your Name / Handle</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    name="bidderName"
                    required
                    value={formData.bidderName}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="Alex (or @handle)"
                  />
                </div>
              </div>

              {isAuthenticated ? (
                <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Bidding as: <strong className="text-zinc-900">{activeEmail}</strong></span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Logged In
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Your Email (To notify if you win)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      name="bidderEmail"
                      required
                      value={formData.bidderEmail}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="alex@gmail.com"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Bid Amount ($)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <DollarSign size={15} />
                  </div>
                  <input
                    type="number"
                    name="amount"
                    required
                    min={minBid}
                    step={1}
                    value={formData.amount}
                    onChange={handleChange}
                    className="block w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono"
                    placeholder={`Min bid $${minBid}`}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-zinc-500 mt-1.5 font-mono">
                  <span>Current highest: <strong className="text-zinc-800">${currentHighestBid}</strong></span>
                  <span>Minimum next bid: <strong className="text-orange-600 font-bold">${minBid}</strong></span>
                </div>

                {/* Quick Increment Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 pt-2 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-400 font-medium">Quick add:</span>
                    {[1, 5, 10].map(inc => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => {
                          const base = Number(formData.amount) || minBid;
                          setFormData(prev => ({ ...prev, amount: String(Math.max(minBid, base + inc)) }));
                        }}
                        className="px-2.5 py-0.5 bg-zinc-100 hover:bg-orange-100 hover:text-orange-800 text-zinc-700 text-[11px] font-bold rounded-lg border border-zinc-200 transition-colors"
                      >
                        +${inc}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, amount: String(minBid) }))}
                    className="text-[11px] text-orange-600 hover:underline font-semibold"
                  >
                    Set to Min (${minBid})
                  </button>
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
              form="place-bid-form"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-all shadow-[0_2px_8px_rgba(234,88,12,0.3)] active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Placing...' : `Bid $${formData.amount || minBid}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
