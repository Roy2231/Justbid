import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import DodoPayments from "dodopayments";
import nodemailer from "nodemailer";

function getAdminEmails(): string[] {
  const envAdmins = (process.env.ADMIN_EMAIL || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (envAdmins.length > 0) {
    return Array.from(new Set(envAdmins));
  }
  return ["princemrb89@gmail.com"];
}

// Determine the safe sender address based on provider
function getSenderAddress(): string {
  const isResend =
    process.env.SMTP_HOST?.includes("resend") ||
    process.env.SMTP_USER?.toLowerCase() === "resend" ||
    !!process.env.RESEND_API_KEY;

  if (isResend) {
    const customFrom = process.env.SMTP_FROM?.trim();
    // Resend prohibits using @gmail.com or other public webmail domains as the 'from' address
    if (
      customFrom &&
      !customFrom.toLowerCase().includes("@gmail.") &&
      !customFrom.toLowerCase().includes("@yahoo.") &&
      !customFrom.toLowerCase().includes("@hotmail.") &&
      !customFrom.toLowerCase().includes("@outlook.")
    ) {
      return customFrom;
    }
    // Default allowed sender for Resend
    return "JustBid Notifications <onboarding@resend.dev>";
  }

  if (process.env.GMAIL_USER) {
    return process.env.GMAIL_USER;
  }

  if (process.env.SMTP_FROM) {
    return process.env.SMTP_FROM;
  }

  return "JustBid Notifications <onboarding@resend.dev>";
}

// Setup email transport
const createEmailTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS,
      },
    });
  }

  // Fallback test account or direct transport
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (e) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }
};

