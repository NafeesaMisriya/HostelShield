import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Shield, AlertCircle, Users, Clock, FileSpreadsheet, RefreshCw, Search, LogOut, Download, AlertTriangle, UserCheck, BellRing, Check, X, Megaphone, Send } from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('active'); // active, overstays, pending-students, reports

  const [activeVisitors, setActiveVisitors] = useState([]);
  const [overstays, setOverstays] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Emergency Broadcast Modal State
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyTitle, setEmergencyTitle] = useState('🚨 EMERGENCY BROADCAST ALERT');
  const [emergencyMsg, setEmergencyMsg] = useState('ATTENTION ALL RESIDENTS & SECURITY: Immediate emergency alert / notice broadcasted by Warden Desk.');
  const [sendingEmergency, setSendingEmergency] = useState(false);

  // Reports State
  const [reportData, setReportData] = useState({ period: 'all', summary: {}, logs: [] });
  const [reportPeriod, setReportPeriod] = useState('all'); // daily, monthly, custom, all
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [loadingActive, setLoadingActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  useEffect(() => {
    fetchActiveData();
    fetchStats();

    // Auto refresh active list every 10 seconds for live emergency tracking
    const interval = setInterval(() => {
      fetchActiveData();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'pending-students') {
      fetchPendingStudents();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab, reportPeriod, fromDate, toDate]);

  const fetchActiveData = async () => {
    try {
      setLoadingActive(true);
      const [actRes, ovrRes] = await Promise.all([
        client.get('/admin/active'),
        client.get('/admin/overstays')
      ]);
      setActiveVisitors(actRes.data);
      setOverstays(ovrRes.data);
    } catch (err) {
      console.error('Error fetching active list', err);
    } finally {
      setLoadingActive(false);
    }
  };

  const fetchPendingStudents = async () => {
    try {
      const res = await client.get('/admin/pending-students');
      setPendingStudents(res.data);
    } catch (err) {
      console.error('Error fetching pending students', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await client.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  };

  const fetchReports = async () => {
    try {
      let url = `/admin/reports?period=${reportPeriod}`;
      if (fromDate) url += `&from_date=${fromDate}`;
      if (toDate) url += `&to_date=${toDate}`;

      const res = await client.get(url);
      setReportData(res.data);
    } catch (err) {
      console.error('Error fetching reports', err);
    }
  };

  const handleApproveStudent = async (studentId, action) => {
    try {
      const res = await client.patch(`/admin/approve-student/${studentId}?action=${action}`);
      setNotifMsg(`✅ ${res.data.message}`);
      fetchPendingStudents();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed');
    }
  };

  const handleTriggerOverstayNotif = async (requestId) => {
    try {
      const res = await client.post(`/notifications/trigger-overstay/${requestId}`);
      setNotifMsg(`🚨 OVERSTAY ALERT DISPATCHED: ${res.data.message}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to dispatch notification');
    }
  };

  const handleBroadcastEmergency = async (e) => {
    e.preventDefault();
    if (!emergencyMsg.trim()) return;
    setSendingEmergency(true);
    try {
      const res = await client.post('/admin/broadcast-emergency', {
        title: emergencyTitle,
        message: emergencyMsg.trim()
      });
      setNotifMsg(`🚨 EMERGENCY ALERT BROADCASTED: ${res.data.message}`);
      setShowEmergencyModal(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to broadcast emergency alert');
    } finally {
      setSendingEmergency(false);
    }
  };

  const handleForceCheckout = async (checkLogId) => {
    if (!window.confirm('Are you sure you want to force check-out this visitor?')) return;
    try {
      await client.post(`/admin/force-checkout/${checkLogId}`);
      fetchActiveData();
      fetchStats();
      if (activeTab === 'reports') fetchReports();
    } catch (err) {
      alert(err.response?.data?.detail || 'Force checkout failed');
    }
  };

  // CSV Export
  const exportToCSV = () => {
    const logs = reportData.logs || [];
    if (logs.length === 0) return;
    const headers = ['ID', 'Pass Code', 'Visitor Name', 'Visitor Phone', 'Gov ID Type', 'Gov ID Number', 'Host Student', 'Room', 'Block', 'Purpose', 'Check-In Time', 'Check-Out Time', 'Duration (Mins)', 'Expected (Mins)', 'Overstayed', 'Status', 'Security Note'];
    const rows = logs.map(r => [
      r.id,
      r.pass_code || '',
      `"${r.visitor_name}"`,
      `"${r.visitor_phone}"`,
      r.gov_id_type,
      `"${r.gov_id_number}"`,
      `"${r.student_name}"`,
      `"${r.room_no}"`,
      `"${r.hostel_block}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.check_in_time,
      r.check_out_time || 'Active',
      r.duration_minutes,
      r.expected_duration_minutes,
      r.is_overstayed ? 'YES' : 'NO',
      r.status,
      `"${(r.security_note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `warden_visitor_report_${reportPeriod}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredActive = activeVisitors.filter(v =>
    v.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.pass_code && v.pass_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    v.visitor_phone.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 font-sans">
      
      {/* Admin Title Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <Shield className="w-4 h-4" /> Warden Executive Management Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            Hostel Visitor Operations & Emergency Broadcast
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Student registration approvals, real-time emergency headcount, 1-click broadcasts, and overstay alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmergencyModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 border border-rose-400/40 animate-pulse"
          >
            <Megaphone className="w-4 h-4" /> 🚨 Broadcast 1-Click Emergency Alert
          </button>
          
          <button
            onClick={() => { fetchActiveData(); fetchStats(); if (activeTab === 'pending-students') fetchPendingStudents(); }}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
            title="Refresh stream"
          >
            <RefreshCw className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notifMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-emerald-400" />
            <span>{notifMsg}</span>
          </div>
          <button onClick={() => setNotifMsg('')} className="text-emerald-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* Overview Statistics Widgets */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Currently Inside</div>
            <div className="text-2xl font-black text-white mt-1">{stats.currently_inside}</div>
            <div className="text-[10px] text-sky-400 mt-1">Live active headcount</div>
          </div>

          <div className={`glass-card rounded-2xl p-4 border ${stats.total_overstays_today > 0 ? 'border-rose-500/50 bg-rose-500/10' : 'border-slate-800'}`}>
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Overstays Detected</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{stats.total_overstays_today}</div>
            <div className="text-[10px] text-rose-300 mt-1">Flagged overstay warnings</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Pending Registrations</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.pending_student_registrations}</div>
            <div className="text-[10px] text-amber-300 mt-1">Awaiting warden approval</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Today's Requests</div>
            <div className="text-2xl font-black text-white mt-1">{stats.total_requests_today}</div>
            <div className="text-[10px] text-slate-400 mt-1">Total pass requests</div>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Pending Passes</div>
            <div className="text-2xl font-black text-sky-400 mt-1">{stats.pending_approvals}</div>
            <div className="text-[10px] text-sky-300 mt-1">Awaiting resident action</div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-sky-500 text-sky-400 bg-sky-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Active Visitors (Emergency Headcount) ({activeVisitors.length})
        </button>

        <button
          onClick={() => setActiveTab('overstays')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'overstays'
              ? 'border-rose-500 text-rose-400 bg-rose-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" /> Overstays ({overstays.length})
        </button>

        <button
          onClick={() => setActiveTab('pending-students')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'pending-students'
              ? 'border-amber-500 text-amber-400 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-400" /> Student Approvals ({stats?.pending_student_registrations || 0})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Period Reports & History
        </button>
      </div>

      {/* Tab 1: Live Active List (Emergency Headcount) */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          
          {/* PROMINENT BANNER HEADER AT TOP OF ACTIVE VISITORS TAB */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-indigo-950/80 border border-rose-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Megaphone className="w-6 h-6 animate-pulse text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-white font-heading text-base flex items-center gap-2">
                  Emergency Headcount & Broadcast Control
                </h3>
                <p className="text-xs text-slate-300">
                  Instantly broadcast emergency lockdown or evacuation alerts to all resident students & gate security desk.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEmergencyModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 border border-rose-400/40 transition-all shrink-0 flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" /> 🚨 Broadcast 1-Click Emergency Alert
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor, host student, or passcode..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Auto-refreshing emergency headcount stream
            </div>
          </div>

          {loadingActive ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading active building occupants...</div>
          ) : filteredActive.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-slate-400 text-sm">
              No active visitors currently checked into hostel premises.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Pass Code</th>
                    <th className="py-3.5 px-4">Visitor Details</th>
                    <th className="py-3.5 px-4">Gov ID</th>
                    <th className="py-3.5 px-4">Host Student</th>
                    <th className="py-3.5 px-4">Purpose</th>
                    <th className="py-3.5 px-4">Check-In Time</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4 text-right">Emergency Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredActive.map(row => (
                    <tr
                      key={row.check_log_id}
                      className={`transition-colors ${
                        row.is_overstayed ? 'overstay-row-highlight' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <td className="py-4 px-4 font-mono font-bold text-sky-400">
                        {row.pass_code || 'N/A'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm">{row.visitor_name}</div>
                        <div className="text-slate-400 font-mono text-[11px]">📞 {row.visitor_phone}</div>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-300">
                        {row.gov_id_type}: {row.gov_id_number}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{row.student_name}</div>
                        <div className="text-sky-300 text-[11px]">Room {row.student_room} ({row.student_block})</div>
                      </td>

                      <td className="py-4 px-4 max-w-xs truncate text-slate-300">
                        {row.purpose}
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        {new Date(row.check_in_time).toLocaleTimeString()}
                      </td>

                      <td className="py-4 px-4">
                        {row.is_overstayed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> OVERSTAY ({row.duration_minutes}m)
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                            {row.duration_minutes} mins
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        {/* INDIVIDUAL OVERSTAY ALERT BUTTON */}
                        {row.is_overstayed && (
                          <button
                            onClick={() => handleTriggerOverstayNotif(row.request_id)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border border-rose-400/40 text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-1"
                          >
                            <BellRing className="w-3.5 h-3.5" /> 🚨 Send Overstay Alert
                          </button>
                        )}
                        <button
                          onClick={() => handleForceCheckout(row.check_log_id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-400" /> Force Checkout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Overstays Flagged */}
      {activeTab === 'overstays' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>
                <strong>Emergency Overstay Alert:</strong> Showing active visitors who have exceeded stay limit duration.
              </span>
            </div>
          </div>

          {overstays.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-emerald-400 text-sm">
              ✅ No overstay violations detected. All current visitors are within stay limit!
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-rose-500/30">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-rose-950/60 text-rose-200 uppercase tracking-wider font-semibold border-b border-rose-500/30">
                  <tr>
                    <th className="py-3.5 px-4">Pass Code</th>
                    <th className="py-3.5 px-4">Visitor</th>
                    <th className="py-3.5 px-4">Gov ID</th>
                    <th className="py-3.5 px-4">Host Student</th>
                    <th className="py-3.5 px-4">Checked In</th>
                    <th className="py-3.5 px-4">Elapsed Time</th>
                    <th className="py-3.5 px-4 text-right">Emergency Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-500/20">
                  {overstays.map(row => (
                    <tr key={row.check_log_id} className="bg-rose-950/20 hover:bg-rose-950/40 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-rose-300">{row.pass_code}</td>
                      <td className="py-4 px-4 font-bold text-white">{row.visitor_name} ({row.visitor_phone})</td>
                      <td className="py-4 px-4 font-mono">{row.gov_id_type}: {row.gov_id_number}</td>
                      <td className="py-4 px-4">{row.student_name} (Rm {row.student_room}, {row.student_block})</td>
                      <td className="py-4 px-4">{new Date(row.check_in_time).toLocaleTimeString()}</td>
                      <td className="py-4 px-4 text-rose-400 font-extrabold text-sm">{row.duration_minutes} mins</td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleTriggerOverstayNotif(row.request_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-md border border-rose-400/40 transition-all inline-flex items-center gap-1"
                        >
                          <BellRing className="w-3.5 h-3.5" /> 🚨 Send Overstay Alert
                        </button>
                        <button
                          onClick={() => handleForceCheckout(row.check_log_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-400" /> Force Checkout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Pending Student Registrations */}
      {activeTab === 'pending-students' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm">
            <strong>Student Account Registration Approval Queue:</strong> New student registrations remain locked (HTTP 403 Forbidden) until approved by Warden Admin.
          </div>

          {pendingStudents.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center border border-slate-800 text-slate-400 text-sm">
              No student registrations currently pending admin approval.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingStudents.map(student => (
                <div key={student.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white text-base">{student.full_name}</div>
                      <div className="text-xs text-slate-400">{student.email} • 📞 {student.phone}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                      PENDING APPROVAL
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1 border border-slate-800">
                    <div>Hostel Room: <strong className="text-sky-300">Room {student.room_no}</strong></div>
                    <div>Hostel Block: <strong className="text-white">{student.hostel_block || 'Block A'}</strong></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleApproveStudent(student.id, 'reject')}
                      className="py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Reject Account
                    </button>
                    <button
                      onClick={() => handleApproveStudent(student.id, 'approve')}
                      className="py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Approve Student
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Reports & History */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          
          {/* Period Filter & Controls */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Report Period</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="all">All Time</option>
                  <option value="daily">Daily Report (Today)</option>
                  <option value="monthly">Monthly Report (This Month)</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {reportPeriod === 'custom' && (
                <>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </>
              )}

            </div>

            <button
              onClick={exportToCSV}
              disabled={!reportData.logs || reportData.logs.length === 0}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> Export CSV Report
            </button>
          </div>

          {/* Period Summary Metric Cards */}
          {reportData.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Total Entries ({reportData.period})</span>
                <span className="text-xl font-bold text-white">{reportData.summary.total_entries || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Completed Exits</span>
                <span className="text-xl font-bold text-emerald-400">{reportData.summary.completed_exits || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Active Inside</span>
                <span className="text-xl font-bold text-sky-400">{reportData.summary.active_inside || 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Overstay Count</span>
                <span className="text-xl font-bold text-rose-400">{reportData.summary.overstay_count || 0}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Pass Code</th>
                  <th className="py-3.5 px-4">Visitor</th>
                  <th className="py-3.5 px-4">Gov ID</th>
                  <th className="py-3.5 px-4">Host Student</th>
                  <th className="py-3.5 px-4">Check-In</th>
                  <th className="py-3.5 px-4">Check-Out</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Security Remarks</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(reportData.logs || []).map(r => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">{r.pass_code || '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{r.visitor_name} ({r.visitor_phone})</td>
                    <td className="py-3.5 px-4 font-mono">{r.gov_id_type}: {r.gov_id_number}</td>
                    <td className="py-3.5 px-4">{r.student_name} (Rm {r.room_no}, {r.hostel_block})</td>
                    <td className="py-3.5 px-4">{new Date(r.check_in_time).toLocaleString()}</td>
                    <td className="py-3.5 px-4">{r.check_out_time ? new Date(r.check_out_time).toLocaleString() : <span className="text-emerald-400 font-bold">Currently Inside</span>}</td>
                    <td className="py-3.5 px-4 font-mono">{r.duration_minutes} mins</td>
                    <td className="py-3.5 px-4 text-slate-400 italic max-w-xs truncate">{r.security_note || '—'}</td>
                    <td className="py-3.5 px-4">
                      {r.is_overstayed ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                          OVERSTAYED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1-CLICK EMERGENCY BROADCAST MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-rose-500/40 shadow-2xl max-w-md w-full bg-slate-900 space-y-5 relative">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold font-heading text-lg">
                <Megaphone className="w-5 h-5 text-rose-400" />
                Confirm Emergency Broadcast
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs leading-relaxed">
              ⚠️ <strong>Warning:</strong> This 1-click broadcast will immediately dispatch an emergency notification to all registered resident students and gate security guards.
            </div>

            <form onSubmit={handleBroadcastEmergency} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Alert Title
                </label>
                <input
                  type="text"
                  required
                  value={emergencyTitle}
                  onChange={(e) => setEmergencyTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Emergency Broadcast Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={emergencyMsg}
                  onChange={(e) => setEmergencyMsg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmergency}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {sendingEmergency ? 'Broadcasting...' : 'Broadcast Now'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
