import React, { useState, useEffect } from 'react';
import { Timer, ArrowUpRight, Gift, Trophy, Gavel, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Auction } from '../types';
import { CATEGORIES } from '../categories';

interface AuctionItemProps {
  key?: React.Key;
  auction: Auction;
  rank?: number;
  onPlaceBidClick: (auction: Auction) => void;
}

export function AuctionItem({ auction, rank, onPlaceBidClick }: AuctionItemProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, auction.endTime - Date.now());
      setTimeLeft(remaining);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [auction.endTime]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'ENDED';
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const isEnded = timeLeft <= 0;
  const currentHighestBid = auction.bids.length > 0 
    ? Math.max(...auction.bids.map(b => b.amount)) 
    : 0;

  const categoryMeta = CATEGORIES.find(c => c.id === auction.category) || {
    color: 'text-zinc-700',
    bgColor: 'bg-zinc-50',
    borderColor: 'border-zinc-200'
  };

  const isRank1 = rank === 1;
  const isRank2 = rank === 2;
  const isRank3 = rank === 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-200 border bg-white ${
        isEnded 
          ? 'border-zinc-200 opacity-60 bg-zinc-50/50' 
          : isRank1
            ? 'border-orange-300/80 bg-gradient-to-r from-orange-50/40 via-white to-white shadow-sm hover:border-orange-400 hover:shadow-md'
            : isRank2
              ? 'border-teal-200/80 bg-gradient-to-r from-teal-50/30 via-white to-white shadow-sm hover:border-teal-300 hover:shadow-md'
              : isRank3
                ? 'border-amber-200/80 bg-gradient-to-r from-amber-50/30 via-white to-white shadow-sm hover:border-amber-300 hover:shadow-md'
                : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
      }`}
    >
      {/* Content */}
      <div className="flex-1 min-w-0 w-full">
        <div className="flex items-center justify-between sm:justify-start gap-2.5 mb-1.5 flex-wrap">
          {rank && (
            <div className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-lg text-xs tracking-tight ${
              isRank1 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm font-mono' 
                : isRank2 
                  ? 'bg-teal-600 text-white shadow-sm font-mono' 
                  : isRank3 
                    ? 'bg-amber-600 text-white shadow-sm font-mono' 
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono'
            }`}>
              {isRank1 && <Trophy size={11} className="mr-1" />}
              #{rank}
            </div>
          )}

          <h3 className="font-bold text-base sm:text-lg text-zinc-900 truncate flex items-center gap-1">
            <a href={auction.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors flex items-center gap-1">
              {auction.companyName}
              <ArrowUpRight size={14} className="text-zinc-400 group-hover:text-orange-500 transition-colors" />
            </a>
          </h3>

          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
            isEnded 
              ? 'bg-zinc-100 text-zinc-500 border-zinc-200' 
              : 'bg-rose-50 text-rose-600 border-rose-200/80 animate-pulse'
          }`}>
            <Timer size={12} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
        
        <p className="text-xs sm:text-sm text-zinc-600 mb-3 line-clamp-2 leading-relaxed">
          {auction.description}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-900 border border-orange-200/80">
            <Gift size={13} className="text-orange-600 shrink-0" />
            {auction.offerText}
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${categoryMeta.bgColor} ${categoryMeta.color} ${categoryMeta.borderColor}`}>
            {auction.category}
          </span>
          <span className="text-[11px] font-mono text-zinc-500 px-2 py-0.5 rounded-md bg-zinc-100/80 border border-zinc-200">
            Worth ${auction.worthValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Stats / Action */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 sm:pl-4">
        <div className="text-left sm:text-right">
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">
            {isEnded ? 'Winning Bid' : 'Current Bid'}
          </div>
          <div className="font-bold text-xl sm:text-2xl text-orange-600 font-mono">
            ${currentHighestBid.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
            {auction.bids.length} bid{auction.bids.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <button
          onClick={() => onPlaceBidClick(auction)}
          disabled={isEnded}
          className={`mt-0 sm:mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            isEnded 
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200'
              : 'bg-zinc-900 hover:bg-orange-600 text-white shadow-sm hover:shadow active:scale-95'
          }`}
        >
          <Gavel size={14} />
          {isEnded ? 'Ended' : 'Place Bid'}
        </button>
      </div>
    </motion.div>
  );
}
