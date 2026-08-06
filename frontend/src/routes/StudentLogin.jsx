import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Mail, Lock, Phone, Home, Building, AlertCircle, CheckCircle2, UserPlus, LogIn, ArrowLeft } from 'lucide-react';

export const StudentLogin = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [hostelBlock, setHostelBlock] = useState('Block A');
  const [phoneError, setPhoneError] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { login, registerStudent } = useAuth();
  const navigate = useNavigate();

  const validatePhone = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    if (cleaned.length > 0 && !/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Must be a valid 10-digit mobile number starting with 6-9');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (isRegister) {
      if (!/^[6-9]\d{9}$/.test(phone)) {
        setPhoneError('Please enter a valid 10-digit mobile number');
        return;
      }
      setLoading(true);
      try {
        await registerStudent({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          room_no: roomNo.trim(),
          hostel_block: hostelBlock
        });
        setSuccessMsg('Account Created! Pending Warden approval. You can log in once your warden approves your account.');
        setIsRegister(false);
        setPassword('');
      } catch (err) {
        console.error('Registration error:', err);
        setErrorMsg(err.response?.data?.detail || 'Registration failed. Please check your details.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const user = await login(email.trim().toLowerCase(), password);
        if (user.role === 'STUDENT') {
          navigate('/student/dashboard');
        } else {
          setErrorMsg('Invalid portal. Please use Staff Gateway for staff logins.');
        }
      } catch (err) {
        console.error('Login error:', err);
        const detail = err.response?.data?.detail;
        if (err.response?.status === 403) {
          setErrorMsg('Registration pending Warden approval. You will be able to log in once Warden approves your account.');
        } else {
          setErrorMsg(typeof detail === 'string' ? detail : 'Invalid credentials. Please check your email and password.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

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
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Resident Student Portal
          </h2>
          <p className="text-xs text-slate-400">
            {isRegister ? 'Register your resident student account' : 'Sign in to manage visitor requests & availability'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              !isRegister ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Student Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              isRegister ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            New Registration
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* 10-Digit Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    10-Digit Mobile Phone
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    inputMode="numeric"
                    placeholder="e.g. 9876543201"
                    value={phone}
                    onChange={(e) => validatePhone(e.target.value)}
                    className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all ${
                      phoneError ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {phoneError ? (
                    <p className="text-[11px] text-rose-400 mt-1">{phoneError}</p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">10 digits starting with 6-9</p>
                  )}
                </div>

                {/* Room No & Hostel Block */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Room No
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 101-A"
                      value={roomNo}
                      onChange={(e) => setRoomNo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      Hostel Block
                    </label>
                    <select
                      value={hostelBlock}
                      onChange={(e) => setHostelBlock(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="Block A">Block A</option>
                      <option value="Block B">Block B</option>
                      <option value="Block C">Block C</option>
                      <option value="Block D">Block D</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. student1@hostel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Processing...' : isRegister ? 'Submit for Warden Approval' : 'Sign In to Student Portal'}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};
