import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string;
  option?: string;
  plotSize?: string;
  finalOption: string;
  timestamp: any;
  userId: string;
  lastUpdated?: any;
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  notes?: string;
  conversionPath?: string;
}

interface EditFormData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  option: string;
  plotSize: string;
  finalOption: string;
  status: string;
  notes: string;
}

interface FilterOptions {
  interest: string;
  status: string;
  dateRange: string;
  finalOption: string;
}

interface CustomizationSettings {
  primaryColor: string;
  secondaryColor: string;
  formLabels: {
    name: string;
    email: string;
    phone: string;
    interest: string;
    finalChoice: string;
  };
  exportDestination: string;
}

const AdminDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSubmission, setEditingSubmission] = useState<FormSubmission | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    name: '',
    email: '',
    phone: '',
    interest: '',
    option: '',
    plotSize: '',
    finalOption: '',
    status: 'new',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    interest: '',
    status: '',
    dateRange: '',
    finalOption: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [customization, setCustomization] = useState<CustomizationSettings>({
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    formLabels: {
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      interest: 'Interest Type',
      finalChoice: 'Final Choice'
    },
    exportDestination: 'local'
  });
  const [conversionStats, setConversionStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    lost: 0,
    conversionRate: 0
  });

  const { getFormResponses, updateFormResponse, logout } = useFirebase();
  const navigate = useNavigate();

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [submissions, filters]);

  useEffect(() => {
    calculateConversionStats();
  }, [submissions]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getFormResponses();
      // Add default status to submissions that don't have one
      const submissionsWithStatus = data.map((sub: FormSubmission) => ({
        ...sub,
        status: sub.status || 'new',
        notes: sub.notes || '',
        conversionPath: sub.conversionPath || 'Direct Form Submission'
      }));
      setSubmissions(submissionsWithStatus);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    if (filters.interest) {
      filtered = filtered.filter(sub => sub.interest === filters.interest);
    }

    if (filters.status) {
      filtered = filtered.filter(sub => sub.status === filters.status);
    }

    if (filters.finalOption) {
      filtered = filtered.filter(sub => sub.finalOption === filters.finalOption);
    }

    if (filters.dateRange) {
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(sub => {
        const submissionDate = sub.timestamp?.toDate?.() || new Date(sub.timestamp);
        return submissionDate >= startDate;
      });
    }

    setFilteredSubmissions(filtered);
  };

  const calculateConversionStats = () => {
    const stats = {
      total: submissions.length,
      new: submissions.filter(s => s.status === 'new').length,
      contacted: submissions.filter(s => s.status === 'contacted').length,
      qualified: submissions.filter(s => s.status === 'qualified').length,
      converted: submissions.filter(s => s.status === 'converted').length,
      lost: submissions.filter(s => s.status === 'lost').length,
      conversionRate: 0
    };
    
    stats.conversionRate = stats.total > 0 ? (stats.converted / stats.total) * 100 : 0;
    setConversionStats(stats);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (submission: FormSubmission) => {
    setEditingSubmission(submission);
    setEditFormData({
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      interest: submission.interest,
      option: submission.option || '',
      plotSize: submission.plotSize || '',
      finalOption: submission.finalOption,
      status: submission.status || 'new',
      notes: submission.notes || ''
    });
  };

  const closeEditModal = () => {
    setEditingSubmission(null);
    setEditFormData({
      name: '',
      email: '',
      phone: '',
      interest: '',
      option: '',
      plotSize: '',
      finalOption: '',
      status: 'new',
      notes: ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;

    try {
      setSaving(true);
      await updateFormResponse(editingSubmission.id, editFormData);
      await loadSubmissions();
      closeEditModal();
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Email', 'Phone', 'Interest', 'Option', 'Plot Size', 
      'Final Choice', 'Status', 'Notes', 'Date', 'Last Updated', 'Conversion Path'
    ];
    const csvData = filteredSubmissions.map(sub => [
      sub.name,
      sub.email,
      sub.phone,
      sub.interest,
      sub.option || '',
      sub.plotSize || '',
      sub.finalOption,
      sub.status || 'new',
      sub.notes || '',
      new Date(sub.timestamp?.toDate?.() || sub.timestamp).toLocaleDateString(),
      sub.lastUpdated ? new Date(sub.lastUpdated?.toDate?.() || sub.lastUpdated).toLocaleDateString() : 'Never',
      sub.conversionPath || 'Direct Form Submission'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // Simple PDF export using window.print() for now
    // In a real implementation, you'd use a library like jsPDF
    window.print();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 font-sans">
      <header className="bg-white shadow-md border-b border-blue-100 rounded-b-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleLogout} className="text-base text-red-600 hover:text-red-800 font-semibold bg-red-50 px-3 py-1 rounded-xl transition-colors shadow-sm border border-red-100">Sign Out</button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Total Leads</h3>
            <p className="text-3xl font-bold text-blue-600">{conversionStats.total}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">New</h3>
            <p className="text-3xl font-bold text-blue-600">{conversionStats.new}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Contacted</h3>
            <p className="text-3xl font-bold text-yellow-600">{conversionStats.contacted}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Qualified</h3>
            <p className="text-3xl font-bold text-purple-600">{conversionStats.qualified}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Converted</h3>
            <p className="text-3xl font-bold text-green-600">{conversionStats.converted}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Lost</h3>
            <p className="text-3xl font-bold text-red-600">{conversionStats.lost}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-900">Conversion Rate</h3>
            <p className="text-3xl font-bold text-indigo-600">{conversionStats.conversionRate.toFixed(1)}%</p>
          </motion.div>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100">
          <div className="border-b border-blue-100 rounded-t-3xl">
            <nav className="-mb-px flex space-x-8 px-6">
              {/* ...tab buttons: use font-bold, rounded-t-xl, bg-blue-50 for active, hover:bg-blue-100, etc... */}
            </nav>
          </div>
          <div className="p-8">
            {/* ...tab content: leads list, etc. Use rounded-xl, shadow, bg-blue-50/50 for cards, modern buttons, etc... */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard; 