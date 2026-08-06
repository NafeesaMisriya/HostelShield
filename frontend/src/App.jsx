import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RoleRoute } from './components/RoleRoute';

import { Landing } from './routes/Landing';
import { VisitorTrackPass } from './routes/VisitorTrackPass';
import { StudentLogin } from './routes/StudentLogin';
import { StaffLogin } from './routes/StaffLogin';
import { VisitorRequestForm } from './routes/VisitorRequestForm';
import { StudentDashboard } from './routes/StudentDashboard';
import { SecurityDesk } from './routes/SecurityDesk';
import { AdminDashboard } from './routes/AdminDashboard';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Enterprise Landing Cover Page */}
              <Route path="/" element={<Landing />} />

              {/* Public Visitor Pass Application & Tracking */}
              <Route path="/visitor/request" element={<VisitorRequestForm />} />
              <Route path="/request-pass" element={<VisitorRequestForm />} />
              <Route path="/visitor/track-pass" element={<VisitorTrackPass />} />

              {/* Student Portal Login & Signup */}
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/register" element={<StudentLogin />} />

              {/* Staff & Security Gateway */}
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/login" element={<StaffLogin />} />

              {/* Authenticated Dashboards */}
              <Route
                path="/student"
                element={
                  <RoleRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/student/dashboard"
                element={
                  <RoleRoute allowedRoles={['STUDENT']}>
                    <StudentDashboard />
                  </RoleRoute>
                }
              />

              <Route
                path="/security"
                element={
                  <RoleRoute allowedRoles={['SECURITY', 'ADMIN']}>
                    <SecurityDesk />
                  </RoleRoute>
                }
              />
              <Route
                path="/security/dashboard"
                element={
                  <RoleRoute allowedRoles={['SECURITY', 'ADMIN']}>
                    <SecurityDesk />
                  </RoleRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <RoleRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </RoleRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
