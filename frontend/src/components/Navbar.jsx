import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCheck, LogOut, Ticket, ToggleLeft, ToggleRight, Search, Home, Menu, X } from 'lucide-react';
import client from '../api/client';

export const Navbar = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleAvailability = async () => {
    if (!user || user.role !== 'STUDENT') return;
    try {
      const newStatus = !user.is_available;
      await client.patch('/students/me/availability', { is_available: newStatus });
      updateUser({ is_available: newStatus });
    } catch (err) {
      console.error('Failed to toggle availability', err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><Shield className="w-3 h-3 text-purple-400" /> Warden Admin</span>;
      case 'SECURITY':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /> Security Gate</span>;
      case 'STUDENT':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><UserCheck className="w-3 h-3 text-indigo-400" /> Resident Student</span>;
      default:
        return null;
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity: HostelShield SVG without Enterprise label */}
          <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform shield-glow">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <circle cx="12" cy="10" r="2" fill="currentColor" />
                    <path d="M12 12v3" strokeWidth="2.5" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <div className="font-heading font-extrabold text-lg text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
                Hostel<span className="text-indigo-400">Shield</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Smart Visitor Management</div>
            </div>
          </Link>

          {/* Desktop Quick Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-indigo-400" />
              Home
            </Link>

            <Link
              to="/visitor/request"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/visitor/request' || location.pathname === '/request-pass'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-400" />
              Apply Pass
            </Link>

            <Link
              to="/visitor/track-pass"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/visitor/track-pass'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-sky-400" />
              Track Pass Key
            </Link>

            {user && (
              <Link
                to={
                  user.role === 'STUDENT'
                    ? '/student/dashboard'
                    : user.role === 'SECURITY'
                    ? '/security/dashboard'
                    : '/admin/dashboard'
                }
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
              >
                Dashboard ({user.role})
              </Link>
            )}
          </div>

          {/* Desktop Right User Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Student Availability Toggle */}
                {user.role === 'STUDENT' && (
                  <button
                    onClick={handleToggleAvailability}
                    title="Toggle availability for receiving visitor pass requests"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      user.is_available
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                    }`}
                  >
                    {user.is_available ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        Available
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-rose-400" />
                        Unavailable
                      </>
                    )}
                  </button>
                )}

                {/* Role Badge */}
                <div>
                  {getRoleBadge(user.role)}
                </div>

                {/* User Info */}
                <div className="text-right">
                  <div className="text-xs font-bold text-white leading-tight">{user.full_name}</div>
                  <div className="text-[10px] text-slate-400">{user.email} {user.room_no ? `• Rm ${user.room_no}` : ''}</div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/student/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  Student Portal
                </Link>
                <Link
                  to="/staff/login"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-lg shadow-indigo-600/20 border border-indigo-400/30 transition-all"
                >
                  Staff Gateway
                </Link>
              </div>
            )}
          </div>

          {/* Responsive Mobile Hamburger Toggle Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-indigo-400" /> : <Menu className="w-6 h-6 text-indigo-400" />}
            </button>
          </div>

        </div>
      </div>

      {/* Responsive Mobile Dropdown Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-fade-in backdrop-blur-xl">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Home className="w-4 h-4 text-indigo-400" /> Home
          </Link>

          <Link
            to="/visitor/request"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Ticket className="w-4 h-4 text-emerald-400" /> Apply Visitor Pass
          </Link>

          <Link
            to="/visitor/track-pass"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <Search className="w-4 h-4 text-sky-400" /> Track Pass Key
          </Link>

          {user ? (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs px-3">
                <span className="text-slate-400">{user.full_name} ({user.role})</span>
                {user.role === 'STUDENT' && (
                  <button
                    onClick={handleToggleAvailability}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      user.is_available ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {user.is_available ? '🟢 Available' : '🔴 Unavailable'}
                  </button>
                )}
              </div>

              <Link
                to={
                  user.role === 'STUDENT'
                    ? '/student/dashboard'
                    : user.role === 'SECURITY'
                    ? '/security/dashboard'
                    : '/admin/dashboard'
                }
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 rounded-xl bg-purple-600/20 text-purple-300 font-bold text-xs border border-purple-500/30"
              >
                Go to Dashboard ({user.role})
              </Link>

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate('/');
                }}
                className="w-full text-center py-2 rounded-xl bg-rose-500/10 text-rose-300 font-bold text-xs border border-rose-500/20"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <Link
                to="/student/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700"
              >
                Student Portal
              </Link>
              <Link
                to="/staff/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
              >
                Staff Gateway
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
