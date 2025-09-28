import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  Calendar,
  User,
  Mail,
  Phone,
  MessageSquare,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Users
} from 'lucide-react';

interface LandingPageSubmission {
  id: string;
  landingPageId: string;
  landingPageTitle: string;
  formData: Record<string, any>;
  submittedAt: Date;
  userAgent: string;
  ipAddress: string;
  leadScore?: number;
  contactInfo?: {
    email?: string;
    phone?: string;
    name?: string;
  };
}

interface LandingPage {
  id: string;
  title: string;
  status: string;
  submissions: number;
  views: number;
  createdAt: Date;
}

const LandingPageResponses: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<LandingPageSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLandingPages, setLoadingLandingPages] = useState(true);
  const [selectedLandingPage, setSelectedLandingPage] = useState<string>('all');
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSubmissions, setFilteredSubmissions] = useState<LandingPageSubmission[]>([]);
  
  // Pagination state
  const [displayedSubmissions, setDisplayedSubmissions] = useState<LandingPageSubmission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const SUBMISSIONS_PER_PAGE = 10;

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalSubmissions: 0,
    totalLandingPages: 0,
    avgSubmissionsPerPage: 0,
    recentSubmissions: 0
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchLandingPages();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (landingPages.length > 0) {
      console.log('Landing pages loaded, fetching submissions...');
      fetchSubmissions();
    }
  }, [landingPages]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, selectedLandingPage, searchTerm, landingPages]);

  // Handle pagination when filtered submissions change
  useEffect(() => {
    setCurrentPage(1);
    updateDisplayedSubmissions(filteredSubmissions, 1);
  }, [filteredSubmissions]);

  const fetchLandingPages = async () => {
    try {
      setLoadingLandingPages(true);
      // First get all landing pages for the user (without orderBy to avoid index requirement)
      const q = query(
        collection(db, 'landingPages'),
        where('userId', '==', currentUser?.id)
      );
      const querySnapshot = await getDocs(q);
      const landingPagesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Landing Page',
          status: data.status || 'draft',
          submissions: data.submissions || 0,
          views: data.views || 0,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      });
      
      // Sort by creation date on the client side
      landingPagesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setLandingPages(landingPagesData);
      console.log('Fetched landing pages:', landingPagesData);
    } catch (error) {
      console.error('Error fetching landing pages:', error);
    } finally {
      setLoadingLandingPages(false);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching submissions for landing pages...');
      
      // Get all user landing page IDs
      const userLandingPageIds = landingPages.map(lp => lp.id);
      console.log('User landing page IDs:', userLandingPageIds);
      
      if (userLandingPageIds.length === 0) {
        console.log('No landing pages found for user');
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Fetch submissions from multiple collections
      const submissionPromises = [
        // Check formSubmissions collection
        query(
          collection(db, 'formSubmissions'),
          where('landingPageId', 'in', userLandingPageIds),
          orderBy('submittedAt', 'desc'),
          limit(100)
        ),
        // Check form_responses collection
        query(
          collection(db, 'form_responses'),
          where('landing_page_id', 'in', userLandingPageIds),
          orderBy('submitted_at', 'desc'),
          limit(100)
        ),
        // Check landingPageSubmissions collection
        query(
          collection(db, 'landingPageSubmissions'),
          where('landingPageId', 'in', userLandingPageIds),
          orderBy('submittedAt', 'desc'),
          limit(100)
        )
      ];

      const allSubmissions: LandingPageSubmission[] = [];

      for (const queryPromise of submissionPromises) {
        try {
          const querySnapshot = await getDocs(queryPromise);
          const submissions = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              landingPageId: data.landingPageId || data.landing_page_id || '',
              landingPageTitle: data.landingPageTitle || data.landing_page_title || 'Unknown Landing Page',
              formData: data.formData || data.form_data || data.answers || {},
              submittedAt: data.submittedAt?.toDate() || data.submitted_at?.toDate() || new Date(),
              userAgent: data.userAgent || data.user_agent || 'Unknown',
              ipAddress: data.ipAddress || data.ip_address || 'Unknown',
              leadScore: data.leadScore || data.lead_score,
              contactInfo: data.contactInfo || data.contact_info
            };
          });
          allSubmissions.push(...submissions);
        } catch (error) {
          console.error('Error fetching from collection:', error);
        }
      }

      // Remove duplicates based on ID and submission time
      const uniqueSubmissions = allSubmissions.filter((submission, index, self) => 
        index === self.findIndex(s => 
          s.id === submission.id || 
          (s.landingPageId === submission.landingPageId && 
           s.submittedAt.getTime() === submission.submittedAt.getTime())
        )
      );

      // Sort by submission date (most recent first)
      uniqueSubmissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

      setSubmissions(uniqueSubmissions);
      console.log('Fetched submissions:', uniqueSubmissions);

      // Calculate analytics
      const totalSubmissions = uniqueSubmissions.length;
      const totalLandingPages = landingPages.length;
      const avgSubmissionsPerPage = totalLandingPages > 0 ? totalSubmissions / totalLandingPages : 0;
      const recentSubmissions = uniqueSubmissions.filter(s => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return s.submittedAt > oneWeekAgo;
      }).length;

      setAnalytics({
        totalSubmissions,
        totalLandingPages,
        avgSubmissionsPerPage: Math.round(avgSubmissionsPerPage * 10) / 10,
        recentSubmissions
      });

    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }, [landingPages, currentUser]);

  const filterSubmissions = () => {
    let filtered = submissions;

    // Filter by selected landing page
    if (selectedLandingPage !== 'all') {
      filtered = filtered.filter(submission => submission.landingPageId === selectedLandingPage);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(submission => {
        const searchLower = searchTerm.toLowerCase();
        return (
          submission.landingPageTitle.toLowerCase().includes(searchLower) ||
          Object.values(submission.formData).some(value => 
            String(value).toLowerCase().includes(searchLower)
          )
        );
      });
    }

    setFilteredSubmissions(filtered);
  };

  const updateDisplayedSubmissions = (submissions: LandingPageSubmission[], page: number) => {
    const startIndex = (page - 1) * SUBMISSIONS_PER_PAGE;
    const endIndex = startIndex + SUBMISSIONS_PER_PAGE;
    setDisplayedSubmissions(submissions.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(submissions.length / SUBMISSIONS_PER_PAGE));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateDisplayedSubmissions(filteredSubmissions, page);
  };

  const exportToExcel = () => {
    const data = filteredSubmissions.map(submission => ({
      'Landing Page': submission.landingPageTitle,
      'Submitted At': submission.submittedAt.toLocaleString(),
      'Email': submission.contactInfo?.email || submission.formData.email || '',
      'Name': submission.contactInfo?.name || submission.formData.name || '',
      'Phone': submission.contactInfo?.phone || submission.formData.phone || '',
      'Lead Score': submission.leadScore || '',
      'IP Address': submission.ipAddress,
      'User Agent': submission.userAgent,
      ...Object.entries(submission.formData).reduce((acc, [key, value]) => {
        if (key !== 'email' && key !== 'name' && key !== 'phone') {
          acc[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
        }
        return acc;
      }, {} as Record<string, any>)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Landing Page Responses');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `landing-page-responses-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getQuestionLabel = (key: string) => {
    // Convert camelCase to readable format
    return key.replace(/([A-Z])/g, ' $1')
             .replace(/^./, str => str.toUpperCase())
             .trim();
  };

  const renderFilePreview = (fileData: any, questionLabel: string) => {
    if (fileData.isFile) {
      return (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>📎</span>
          <span>{fileData.fileName}</span>
          <span>({Math.round(fileData.fileSize / 1024)}KB)</span>
        </div>
      );
    }
    return <span className="text-gray-700">{String(fileData)}</span>;
  };

  if (loadingLandingPages) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading landing pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Landing Page Responses</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={exportToExcel}
                disabled={filteredSubmissions.length === 0}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalSubmissions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Landing Pages</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalLandingPages}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg per Page</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.avgSubmissionsPerPage}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.recentSubmissions}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Landing Page
                </label>
                <select
                  value={selectedLandingPage}
                  onChange={(e) => setSelectedLandingPage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">All Landing Pages</option>
                  {landingPages.map(lp => (
                    <option key={lp.id} value={lp.id}>
                      {lp.title} ({lp.submissions} responses)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Responses
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading responses...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
            <p className="text-gray-600 mb-4">
              {selectedLandingPage === 'all' 
                ? "You haven't received any responses from your landing pages yet."
                : "No responses found for the selected landing page."
              }
            </p>
            <Link 
              to="/landing-builder" 
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Landing Page
            </Link>
          </div>
        ) : (
          <>
            {/* Horizontal Swipeable Cards Layout */}
            <div className="relative">
              {/* Response Counter */}
              <div className="px-6 py-4 bg-white rounded-lg shadow mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {displayedSubmissions.length} of {filteredSubmissions.length} responses
                  </div>
                  <div className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                </div>
              </div>

              {/* Horizontal Scrollable Cards */}
              <div className="overflow-x-auto pb-4">
                <div className="flex gap-4 p-4 min-w-max">
                  {displayedSubmissions.map((submission, index) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-shrink-0 w-96 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Card Header */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {submission.landingPageTitle}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>{submission.submittedAt.toLocaleDateString()}</span>
                              <span>{submission.submittedAt.toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            {submission.leadScore && (
                              <div className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full mb-1">
                                Score: {submission.leadScore}
                              </div>
                            )}
                            <div className="truncate max-w-24">{submission.ipAddress}</div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        {(submission.contactInfo?.email || submission.contactInfo?.phone || submission.contactInfo?.name) && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {submission.contactInfo?.email && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Mail className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-32">{submission.contactInfo.email}</span>
                              </div>
                            )}
                            {submission.contactInfo?.phone && (
                              <div className="flex items-center text-xs text-gray-600">
                                <Phone className="h-3 w-3 mr-1" />
                                <span>{submission.contactInfo.phone}</span>
                              </div>
                            )}
                            {submission.contactInfo?.name && (
                              <div className="flex items-center text-xs text-gray-600">
                                <User className="h-3 w-3 mr-1" />
                                <span>{submission.contactInfo.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Content - Form Responses */}
                      <div className="p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-3">
                          {Object.entries(submission.formData).map(([key, value]) => (
                            <div key={key} className="border-l-2 border-emerald-200 pl-3">
                              <div className="font-medium text-gray-800 text-sm mb-1">
                                {getQuestionLabel(key)}
                              </div>
                              <div className="text-gray-600 text-sm break-words">
                                {typeof value === 'object' && value !== null ? (
                                  renderFilePreview(value, getQuestionLabel(key))
                                ) : (
                                  <span>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <div className="text-xs text-gray-500 mb-2">
                          Device: {submission.userAgent.includes('Mobile') ? 'Mobile' : submission.userAgent.includes('Tablet') ? 'Tablet' : 'Desktop'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {displayedSubmissions.length > 0 && (
                <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
                  <button
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto');
                      if (container) {
                        container.scrollBy({ left: -400, behavior: 'smooth' });
                      }
                    }}
                    className="p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
              )}

              {displayedSubmissions.length > 0 && (
                <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                  <button
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto');
                      if (container) {
                        container.scrollBy({ left: 400, behavior: 'smooth' });
                      }
                    }}
                    className="p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Compact Pagination for Horizontal Layout */}
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-white rounded-lg shadow mt-4">
                <div className="flex items-center justify-center gap-2">
                  {/* Previous Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Prev</span>
                  </button>

                  {/* Current Page Indicator */}
                  <div className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm">
                    Page {currentPage} of {totalPages}
                  </div>

                  {/* Next Page Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-sm"
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LandingPageResponses;
