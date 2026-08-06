import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, UserCheck, Ticket, ArrowRight, Lock, BellRing, Smartphone } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Background Decorative Glow Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center relative z-10">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto space-y-6 pt-4 pb-8">
          
          {/* Hero Main Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold font-heading tracking-tight text-white leading-tight">
            Smart, Secure & Frictionless <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Hostel Visitor Management
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Eliminate gate queues, verify digital passes, track overstays, and broadcast emergency alerts in real time.
          </p>

        </div>

        {/* 4 INTERACTIVE QUICK-ACCESS GATEWAY CARDS */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Resident Student Portal */}
          <Link
            to="/student/login"
            className="group glass-card p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-24 h-24 text-indigo-400" />
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-xl">🎓</span>
              </div>
              <h3 className="text-lg font-bold text-white font-heading mb-2 group-hover:text-indigo-400 transition-colors">
                Resident Student Portal
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Student Login & Registration. Review incoming visitor requests, grant digital passes, and toggle availability status.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Student Login / Signup</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Card 2: Staff & Security Gateway */}
          <Link
            to="/staff/login"
            className="group glass-card p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="w-24 h-24 text-purple-400" />
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-xl">🛡️</span>
              </div>
              <h3 className="text-lg font-bold text-white font-heading mb-2 group-hover:text-purple-400 transition-colors">
                Staff & Security Gateway
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Role-switched login for Security Gate Officers and Hostel Warden Administrators with 1-click emergency broadcast.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Gate & Warden Login</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Card 3: Apply for Visitor Pass */}
          <Link
            to="/visitor/request"
            className="group glass-card p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Ticket className="w-24 h-24 text-emerald-400" />
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-lg font-bold text-white font-heading mb-2 group-hover:text-emerald-400 transition-colors">
                Apply for Visitor Pass
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Public visitor pass application. Submit your details, target host student, and government ID for approval.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Submit Pass Request</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

          {/* Card 4: Track My Visitor Pass */}
          <Link
            to="/visitor/track-pass"
            className="group glass-card p-6 rounded-2xl border border-slate-800 hover:border-sky-500/50 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Key className="w-24 h-24 text-sky-400" />
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-white font-heading mb-2 group-hover:text-sky-400 transition-colors">
                Track My Visitor Pass
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Check approval status, retrieve unique Pass Key Code & QR Code to present at security desk for gate check-in.
              </p>
            </div>
            <div className="flex items-center text-xs font-semibold text-sky-400 group-hover:translate-x-1 transition-transform">
              <span>Track Pass & Get Code</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>

        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-slate-300 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Physical ID Verification</h4>
              <p className="text-slate-400 leading-relaxed">
                Mandatory physical Govt ID (Aadhaar, PAN, DL, Passport) check at gate before visitor check-in.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Overstay Alerts</h4>
              <p className="text-slate-400 leading-relaxed">
                Automated overstay tracking with 1-click Warden alerts to host students and gate security.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white mb-1">Offline Gate Resilience</h4>
              <p className="text-slate-400 leading-relaxed">
                Local storage caching and auto-sync queue ensures security desk operates seamlessly during internet outages.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