async function sendAdminNotificationEmail(auction: Auction) {
  const adminRecipients = getAdminEmails();
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const approveUrl = `${appUrl}/api/admin/approve/${auction.id}`;
  const rejectUrl = `${appUrl}/api/admin/reject/${auction.id}`;

  const subject = `⚡ [JustBid Approval Request] New Offer: ${auction.companyName} ($${auction.worthValue.toLocaleString()} Value)`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; padding: 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 6px 0 0 0; opacity: 0.9; font-size: 13px; }
      .content { padding: 24px; font-size: 14px; line-height: 1.6; }
      .badge { display: inline-block; background: #ffedd5; color: #9a3412; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-bottom: 12px; }
      .card { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin: 16px 0; }
      .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
      .row strong { color: #52525b; font-weight: 600; }
      .row span { color: #09090b; font-weight: 700; }
      .actions { display: flex; gap: 12px; margin: 24px 0 12px 0; }
      .btn { display: inline-block; padding: 12px 20px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; text-align: center; }
      .btn-approve { background: #16a34a; color: #ffffff !important; }
      .btn-reject { background: #dc2626; color: #ffffff !important; }
      .footer { border-top: 1px solid #e4e4e7; padding: 16px 24px; font-size: 12px; color: #71717a; text-align: center; background: #fafafa; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>JustBid — New Auction Approval Request</h1>
        <p>A founder submitted a new startup offer requiring your approval</p>
      </div>
      <div class="content">
        <span class="badge">PENDING APPROVAL</span>
        <h2 style="margin: 0 0 4px 0; font-size: 18px; color: #09090b;">${auction.companyName}</h2>
        <p style="margin: 0 0 16px 0; color: #52525b; font-size: 13px;">${auction.description || "No description provided."}</p>

        <div class="card">
          <div style="font-size: 11px; font-weight: bold; color: #ea580c; text-transform: uppercase; margin-bottom: 4px;">The Offer:</div>
          <div style="font-size: 15px; font-weight: bold; color: #09090b; margin-bottom: 12px;">${auction.offerText}</div>

          <div style="font-size: 13px; line-height: 1.8;">
            <div><strong>Website:</strong> <a href="${auction.url}" target="_blank" style="color: #ea580c;">${auction.url}</a></div>
            <div><strong>Category:</strong> ${auction.category}</div>
            <div><strong>Retail Worth:</strong> $${auction.worthValue.toLocaleString()}</div>
            <div><strong>Secret Promo Code:</strong> <code style="background: #e4e4e7; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${auction.discountCode || "N/A"}</code></div>
            <div><strong>Founder Email:</strong> <a href="mailto:${auction.contactEmail}">${auction.contactEmail}</a></div>
          </div>
        </div>

        <p style="font-size: 13px; color: #3f3f46; margin: 16px 0 8px 0;">
          <strong>Quick Action:</strong> Click below to immediately approve or reject this auction:
        </p>

        <div style="margin: 16px 0;">
          <a href="${approveUrl}" class="btn btn-approve" style="display: inline-block; margin-right: 8px; margin-bottom: 8px; color: #ffffff;">
            ✅ Approve & Start 1-Hour Auction
          </a>
          <a href="${rejectUrl}" class="btn btn-reject" style="display: inline-block; margin-right: 8px; margin-bottom: 8px; color: #ffffff;">
            ❌ Reject Offer
          </a>
        </div>

        <p style="font-size: 11px; color: #71717a; margin-top: 16px;">
          Direct Approve Link: <a href="${approveUrl}" style="color: #ea580c; word-break: break-all;">${approveUrl}</a><br>
          Direct Reject Link: <a href="${rejectUrl}" style="color: #ea580c; word-break: break-all;">${rejectUrl}</a>
        </p>
      </div>
      <div class="footer">
        JustBid Notifications • Sent to <strong>${adminRecipients.join(", ")}</strong>
      </div>
    </div>
  </body>
  </html>
  `;

  console.log(`\n\n=============================================================================`);
  console.log(`✉️ [JUSTBID DISPATCH] NOTIFICATION SENT TO ADMINS: ${adminRecipients.join(", ")}`);
  console.log(`Auction: ${auction.companyName} | ${auction.offerText} ($${auction.worthValue})`);
  console.log(`Founder Email: ${auction.contactEmail}`);
  console.log(`Approve Link: ${approveUrl}`);
  console.log(`Reject Link:  ${rejectUrl}`);
  console.log(`=============================================================================\n\n`);

  const fromAddress = getSenderAddress();
  const dispatchResults: Array<{ recipient: string; provider: string; status: string; info?: any; error?: string }> = [];

  // 1. Try Resend REST API if RESEND_API_KEY is available
  if (process.env.RESEND_API_KEY) {
    for (const recipient of adminRecipients) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [recipient],
            subject,
            html: htmlContent,
            text: `JustBid New Auction Approval Request\n\nCompany: ${auction.companyName}\nOffer: ${auction.offerText}\nRetail Worth: $${auction.worthValue}\nFounder Email: ${auction.contactEmail}\nSecret Voucher: ${auction.discountCode}\n\nApprove: ${approveUrl}\nReject: ${rejectUrl}`,
          }),
        });

        const resData = (await res.json().catch(() => ({}))) as any;
        if (res.ok && resData?.id) {
          console.log(`Email dispatched to ${recipient} via Resend API. ID:`, resData.id);
          dispatchResults.push({ recipient, provider: "Resend", status: "sent", info: resData });
        } else {
          const errorMsg = resData?.message || (resData?.name === 'validation_error' ? 'Recipient unverified in Resend test mode' : 'Resend dispatch rejected');
          console.log(`ℹ️ Resend note for ${recipient}: ${errorMsg}`);
          dispatchResults.push({ recipient, provider: "Resend", status: "restricted_or_failed", error: errorMsg });
        }
      } catch (apiErr: any) {
        console.log(`Resend API fetch notice for ${recipient}:`, apiErr.message || apiErr);
        dispatchResults.push({ recipient, provider: "Resend", status: "error", error: apiErr.message });
      }
    }
  }

  // 2. Also send via SMTP / Gmail if configured
  if (process.env.GMAIL_USER || process.env.SMTP_HOST) {
    try {
      const transporter = await createEmailTransporter();
      for (const recipient of adminRecipients) {
        try {
          const info = await transporter.sendMail({
            from: fromAddress,
            to: recipient,
            subject,
            text: `JustBid New Auction Approval Request\n\nCompany: ${auction.companyName}\nOffer: ${auction.offerText}\nRetail Worth: $${auction.worthValue}\nFounder Email: ${auction.contactEmail}\nSecret Voucher: ${auction.discountCode}\n\nApprove: ${approveUrl}\nReject: ${rejectUrl}`,
            html: htmlContent,
          });
          console.log(`Email dispatched to ${recipient} via SMTP/Gmail. Message ID:`, (info as any).messageId);
          dispatchResults.push({ recipient, provider: "SMTP/Gmail", status: "sent", info });
        } catch (subErr: any) {
          console.error(`SMTP send failed for ${recipient}:`, subErr.message || subErr);
          dispatchResults.push({ recipient, provider: "SMTP/Gmail", status: "failed", error: subErr.message });
        }
      }
    } catch (err: any) {
      console.error(`Failed to create email transporter:`, err.message || err);
    }
  }

  return { success: true, dispatchResults, approveUrl, rejectUrl, adminRecipients };
}

async function sendAdminWinnerNotificationEmail(auction: Auction, winningBid: UserBid) {
  const adminRecipients = getAdminEmails();
  const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const adminUrl = `${appUrl}/admin`;

  const savings = Math.max(0, Math.round(((auction.worthValue - winningBid.amount) / auction.worthValue) * 100));
  const subject = `🏆 [JustBid Winner Alert] ${winningBid.bidderName} WON ${auction.companyName} with $${winningBid.amount.toLocaleString()} Bid!`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 26px; text-align: center; }
      .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
      .header p { margin: 6px 0 0 0; opacity: 0.95; font-size: 13px; }
      .content { padding: 24px; font-size: 14px; line-height: 1.6; }
      .trophy-badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px; }
      .card { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 18px; margin: 16px 0; }
      .row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; border-bottom: 1px dashed #e4e4e7; padding-bottom: 8px; }
      .row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
      .row strong { color: #52525b; font-weight: 600; }
      .row span { color: #09090b; font-weight: 700; }
      .voucher-box { background: #f0fdf4; border: 1.5px dashed #86efac; border-radius: 10px; padding: 12px; text-align: center; margin: 16px 0; font-family: monospace; font-size: 16px; font-weight: 800; color: #15803d; }
      .btn { display: inline-block; background: #ea580c; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; text-align: center; }
      .footer { padding: 16px 24px; background: #f4f4f5; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🏆 Auction Concluded with a Winner!</h1>
        <p>A founder deal has been successfully won on JustBid</p>
      </div>
      <div class="content">
        <span class="trophy-badge">WINNING BID: $${winningBid.amount.toLocaleString()} (${savings}% Discount)</span>
        
        <div class="card">
          <div class="row">
            <strong>Company Offer:</strong>
            <span>${auction.companyName}</span>
          </div>
          <div class="row">
            <strong>Perk Details:</strong>
            <span>${auction.offerText}</span>
          </div>
          <div class="row">
            <strong>Original Retail Value:</strong>
            <span style="color:#ea580c;">$${auction.worthValue.toLocaleString()}</span>
          </div>
          <div class="row">
            <strong>Winner Name:</strong>
            <span style="color:#059669;">${winningBid.bidderName}</span>
          </div>
          <div class="row">
            <strong>Winner Account ID:</strong>
            <span style="font-family:monospace;font-size:11px;">${winningBid.bidderId}</span>
          </div>
          <div class="row">
            <strong>Total Bids Placed:</strong>
            <span>${auction.bids.length} bids</span>
          </div>
          <div class="row">
            <strong>Founder Email:</strong>
            <span>${auction.contactEmail}</span>
          </div>
        </div>

        <p style="margin: 12px 0 6px 0; font-size: 12px; color: #52525b; font-weight: 600;">UNLOCKED SECRET VOUCHER CODE:</p>
        <div class="voucher-box">
          ${auction.discountCode || 'N/A'}
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <a href="${adminUrl}" class="btn">Open Admin Moderation Center →</a>
        </div>
      </div>
      <div class="footer">
        JustBid Notifications • Sent to <strong>${adminRecipients.join(", ")}</strong>
      </div>
    </div>
  </body>
  </html>
  `;

  console.log(`\n=============================================================================`);
  console.log(`🏆 [JUSTBID WINNER NOTIFICATION] SENT TO ADMINS: ${adminRecipients.join(", ")}`);
  console.log(`Company: ${auction.companyName} | Winner: ${winningBid.bidderName} ($${winningBid.amount})`);
  console.log(`Voucher: ${auction.discountCode}`);
  console.log(`=============================================================================\n`);

  const fromAddress = getSenderAddress();

  if (process.env.RESEND_API_KEY) {
    for (const recipient of adminRecipients) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [recipient],
            subject,
            html: htmlContent,
            text: `JustBid Auction Winner Alert!\n\n${winningBid.bidderName} won ${auction.companyName} (${auction.offerText}) with a winning bid of $${winningBid.amount}.\nRetail Worth: $${auction.worthValue}\nSecret Voucher: ${auction.discountCode}\nFounder: ${auction.contactEmail}\n\nView Admin Center: ${adminUrl}`,
          }),
        });
      } catch (e: any) {
        console.log(`Resend winner alert notice:`, e.message || e);
      }
    }
  }

  if (process.env.GMAIL_USER || process.env.SMTP_HOST) {
    try {
      const transporter = await createEmailTransporter();
      for (const recipient of adminRecipients) {
        try {
          await transporter.sendMail({
            from: fromAddress,
            to: recipient,
            subject,
            text: `JustBid Auction Winner Alert!\n\n${winningBid.bidderName} won ${auction.companyName} (${auction.offerText}) with a winning bid of $${winningBid.amount}.\nRetail Worth: $${auction.worthValue}\nSecret Voucher: ${auction.discountCode}\nFounder: ${auction.contactEmail}\n\nView Admin Center: ${adminUrl}`,
            html: htmlContent,
          });
        } catch (e: any) {
          console.log(`SMTP winner alert send notice:`, e.message || e);
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

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
  discountCode?: string; 
  createdAt: number;
  endTime: number;
  bids: UserBid[];
  winnerId?: string;
  isPaid: boolean;
  status: 'pending' | 'approved' | 'rejected';
  contactEmail: string;
};

const ONE_HOUR = 60 * 60 * 1000;

const initialDefaultAuctions: Auction[] = [
  {
    id: "1",
    authorId: "acc_demo1",
    companyName: "NeuralMesh",
    url: "https://neuralmesh.io",
    description: "Distributed cloud GPU computing and LLM orchestration pipeline for AI agents.",
    offerText: "$15,000 AI Infrastructure & Cloud GPU Credits",
    category: "AI Agents & Infrastructure",
    worthValue: 17005,
    discountCode: "NEURALMESH-INFRA-2026",
    createdAt: Date.now() - 1000 * 60 * 20,
    endTime: Date.now() + 1000 * 60 * 40,
    bids: [
      { id: "b1", bidderId: "user_a", bidderName: "Jordan Blake", amount: 450, timestamp: Date.now() - 1000 * 60 * 15 },
      { id: "b2", bidderId: "user_b", bidderName: "Rachel Sterling", amount: 1200, timestamp: Date.now() - 1000 * 60 * 5 }
    ],
    isPaid: false,
    status: 'approved',
    contactEmail: 'founders@neuralmesh.io',
  },
  {
    id: "2",
    authorId: "acc_demo2",
    companyName: "Virallo",
    url: "https://virallo.app",
    description: "All-in-one marketplace to monetize creator performance and drive viral influencer campaigns.",
    offerText: "$10,000 Creator Ads Grant + Lifetime Pro Tier",
    category: "Marketing & Advertising",
    worthValue: 16000,
    discountCode: "VIRALLO-CREATOR-ADS",
    createdAt: Date.now() - 1000 * 60 * 10,
    endTime: Date.now() + 1000 * 60 * 50,
    bids: [
      { id: "b3", bidderId: "user_c", bidderName: "Marcus Vance", amount: 820, timestamp: Date.now() - 1000 * 60 * 8 }
    ],
    isPaid: false,
    status: 'approved',
    contactEmail: 'team@virallo.app',
  },
  {
    id: "3",
    authorId: "acc_demo3",
    companyName: "CognitiveOS",
    url: "https://cognitiveos.ai",
    description: "Your Personal AI Computer. Autonomous tasks, data research, and browser actions.",
    offerText: "1-Year Enterprise AI Workspace for 20 seats",
    category: "Productivity & Personal Tools",
    worthValue: 14028,
    discountCode: "COGNITIVE-ENT-20X",
    createdAt: Date.now() - 1000 * 60 * 25,
    endTime: Date.now() + 1000 * 60 * 35,
    bids: [
      { id: "b4", bidderId: "user_d", bidderName: "Chloe Rivera", amount: 650, timestamp: Date.now() - 1000 * 60 * 12 }
    ],
    isPaid: false,
    status: 'approved',
    contactEmail: 'hello@cognitiveos.ai',
  },
  {
    id: "4",
    authorId: "acc_demo4",
    companyName: "VectorScout",
    url: "https://vectorscout.io",
    description: "Next-gen generative engine optimization (GEO) and AI search visibility tracking.",
    offerText: "$8,000 Annual GEO Indexing Credits",
    category: "SEO & AI Visibility",
    worthValue: 9500,
    discountCode: "VECTORSCOUT-GEO-8K",
    createdAt: Date.now() - 1000 * 60 * 15,
    endTime: Date.now() + 1000 * 60 * 45,
    bids: [
      { id: "b5", bidderId: "user_e", bidderName: "Lucas Lindqvist", amount: 320, timestamp: Date.now() - 1000 * 60 * 6 }
    ],
    isPaid: false,
    status: 'approved',
    contactEmail: 'founders@vectorscout.io',
  }
];

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "auctions.json");

function loadAuctions(): Auction[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error loading persisted auctions:", err);
  }
  // Initialize with defaults if no file exists
  saveAuctions(initialDefaultAuctions);
  return [...initialDefaultAuctions];
}

function saveAuctions(data: Auction[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving persisted auctions:", err);
  }
}

let auctions: Auction[] = loadAuctions();

// Helper to evaluate winners
const evaluateAuctions = () => {
  let changed = false;
  auctions.forEach(auction => {
    if (auction.status === 'approved' && auction.endTime > 0 && Date.now() > auction.endTime && !auction.winnerId && auction.bids.length > 0) {
      const highestBid = auction.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
      auction.winnerId = highestBid.bidderId;
      changed = true;
      
      // Dispatch real-time winner email notification to princemrb89@gmail.com
      sendAdminWinnerNotificationEmail(auction, highestBid).catch(err => {
        console.error("Failed to send admin winner notification email:", err);
      });
    }
  });
  if (changed) {
    saveAuctions(auctions);
  }
};

const sanitizeAuction = (auction: Auction) => {
  const { discountCode, ...rest } = auction;
  return rest;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // Get all auctions (public)
  app.get("/api/auctions", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      evaluateAuctions();
      // Return all approved auctions, hide discount codes
      const sanitizedAuctions = auctions
        .filter(a => a.status === 'approved')
        .map(a => sanitizeAuction(a))
        .sort((a, b) => b.worthValue - a.worthValue);
      res.json(sanitizedAuctions);
    } catch (err: any) {
      console.error("Error in /api/auctions:", err);
      res.status(500).json({ error: "Failed to retrieve auctions" });
    }
  });

  // Get user dashboard data
  app.get("/api/dashboard/:accountId", (req, res) => {
    try {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      evaluateAuctions();
      const rawAccountId = req.params.accountId || '';
      const accountId = decodeURIComponent(rawAccountId).toLowerCase().trim();
      const emailParam = ((req.query.email as string) || '').toLowerCase().trim();
      const nameParam = ((req.query.name as string) || '').toLowerCase().trim();
    
      // My posted offers (keep discount code visible for the author)
      const myOffers = auctions.filter(a => {
        const authorId = (a.authorId || '').toLowerCase();
        const contactEmail = (a.contactEmail || '').toLowerCase();
        const emailUsername = contactEmail.split('@')[0];
        const sanitizedEmail = contactEmail.replace(/[^a-zA-Z0-9]/g, '_');

        const matchAuthorId = authorId && (authorId === accountId || accountId.includes(authorId) || authorId.includes(accountId));
        const matchEmail = contactEmail && (
          contactEmail === accountId || 
          contactEmail === emailParam ||
          accountId.includes(contactEmail) ||
          (emailParam && contactEmail.includes(emailParam))
        );
        const matchSanitized = sanitizedEmail && (
          accountId.includes(sanitizedEmail) ||
          sanitizedEmail.includes(accountId)
        );
        const matchUsername = emailUsername && (accountId.includes(emailUsername) || (nameParam && nameParam.includes(emailUsername)));

        return matchAuthorId || matchEmail || matchSanitized || matchUsername;
      }).map(a => a);

      // My bids (hide discount code UNLESS I am the winner and have paid)
      const myBidsAuctions = auctions.filter(a => 
        a.bids.some(b => {
          const bidderId = (b.bidderId || '').toLowerCase();
          const bidderName = (b.bidderName || '').toLowerCase();
          return (
            bidderId === accountId || 
            bidderId.includes(accountId) || 
            accountId.includes(bidderId) ||
            (emailParam && (bidderId.includes(emailParam) || emailParam.includes(bidderId))) ||
            (nameParam && (bidderName.includes(nameParam) || nameParam.includes(bidderName))) ||
            (bidderName && accountId.includes(bidderName))
          );
        })
      ).map(a => {
        const winnerId = (a.winnerId || '').toLowerCase();
        const isWinner = winnerId && (
          winnerId === accountId ||
          accountId.includes(winnerId) ||
          winnerId.includes(accountId) ||
          (emailParam && (winnerId.includes(emailParam) || emailParam.includes(winnerId))) ||
          (nameParam && (winnerId.includes(nameParam) || nameParam.includes(winnerId)))
        );

        if (isWinner && a.isPaid) {
          return a; // I paid for it, show me the code
        }
        return sanitizeAuction(a); // hide code
      });

      res.json({ myOffers, myBids: myBidsAuctions });
    } catch (err: any) {
      console.error("Error in /api/dashboard:", err);
      res.status(500).json({ error: "Failed to retrieve dashboard data", myOffers: [], myBids: [] });
    }
  });

  // Post a new offer (create an auction)
  app.post("/api/auctions", async (req, res) => {
    const { companyName, url, description, offerText, category, worthValue, discountCode, authorId, contactEmail } = req.body;
    
    if (!companyName || !url || !offerText || typeof worthValue !== 'number' || !discountCode || !authorId || !category || !contactEmail) {
      return res.status(400).json({ error: "Missing required fields or invalid types" });
    }

    const email = contactEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: "A valid email address is required" });
    }

    const now = Date.now();

    // Remove ended bid offer posts from this user if they post another offer
    auctions = auctions.filter(a => {
      const isAuthorMatch = a.authorId === authorId || (a.contactEmail || '').toLowerCase() === email;
      const isEnded = a.endTime > 0 && now >= a.endTime;
      if (isAuthorMatch && isEnded) {
        return false; // Remove ended offer
      }
      return true;
    });

    const newAuction: Auction = {
      id: Math.random().toString(36).substring(2, 9),
      authorId,
      companyName,
      url,
      description: description || "",
      offerText,
      category,
      worthValue,
      discountCode,
      createdAt: now,
      endTime: 0,
      bids: [],
      isPaid: false,
      status: 'pending',
      contactEmail: email,
    };

    auctions.push(newAuction);
    saveAuctions(auctions);

    // Send Real Email Notification to Admin (mrbking43@gmail.com)
    sendAdminNotificationEmail(newAuction).catch(err => {
      console.error("Background email send error:", err);
    });

    res.status(201).json(sanitizeAuction(newAuction));
  });

  // Admin Routes
  app.get("/api/admin/auctions", (req, res) => {
    evaluateAuctions();
    res.json({
      adminEmails: getAdminEmails(),
      auctions: [...auctions].reverse()
    });
  });

  // Test Email dispatch endpoint
  app.post("/api/admin/test-email", async (req, res) => {
    const adminEmails = getAdminEmails();
    const testAuction: Auction = {
      id: "test_" + Math.random().toString(36).substring(2, 7),
      authorId: "test_author",
      companyName: req.body.companyName || "AI Growth Studio",
      url: req.body.url || "https://aigrowth.example.com",
      description: req.body.description || "Autonomous AI agent for high-velocity user acquisition.",
      offerText: req.body.offerText || "$12,000 Growth Marketing & Ad Credits",
      category: req.body.category || "Marketing & Advertising",
      worthValue: Number(req.body.worthValue) || 12000,
      discountCode: "GROWTH-TEST-2026",
      createdAt: Date.now(),
      endTime: 0,
      bids: [],
      isPaid: false,
      status: 'pending',
      contactEmail: req.body.contactEmail || "founder@aigrowth.example.com",
    };

    const result = await sendAdminNotificationEmail(testAuction);
    res.json({ 
      success: true, 
      recipients: adminEmails,
      result, 
      message: `Notification email dispatched to: ${adminEmails.join(", ")}` 
    });
  });

  // Approve auction (POST & GET for email 1-click)
  app.post("/api/admin/approve/:id", (req, res) => {
    const auction = auctions.find(a => a.id === req.params.id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    
    auction.status = 'approved';
    auction.endTime = Date.now() + ONE_HOUR; // Live for 1 hour
    saveAuctions(auctions);
    res.json({ success: true, auction });
  });

  app.get("/api/admin/approve/:id", (req, res) => {
    const auction = auctions.find(a => a.id === req.params.id);
    if (!auction) {
      return res.status(404).send(`
        <body style="font-family:sans-serif;text-align:center;padding:40px;background:#fafafa;">
          <h1 style="color:#e11d48;">Auction Not Found</h1>
          <p>This auction link may have expired or was removed.</p>
        </body>
      `);
    }
    
    auction.status = 'approved';
    if (auction.endTime <= 0) {
      auction.endTime = Date.now() + ONE_HOUR;
    }
    saveAuctions(auctions);

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, "");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Auction Approved — JustBid</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 36px; max-width: 480px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          .icon { width: 64px; height: 64px; background: rgba(34, 197, 94, 0.15); color: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px auto; border: 1px solid rgba(34, 197, 94, 0.3); }
          h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
          .highlight { color: #fb923c; font-weight: 700; }
          .btn { display: inline-block; background: #ea580c; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; transition: 0.2s; }
          .btn:hover { background: #f97316; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Auction Approved!</h1>
          <p>The offer for <span class="highlight">${auction.companyName}</span> (${auction.offerText}) is now <strong>LIVE</strong> on the leaderboard for 1 hour.</p>
          <a href="${appUrl}/" class="btn">View Live Leaderboard →</a>
        </div>
      </body>
      </html>
    `);
  });

  // Reject auction (POST & GET for email 1-click)
  app.post("/api/admin/reject/:id", (req, res) => {
    const auction = auctions.find(a => a.id === req.params.id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    
    auction.status = 'rejected';
    saveAuctions(auctions);
    res.json({ success: true, auction });
  });

  app.get("/api/admin/reject/:id", (req, res) => {
    const auction = auctions.find(a => a.id === req.params.id);
    if (!auction) return res.status(404).send("Auction not found");
    
    auction.status = 'rejected';
    saveAuctions(auctions);
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, "");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Offer Rejected — JustBid</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 36px; max-width: 480px; text-align: center; }
          .icon { width: 64px; height: 64px; background: rgba(239, 68, 68, 0.15); color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px auto; border: 1px solid rgba(239, 68, 68, 0.3); }
          h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
          .btn { display: inline-block; background: #27272a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✕</div>
          <h1>Offer Rejected</h1>
          <p>The offer for <strong>${auction.companyName}</strong> has been marked as rejected and will not appear on the live leaderboard.</p>
          <a href="${appUrl}/" class="btn">Back to JustBid →</a>
        </div>
      </body>
      </html>
    `);
  });

  // Delete auction
  app.delete("/api/admin/auctions/:id", (req, res) => {
    const index = auctions.findIndex(a => a.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Auction not found" });
    auctions.splice(index, 1);
    saveAuctions(auctions);
    res.json({ success: true });
  });

  // End auction immediately and finalize winner (Admin action)
  app.post("/api/admin/end-auction/:id", async (req, res) => {
    const auction = auctions.find(a => a.id === req.params.id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });

    auction.endTime = Date.now() - 1000; // mark ended
    if (auction.bids && auction.bids.length > 0) {
      const highestBid = auction.bids.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
      auction.winnerId = highestBid.bidderId;
      saveAuctions(auctions);

      // Trigger email alert
      sendAdminWinnerNotificationEmail(auction, highestBid).catch(err => {
        console.error("Admin winner notification dispatch failed:", err);
      });

      return res.json({ success: true, auction, winner: highestBid });
    } else {
      saveAuctions(auctions);
      return res.json({ success: true, auction, message: "Auction ended without bids" });
    }
  });

  // Toggle paid status (Admin action)
  app.post("/api/admin/mark-paid/:id", (req, res) => {
    const auction = auctions.find(a => a.id === req.params.id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });

    auction.isPaid = !auction.isPaid;
    saveAuctions(auctions);
    res.json({ success: true, isPaid: auction.isPaid, auction });
  });

  // Test Winner Alert Email
  app.post("/api/admin/test-winner-email", async (req, res) => {
    const adminEmails = getAdminEmails();
    const sampleWonAuction = auctions.find(a => a.bids.length > 0) || auctions[0];
    const winningBid = sampleWonAuction?.bids?.length > 0 
      ? sampleWonAuction.bids.reduce((p, c) => p.amount > c.amount ? p : c)
      : { id: "w_demo", bidderId: "user_sarah", bidderName: "Sarah_Founder", amount: 1450, timestamp: Date.now() };

    await sendAdminWinnerNotificationEmail(sampleWonAuction, winningBid);
    res.json({ 
      success: true, 
      recipients: adminEmails,
      message: `Winner alert test email dispatched to ${adminEmails.join(", ")}!` 
    });
  });

  // Place a bid on an auction
  app.post("/api/auctions/:id/bid", async (req, res) => {
    const { id } = req.params;
    const { bidderId, bidderName, amount } = req.body;

    const auctionIndex = auctions.findIndex((a) => a.id === id);
    if (auctionIndex === -1) {
      return res.status(404).json({ error: "Auction not found" });
    }

    const auction = auctions[auctionIndex];
    
    if (Date.now() > auction.endTime) {
      return res.status(400).json({ error: "Auction has ended" });
    }

    const currentHighestBid = auction.bids.length > 0 
      ? Math.max(...auction.bids.map(b => b.amount)) 
      : 0;

    const minRequiredBid = currentHighestBid > 0 ? Math.max(5, currentHighestBid + 1) : 5;

    if (amount < minRequiredBid) {
      return res.status(400).json({ 
        error: currentHighestBid === 0 
          ? "Minimum starting bid is $5" 
          : `Bid must be at least $${minRequiredBid} ($1 higher than current highest bid of $${currentHighestBid})` 
      });
    }

    const newBid: UserBid = {
      id: Math.random().toString(36).substring(2, 9),
      bidderId,
      bidderName,
      amount,
      timestamp: Date.now()
    };

    auctions[auctionIndex].bids.push(newBid);
    saveAuctions(auctions);
    res.json({ success: true, auction: sanitizeAuction(auctions[auctionIndex]) });
  });

  // Generate checkout session to pay for won auction
  app.post("/api/auctions/:id/checkout", async (req, res) => {
    const { id } = req.params;
    const { accountId } = req.body;
    
    evaluateAuctions();
    const auction = auctions.find((a) => a.id === id);
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    
    if (auction.winnerId !== accountId) {
      return res.status(403).json({ error: "You are not the winner of this auction" });
    }

    if (auction.isPaid) {
      return res.status(400).json({ error: "Auction is already paid" });
    }

    const winningBid = auction.bids.find(b => b.bidderId === accountId);
    if (!winningBid) return res.status(400).json({ error: "Bid not found" });

    let checkoutUrl = "";
    try {
      const dodoKey = process.env.DODO_PAYMENTS_API_KEY;
      const productId = process.env.DODO_PRODUCT_ID;
      
      if (!dodoKey || !productId) {
        return res.status(500).json({ error: "Payment gateway is not configured. Please contact the administrator." });
      }

      const dodo = new DodoPayments({ bearerToken: dodoKey });
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      
      const session = await dodo.payments.create({
        billing: { city: "San Francisco", country: "US", state: "CA", street: "123 Market St", zipcode: "94105" },
        customer: { name: winningBid.bidderName || "Winner", email: "winner@justbid.app" },
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
            amount: winningBid.amount * 100
          }
        ],
        metadata: {
          auction_id: id
        },
        payment_link: true,
        return_url: `${appUrl}/dashboard?payment_success=true&auction_id=${id}`
      });
      
      checkoutUrl = (session as any).payment_link || (session as any).url || "";
    } catch (e: any) {
      console.log("Dodo payments notice:", e?.message || e?.name || e);
      return res.status(500).json({ error: e?.message || "Failed to create payment session" });
    }

    if (!checkoutUrl) {
      return res.status(500).json({ error: "Failed to get payment link" });
    }

    res.json({ checkoutUrl });
  });

  // Real Webhook handler for Dodo Payments
  app.post("/api/webhooks/dodo", async (req, res) => {
    try {
      const event = req.body;
      const type = event.type || event.event;
      
      // Handle payment success
      if (type === 'payment.succeeded' || type === 'payment.successful' || event.status === 'succeeded' || event.data?.status === 'succeeded') {
        const metadata = event.data?.metadata || event.metadata || {};
        const auctionId = metadata.auction_id;
        
        if (auctionId) {
          const auction = auctions.find(a => a.id === auctionId);
          if (auction && !auction.isPaid) {
            auction.isPaid = true;
            saveAuctions(auctions);
            console.log(`[Webhook] Payment confirmed for auction ${auctionId}`);
          }
        }
      }
      res.json({ received: true });
    } catch (e) {
      console.error("Dodo webhook error:", e);
      res.status(400).send(`Webhook Error`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
