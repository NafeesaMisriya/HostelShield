import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Mail, Lock, AlertCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

export const StaffLogin = () => {
  const [staffRoleToggle, setStaffRoleToggle] = useState('SECURITY'); // 'SECURITY' or 'ADMIN'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await login(email.trim().toLowerCase(), password);
      
      // Role enforcement check
      if (staffRoleToggle === 'SECURITY' && (user.role === 'SECURITY' || user.role === 'ADMIN')) {
        navigate('/security/dashboard');
      } else if (staffRoleToggle === 'ADMIN' && user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        setErrorMsg(`Role mismatch: Account is registered as ${user.role}. Please toggle to the appropriate role.`);
      }
    } catch (err) {
      console.error('Staff login error:', err);
      setErrorMsg(err.response?.data?.detail || 'Invalid credentials or unauthorized staff account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md mx-auto w-full space-y-6 relative z-10">
        
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Home
        </Link>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 mx-auto flex items-center justify-center shadow-lg shadow-purple-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Staff & Security Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Select your duty role and sign in to access security operations or warden administration.
          </p>
        </div>

        {/* ROLE SEGMENTED TOGGLE SWITCH */}
        <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setStaffRoleToggle('SECURITY');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              staffRoleToggle === 'SECURITY'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span>🛡️ Security Desk</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setStaffRoleToggle('ADMIN');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              staffRoleToggle === 'ADMIN'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span>👑 Warden / Admin</span>
          </button>
        </div>

        {/* Demo Credential Helper Banner */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-center justify-between">
          <span>Demo Credentials:</span>
          <span className="font-mono text-slate-200 font-bold">
            {staffRoleToggle === 'SECURITY' ? 'security@hostel.com' : 'admin@hostel.com'} / password123
          </span>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Login Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
          <form onSubmit={handleStaffLogin} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {staffRoleToggle === 'SECURITY' ? 'Security Officer Email' : 'Warden Admin Email'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={staffRoleToggle === 'SECURITY' ? 'security@hostel.com' : 'admin@hostel.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Staff Account Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-purple-500 transition-all placeholder:text-slate-600"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold text-sm py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 mt-2 text-white ${
                staffRoleToggle === 'SECURITY'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/20'
              }`}
            >
              {loading ? 'Authenticating...' : `Access ${staffRoleToggle === 'SECURITY' ? 'Security Desk Dashboard' : 'Warden Admin Dashboard'}`}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};
