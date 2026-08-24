import React, { useEffect, useState, useRef } from 'react';
import { Flame, Plus, TrendingUp, Sparkles, Search, ChevronDown, Check, Zap } from 'lucide-react';
import { Auction } from '../types';
import { PostOfferModal } from '../components/PostOfferModal';
import { PlaceBidModal } from '../components/PlaceBidModal';
import { AuctionItem } from '../components/AuctionItem';
import { useAuth } from '../components/AuthContext';
import { CATEGORIES, PRIMARY_CHIPS } from '../categories';

export function Home() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>(() => {
    try {
      const cached = localStorage.getItem('justbid_cached_auctions');
      if (cached) return JSON.parse(cached);
    } catch (e) {
      // ignore
    }
    return [];
  });
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedAuctionForBid, setSelectedAuctionForBid] = useState<Auction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAuctions = async () => {
    try {
      const res = await fetch('/api/auctions', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAuctions(data);
          try {
            localStorage.setItem('justbid_cached_auctions', JSON.stringify(data));
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      // Soft fallback to cached data if network briefly interrupted
      try {
        const cached = localStorage.getItem('justbid_cached_auctions');
        if (cached && auctions.length === 0) {
          setAuctions(JSON.parse(cached));
        }
      } catch (e) {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePostOfferClick = () => {
    // Frictionless: Open modal directly!
    setIsPostModalOpen(true);
  };

  const handlePlaceBidClick = (auction: Auction) => {
    // Frictionless: Open modal directly!
    setSelectedAuctionForBid(auction);
  };

  const handlePostOffer = async (newOffer: any) => {
    try {
      const localId = localStorage.getItem('justbid_account_id');
      const authorId = user?.uid || localId || 'user_' + newOffer.contactEmail.replace(/[^a-zA-Z0-9]/g, '_');
      
      const res = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newOffer, authorId })
      });
      if (res.ok) {
        await fetchAuctions();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to post offer');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handlePlaceBid = async (auctionId: string, bidderName: string, amount: number, email?: string) => {
    try {
      const localId = localStorage.getItem('justbid_account_id');
      const bidderId = user?.uid || localId || (email ? 'user_' + email.replace(/[^a-zA-Z0-9]/g, '_') : 'user_guest_' + Math.random().toString(36).substring(2, 7));
      
      const res = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bidderName: bidderName || user?.email?.split('@')[0] || 'Anonymous', 
          amount, 
          bidderId 
        })
      });
      if (res.ok) {
        await fetchAuctions();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to place bid');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const filteredAuctions = auctions.filter(a => {
    const matchCat = selectedCategory === 'All' || a.category === selectedCategory;
    const matchSearch = a.companyName.toLowerCase().includes(search.toLowerCase()) || 
                        a.description.toLowerCase().includes(search.toLowerCase()) ||
                        a.category.toLowerCase().includes(search.toLowerCase()) ||
                        a.offerText.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-[#FAFAFA]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-orange-100/30 via-amber-50/20 to-transparent blur-3xl opacity-70" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Top Announcement Bar */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200/80 text-xs text-zinc-700 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-zinc-900">760+ Live Online</span>
            <span className="text-zinc-300">•</span>
            <span>1-Hour Startup Flash Auctions</span>
          </div>
        </div>

        {/* Hero Header */}
        <header className="text-center mb-10 max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mb-2.5">
            Startup Credits & Discounts Marketplace
          </h1>
          
          <p className="text-xs sm:text-sm text-zinc-600 mb-6 leading-relaxed">
            Leading tech companies list high-value credits, perks, and discounts. Bid live in 1-hour fast auctions to win exclusive deals for your startup.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handlePostOfferClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-[0_4px_14px_rgba(234,88,12,0.3)] hover:shadow-[0_6px_20px_rgba(234,88,12,0.4)] active:scale-95"
            >
              <Sparkles size={16} />
              <span>Start an Auction</span>
            </button>
            <a
              href="#auctions-list"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200/90 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-sm"
            >
              <Flame size={15} className="text-amber-500" />
              <span>View Leaderboard</span>
            </a>
          </div>
        </header>

        {/* Search & Category Filter Section */}
        <div className="mb-8 space-y-3.5">
          {/* Search bar */}
          <div className="flex items-center bg-white border border-zinc-200/90 rounded-2xl px-3.5 py-2 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <Search size={16} className="text-zinc-400 mr-2.5 shrink-0" />
            <input 
              type="text"
              placeholder="Search companies, credits, or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none focus:outline-none flex-1 text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-xs text-zinc-400 hover:text-zinc-600 px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Category Chips with 'More' Dropdown */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {PRIMARY_CHIPS.map(catId => {
              const cat = CATEGORIES.find(c => c.id === catId);
              if (!cat) return null;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 border ${
                    isSelected 
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'bg-white text-zinc-600 border-zinc-200/90 hover:border-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  <span>{cat.shortName}</span>
                </button>
              );
            })}

            {/* More Categories Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 border ${
                  !PRIMARY_CHIPS.includes(selectedCategory) && selectedCategory !== 'All'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-white text-zinc-600 border-zinc-200/90 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                <span>
                  {!PRIMARY_CHIPS.includes(selectedCategory) && selectedCategory !== 'All' 
                    ? activeCategoryObj?.shortName || 'More' 
                    : 'More'}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute right-0 sm:left-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 p-2 text-xs space-y-0.5">
                  <div className="px-2.5 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    All Categories ({CATEGORIES.length - 1})
                  </div>
                  {CATEGORIES.filter(c => c.id !== 'All').map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                          isSelected 
                            ? 'bg-orange-50 text-orange-900 font-bold' 
                            : 'text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <span className="truncate pr-2">{cat.name}</span>
                        {isSelected && <Check size={14} className="text-orange-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard / Auctions list */}
        <main id="auctions-list">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-zinc-900">
              <Flame size={18} className="text-orange-500" />
              <span>Live Leaderboard</span>
              {selectedCategory !== 'All' && (
                <span className="text-xs font-normal text-zinc-500">
                  in <strong className="text-zinc-800">{activeCategoryObj?.name}</strong>
                </span>
              )}
            </h2>
            <div className="text-xs font-mono font-medium text-zinc-500 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
              {filteredAuctions.length} Active
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-zinc-400 text-xs">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading live auctions...
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAuctions.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-zinc-200 rounded-2xl bg-white/60">
                  <p className="text-xs sm:text-sm text-zinc-500 mb-3">No active auctions in this category yet.</p>
                  <button
                    onClick={handlePostOfferClick}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Plus size={14} />
                    <span>Be the First to List an Offer</span>
                  </button>
                </div>
              ) : (
                filteredAuctions.map((auction, index) => (
                  <AuctionItem 
                    key={auction.id} 
                    auction={auction} 
                    rank={index + 1}
                    onPlaceBidClick={handlePlaceBidClick}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <PostOfferModal 
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={handlePostOffer}
      />

      <PlaceBidModal 
        isOpen={!!selectedAuctionForBid}
        auction={selectedAuctionForBid}
        onClose={() => setSelectedAuctionForBid(null)}
        onSubmit={handlePlaceBid}
      />
    </>
  );
}
