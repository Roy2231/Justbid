export type UserBid = {
  id: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
};

export type Auction = {
  id: string;
  authorId: string;
  companyName: string;
  url: string;
  description: string;
  offerText: string;
  category: string;
  worthValue: number;
  discountCode?: string; // Hidden unless authorized
  createdAt: number;
  endTime: number; // 0 if pending
  bids: UserBid[];
  winnerId?: string;
  isPaid: boolean;
  status: 'pending' | 'approved' | 'rejected';
  contactEmail: string;
};
