import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Shield, Search, CheckCircle2, LogOut, AlertTriangle, UserCheck, Phone, CreditCard, Building, RefreshCw, WifiOff, Clock, FileText } from 'lucide-react';
import {
  cacheApprovedPass,
  lookupCachedPass,
  queueOfflineCheckin,
  getOfflineCheckinQueue,
  syncOfflineCheckinQueue,
  initAutoSyncOnOnline
} from '../utils/offlineSync';

export const SecurityDesk = () => {
  const [passCode, setPassCode] = useState('');
  const [lookupData, setLookupData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Security Desk Controls State
  const [govIdVerified, setGovIdVerified] = useState(true);
  const [overrideNote, setOverrideNote] = useState('');

  // Offline Resilience State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    // Update queue count
    setQueuedCount(getOfflineCheckinQueue().length);

    // Auto-sync listener setup
    const cleanup = initAutoSyncOnOnline(client, (result) => {
      setIsOnline(true);
      setQueuedCount(getOfflineCheckinQueue().length);
      setSuccessMsg(`🟢 Network restored. Auto-synced ${result.syncedCount} queued check-ins.`);
    });

    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      cleanup();
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!passCode.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setLookupData(null);

    const cleanCode = passCode.trim().toUpperCase();

    try {
      if (!navigator.onLine) {
        throw new Error('OFFLINE');
      }
      const res = await client.get(`/security/lookup/${cleanCode}`);
      setLookupData(res.data);
      // Cache pass data for offline resilience
      cacheApprovedPass(res.data);
    } catch (err) {
      // Offline fallback lookup from localStorage
      const cached = lookupCachedPass(cleanCode);
      if (cached) {
        setLookupData(cached);
        setErrorMsg('⚠️ Network unreachable. Loaded pass details from local cache.');
      } else {
        setErrorMsg(err.response?.data?.detail || `Passcode '${cleanCode}' not found or invalid.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (override = false) => {
    if (!passCode.trim()) return;
    if (!govIdVerified) {
      setErrorMsg('⚠️ Physical Gov ID verification checkbox must be checked before proceeding with check-in.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = passCode.trim().toUpperCase();
    const payload = {
      pass_code: cleanCode,
      gov_id_verified: govIdVerified,
      override_student_unavailable: override,
      override_note: overrideNote
    };

    // If offline, queue locally
    if (!navigator.onLine) {
      queueOfflineCheckin(payload);
      setQueuedCount(getOfflineCheckinQueue().length);
      setSuccessMsg(`📍 Offline mode: Check-in for pass '${cleanCode}' queued locally. Will auto-sync when online.`);
      setLoading(false);
      return;
    }

    try {
      const res = await client.post('/security/checkin', payload);
      setSuccessMsg(`✅ VISITOR CHECKED IN SUCCESSFULLY at ${new Date(res.data.check_in_time).toLocaleTimeString()}`);
      setOverrideNote('');
      handleLookup(); // Refresh details
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!passCode.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCode = passCode.trim().toUpperCase();

    try {
      const res = await client.post('/security/checkout', {
        pass_code: cleanCode
      });
      setSuccessMsg(`✅ VISITOR CHECKED OUT SUCCESSFULLY. Duration: ${res.data.duration_minutes} mins`);
      handleLookup(); // Refresh details
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Check-out failed');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async () => {
    setLoading(true);
    const res = await syncOfflineCheckinQueue(client);
    setQueuedCount(getOfflineCheckinQueue().length);
    setSuccessMsg(`🟢 Synced ${res.syncedCount} queued check-ins to server.`);
    setLoading(false);
  };

  const quickFillPass = (code) => {
    setPassCode(code);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Shield className="w-4 h-4" /> Security Gate 1 Desk
            </div>

            {/* Offline/Online Status Badge */}
            {isOnline ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" /> Offline Mode ({queuedCount} Queued)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Pass Verification & Entry Control
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search visitor passcode to verify identity document, student host status, and execute check-in/out.
          </p>
        </div>

        {/* Demo Quick Pass Codes & Sync */}
        <div className="flex flex-col gap-2 items-end">
          {queuedCount > 0 && (
            <button
              onClick={triggerManualSync}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold hover:bg-sky-500/30 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sync {queuedCount} Queued Check-ins
            </button>
          )}

          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-xs space-y-1.5">
            <div className="text-slate-400 font-semibold">Demo Quick Codes:</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => quickFillPass('PASS01')} className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30">
                PASS01 (Pending)
              </button>
              <button onClick={() => quickFillPass('PASS02')} className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
                PASS02 (Active Visit)
              </button>
              <button onClick={() => quickFillPass('PASS03')} className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30">
                PASS03 (Overstay)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={passCode}
              onChange={(e) => setPassCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character Passcode (e.g. PASS02)"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-lg font-mono tracking-widest text-white uppercase placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !passCode.trim()}
            className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Search className="w-4 h-4" /> Lookup Pass
              </>
            )}
          </button>
        </form>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pass Verification Card */}
      {lookupData && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-sky-500/30 space-y-6 shadow-2xl animate-fade-in">
          
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-3">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Pass Code</div>
              <div className="text-3xl font-black font-mono text-sky-400">{lookupData.request?.pass_code}</div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                lookupData.request?.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                PASS STATUS: {lookupData.request?.status}
              </span>

              {lookupData.has_active_checkin && (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse">
                  CURRENTLY CHECKED IN
                </span>
              )}
            </div>
          </div>

          {/* Student Availability Amber Warning Banner */}
          {!lookupData.student_available && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                ⚠️ Host Student Unavailable (Room {lookupData.student_room || 'N/A'}, {lookupData.student_block || 'Block A'})
              </div>
              <div className="text-amber-200/80">
                Host resident <strong>{lookupData.request?.student?.full_name}</strong> is currently toggled to unavailable. Physical ID verification and security note entry are required for override check-in audit.
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Visitor Info */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Visitor Identity Verification
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Full Name</span>
                  <span className="text-white font-bold text-base">{lookupData.request?.visitor?.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number</span>
                  <span className="text-white font-medium text-sm">{lookupData.request?.visitor?.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Gov ID Document</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    {lookupData.request?.visitor?.gov_id_type}: {lookupData.request?.visitor?.gov_id_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Visit Purpose</span>
                  <span className="text-slate-300">{lookupData.request?.purpose}</span>
                </div>
              </div>
            </div>

            {/* Host Student Info */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4" /> Host Student Info
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Student Resident</span>
                  <span className="text-white font-bold text-base">{lookupData.request?.student?.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Room & Block</span>
                  <span className="text-sky-300 font-bold text-sm">
                    Room {lookupData.student_room || 'N/A'} • {lookupData.student_block || 'Block A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Host Availability Status</span>
                  {lookupData.student_available ? (
                    <span className="text-emerald-400 font-semibold">Available</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">Unavailable (Override needed)</span>
                  )}
                </div>
                {lookupData.current_checklog && (
                  <div>
                    <span className="text-slate-400 block">Checked In Time</span>
                    <span className="text-slate-300 font-medium">
                      {new Date(lookupData.current_checklog.check_in_time).toLocaleString()} ({lookupData.current_checklog.duration_minutes} mins inside)
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Verification & Remarks Controls */}
          {lookupData.can_checkin && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <label className="flex items-center gap-3 text-xs font-semibold text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={govIdVerified}
                  onChange={(e) => setGovIdVerified(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                />
                <span className="text-slate-100 font-bold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  [x] Physical Gov ID Verified & Matched ({lookupData.request?.visitor?.gov_id_type})
                </span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Security Desk Remarks / Override Audit Note
                </label>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="e.g. Verified physical Aadhaar card at Gate 1 desk. Approved entry."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
            
            {lookupData.can_checkin && (
              <>
                {!lookupData.student_available ? (
                  <button
                    onClick={() => handleCheckIn(true)}
                    disabled={loading || !govIdVerified}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <AlertTriangle className="w-4 h-4" /> Override Unavailable & Execute Check-In
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckIn(false)}
                    disabled={loading || !govIdVerified}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Execute Visitor Check-In
                  </button>
                )}
              </>
            )}

            {lookupData.can_checkout && (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-500/20 text-sm transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Execute Visitor Check-Out
              </button>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

