import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, User, Sparkles, Building2, CheckCircle2, Lock } from 'lucide-react';

export const Login = () => {
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  // Student Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRoomNo, setRegRoomNo] = useState('');
  const [regHostelBlock, setRegHostelBlock] = useState('Block A');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [regErrorMsg, setRegErrorMsg] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await login(email, password);
      redirectUser(user.role);
    } catch (err) {
      // Handled in context
    }
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setRegErrorMsg('');
    setRegSuccessMsg('');
    setRegLoading(true);

    try {
      const res = await client.post('/auth/register-student', {
        full_name: regFullName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        room_no: regRoomNo,
        hostel_block: regHostelBlock
      });
      setRegSuccessMsg(`✅ Registration submitted for ${res.data.full_name}! Account is pending Warden Admin approval.`);
      // Reset form
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setRegPhone('');
      setRegRoomNo('');
    } catch (err) {
      setRegErrorMsg(err.response?.data?.detail || 'Student registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    try {
      setEmail(demoEmail);
      setPassword(demoPassword);
      const user = await login(demoEmail, demoPassword);
      redirectUser(user.role);
    } catch (err) {
      // Handled
    }
  };

  const redirectUser = (role) => {
    if (role === 'STUDENT') navigate('/student');
    else if (role === 'SECURITY') navigate('/security');
    else if (role === 'ADMIN') navigate('/admin');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Left Side: Demo Credentials & System Highlights */}
        <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/40 border-b md:border-b-0 md:border-r border-slate-800/80 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon Demo Ready
            </div>
            
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Smart Hostel Gate Pass Portal
            </h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Instant verification system for hostel resident visitors with automated overstay tracking and security desk pass checking.
            </p>

            {/* Quick Demo Credentials Panel */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                ⚡ Quick Demo One-Click Login:
              </div>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student1@hostel.com', 'password123')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-sky-300 group-hover:text-sky-200">
                    Host Student 1 (Aarav Sharma)
                  </div>
                  <div className="text-xs text-slate-400">Room 101-A • Approved & Available</div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-sky-500/20 text-sky-300">Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student2@hostel.com', 'password123')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-amber-300 group-hover:text-amber-200">
                    Host Student 2 (Ananya Verma)
                  </div>
                  <div className="text-xs text-slate-400">Room 102-B • Marked Unavailable</div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-amber-500/20 text-amber-300">Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student3@hostel.com', 'password123')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/50 transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-rose-300 group-hover:text-rose-200">
                    Student 3 (Unapproved Demo)
                  </div>
                  <div className="text-xs text-slate-400">Pending Admin Approval (Triggers 403)</div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-rose-500/20 text-rose-300">Test 403</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('security@hostel.com', 'password123')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">
                    Security Guard (Gate 1)
                  </div>
                  <div className="text-xs text-slate-400">Passcode search & check-in desk</div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@hostel.com', 'password123')}
                className="w-full text-left p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 transition-all group flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-purple-300 group-hover:text-purple-200">
                    Hostel Warden (Admin)
                  </div>
                  <div className="text-xs text-slate-400">Student approval & reports dashboard</div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-purple-500/20 text-purple-300">Login</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-500 flex items-center justify-between">
            <span>Passcode Validation System</span>
            <span>All Passwords: <code className="text-slate-300">password123</code></span>
          </div>
        </div>

        {/* Right Side: Login & Registration Tabs */}
        <div className="p-8 flex flex-col justify-center bg-slate-900/60">
          
          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Register Student Account
            </button>
          </div>

          {activeTab === 'login' ? (
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">Account Sign In</h3>
                <p className="text-xs text-slate-400">Enter your official hostel credentials to access your dashboard</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  {error}
                </div>
              )}

              <form onSubmit={handleCustomLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student1@hostel.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Sign In to Dashboard
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">Student Registration</h3>
                <p className="text-xs text-slate-400">Register new account (Requires Warden Admin approval before sign-in)</p>
              </div>

              {regSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  {regSuccessMsg}
                </div>
              )}

              {regErrorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  {regErrorMsg}
                </div>
              )}

              <form onSubmit={handleStudentRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="rahul@hostel.com"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Room No *</label>
                    <input
                      type="text"
                      required
                      value={regRoomNo}
                      onChange={(e) => setRegRoomNo(e.target.value)}
                      placeholder="301-A"
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Hostel Block</label>
                    <select
                      value={regHostelBlock}
                      onChange={(e) => setRegHostelBlock(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Block A">Block A</option>
                      <option value="Block B">Block B</option>
                      <option value="Block C">Block C</option>
                      <option value="Block D">Block D</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all text-xs flex items-center justify-center gap-2"
                >
                  {regLoading ? 'Registering...' : 'Register Account'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
