import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import PaystackPayment from '../components/PaystackPayment';
import AIBuilder from '../components/AIBuilder';
import ExportModal from '../components/ExportModal';
import AuthDebugger from '../components/AuthDebugger';
import { useSEO } from '../hooks/useSEO';

interface Form {
  id: string;
  title: string;
  description?: string;
  fields: any[];
  settings: any;
  status: string;
  createdAt: Date;
  lastSubmission?: Date;
  submissions: number;
}

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // SEO optimization
  useSEO({
    title: 'Dashboard - Adparlay | Build Forms That Tell Your Story',
    description: 'Manage your forms and landing pages with Adparlay dashboard. Track submissions, view analytics, and create beautiful lead capture forms.',
    keywords: 'form dashboard, lead capture analytics, form management, submission tracking',
    canonical: 'https://adparlaysaas.web.app/dashboard'
  });
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [stats, setStats] = useState({
    totalForms: 0,
    totalSubmissions: 0,
    conversionRate: 0,
    thisMonthSubmissions: 0
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deletingForms, setDeletingForms] = useState<Set<string>>(new Set());
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [deletingLandingPages, setDeletingLandingPages] = useState<Set<string>>(new Set());
  const [linkOrganizers, setLinkOrganizers] = useState<any[]>([]);
  const [deletingLinkOrganizers, setDeletingLinkOrganizers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentUser) {
      fetchForms();
      fetchLandingPages();
      fetchLinkOrganizers();
    }
  }, [currentUser]);

  // Refresh forms when user changes - removed automatic refresh to prevent infinite loops

  // Manual refresh function
  const handleRefresh = () => {
    if (currentUser) {
      fetchForms();
      fetchLandingPages();
      fetchLinkOrganizers();
      // Force analytics refresh by updating a state that triggers useEffect
      setStats(prev => ({ ...prev }));
    }
  };

  const deleteForm = async (formId: string) => {
    if (!currentUser?.id) {
      alert('You must be logged in to delete forms.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this form? This action cannot be undone and will also delete all submissions associated with this form.');
    
    if (!confirmDelete) {
      return;
    }

    try {
      // Set loading state immediately for better UX
      setDeletingForms(prev => new Set(prev).add(formId));
      
      // Optimistically remove the form from UI for immediate feedback
      setForms(prev => prev.filter(form => form.id !== formId));
      
      // Delete form and submissions in parallel for better performance
      const formDeletePromise = deleteDoc(doc(db, 'forms', formId));
      
      // Get submissions count first to avoid unnecessary query if none exist
      const submissionsQuery = query(
        collection(db, 'formSubmissions'),
        where('formId', '==', formId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      let submissionsDeletePromise: Promise<any> = Promise.resolve();
      if (submissionsSnapshot.size > 0) {
        // Delete all submissions in parallel
        const deletePromises = submissionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        submissionsDeletePromise = Promise.all(deletePromises);
      }
      
      // Wait for both operations to complete
      await Promise.all([formDeletePromise, submissionsDeletePromise]);
      
      console.log('Form and submissions deleted successfully');
      
      // Update stats immediately without full refresh
      setStats(prev => ({
        ...prev,
        totalForms: prev.totalForms - 1
      }));
      
      // Show success message
      alert('Form deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting form:', error);
      
      // Restore the form in UI if deletion failed
      fetchForms();
      
      alert(`Error deleting form: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      // Clear loading state
      setDeletingForms(prev => {
        const newSet = new Set(prev);
        newSet.delete(formId);
        return newSet;
      });
    }
  };

  const fetchForms = async () => {
    if (!currentUser?.id) {
      console.log('fetchForms: No currentUser.id available');
      return;
    }
    
    try {
      console.log('fetchForms: Fetching forms for user:', currentUser.id);
      
      // First try the filtered query
      try {
        const formsQuery = query(
          collection(db, 'forms'),
          where('userId', '==', currentUser.id),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(formsQuery);
        console.log('fetchForms: Filtered query returned', querySnapshot.size, 'forms');
        
        const formsList: Form[] = [];
        let totalSubmissions = 0;
        let thisMonthSubmissions = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('fetchForms: Form data:', { id: doc.id, title: data.title, userId: data.userId, status: data.status });
          
          const form: Form = {
            id: doc.id,
            title: data.title || 'Untitled Form',
            description: data.description || '',
            fields: data.blocks || data.fields || [],
            settings: data.settings || {},
            status: data.status || 'draft',
            createdAt: data.createdAt?.toDate() || new Date(),
            lastSubmission: data.lastSubmission?.toDate(),
            submissions: data.submissions || 0
          };
          
          formsList.push(form);
          totalSubmissions += form.submissions;
          
          // Calculate this month's submissions
          const thisMonth = new Date().getMonth();
          const formMonth = form.lastSubmission ? form.lastSubmission.getMonth() : -1;
          if (formMonth === thisMonth) {
            thisMonthSubmissions += form.submissions;
          }
        });
        
        console.log('fetchForms: Processed forms:', formsList.length);
        setForms(formsList);
        
        // Calculate average submissions per form
        const avgSubmissionsPerForm = formsList.length > 0 ? totalSubmissions / formsList.length : 0;
        const submissionRate = Math.round(avgSubmissionsPerForm * 10) / 10; // Round to 1 decimal place
        
        setStats({
          totalForms: formsList.length,
          totalSubmissions,
          conversionRate: submissionRate, // This is average submissions per form
          thisMonthSubmissions
        });
        setLoading(false);
        
        // If we found forms, we're done
        if (formsList.length > 0) {
          return;
        }
      } catch (filteredError) {
        console.error('fetchForms: Error with filtered query:', filteredError);
      }
      
      // If no forms found or filtered query failed, try getting all forms and filter manually
      console.log('fetchForms: Trying fallback - getting all forms and filtering manually...');
      try {
        const allFormsQuery = query(collection(db, 'forms'), orderBy('createdAt', 'desc'));
        const allFormsSnapshot = await getDocs(allFormsQuery);
        console.log('fetchForms: Total forms in collection:', allFormsSnapshot.size);
        
        const formsList: Form[] = [];
        let totalSubmissions = 0;
        let thisMonthSubmissions = 0;
        
        allFormsSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('fetchForms: All form data:', { 
            id: doc.id, 
            title: data.title, 
            userId: data.userId, 
            currentUserId: currentUser.id,
            status: data.status 
          });
          
          // Manual filter for current user
          if (data.userId === currentUser.id) {
            const form: Form = {
              id: doc.id,
              title: data.title || 'Untitled Form',
              description: data.description || '',
              fields: data.blocks || data.fields || [],
              settings: data.settings || {},
              status: data.status || 'draft',
              createdAt: data.createdAt?.toDate() || new Date(),
              lastSubmission: data.lastSubmission?.toDate(),
              submissions: data.submissions || 0
            };
            
            formsList.push(form);
            totalSubmissions += form.submissions;
            
            // Calculate this month's submissions
            const thisMonth = new Date().getMonth();
            const formMonth = form.lastSubmission ? form.lastSubmission.getMonth() : -1;
            if (formMonth === thisMonth) {
              thisMonthSubmissions += form.submissions;
            }
          }
        });
        
        console.log('fetchForms: Manually filtered forms:', formsList.length);
        setForms(formsList);
        
        // Calculate average submissions per form
        const avgSubmissionsPerForm = formsList.length > 0 ? totalSubmissions / formsList.length : 0;
        const submissionRate = Math.round(avgSubmissionsPerForm * 10) / 10; // Round to 1 decimal place
        
        setStats({
          totalForms: formsList.length,
          totalSubmissions,
          conversionRate: submissionRate, // This is average submissions per form
          thisMonthSubmissions
        });
        setLoading(false);
        
      } catch (fallbackError) {
        console.error('fetchForms: Error with fallback query:', fallbackError);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      setLoading(false);
    }
  };

  const fetchLandingPages = async () => {
    if (!currentUser?.id) {
      console.log('fetchLandingPages: No currentUser.id available');
      return;
    }
    
    try {
      console.log('fetchLandingPages: Fetching landing pages for user:', currentUser.id);
      
      // Try the ordered query first
      let querySnapshot;
      try {
        const landingPagesQuery = query(
          collection(db, 'landingPages'),
          where('userId', '==', currentUser.id),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(landingPagesQuery);
        console.log('fetchLandingPages: Ordered query returned', querySnapshot.size, 'landing pages');
      } catch (orderError) {
        console.log('fetchLandingPages: Ordered query failed, trying without orderBy:', orderError);
        // Fallback to query without orderBy
        const landingPagesQuery = query(
          collection(db, 'landingPages'),
          where('userId', '==', currentUser.id)
        );
        querySnapshot = await getDocs(landingPagesQuery);
        console.log('fetchLandingPages: Fallback query returned', querySnapshot.size, 'landing pages');
      }
      
      const landingPagesList: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('fetchLandingPages: Landing page data:', { 
          id: doc.id, 
          title: data.title, 
          userId: data.userId, 
          status: data.status,
          createdAt: data.createdAt
        });
        
        const landingPage = {
          id: doc.id,
          title: data.title || 'Untitled Landing Page',
          headline: data.headline || '',
          status: data.status || 'draft',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          views: data.views || 0,
          submissions: data.submissions || 0,
          showMedia: data.showMedia || true,
          additionalLinks: data.additionalLinks || []
        };
        
        landingPagesList.push(landingPage);
      });
      
      // Sort manually if orderBy failed
      landingPagesList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log('fetchLandingPages: Processed landing pages:', landingPagesList.length);
      setLandingPages(landingPagesList);
      
    } catch (error) {
      console.error('Error fetching landing pages:', error);
    }
  };

  const deleteLandingPage = async (landingPageId: string) => {
    if (!currentUser?.id) {
      alert('You must be logged in to delete landing pages.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this landing page? This action cannot be undone.');
    
    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingLandingPages(prev => new Set(prev).add(landingPageId));
      
      setLandingPages(prev => prev.filter(page => page.id !== landingPageId));
      
      await deleteDoc(doc(db, 'landingPages', landingPageId));
      
      console.log('Landing page deleted successfully');
      alert('Landing page deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting landing page:', error);
      fetchLandingPages();
      alert(`Error deleting landing page: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setDeletingLandingPages(prev => {
        const newSet = new Set(prev);
        newSet.delete(landingPageId);
        return newSet;
      });
    }
  };

  const fetchLinkOrganizers = async () => {
    if (!currentUser?.id) {
      console.log('fetchLinkOrganizers: No currentUser.id available');
      return;
    }
    
    try {
      console.log('fetchLinkOrganizers: Fetching link organizers for user:', currentUser.id);
      
      let querySnapshot;
      try {
        const linkOrganizersQuery = query(
          collection(db, 'linkOrganizers'),
          where('userId', '==', currentUser.id),
          orderBy('createdAt', 'desc')
        );
        querySnapshot = await getDocs(linkOrganizersQuery);
        console.log('fetchLinkOrganizers: Ordered query returned', querySnapshot.size, 'link organizers');
      } catch (orderError) {
        console.log('fetchLinkOrganizers: Ordered query failed, trying without orderBy:', orderError);
        const linkOrganizersQuery = query(
          collection(db, 'linkOrganizers'),
          where('userId', '==', currentUser.id)
        );
        querySnapshot = await getDocs(linkOrganizersQuery);
        console.log('fetchLinkOrganizers: Fallback query returned', querySnapshot.size, 'link organizers');
      }
      
      const linkOrganizersList: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('fetchLinkOrganizers: Link organizer data:', { 
          id: doc.id, 
          title: data.title, 
          userId: data.userId, 
          createdAt: data.createdAt
        });
        
        const linkOrganizer = {
          id: doc.id,
          title: data.title || 'Untitled Link Page',
          description: data.description || '',
          profileName: data.profileName || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          links: data.links || [],
          products: data.products || []
        };
        
        linkOrganizersList.push(linkOrganizer);
      });
      
      linkOrganizersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log('fetchLinkOrganizers: Processed link organizers:', linkOrganizersList.length);
      setLinkOrganizers(linkOrganizersList);
      
    } catch (error) {
      console.error('Error fetching link organizers:', error);
    }
  };

  const deleteLinkOrganizer = async (linkOrganizerId: string) => {
    if (!currentUser?.id) {
      alert('You must be logged in to delete link organizers.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this link organizer? This action cannot be undone.');
    
    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingLinkOrganizers(prev => new Set(prev).add(linkOrganizerId));
      
      setLinkOrganizers(prev => prev.filter(organizer => organizer.id !== linkOrganizerId));
      
      await deleteDoc(doc(db, 'linkOrganizers', linkOrganizerId));
      
      console.log('Link organizer deleted successfully');
      alert('Link organizer deleted successfully!');
      
    } catch (error) {
      console.error('Error deleting link organizer:', error);
      fetchLinkOrganizers();
      alert(`Error deleting link organizer: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setDeletingLinkOrganizers(prev => {
        const newSet = new Set(prev);
        newSet.delete(linkOrganizerId);
        return newSet;
      });
    }
  };

  const resetToFree = async () => {
    if (!currentUser?.id) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        subscription: 'free',
        maxForms: 3,
        maxLeads: 100,
        updatedAt: new Date()
      });
      
      // Refresh the page to show updated subscription
      window.location.reload();
    } catch (error) {
      console.error('Error resetting to free plan:', error);
      alert('Error resetting to free plan. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Template data for new forms
  const formTemplates = [
    {
      id: 'real-estate',
      name: 'Real Estate',
      description: 'Property listing and inquiry form',
      icon: '🏠',
      color: 'from-blue-500 to-blue-600',
      questions: [
        { type: 'short_answer', label: 'Property Address', required: true, placeholder: 'Enter the full property address' },
        { type: 'dropdown', label: 'Property Type', required: true, options: ['House', 'Apartment', 'Condo', 'Townhouse', 'Land'] },
        { type: 'short_answer', label: 'Your Name', required: true, placeholder: 'Enter your full name' },
        { type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
        { type: 'phone', label: 'Phone Number', required: true, placeholder: 'Enter your phone number' },
        { type: 'long_answer', label: 'Additional Requirements', required: false, placeholder: 'Any specific requirements or questions?' }
      ]
    },
    {
      id: 'hr',
      name: 'HR & Recruitment',
      description: 'Job application and employee onboarding',
      icon: '👔',
      color: 'from-green-500 to-green-600',
      questions: [
        { type: 'short_answer', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
        { type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
        { type: 'phone', label: 'Phone Number', required: true, placeholder: 'Enter your phone number' },
        { type: 'dropdown', label: 'Position Applied For', required: true, options: ['Software Developer', 'Designer', 'Marketing', 'Sales', 'Administrative', 'Other'] },
        { type: 'file_upload', label: 'Resume/CV', required: true, helpText: 'Upload your resume (PDF, DOC, DOCX)' },
        { type: 'long_answer', label: 'Why are you interested in this position?', required: true, placeholder: 'Tell us about your interest and motivation' }
      ]
    },
    {
      id: 'house-party',
      name: 'House Party',
      description: 'Event RSVP and guest management',
      icon: '🎉',
      color: 'from-purple-500 to-purple-600',
      questions: [
        { type: 'short_answer', label: 'Your Name', required: true, placeholder: 'Enter your full name' },
        { type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
        { type: 'dropdown', label: 'Will you attend?', required: true, options: ['Yes, I\'ll be there!', 'No, I can\'t make it', 'Maybe, I\'ll let you know'] },
        { type: 'number', label: 'Number of Guests', required: false, placeholder: 'How many people are you bringing?' },
        { type: 'long_answer', label: 'Dietary Restrictions', required: false, placeholder: 'Any food allergies or dietary preferences?' },
        { type: 'long_answer', label: 'Song Requests', required: false, placeholder: 'Any songs you\'d like to hear at the party?' }
      ]
    },
    {
      id: 'basic',
      name: 'Basic Contact',
      description: 'Simple contact and inquiry form',
      icon: '📝',
      color: 'from-gray-500 to-gray-600',
      questions: [
        { type: 'short_answer', label: 'Name', required: true, placeholder: 'Enter your name' },
        { type: 'email', label: 'Email', required: true, placeholder: 'Enter your email address' },
        { type: 'phone', label: 'Phone', required: false, placeholder: 'Enter your phone number' },
        { type: 'dropdown', label: 'Subject', required: true, options: ['General Inquiry', 'Support Request', 'Partnership', 'Feedback', 'Other'] },
        { type: 'long_answer', label: 'Message', required: true, placeholder: 'Tell us how we can help you' }
      ]
    },
    {
      id: 'customer-feedback',
      name: 'Customer Feedback',
      description: 'Product and service feedback collection',
      icon: '⭐',
      color: 'from-yellow-500 to-yellow-600',
      questions: [
        { type: 'short_answer', label: 'Customer Name', required: true, placeholder: 'Enter your name' },
        { type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
        { type: 'dropdown', label: 'Product/Service', required: true, options: ['Product A', 'Product B', 'Service C', 'Service D', 'Other'] },
        { type: 'linear_scale', label: 'Overall Satisfaction', required: true, scaleMin: 1, scaleMax: 5, scaleLabels: { min: 'Very Dissatisfied', max: 'Very Satisfied' } },
        { type: 'long_answer', label: 'What did you like most?', required: false, placeholder: 'Tell us what you enjoyed' },
        { type: 'long_answer', label: 'What could we improve?', required: false, placeholder: 'Share your suggestions for improvement' }
      ]
    }
  ];

  const handleTemplateSelect = (template: any) => {
    // Navigate to form builder with template data
    navigate('/builder', { 
      state: { 
        template: template,
        isFromTemplate: true 
      } 
    });
    setShowTemplateModal(false);
  };

  const handleBuildFromScratch = () => {
    // Navigate to form builder without template
    navigate('/builder');
    setShowTemplateModal(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-900 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">AdParlay</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome back, {currentUser?.displayName || 'User'}!</h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              {currentUser?.subscription === 'premium' 
                ? 'You are on the Premium plan with unlimited forms and leads'
                : `You are on the Free plan. You can create up to ${currentUser?.maxForms} forms and collect up to ${currentUser?.maxLeads} leads.`
              }
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Forms</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalForms}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Submissions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg Submissions per Form</p>
                <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#333] hover:border-[#8B5CF6] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#A3A3A3] text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold text-white">{stats.thisMonthSubmissions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-h-[44px] py-3 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 min-h-[44px] py-3 px-6 rounded-lg font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Advanced Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
              
              {/* Subscription Status Notifications */}
              {/* Skip notifications for test accounts */}
              {(() => {
                const testEmails = ['kingflamebeats@gmail.com', 'olugbodeoluwaseyi111@gmail.com'];
                const isTestAccount = currentUser?.email && testEmails.includes(currentUser.email.toLowerCase());
                
                if (isTestAccount) return null;
                
                // Countdown Timer for Active Subscription
                return currentUser?.subscription === 'premium' && 
                       currentUser?.paymentStatus === 'active' && 
                       currentUser?.daysTillExpiry && 
                       currentUser?.daysTillExpiry <= 15 && 
                       currentUser?.daysTillExpiry > 0 && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-400 text-sm font-medium">
                      ⏰ Premium expires in {currentUser.daysTillExpiry} day{currentUser.daysTillExpiry === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-blue-300 text-xs mt-1">
                    Renew your subscription to avoid service interruptions. Upgrade today!
                  </p>
                </div>
                );
              })()}

              {/* Grace Period Warning */}
              {(() => {
                const testEmails = ['kingflamebeats@gmail.com', 'olugbodeoluwaseyi111@gmail.com'];
                const isTestAccount = currentUser?.email && testEmails.includes(currentUser.email.toLowerCase());
                
                if (isTestAccount) return null;
                
                return currentUser?.paymentStatus === 'grace' && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-500/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-yellow-400 text-sm font-medium">
                      ⚠️ Grace Period Active: Your subscription expired but you have limited time left.
                    </span>
                  </div>
                  <p className="text-yellow-300 text-xs mt-1">
                    Some features are limited. Upgrade immediately to maintain full access.
                  </p>
                </div>
                );
              })()}

              {/* Subscription Expired */}
              {(() => {
                const testEmails = ['kingflamebeats@gmail.com', 'olugbodeoluwaseyi111@gmail.com'];
                const isTestAccount = currentUser?.email && testEmails.includes(currentUser.email.toLowerCase());
                
                if (isTestAccount) return null;
                
                return (currentUser?.paymentStatus === 'expired' || (currentUser?.subscription === 'free' && currentUser?.maxLeads === 100)) && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-red-400 text-sm font-medium">
                      Subscription Expired: Upgrade to create new forms and landing pages.
                    </span>
                  </div>
                  <p className="text-red-300 text-xs mt-1">
                    You can view existing content but cannot create new items. Renew subscription now.
                  </p>
                </div>
                );
              })()}

              {/* Form Limit Warning for Free Users */}
              {currentUser?.subscription === 'free' && forms.length >= (currentUser?.maxForms || 3) && (
                <div className="mb-4 p-3 bg-orange-900/20 border border-orange-500/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-orange-400 text-sm font-medium">
                      You've reached your limit of {currentUser?.maxForms || 3} forms on the free plan.
                    </span>
                  </div>
                  <p className="text-orange-300 text-xs mt-1">
                    Delete some forms or upgrade to Premium for unlimited forms.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    if (currentUser?.subscription === 'free' && forms.length >= (currentUser?.maxForms || 3)) {
                      alert('You have reached your form limit. Please delete some forms or upgrade to Premium.');
                      return;
                    }
                    setShowTemplateModal(true);
                  }}
                  className={`min-h-[44px] px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                    currentUser?.subscription === 'free' && forms.length >= (currentUser?.maxForms || 3)
                      ? 'bg-gray-500 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  + Create New Form
                </button>
                <Link
                  to="/landing-builder"
                  className="min-h-[44px] px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center"
                >
                  + Create New Page
                </Link>
                <Link
                  to="/link-organizer-builder"
                  className="min-h-[44px] px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center"
                >
                  + Link Organizer
                </Link>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="min-h-[44px] px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>

            {/* Forms List */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Forms</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    className="min-h-[44px] px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                  <span className="text-gray-600 text-sm">{forms.length} forms</span>
                </div>
              </div>
              
              {forms.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg mb-4">No forms created yet</p>
                  <Link
                    to="/builder"
                    className="min-h-[44px] px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all inline-flex items-center justify-center"
                  >
                    Create Your First Form
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {forms.map((form) => (
                    <motion.div
                      key={form.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 transition-all shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Form Info - Flexible width */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{form.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{form.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="whitespace-nowrap">Created: {form.createdAt.toLocaleDateString()}</span>
                            <span className="whitespace-nowrap">Submissions: {form.submissions}</span>
                            {form.lastSubmission && (
                              <span className="whitespace-nowrap">Last: {form.lastSubmission.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Buttons - Fixed width, properly aligned */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-32 flex-shrink-0">
                          <div className="flex items-center gap-2 mb-2 lg:mb-0">
                            <span className={`w-3 h-3 rounded-full ${getStatusColor(form.status)}`}></span>
                            <span className="text-xs text-gray-500 capitalize">{form.status}</span>
                          </div>
                          
                          <Link
                            to={`/builder/${form.id}`}
                            className="min-h-[44px] px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium text-sm"
                          >
                            Edit
                          </Link>
                          
                          <Link
                            to="/responses"
                            className="min-h-[44px] px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium text-sm inline-flex items-center justify-center"
                            title="View all responses for this form"
                          >
                            View Responses
                          </Link>
                          
                          <button
                            onClick={() => deleteForm(form.id)}
                            disabled={deletingForms.has(form.id)}
                            className={`min-h-[44px] px-4 py-3 rounded-lg transition-colors text-center font-medium text-sm ${
                              deletingForms.has(form.id)
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                            title="Delete this form and all its submissions"
                          >
                            {deletingForms.has(form.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Landing Pages List */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Landing Pages</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    className="min-h-[44px] px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                  <span className="text-gray-600 text-sm">{landingPages.length} landing pages</span>
                </div>
              </div>
              
              {landingPages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg mb-4">No landing pages created yet</p>
                  <Link
                    to="/landing-builder"
                    className="min-h-[44px] px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all inline-flex items-center justify-center"
                  >
                    Create Your First Landing Page
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {landingPages.map((landingPage) => (
                    <motion.div
                      key={landingPage.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 transition-all shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Landing Page Info - Flexible width */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{landingPage.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{landingPage.headline}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="whitespace-nowrap">Created: {landingPage.createdAt.toLocaleDateString()}</span>
                            <span className="whitespace-nowrap">Views: {landingPage.views}</span>
                            <span className="whitespace-nowrap">Submissions: {landingPage.submissions}</span>
                            <span className="whitespace-nowrap">Status: <span className={`capitalize px-2 py-1 rounded-full text-xs ${
                              landingPage.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>{landingPage.status}</span></span>
                          </div>
                        </div>
                        
                        {/* Action Buttons - Fixed width, properly aligned */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-32 flex-shrink-0">
                          <Link
                            to={`/landing/${landingPage.id}`}
                            target="_blank"
                            className="min-h-[44px] px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-medium text-sm"
                          >
                            View Live
                          </Link>
                          
                          <Link
                            to={`/landing-builder?edit=${landingPage.id}`}
                            className="min-h-[44px] px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium text-sm"
                          >
                            Edit
                          </Link>
                          
                          <Link
                            to="/landing-responses"
                            className="min-h-[44px] px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-center font-medium text-sm"
                          >
                            View Responses
                          </Link>
                          
                          <button
                            onClick={() => deleteLandingPage(landingPage.id)}
                            disabled={deletingLandingPages.has(landingPage.id)}
                            className={`min-h-[44px] px-4 py-3 rounded-lg transition-colors text-center font-medium text-sm ${
                              deletingLandingPages.has(landingPage.id)
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {deletingLandingPages.has(landingPage.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Link Organizers List */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Link Organizers</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    className="min-h-[44px] px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </button>
                  <span className="text-gray-600 text-sm">{linkOrganizers.length} link organizers</span>
                </div>
              </div>
              
              {linkOrganizers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg mb-4">No link organizers created yet</p>
                  <Link
                    to="/link-organizer-builder"
                    className="min-h-[44px] px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-all inline-flex items-center justify-center"
                  >
                    Create Your First Link Organizer
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {linkOrganizers.map((linkOrganizer) => (
                    <motion.div
                      key={linkOrganizer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:border-orange-300 transition-all shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                        {/* Link Organizer Info - Flexible width */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{linkOrganizer.title}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{linkOrganizer.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <span className="whitespace-nowrap">Created: {linkOrganizer.createdAt.toLocaleDateString()}</span>
                            <span className="whitespace-nowrap">Links: {linkOrganizer.links.length}</span>
                            <span className="whitespace-nowrap">Products: {linkOrganizer.products.length}</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons - Fixed width, properly aligned */}
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-32 flex-shrink-0">
                          <Link
                            to={linkOrganizer.username ? `/${linkOrganizer.username}` : `/link/${linkOrganizer.id}`}
                            target="_blank"
                            className="min-h-[44px] px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-center font-medium text-sm"
                          >
                            View Live
                          </Link>
                          
                          <Link
                            to={`/link-organizer-builder/${linkOrganizer.id}`}
                            className="min-h-[44px] px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-medium text-sm"
                          >
                            Edit
                          </Link>
                          
                          <button
                            onClick={() => deleteLinkOrganizer(linkOrganizer.id)}
                            disabled={deletingLinkOrganizers.has(linkOrganizer.id)}
                            className={`min-h-[44px] px-4 py-3 rounded-lg transition-colors text-center font-medium text-sm ${
                              deletingLinkOrganizers.has(linkOrganizer.id)
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {deletingLinkOrganizers.has(linkOrganizer.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <AdvancedAnalytics 
            key={`${currentUser?.id}-${forms.length}-${stats.totalSubmissions}`}
            userId={currentUser?.id || ''} 
            isProUser={currentUser?.subscription === 'premium'}
          />
        )}
      </div>

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Choose a Template</h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">Start with a pre-built template or build from scratch. You can customize any template after selection.</p>
              
              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {formTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center text-2xl mb-3`}>
                      {template.icon}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="text-xs text-gray-500">
                      {template.questions.length} questions
                    </div>
                  </div>
                ))}
              </div>
              
              {/* AI Builder Option - Premium Only */}
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span className="text-purple-600 font-semibold">AI Builder</span>
                      {currentUser?.subscription === 'premium' && (
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">Premium</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">Describe your form and let AI build it for you</p>
                  </div>
                  
                  {currentUser?.subscription === 'premium' ? (
                    <button
                      onClick={() => setShowAIBuilderModal(true)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                    >
                      Use AI Builder
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                      disabled
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              </div>
              
              {/* Build from Scratch Option */}
              <div className="border-t border-gray-200 pt-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Or start completely fresh</p>
                  <button
                    onClick={handleBuildFromScratch}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
                  >
                    Build from Scratch
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Upgrade to Premium</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <PaystackPayment 
                onSuccess={() => {
                  setShowPaymentModal(false);
                  // Refresh the page to show updated subscription
                  window.location.reload();
                }}
                onClose={() => setShowPaymentModal(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Builder Modal */}
      {showAIBuilderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">AI Form Builder</h3>
                <button
                  onClick={() => setShowAIBuilderModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <AIBuilder 
                onSuccess={(formData) => {
                  setShowAIBuilderModal(false);
                  // Navigate to form builder with AI-generated data
                  navigate('/builder', { 
                    state: { 
                      aiGeneratedForm: formData,
                      isFromAI: true 
                    } 
                  });
                }}
                onClose={() => setShowAIBuilderModal(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* View Responses Modal */}
      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          userId={currentUser?.id || ''}
          isProUser={currentUser?.subscription === 'premium'}
        />
      )}
      
      {/* Auth Debugger - Only in development */}
      {process.env.NODE_ENV === 'development' && <AuthDebugger />}
    </div>
  );
};

export default Dashboard;
