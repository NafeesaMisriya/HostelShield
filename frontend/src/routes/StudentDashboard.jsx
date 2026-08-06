import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Check, X, Clock, ShieldCheck, Ticket, User, Phone, ToggleLeft, ToggleRight, Sparkles, QrCode } from 'lucide-react';

export const StudentDashboard = () => {
  const { user, updateUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedQrPass, setSelectedQrPass] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await client.get('/students/me/requests');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching requests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await client.patch(`/requests/${id}/approve`);
      setRequests(prev => prev.map(req => req.id === id ? res.data : req));
      setSelectedQrPass(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await client.patch(`/requests/${id}/reject`);
      setRequests(prev => prev.map(req => req.id === id ? res.data : req));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !user.is_available;
      await client.patch('/students/me/availability', { is_available: newStatus });
      updateUser({ is_available: newStatus });
    } catch (err) {
      console.error('Error toggling availability', err);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const pastRequests = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Top Banner / Welcome */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <User className="w-4 h-4" /> Host Student Resident Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Room <strong className="text-sky-300">{user?.room_no || 'N/A'}</strong> • Manage your incoming visitor pass approvals
          </p>
        </div>

        {/* Real-time Availability Switch */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div>
            <div className="text-xs font-bold text-slate-300">Receiving Visitors?</div>
            <div className="text-xs text-slate-400">
              {user?.is_available ? 'Available (Visitors can request)' : 'Unavailable (Requests auto-blocked)'}
            </div>
          </div>

          <button
            onClick={handleToggleAvailability}
            className={`p-1.5 rounded-full transition-all border ${
              user?.is_available
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
            }`}
          >
            {user?.is_available ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* QR Code / Pass Details Modal */}
      {selectedQrPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel max-w-sm w-full p-6 rounded-3xl border border-sky-500/30 text-center space-y-4 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setSelectedQrPass(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto border border-sky-500/40">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Visitor Pass Generated!</h3>
              <p className="text-xs text-slate-400">Share this passcode or QR code with your visitor</p>
            </div>

            {/* Pass Code Badge */}
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30">
              <div className="text-xs text-sky-400 uppercase tracking-widest font-semibold mb-1">Gate Pass Code</div>
              <div className="text-3xl font-black font-mono tracking-widest text-white">{selectedQrPass.pass_code}</div>
            </div>

            {/* Render Client-Side QR Code */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner">
              <QRCodeSVG value={selectedQrPass.pass_code || ''} size={150} />
            </div>

            <div className="text-xs text-slate-400">
              Visitor: <strong className="text-white">{selectedQrPass.visitor?.full_name}</strong> ({selectedQrPass.visitor?.gov_id_type})
            </div>

            <button
              onClick={() => setSelectedQrPass(null)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl border border-slate-700 text-xs"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Pending Visitor Requests
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {pendingRequests.length}
            </span>
          </h2>

          <button
            onClick={fetchRequests}
            className="text-xs text-sky-400 hover:underline font-medium"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Loading visitor requests...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-slate-400 text-sm">
            No pending visitor requests at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(req => (
              <div key={req.id} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{req.visitor?.full_name}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>📞 {req.visitor?.phone}</span>
                      <span>•</span>
                      <span className="font-mono">{req.visitor?.gov_id_type}: {req.visitor?.gov_id_number}</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    PENDING
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 text-xs text-slate-300 border border-slate-800">
                  <strong className="text-slate-400 block mb-0.5">Visit Purpose:</strong>
                  {req.purpose}
                </div>

                {/* Approve / Reject Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>

                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
                  >
                    <Check className="w-4 h-4" /> Approve Pass
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Responded Requests Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h2 className="text-lg font-bold text-slate-300">Approval History</h2>

        {pastRequests.length === 0 ? (
          <div className="text-xs text-slate-500">No past requests recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Gov ID</th>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pastRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {req.visitor?.full_name}
                      <div className="text-[10px] text-slate-500 font-normal">{req.visitor?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{req.visitor?.gov_id_type}: {req.visitor?.gov_id_number}</td>
                    <td className="py-3.5 px-4">
                      {req.pass_code ? (
                        <span className="font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                          {req.pass_code}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">{req.purpose}</td>
                    <td className="py-3.5 px-4">
                      {req.status === 'APPROVED' ? (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          APPROVED
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          REJECTED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'APPROVED' && req.pass_code && (
                        <button
                          onClick={() => setSelectedQrPass(req)}
                          className="text-sky-400 hover:text-sky-300 font-semibold text-xs flex items-center gap-1 ml-auto"
                        >
                          <QrCode className="w-3.5 h-3.5" /> View Pass
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
