import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Auction } from '../types';
import { 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  Flame, 
  Trophy, 
  Sparkles, 
  Copy, 
  Check, 
  CreditCard, 
  ExternalLink, 
  Clock, 
  Tag, 
  Mail, X, RefreshCw
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';

export function Dashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [myOffers, setMyOffers] = useState<Auction[]>([]);
  const [myBids, setMyBids] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedVoucherId, setCopiedVoucherId] = useState<string | null>(null);
  const [dismissedWins, setDismissedWins] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('justbid_dismissed_wins') || '[]');
    } catch {
      return [];
    }
  });

  const localEmail = localStorage.getItem('justbid_user_email');
  const localAccountId = localStorage.getItem('justbid_account_id');
  const localName = localStorage.getItem('justbid_user_name');
  const effectiveId = user?.uid || localAccountId || (localEmail ? encodeURIComponent(localEmail) : '');

  const fetchDashboard = async () => {
    if (!effectiveId && !user && !localEmail) {
      setIsLoading(false);
      return;
    }
    
    try {
      setError(null);
      const queryId = user?.uid || localAccountId || localEmail || '';
      const emailQuery = user?.email || localEmail || '';
      const nameQuery = user?.name || localName || '';
      const res = await fetch(`/api/dashboard/${encodeURIComponent(queryId)}?email=${encodeURIComponent(emailQuery)}&name=${encodeURIComponent(nameQuery)}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setMyOffers(data.myOffers || []);
        setMyBids(data.myBids || []);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard', err);
      setError(err?.message || 'Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success');
    const auctionId = searchParams.get('auction_id');

    if (paymentSuccess && auctionId) {
      // Payment just returned. The server webhook should have confirmed it.
      // Remove query params and fetch dashboard to see updated status.
      setSearchParams({});
      fetchDashboard();
    } else {
      fetchDashboard();
    }
  }, [user, effectiveId, searchParams, setSearchParams]);

  const handlePay = async (auctionId: string) => {
    const accountId = user?.uid || localAccountId || localEmail;
    if (!accountId) return;
    try {
      const res = await fetch(`/api/auctions/${auctionId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissWin = (auctionId: string) => {
    setDismissedWins(prev => {
      const updated = [...prev, auctionId];
      localStorage.setItem('justbid_dismissed_wins', JSON.stringify(updated));
      return updated;
    });
  };

  const copyVoucher = (id: string, code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedVoucherId(id);
    setTimeout(() => setCopiedVoucherId(null), 2500);
  };

  const activeEmail = user?.email || localEmail || 'Guest User';
  const activeName = user?.name || localName || (activeEmail !== 'Guest User' ? activeEmail.split('@')[0] : 'Founder');
  const hasNoItems = myOffers.length === 0 && myBids.length === 0;

  // Determine all won auctions
  const now = Date.now();
  const wonAuctions = myBids.filter(auction => {
    const isEnded = (auction.endTime > 0 && now > auction.endTime) || auction.status !== 'approved';
    const isWinner = auction.winnerId === (user?.uid || localAccountId || localEmail) || 
      (isEnded && auction.bids && auction.bids.length > 0 && (
        auction.bids.reduce((p, c) => p.amount > c.amount ? p : c).bidderId === (user?.uid || localAccountId || localEmail) ||
        auction.bids.reduce((p, c) => p.amount > c.amount ? p : c).bidderName === activeName
      ));
    return isWinner && !dismissedWins.includes(auction.id);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">Your Dashboard</h1>
            {wonAuctions.length > 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Trophy size={12} /> {wonAuctions.length} Deal{wonAuctions.length > 1 ? 's' : ''} Won
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Tracking auctions & live bids for <strong className="text-zinc-800">{activeName}</strong> ({activeEmail})
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <span>Browse Live Auctions</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* TOP WINNER NOTIFICATIONS BANNER (Shows when user won an auction) */}
      {wonAuctions.length > 0 && (
        <div className="mb-8 space-y-4">
          {wonAuctions.map(wonAuction => {
            const highestBid = wonAuction.bids.length > 0
              ? Math.max(...wonAuction.bids.map(b => b.amount))
              : 0;
            const savings = Math.max(0, Math.round(((wonAuction.worthValue - highestBid) / wonAuction.worthValue) * 100));

            return (
              <div 
                key={`winner-card-${wonAuction.id}`}
                className="relative overflow-hidden bg-white text-zinc-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-emerald-200"
              >
                <div className="relative z-10">
                  {/* Top Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center flex-wrap gap-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-wider">
                        <Sparkles size={13} className="text-amber-500 animate-spin" />
                        <span>🎉 Winner Notification</span>
                      </div>
                      <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        {savings}% Savings • Saved ${(wonAuction.worthValue - highestBid).toLocaleString()}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDismissWin(wonAuction.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors shrink-0"
                      title="Dismiss to claims list"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Main Headline */}
                  <div className="space-y-1 mb-4">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 flex items-center gap-2">
                      <Trophy className="text-amber-500 shrink-0" size={24} />
                      Congratulations! You Won the {wonAuction.companyName} Deal!
                    </h2>
                    <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed max-w-2xl">
                      Your winning bid of <strong className="text-emerald-600 font-mono font-bold">${highestBid.toLocaleString()}</strong> placed you #1 for <strong className="text-zinc-800">{wonAuction.offerText}</strong> (Retail Value: ${wonAuction.worthValue.toLocaleString()}).
                    </p>
                  </div>

                  {/* Action Section: Voucher Revealed or Pay Now */}
                  {wonAuction.isPaid ? (
                    <div className="mt-5 p-4 sm:p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-600" /> Your Secret Voucher Code Unlocked
                          </span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <code className="font-mono text-xl sm:text-2xl font-black text-emerald-700 tracking-wider bg-white px-3 py-1 rounded-xl border border-emerald-200">
                              {wonAuction.discountCode || 'OFFER-CLAIMED'}
                            </code>
                            <button
                              onClick={() => copyVoucher(wonAuction.id, wonAuction.discountCode)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95"
                            >
                              {copiedVoucherId === wonAuction.id ? (
                                <>
                                  <Check size={14} className="text-emerald-700" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  <span>Copy Code</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-zinc-600 space-y-1">
                          <p className="font-semibold text-zinc-900">How to redeem:</p>
                          <p className="text-[11px] text-zinc-500">
                            Apply this promo voucher code directly on <a href={wonAuction.url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-medium">{wonAuction.companyName}</a> during checkout or sign up.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 p-4 sm:p-5 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-amber-600 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                          <Clock size={14} /> Next Step: Complete Payment to Unlock Voucher
                        </div>
                        <p className="text-zinc-500 text-xs mt-1">
                          Secure your winning price of <strong className="text-emerald-600 font-mono">${highestBid.toLocaleString()}</strong> to reveal the secret discount voucher code immediately.
                        </p>
                      </div>
                      <button
                        onClick={() => handlePay(wonAuction.id)}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 shrink-0"
                      >
                        <CreditCard size={16} />
                        <span>Pay ${highestBid.toLocaleString()} & Claim Perk</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 text-center text-zinc-400 text-xs">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading dashboard data...
        </div>
      ) : error ? (
        <div className="py-16 text-center border border-dashed border-red-200 rounded-2xl bg-red-50 p-6">
          <Flame className="mx-auto text-red-400 mb-2" size={32} />
          <h3 className="text-base font-bold text-zinc-900 mb-1">Connection Error</h3>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mb-4">
            {error}. The server might have restarted while you were loading the page.
          </p>
          <button 
            onClick={() => { setIsLoading(true); fetchDashboard(); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      ) : hasNoItems ? (
        <div className="py-16 text-center border border-dashed border-zinc-200 rounded-2xl bg-white/70 p-6">
          <Flame className="mx-auto text-orange-400 mb-2" size={32} />
          <h3 className="text-base font-bold text-zinc-900 mb-1">No Active Offers or Bids Found</h3>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto mb-4">
            You haven't placed a bid or posted an auction under this email yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <span>Explore Live Auctions</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* My Bids Section */}
          <section>
            <div className="flex items-center justify-between mb-3 border-b border-zinc-200/80 pb-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span>My Active & Won Bids</span>
                <span className="text-xs font-mono font-medium text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
                  {myBids.length}
                </span>
              </h2>
            </div>

            {myBids.length === 0 ? (
              <p className="text-zinc-400 text-xs py-4">No bids placed yet.</p>
            ) : (
              <div className="space-y-3.5">
                {myBids.map(auction => {
                  const isEnded = (auction.endTime > 0 && now > auction.endTime) || auction.status !== 'approved';
                  const currentHighest = auction.bids.length > 0 ? Math.max(...auction.bids.map(b => b.amount)) : 0;
                  const myHighestBid = Math.max(...auction.bids.filter(b => 
                    b.bidderId === (user?.uid || localAccountId || localEmail) || 
                    b.bidderName === activeName ||
                    b.bidderName === (user?.email?.split('@')[0] || localEmail)
                  ).map(b => b.amount), 0);
                  const amILeading = myHighestBid >= currentHighest;
                  const iWon = isEnded && (
                    auction.winnerId === (user?.uid || localAccountId || localEmail) ||
                    (auction.bids.length > 0 && auction.bids.reduce((p, c) => p.amount > c.amount ? p : c).bidderName === activeName)
                  );

                  return (
                    <div 
                      key={auction.id} 
                      className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${
                        iWon 
                          ? 'border-emerald-300 ring-1 ring-emerald-100 bg-gradient-to-r from-emerald-50/20 via-white to-white' 
                          : 'border-zinc-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                              {iWon && <Trophy size={14} className="text-emerald-600" />}
                              {auction.companyName}
                            </span>
                            <span className="text-[11px] text-zinc-500 font-mono">Worth ${auction.worthValue.toLocaleString()}</span>
                            <span className="text-[10px] bg-zinc-100 text-zinc-600 font-semibold px-2 py-0.5 rounded-md">
                              {auction.category}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm sm:text-base text-zinc-900">{auction.offerText}</h3>
                          
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {isEnded ? (
                              iWon ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
                                  <Trophy size={13} className="text-emerald-700" /> You Won this Deal!
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-lg border border-zinc-200">
                                  Auction Ended
                                </span>
                              )
                            ) : (
                              amILeading ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-100 text-orange-800 text-xs font-bold rounded-lg border border-orange-200 animate-pulse">
                                  Leading Bid (${myHighestBid})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 text-xs font-medium rounded-lg border border-amber-200">
                                  Outbid (Highest: ${currentHighest})
                                </span>
                              )
                            )}

                            {auction.isPaid && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Paid & Claimed
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right w-full sm:w-auto bg-zinc-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                          {iWon && !auction.isPaid && (
                            <div className="flex flex-col items-start sm:items-end gap-1.5">
                              <p className="text-xs text-zinc-600 font-medium">
                                Winning Bid: <span className="font-bold text-emerald-700 font-mono">${myHighestBid || currentHighest}</span>
                              </p>
                              <button 
                                onClick={() => handlePay(auction.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                              >
                                Pay & Unlock Voucher
                              </button>
                            </div>
                          )}
                          {iWon && auction.isPaid && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left sm:text-right">
                              <p className="text-[10px] text-emerald-700 font-bold mb-0.5 uppercase tracking-wide flex items-center sm:justify-end gap-1">
                                <Lock size={12} /> Voucher Code
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono font-bold text-base text-zinc-900 select-all">{auction.discountCode}</p>
                                <button
                                  onClick={() => copyVoucher(auction.id, auction.discountCode)}
                                  className="p-1 text-zinc-400 hover:text-zinc-800 rounded"
                                  title="Copy Code"
                                >
                                  {copiedVoucherId === auction.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                </button>
                              </div>
                            </div>
                          )}
                          {!isEnded && (
                            <div className="text-left sm:text-right">
                              <div className="text-[10px] text-zinc-400 font-bold uppercase">Current Price</div>
                              <div className="text-lg font-bold text-orange-600 font-mono">${currentHighest}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* My Posted Offers Section */}
          <section>
            <div className="flex items-center justify-between mb-3 border-b border-zinc-200/80 pb-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                <span>My Startup Offers</span>
                <span className="text-xs font-mono font-medium text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
                  {myOffers.length}
                </span>
              </h2>
            </div>

            {myOffers.length === 0 ? (
              <p className="text-zinc-400 text-xs py-4">No startup offers posted under this account.</p>
            ) : (
              <div className="space-y-3">
                {myOffers.map(auction => (
                  <div key={auction.id} className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-zinc-900">{auction.companyName}</h3>
                          <span className="text-[11px] text-zinc-500 font-mono">Worth ${auction.worthValue.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-zinc-600 mt-0.5">{auction.offerText}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          auction.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          auction.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          (auction.endTime > 0 && Date.now() > auction.endTime) ? 'bg-zinc-100 text-zinc-600 border-zinc-200' : 
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {auction.status === 'pending' ? 'Pending Approval' :
                           auction.status === 'rejected' ? 'Rejected' :
                           (auction.endTime > 0 && Date.now() > auction.endTime) ? 'Ended' : 'Active Live'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 mb-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Your Secret Voucher Code</p>
                        <p className="font-mono font-bold text-zinc-900">{auction.discountCode}</p>
                      </div>
                      <div className="text-[11px] text-zinc-400 max-w-[220px] text-right">
                        Hidden from public. Unlocked only to the winning bidder after checkout.
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 pt-2.5">
                      <p className="text-xs font-semibold text-zinc-700 mb-1.5">
                        Bid History ({auction.bids.length} bids)
                      </p>
                      {auction.bids.length > 0 ? (
                        <div className="space-y-1">
                          {[...auction.bids].sort((a, b) => b.amount - a.amount).map((bid, i) => (
                            <div key={bid.id} className="text-xs flex justify-between items-center bg-zinc-50 px-2.5 py-1.5 rounded-lg border border-zinc-100">
                              <span className="text-zinc-600"><strong className="text-zinc-900 font-mono">#{i + 1}</strong> {bid.bidderName}</span>
                              <span className="font-bold text-orange-600 font-mono">${bid.amount}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400">No bids placed yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
