import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Gavel, LogOut, User as UserIcon, Flame, ShieldCheck } from 'lucide-react';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { AuthProvider, useAuth } from './components/AuthContext';
import { AuthModal } from './components/AuthModal';

function Navigation() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isAdmin = location.pathname === '/admin';
  const { user, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  
  const localEmail = localStorage.getItem('justbid_user_email');
  const isAuthenticated = !!user || !!localEmail;
  const activeUserEmail = (user?.email || localEmail || '').trim().toLowerCase();
  const isAdminUser = activeUserEmail === 'princemrb89@gmail.com';

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('justbid_user_email');
    localStorage.removeItem('justbid_account_id');
    window.location.href = '/';
  };

  return (
    <>
      <nav className="border-b border-zinc-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight text-zinc-900 flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
              <Gavel size={15} />
            </div>
            <span className="font-black text-zinc-900">Just<span className="text-orange-600">Bid</span></span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3.5 text-xs sm:text-sm font-semibold">
            <Link 
              to="/" 
              className={`flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg ${
                location.pathname === '/' ? 'text-orange-600 bg-orange-50/80 font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Flame size={14} className={location.pathname === '/' ? "text-orange-600" : "text-zinc-400"} />
              <span>Leaderboard</span>
            </Link>
            
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg ${
                isDashboard ? 'text-orange-600 bg-orange-50/80 font-bold' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutDashboard size={14} />
              <span>Dashboard</span>
              {isAuthenticated && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              )}
            </Link>

            {isAdminUser && (
              <Link 
                to="/admin" 
                className={`flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg ${
                  isAdmin ? 'text-orange-600 bg-orange-50/80 font-bold' : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title="Admin Moderation Portal"
              >
                <ShieldCheck size={14} className={isAdmin ? 'text-orange-600' : 'text-zinc-400'} />
                <span>Admin</span>
              </Link>
            )}

            {/* Authenticated User state */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                <span className="text-xs text-zinc-600 font-medium hidden sm:inline max-w-[130px] truncate" title={activeUserEmail || ''}>
                  {activeUserEmail?.split('@')[0]}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1 text-xs"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                  <span className="hidden md:inline text-[11px] text-zinc-500">Sign Out</span>
                </button>
              </div>
            ) : !isDashboard && !isAdmin ? (
              /* Only show Log In for new unauthenticated visitors outside dashboard/admin */
              <button 
                onClick={() => setAuthOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <UserIcon size={13} />
                <span>Log In</span>
              </button>
            ) : null}
          </div>
        </div>
      </nav>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-orange-500/20">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

