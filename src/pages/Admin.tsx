import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  ExternalLink, 
  RefreshCw, 
  Clock, 
  Send, 
  AlertCircle, 
  Copy, 
  Check, 
  Lock, 
  ArrowLeft, 
  LogIn, 
  Trophy, 
  DollarSign, 
  Award, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Auction } from '../types';
import { useAuth } from '../components/AuthContext';
import { AuthModal } from '../components/AuthModal';

export function Admin() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [testEmailStatus, setTestEmailStatus] = useState<{ loading: boolean; message?: string; error?: string; details?: any } | null>(null);
  const [testWinnerEmailStatus, setTestWinnerEmailStatus] = useState<{ loading: boolean; message?: string; error?: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [expandedBidsId, setExpandedBidsId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'won' | 'all'>('pending');

  const localEmail = localStorage.getItem('justbid_user_email');
  const activeUserEmail = (user?.email || localEmail || '').trim().toLowerCase();
  const isAuthorizedAdmin = activeUserEmail === 'princemrb89@gmail.com';

  const fetchAdminData = async () => {
    if (!isAuthorizedAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auctions', { headers: { 'Cache-Control': 'no-cache' } });
      const data = await res.json();
      setAuctions(data.auctions || []);
      setAdminEmails(data.adminEmails || ['princemrb89@gmail.com']);
    } catch (e) {
      console.error('Failed to fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [activeUserEmail]);

  if (!isAuthorizedAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <Lock size={28} />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Admin Access Restricted</h2>
          <p className="text-zinc-500 text-sm mt-2 leading-relaxed">
            The Admin Moderation & Winner Center is strictly reserved for the site owner (<strong className="text-zinc-800">princemrb89@gmail.com</strong>).
          </p>

          {activeUserEmail ? (
            <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-600">
              Currently signed in as: <span className="font-mono font-bold text-zinc-900">{activeUserEmail}</span>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              You are currently not signed in.
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <LogIn size={15} />
              <span>Sign In as Admin</span>
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
            >
              <ArrowLeft size={15} />
              <span>Back to Leaderboard</span>
            </Link>
          </div>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/approve/${id}`, { method: 'POST' });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reject/${id}`, { method: 'POST' });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndAuction = async (id: string) => {
    if (!confirm('Are you sure you want to end this auction right now and declare the top bidder as the winner?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/end-auction/${id}`, { method: 'POST' });
      if (res.ok) {
        await fetchAdminData();
        setActiveTab('won');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePaid = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/mark-paid/${id}`, { method: 'POST' });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailStatus({ loading: true });
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: 'Superscale AI',
          offerText: '$10,000 Free Cloud AI & Scaling Credits',
          worthValue: 10000,
          contactEmail: 'founder@superscale.example.com',
          url: 'https://superscale.example.com',
          category: 'Developer Tools'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailStatus({ 
          loading: false, 
          message: data.message || `Approval test email dispatched successfully!`,
          details: data.result 
        });
      } else {
        setTestEmailStatus({ 
          loading: false, 
          error: data.error || 'Failed to dispatch test email.' 
        });
      }
    } catch (e: any) {
      setTestEmailStatus({ loading: false, error: e.message || 'Error triggering test email' });
    }
  };

  const handleSendWinnerTestEmail = async () => {
    setTestWinnerEmailStatus({ loading: true });
    try {
      const res = await fetch('/api/admin/test-winner-email', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestWinnerEmailStatus({ loading: false, message: data.message || 'Winner alert sent to princemrb89@gmail.com!' });
      } else {
        setTestWinnerEmailStatus({ loading: false, error: data.error || 'Failed to send winner email' });
      }
    } catch (e: any) {
      setTestWinnerEmailStatus({ loading: false, error: e.message || 'Error sending winner test email' });
    }
  };

  const copyApproveUrl = (id: string) => {
    const url = `${window.location.origin}/api/admin/approve/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyVoucherCode = (id: string, code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const now = Date.now();
  const pendingAuctions = auctions.filter(a => a.status === 'pending');
  
  // Won auctions: approved auctions that have ended and have winnerId OR have bids and endTime passed
  const wonAuctions = auctions.filter(a => {
    if (a.status !== 'approved') return false;
    const isEnded = a.endTime > 0 && now > a.endTime;
    const hasBids = a.bids && a.bids.length > 0;
    return !!a.winnerId || (isEnded && hasBids);
  });

  // Calculate high level metrics
  const totalWonVolume = wonAuctions.reduce((acc, a) => {
    const highestBid = a.bids?.length > 0 ? Math.max(...a.bids.map(b => b.amount)) : 0;
    return acc + highestBid;
  }, 0);

  const totalStartupValueDelivered = wonAuctions.reduce((acc, a) => acc + (a.worthValue || 0), 0);

  const displayAuctions = 
    activeTab === 'pending' 
      ? pendingAuctions 
      : activeTab === 'won' 
      ? wonAuctions 
      : auctions;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-orange-600/10 text-orange-600 rounded-xl flex items-center justify-center font-bold">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              Admin & Winner Center
              <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                Owner Portal
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Review offer submissions, track winning bidders, and inspect unlocked founder perks
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-semibold text-zinc-700 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleSendWinnerTestEmail}
            disabled={testWinnerEmailStatus?.loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            title="Test dispatching a Winner Alert notification email to princemrb89@gmail.com"
          >
            <Trophy size={13} className={testWinnerEmailStatus?.loading ? 'animate-bounce' : ''} />
            <span>Test Winner Alert</span>
          </button>

          <button
            onClick={handleSendTestEmail}
            disabled={testEmailStatus?.loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Send size={13} className={testEmailStatus?.loading ? 'animate-pulse' : ''} />
            <span>Test Approval Email</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-1 text-xs font-bold uppercase tracking-wider">
            <Trophy size={14} /> Won Auctions
          </div>
          <div className="text-2xl font-black text-zinc-900">{wonAuctions.length}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Finished with winning bids</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-orange-600 mb-1 text-xs font-bold uppercase tracking-wider">
            <DollarSign size={14} /> Winning Bid Volume
          </div>
          <div className="text-2xl font-black text-orange-600">${totalWonVolume.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Total collected from winners</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-600 mb-1 text-xs font-bold uppercase tracking-wider">
            <Award size={14} /> Startup Value Won
          </div>
          <div className="text-2xl font-black text-zinc-900">${totalStartupValueDelivered.toLocaleString()}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Original retail credit worth</div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600 mb-1 text-xs font-bold uppercase tracking-wider">
            <Clock size={14} /> Pending Review
          </div>
          <div className="text-2xl font-black text-zinc-900">{pendingAuctions.length}</div>
          <div className="text-[11px] text-zinc-400 mt-0.5">Awaiting launch decision</div>
        </div>
      </div>

      {/* Recipient Notice Box */}
      <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 mb-8 text-xs text-orange-950">
        <div className="flex items-start gap-2.5">
          <Mail className="text-orange-600 shrink-0 mt-0.5" size={16} />
          <div className="space-y-1 flex-1">
            <div className="font-bold text-orange-900 flex items-center justify-between">
              <span>Admin Recipient: <span className="font-mono text-zinc-800 bg-white/80 px-1.5 py-0.5 rounded border border-orange-200">{adminEmails.join(', ') || 'princemrb89@gmail.com'}</span></span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Active Admin Mode</span>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              Whenever a founder submits an offer, real-time approval emails are dispatched to <strong className="text-zinc-800">princemrb89@gmail.com</strong>. Whenever an auction is won by a bidder, a real-time <strong>Winner Alert</strong> with winning bid amounts and vouchers is automatically sent to you as well.
            </p>
          </div>
        </div>

        {/* Winner Alert Result Banner */}
        {testWinnerEmailStatus && (
          <div className={`mt-3 pt-3 border-t border-orange-200/60 text-xs ${testWinnerEmailStatus.error ? 'text-red-700 font-semibold' : 'text-emerald-800 font-medium'}`}>
            {testWinnerEmailStatus.loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin" /> Dispatching winner alert test to {adminEmails.join(', ')}...
              </span>
            ) : testWinnerEmailStatus.error ? (
              <span className="flex items-center gap-1.5 text-red-600">
                <AlertCircle size={14} /> {testWinnerEmailStatus.error}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 size={14} /> {testWinnerEmailStatus.message}
              </span>
            )}
          </div>
        )}

        {/* Test Email Result Banner */}
        {testEmailStatus && (
          <div className={`mt-3 pt-3 border-t border-orange-200/60 text-xs ${testEmailStatus.error ? 'text-red-700 font-semibold' : 'text-emerald-800 font-medium'}`}>
            {testEmailStatus.loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw size={12} className="animate-spin" /> Dispatching test notification to {adminEmails.join(', ')}...
              </span>
            ) : testEmailStatus.error ? (
              <span className="flex items-center gap-1.5 text-red-600">
                <AlertCircle size={14} /> {testEmailStatus.error}
              </span>
            ) : (
              <div>
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 size={14} /> {testEmailStatus.message}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-200 pb-3">
        <button
          onClick={() => setActiveTab('won')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'won'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'
          }`}
        >
          <Trophy size={13} />
          <span>Won Bids & Winners ({wonAuctions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pending'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'
          }`}
        >
          <Clock size={13} />
          <span>Pending Review ({pendingAuctions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-zinc-900 text-white shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100'
          }`}
        >
          All Auctions ({auctions.length})
        </button>
      </div>

      {/* Auctions List */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-xs">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading auctions and winner data...
        </div>
      ) : displayAuctions.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-2xl p-6">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-zinc-900">
            {activeTab === 'won' ? 'No Won Auctions Yet' : activeTab === 'pending' ? 'All Caught Up!' : 'No Auctions Found'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            {activeTab === 'won' 
              ? 'When live auctions conclude with bids, the winning bidders, payment statuses, and secret vouchers will appear here.' 
              : activeTab === 'pending' 
              ? 'No offers currently waiting for admin approval.' 
              : 'No auctions found in the system.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {displayAuctions.map((auction) => {
            const isPending = auction.status === 'pending';
            const isApproved = auction.status === 'approved';
            const isRejected = auction.status === 'rejected';
            const isEnded = auction.endTime > 0 && now > auction.endTime;
            const hasBids = auction.bids && auction.bids.length > 0;
            const hasWon = isApproved && hasBids && (!!auction.winnerId || isEnded);

            // Determine highest bid / winning bid
            const winningBid = hasBids
              ? (auction.winnerId 
                  ? (auction.bids.find(b => b.bidderId === auction.winnerId) || auction.bids.reduce((p, c) => p.amount > c.amount ? p : c))
                  : auction.bids.reduce((p, c) => p.amount > c.amount ? p : c))
              : null;

            const savings = winningBid 
              ? Math.max(0, Math.round(((auction.worthValue - winningBid.amount) / auction.worthValue) * 100))
              : 0;

            const isExpanded = expandedBidsId === auction.id;

            return (
              <div
                key={auction.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                  hasWon
                    ? 'border-emerald-300 ring-1 ring-emerald-100 bg-gradient-to-b from-emerald-50/20 via-white to-white'
                    : isPending 
                    ? 'border-orange-300 ring-1 ring-orange-200' 
                    : 'border-zinc-200'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-zinc-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-1.5">
                        {hasWon && <Trophy size={16} className="text-emerald-600" />}
                        {auction.companyName}
                      </h3>

                      {/* Status Badges */}
                      {hasWon ? (
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Sparkles size={10} /> Won by {winningBid?.bidderName}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {auction.status}
                        </span>
                      )}

                      {/* Live status or ended */}
                      {isApproved && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isEnded ? 'bg-zinc-100 text-zinc-600' : 'bg-orange-100 text-orange-700 animate-pulse'
                        }`}>
                          {isEnded ? 'Concluded' : 'Live Auction'}
                        </span>
                      )}

                      <span className="text-[11px] bg-zinc-100 text-zinc-600 font-semibold px-2 py-0.5 rounded-md">
                        {auction.category}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500">{auction.description || 'No description provided.'}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-wrap">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleApprove(auction.id)}
                          disabled={actionLoading === auction.id}
                          className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve & Start 1-Hr</span>
                        </button>
                        <button
                          onClick={() => handleReject(auction.id)}
                          disabled={actionLoading === auction.id}
                          className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-rose-50 hover:text-rose-600 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Winner / Payment Toggle */}
                        {hasWon && (
                          <button
                            onClick={() => handleTogglePaid(auction.id)}
                            disabled={actionLoading === auction.id}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                              auction.isPaid 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            <CheckCircle size={13} />
                            <span>{auction.isPaid ? 'Paid & Voucher Claimed' : 'Mark as Paid'}</span>
                          </button>
                        )}

                        {/* End Live Auction Now */}
                        {isApproved && !isEnded && (
                          <button
                            onClick={() => handleEndAuction(auction.id)}
                            disabled={actionLoading === auction.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-colors"
                            title="End auction immediately and finalize winner"
                          >
                            <Clock size={13} />
                            <span>End & Finalize Winner</span>
                          </button>
                        )}

                        {/* Restart Auction */}
                        <button
                          onClick={() => handleApprove(auction.id)}
                          disabled={actionLoading === auction.id}
                          className="text-xs text-zinc-500 hover:text-zinc-900 underline"
                        >
                          Restart 1-Hr
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => copyApproveUrl(auction.id)}
                      className="p-2 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-zinc-500 hover:text-zinc-800 transition-colors"
                      title="Copy Direct 1-Click Approve Link"
                    >
                      {copiedId === auction.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* HIGHLIGHTED WINNER CARD SECTION (When an auction is won) */}
                {hasWon && winningBid && (
                  <div className="mt-4 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-emerald-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                          <Trophy size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                            <span>Winner: <strong className="font-extrabold text-emerald-900 text-sm">{winningBid.bidderName}</strong></span>
                            <span className="font-mono text-[11px] bg-white px-1.5 py-0.2 rounded border border-emerald-200 text-zinc-600">ID: {winningBid.bidderId}</span>
                          </div>
                          <div className="text-[11px] text-emerald-800 mt-0.5">
                            Placed winning bid {new Date(winningBid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Total {auction.bids.length} bids placed
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:text-right">
                        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Winning Price</div>
                        <div className="text-lg font-black text-emerald-700">
                          ${winningBid.amount.toLocaleString()} <span className="text-xs font-bold text-emerald-600">({savings}% OFF)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Unlocked Secret Voucher</span>
                        <div className="flex items-center justify-between mt-1">
                          <code className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-sm">
                            {auction.discountCode || 'N/A'}
                          </code>
                          <button
                            onClick={() => copyVoucherCode(auction.id, auction.discountCode)}
                            className="p-1 text-zinc-400 hover:text-zinc-800 rounded"
                            title="Copy Voucher Code"
                          >
                            {copiedCodeId === auction.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Payment Status</span>
                        <div className="mt-1 font-bold">
                          {auction.isPaid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle size={12} /> Paid & Voucher Claimed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Clock size={12} /> Unpaid (Awaiting Checkout)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Founder Contact</span>
                        <a
                          href={`mailto:${auction.contactEmail}`}
                          className="text-orange-600 hover:underline font-bold block truncate mt-1"
                        >
                          {auction.contactEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Offer Details Grid */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50/70 p-3.5 rounded-xl border border-zinc-100 text-xs">
                  <div>
                    <span className="text-zinc-400 font-semibold block text-[10px] uppercase">The Offer</span>
                    <span className="font-bold text-zinc-900">{auction.offerText}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Retail Worth</span>
                    <span className="font-bold text-orange-600">${auction.worthValue?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Secret Voucher Code</span>
                    <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-900 inline-block">
                      {auction.discountCode || 'N/A'}
                    </code>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Founder Email</span>
                    <a
                      href={`mailto:${auction.contactEmail}`}
                      className="text-orange-600 hover:underline font-medium block truncate"
                    >
                      {auction.contactEmail || 'N/A'}
                    </a>
                  </div>
                </div>

                {/* Bid History Accordion Button */}
                {auction.bids && auction.bids.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-100">
                    <button
                      onClick={() => setExpandedBidsId(isExpanded ? null : auction.id)}
                      className="flex items-center justify-between w-full text-xs font-bold text-zinc-600 hover:text-zinc-900 py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-zinc-400" />
                        <span>Inspect All Bids ({auction.bids.length})</span>
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden text-xs">
                        <div className="grid grid-cols-3 bg-zinc-100/80 px-3.5 py-2 font-bold text-zinc-600 text-[11px] uppercase">
                          <span>Bidder</span>
                          <span className="text-right">Bid Amount</span>
                          <span className="text-right">Time</span>
                        </div>
                        <div className="divide-y divide-zinc-200/60 max-h-48 overflow-y-auto">
                          {[...auction.bids].reverse().map((bid, idx) => {
                            const isWinner = winningBid?.id === bid.id || winningBid?.bidderId === bid.bidderId;
                            return (
                              <div
                                key={bid.id || idx}
                                className={`grid grid-cols-3 px-3.5 py-2 items-center ${
                                  isWinner ? 'bg-emerald-50/80 font-bold text-emerald-950' : 'text-zinc-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  {isWinner && <Trophy size={12} className="text-emerald-600 shrink-0" />}
                                  <span className="truncate">{bid.bidderName}</span>
                                </div>
                                <div className={`text-right font-mono ${isWinner ? 'text-emerald-700 font-black' : 'font-semibold'}`}>
                                  ${bid.amount.toLocaleString()}
                                </div>
                                <div className="text-right text-[11px] text-zinc-400">
                                  {new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {auction.url && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-zinc-400">
                    <a
                      href={auction.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900"
                    >
                      <span>Website: {auction.url}</span>
                      <ExternalLink size={11} />
                    </a>
                    <span>Submitted: {new Date(auction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
