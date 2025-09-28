import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormsService, Form, FormResponse } from "./services/formsService";

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    totalViews: number;
    totalStarts: number;
    totalCompletes: number;
    totalAbandons: number;
    conversionRate: number;
    recentResponses: number;
  }>({
    totalViews: 0,
    totalStarts: 0,
    totalCompletes: 0,
    totalAbandons: 0,
    conversionRate: 0,
    recentResponses: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [userForms, allResponses] = await Promise.all([
          FormsService.getUserForms('user123'), // Temporary user ID
          Promise.all((await FormsService.getUserForms('user123')).map(form => 
            FormsService.getFormResponses(form.id)
          )).then(responses => responses.flat())
        ]);
        
        setForms(userForms);
        setSubmissions(allResponses);
        
        // Calculate analytics
        const allAnalytics = await Promise.all(
          userForms.map(form => FormsService.getFormAnalyticsSummary(form.id))
        );
        
        const totalAnalytics = allAnalytics.reduce((acc, curr) => ({
          totalViews: acc.totalViews + curr.totalViews,
          totalStarts: acc.totalStarts + curr.totalStarts,
          totalCompletes: acc.totalCompletes + curr.totalCompletes,
          totalAbandons: acc.totalAbandons + curr.totalAbandons,
          conversionRate: 0, // Will calculate below
          recentResponses: acc.recentResponses + curr.recentResponses
        }), {
          totalViews: 0,
          totalStarts: 0,
          totalCompletes: 0,
          totalAbandons: 0,
          conversionRate: 0,
          recentResponses: 0
        });
        
        totalAnalytics.conversionRate = totalAnalytics.totalStarts > 0 
          ? (totalAnalytics.totalCompletes / totalAnalytics.totalStarts) * 100 
          : 0;
        
        setAnalytics(totalAnalytics);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [activeTab]);

  const handleCreateForm = () => {
    navigate('/form-builder');
  };

  const getFormTitle = (formId: string) => {
    const form = forms.find(f => f.id === formId);
    return form ? form.title : 'Unknown Form';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleExportCSV = () => {
    if (!submissions.length) return;
    const headers = ['Form', 'Date', 'Responses'];
    const rows = submissions.map(sub => [
      getFormTitle(sub.form_id),
      formatDate(sub.created_at),
      JSON.stringify(sub.form_data)
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 font-sans">
      <header className="bg-panel shadow-md border-b border-border rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-extrabold text-heading tracking-tight">Adparlay Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-base text-muted">Welcome, User</span>
              <Link to="/" className="text-base text-error font-semibold bg-error/10 px-3 py-1 rounded-xl transition-colors shadow-sm border border-error">Sign Out</Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-10">
          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Total Forms</p>
                <p className="text-2xl font-semibold text-heading">{loading ? '...' : forms.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-success/10 rounded-lg">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Total Leads</p>
                <p className="text-2xl font-semibold text-heading">{loading ? '...' : submissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-warning/10 rounded-lg">
                <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Recent Responses</p>
                <p className="text-2xl font-semibold text-heading">{loading ? '...' : analytics.recentResponses}</p>
              </div>
            </div>
          </div>

          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Conversion Rate</p>
                <p className="text-2xl font-semibold text-heading">{loading ? '...' : Math.round(analytics.conversionRate)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-info/10 rounded-lg">
                <svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Total Views</p>
                <p className="text-2xl font-semibold text-heading">{loading ? '...' : analytics.totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-panel rounded-3xl shadow-xl border border-border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted">Completions</p>
                <p className="text-2xl font-semibold text-heading">{loading ? '...' : analytics.totalCompletes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-panel rounded-3xl shadow-xl border border-border">
          <div className="border-b border-border rounded-t-3xl">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-secondary hover:border-secondary"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("forms")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "forms"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-secondary hover:border-secondary"
                }`}
              >
                Forms
              </button>
              <button
                onClick={() => setActiveTab("leads")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "leads"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-secondary hover:border-secondary"
                }`}
              >
                Leads
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === "overview" && (
              <div>
                <h2 className="text-lg font-medium text-heading mb-4">Welcome to Adparlay</h2>
                <p className="text-muted mb-6">
                  Manage your lead collection forms and track your business growth.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    className="bg-primary/10 p-4 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => navigate('/form-builder')}
                  >
                    <h3 className="font-medium text-primary">Create Forms</h3>
                    <p className="text-primary text-sm mt-1">Build custom lead collection forms</p>
                  </div>
                  <div
                    className="bg-success/10 p-4 rounded-lg cursor-pointer hover:bg-success/20 transition-colors"
                    onClick={() => setActiveTab('leads')}
                  >
                    <h3 className="font-medium text-success">Track Leads</h3>
                    <p className="text-success text-sm mt-1">Monitor and manage your leads</p>
                  </div>
                  <div
                    className="bg-secondary/10 p-4 rounded-lg cursor-pointer hover:bg-secondary/20 transition-colors"
                    onClick={() => setActiveTab('analytics')}
                  >
                    <h3 className="font-medium text-secondary">Analytics</h3>
                    <p className="text-secondary text-sm mt-1">View performance insights</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "forms" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-heading">Your Forms</h2>
                  <button 
                    onClick={handleCreateForm}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create New Form
                  </button>
                </div>
                <div className="space-y-4">
                  {forms.length === 0 && (
                    <div className="text-muted">No forms yet. Click 'Create New Form' to get started.</div>
                  )}
                  {forms.map((form) => (
                    <div key={form.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-heading">{form.title}</h3>
                          <p className="text-sm text-muted">Created: {new Date(form.created_at).toLocaleString()}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <button className="text-primary hover:text-primary/90 text-sm bg-primary/10 rounded px-3 py-1" onClick={() => window.open(`/#/share/form/${form.id}`, '_blank')}>Preview</button>
                            <button className="text-muted hover:text-secondary text-sm bg-border rounded px-3 py-1" onClick={() => {navigator.clipboard.writeText(window.location.origin + `/#/share/form/${form.id}`)}}>Copy Link</button>
                            <button className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 rounded px-3 py-1" onClick={() => navigate(`/form-builder?edit=${form.id}`)}>Edit</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "leads" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-heading">Recent Leads</h2>
                  <button className="text-primary hover:text-primary/90 text-sm" onClick={handleExportCSV}>Export CSV</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-panel">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Form</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Responses</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-panel divide-y divide-border">
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-muted">
                            No submissions yet. Share your forms to start collecting leads!
                          </td>
                        </tr>
                      ) : (
                        submissions.map((submission) => (
                          <tr key={submission.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-heading">
                              {getFormTitle(submission.form_id)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              {formatDate(submission.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              {Object.keys(submission.form_data).length} responses
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                              <button 
                                className="text-primary hover:text-primary/90"
                                onClick={() => {
                                  alert(JSON.stringify(submission.form_data, null, 2));
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div>
                <h2 className="text-lg font-medium text-heading mb-4">Analytics (Coming Soon)</h2>
                <p className="text-muted">Analytics and insights will be available here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard; 