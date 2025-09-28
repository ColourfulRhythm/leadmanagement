import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormPreview from './pages/FormPreview';
import ViewResponses from './pages/ViewResponses';
import Blog from './pages/Blog';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import HelpCenter from './pages/HelpCenter';
import LandingPageBuilder from './pages/LandingPageBuilder';
import LandingPageView from './pages/LandingPageView';
import LandingPageResponses from './pages/LandingPageResponses';
import LinkOrganizerBuilder from './pages/LinkOrganizerBuilder';
import LinkOrganizerView from './pages/LinkOrganizerView';
import UsernameView from './pages/UsernameView';
import AdminLogin from './AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import PremiumProtectedRoute from './components/PremiumProtectedRoute';
import PerformanceMonitor from './components/PerformanceMonitor';
import './utils/firebaseDiagnostics'; // Auto-run Firebase diagnostics
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/helpcenter" element={<HelpCenter />} />
            <Route path="/landing-builder" element={
              <PremiumProtectedRoute>
                <LandingPageBuilder />
              </PremiumProtectedRoute>
            } />
            <Route path="/link-organizer-builder" element={
              <PremiumProtectedRoute>
                <LinkOrganizerBuilder />
              </PremiumProtectedRoute>
            } />
            <Route path="/link-organizer-builder/:id" element={
              <PremiumProtectedRoute>
                <LinkOrganizerBuilder />
              </PremiumProtectedRoute>
            } />
            <Route path="/landing/:landingId" element={<LandingPageView />} />
            <Route path="/link/:linkId" element={<LinkOrganizerView />} />
            <Route path="/form/:formId" element={<FormPreview />} />
            <Route path="/:username" element={<UsernameView />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/builder" element={
              <ProtectedRoute>
                <FormBuilder />
              </ProtectedRoute>
            } />
            
            <Route path="/builder/:formId" element={
              <ProtectedRoute>
                <FormBuilder />
              </ProtectedRoute>
            } />
            
            <Route path="/responses" element={
              <ProtectedRoute>
                <ViewResponses />
              </ProtectedRoute>
            } />
            
            <Route path="/landing-responses" element={
              <ProtectedRoute>
                <LandingPageResponses />
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminLogin />} />
            
            {/* Catch all route */}
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </div>
        {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
      </Router>
    </AuthProvider>
  );
}

export default App; 