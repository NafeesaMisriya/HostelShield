import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Key, ShieldCheck, Clock, User, Building, Phone, AlertCircle, ArrowLeft, Download, CheckCircle2, XCircle, AlertTriangle, QrCode } from 'lucide-react';
import client from '../api/client';

export const VisitorTrackPass = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passData, setPassData] = useState(null);

  const validatePhoneInput = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhone(cleaned);
    if (cleaned.length > 0 && !/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Must be a valid 10-digit mobile number starting with 6-9');
    } else {
      setPhoneError('');
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setPassData(null);

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError('Please enter a valid 10-digit mobile number without spaces or symbols');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/visitor/track-pass', {
        full_name: fullName.trim(),
        phone: phone.trim()
      });
      setPassData(res.data);
    } catch (err) {
      console.error('Pass tracking error:', err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 404) {
        setErrorMessage(
          typeof detail === 'string'
            ? detail
            : 'No visitor request found for the provided Name and Phone number. Please check details or submit a new request.'
        );
      } else {
        setErrorMessage(typeof detail === 'string' ? detail : 'Failed to retrieve pass details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            APPROVED - PASS READY
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            PENDING STUDENT APPROVAL
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
            <XCircle className="w-4 h-4 text-rose-400" />
            VISIT REQUEST REJECTED
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            CHECKED IN - INSIDE HOSTEL
          </span>
        );
      case 'OVERSTAYED':
        return (
          <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-rose-600/30 text-rose-300 border border-rose-500/60 flex items-center gap-1.5 shadow-sm overstay-row-highlight">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            OVERSTAY ALERT - PLEASE EXIT
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const handlePrintPass = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl mx-auto w-full space-y-6 relative z-10">
        
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
            <Key className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Track My Visitor Pass Key
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Enter your exact full name and 10-digit registered mobile number to retrieve your pass key and gate QR code.
          </p>
        </div>

        {/* Public Visitor Lookup Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/80 backdrop-blur-xl">
          <form onSubmit={handleTrackSubmit} className="space-y-4">
            
            {/* Visitor Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Visitor Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Nair"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {/* 10-Digit Phone Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                10-Digit Mobile Phone Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  inputMode="numeric"
                  placeholder="e.g. 9812345678"
                  value={phone}
                  onChange={(e) => validatePhoneInput(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none transition-all placeholder:text-slate-600 ${
                    phoneError
                      ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
              
              {/* Phone Live Validation Helper Text */}
              {phoneError ? (
                <p className="text-[11px] text-rose-400 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {phoneError}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be exactly 10 digits starting with 6-9 (Standard Indian mobile format).
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !fullName || phone.length !== 10}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Searching Database...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Look Up Pass Status & Key
                </>
              )}
            </button>

          </form>

          {/* ERROR ALERT BANNER FOR 404 */}
          {errorMessage && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-rose-200">No Matching Record Found</div>
                <div className="leading-relaxed">{errorMessage}</div>
                <div className="pt-2">
                  <Link to="/visitor/request" className="text-indigo-400 font-bold underline hover:text-indigo-300">
                    Apply for a New Visitor Pass &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* PASS DETAILS & UNIQUE PASS KEY CARD (ON SUCCESSFUL LOOKUP) */}
        {passData && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl bg-slate-900/90 space-y-6 animate-fade-in relative">
            
            {/* Header Badge & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Official Hostel Pass Card</div>
                <div className="text-xl font-bold font-heading text-white">{passData.visitor_name}</div>
              </div>
              <div>{getStatusBadge(passData.status)}</div>
            </div>

            {/* PASS KEY DISPLAY */}
            {passData.pass_code ? (
              <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/60 p-6 rounded-2xl border border-indigo-500/40 text-center space-y-3 relative overflow-hidden shadow-inner">
                <div className="text-xs uppercase font-extrabold text-indigo-300 tracking-widest">
                  Gate Verification Pass Key
                </div>
                
                {/* Large Pass Code Display */}
                <div className="text-4xl sm:text-5xl font-black font-heading tracking-widest bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent drop-shadow-md">
                  {passData.pass_code}
                </div>

                <div className="text-[11px] text-slate-400">
                  Present this code to the security guard at the gate for entry verification.
                </div>

                {/* VISUAL SVG QR CODE DEMO */}
                <div className="pt-3 flex justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 inline-block">
                    <svg className="w-32 h-32" viewBox="0 0 100 100" fill="none">
                      <rect width="100" height="100" fill="white" />
                      {/* Corner markers */}
                      <rect x="5" y="5" width="30" height="30" fill="black" />
                      <rect x="10" y="10" width="20" height="20" fill="white" />
                      <rect x="15" y="15" width="10" height="10" fill="black" />
                      
                      <rect x="65" y="5" width="30" height="30" fill="black" />
                      <rect x="70" y="10" width="20" height="20" fill="white" />
                      <rect x="75" y="15" width="10" height="10" fill="black" />

                      <rect x="5" y="65" width="30" height="30" fill="black" />
                      <rect x="10" y="70" width="20" height="20" fill="white" />
                      <rect x="15" y="75" width="10" height="10" fill="black" />

                      {/* Random QR code pixels based on pass key */}
                      <rect x="40" y="10" width="15" height="10" fill="black" />
                      <rect x="45" y="25" width="10" height="15" fill="black" />
                      <rect x="65" y="40" width="20" height="10" fill="black" />
                      <rect x="40" y="55" width="15" height="15" fill="black" />
                      <rect x="65" y="65" width="10" height="25" fill="black" />
                      <rect x="80" y="80" width="15" height="15" fill="black" />
                      <rect x="25" y="45" width="15" height="10" fill="black" />
                    </svg>
                    <div className="text-[9px] font-mono text-slate-800 mt-1 font-bold">
                      {passData.pass_code}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center leading-relaxed">
                ℹ️ Pass Key Code will be generated automatically once your host student approves your request.
              </div>
            )}

            {/* Visit Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Host Student
                </div>
                <div className="font-bold text-white text-sm">{passData.student_name}</div>
                <div className="text-slate-400 text-[11px]">
                  Room {passData.student_room || 'N/A'}, {passData.student_block || 'N/A'}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Expected Duration
                </div>
                <div className="font-bold text-white text-sm">{passData.expected_duration_minutes} Minutes</div>
                <div className="text-slate-400 text-[11px]">
                  Requested: {new Date(passData.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 sm:col-span-2">
                <div className="text-slate-400 font-semibold mb-1">Visit Purpose</div>
                <div className="text-slate-200 font-medium">{passData.purpose}</div>
              </div>
            </div>

            {/* Save/Download Button */}
            {passData.pass_code && (
              <div className="pt-2">
                <button
                  onClick={handlePrintPass}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  Save / Print Digital Pass
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
