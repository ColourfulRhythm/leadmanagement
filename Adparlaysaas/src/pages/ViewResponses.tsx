import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import LeadViewer from '../components/LeadViewer';

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  formData: Record<string, any>;
  submittedAt: Date;
  userAgent: string;
  ipAddress: string;
}

interface Form {
  id: string;
  title: string;
  blocks?: Array<{
    title: string;
    questions: Array<{
      id: string;
      label: string;
      type: string;
    }>;
  }>;
}

const ViewResponses: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [responses, setResponses] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingForms, setLoadingForms] = useState(true);
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [forms, setForms] = useState<Form[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResponses, setFilteredResponses] = useState<FormSubmission[]>([]);
  
  // Pagination state
  const [displayedResponses, setDisplayedResponses] = useState<FormSubmission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const RESPONSES_PER_PAGE = 10;

  // Lead viewer state
  const [isLeadViewerOpen, setIsLeadViewerOpen] = useState(false);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchForms();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (forms.length > 0) {
      console.log('Forms loaded, fetching responses...');
      fetchResponses();
    }
  }, [forms]); // Remove fetchResponses dependency to avoid circular dependency

  useEffect(() => {
    filterResponses();
  }, [responses, selectedForm, searchTerm, forms]);

  // Handle pagination when filtered responses change
  useEffect(() => {
    setCurrentPage(1);
    updateDisplayedResponses(filteredResponses, 1);
  }, [filteredResponses]);

  const fetchForms = async () => {
    try {
      setLoadingForms(true);
      console.log('Fetching forms for user:', currentUser?.id);
      
      // Try the optimized query first
      try {
        const formsQuery = query(
          collection(db, 'forms'),
          where('userId', '==', currentUser?.id),
          orderBy('createdAt', 'desc')
        );
        const formsSnapshot = await getDocs(formsQuery);
        const formsData = formsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            blocks: data.blocks || []
          };
        });
        
        console.log('Forms fetched with optimized query:', formsData);
        setForms(formsData);
        return;
      } catch (indexError) {
        console.log('Error with filtered query:', indexError);
        console.log('Trying fallback - getting all forms and filtering manually...');
        
        // Fallback: get all forms and filter manually
        const allFormsSnapshot = await getDocs(collection(db, 'forms'));
        console.log('Total forms in collection:', allFormsSnapshot.docs.length);
        
        const allFormsData = allFormsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            blocks: data.blocks || [],
            userId: data.userId,
            currentUserId: currentUser?.id,
            status: data.status
          };
        });
        
        // Log all form data for debugging
        allFormsData.forEach(form => {
          console.log('All form data:', form);
        });
        
        // Filter forms manually by userId
        const userForms = allFormsData.filter(form => form.userId === currentUser?.id);
        console.log('Manually filtered forms:', userForms.length);
        
        const formsData = userForms.map(form => ({
          id: form.id,
          title: form.title,
          blocks: form.blocks || []
        }));
        
        console.log('Forms fetched with fallback:', formsData);
        setForms(formsData);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
      setForms([]);
    } finally {
      setLoadingForms(false);
    }
  };

  const fetchResponses = useCallback(async () => {
    try {
      setLoading(true);
      
      // Only fetch if we have forms
      if (forms.length === 0) {
        setResponses([]);
        setLoading(false);
        return;
      }

      // Check subscription status for lead viewing limits
      const isSubscriptionExpired = currentUser?.subscription === 'free' && 
                                   (currentUser?.paymentStatus === 'expired' || !currentUser?.subscriptionExpiryDate);
      const maxSubmissionsToShow = isSubscriptionExpired ? (currentUser?.maxLeads || 100) : 999999;
      
      // Get user's form IDs
      const userFormIds = forms.map(form => form.id);
      
      console.log('Starting to fetch responses for forms:', userFormIds);
      
      // First, let's check if there are any submissions at all in the collection
      try {
        const allSubmissionsCheck = query(collection(db, 'formSubmissions'));
        const allSubmissionsSnapshot = await getDocs(allSubmissionsCheck);
        console.log('Total submissions in formSubmissions collection:', allSubmissionsSnapshot.docs.length);
        
        if (allSubmissionsSnapshot.docs.length > 0) {
          console.log('Sample submission data:', allSubmissionsSnapshot.docs[0].data());
        }
      } catch (checkError) {
        console.log('Error checking total submissions:', checkError);
      }
      
      // No timeout needed - let fallback logic complete naturally
      
      // Create a batch of queries for each form to get responses efficiently
      const responsePromises = userFormIds.map(async (formId) => {
        // First try the optimized query
        try {
          const formResponsesQuery = query(
            collection(db, 'formSubmissions'),
            where('formId', '==', formId),
            orderBy('submittedAt', 'desc'),
            limit(100) // Limit to 100 responses per form for performance
          );
          const formResponsesSnapshot = await getDocs(formResponsesQuery);
          
          console.log(`Form ${formId}: Found ${formResponsesSnapshot.docs.length} responses with optimized query`);
          
          return formResponsesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              formId: data.formId,
              formTitle: data.formTitle || forms.find(f => f.id === formId)?.title || 'Unknown Form',
              formData: data.formData || data.responses || {},
              submittedAt: data.submittedAt?.toDate() || new Date(),
              userAgent: data.userAgent || 'Unknown',
              ipAddress: data.ipAddress || 'Unknown'
            } as FormSubmission;
          });
        } catch (optimizedError) {
          console.log(`Form ${formId}: Optimized query failed with error:`, optimizedError instanceof Error ? optimizedError.message : String(optimizedError));
          console.log(`Form ${formId}: Trying fallback...`);
          
          try {
            // Fallback: get all form submissions and filter manually (without orderBy to avoid index requirement)
            console.log(`Form ${formId}: Starting fallback query...`);
            const allSubmissionsQuery = query(collection(db, 'formSubmissions'));
            const allSubmissionsSnapshot = await getDocs(allSubmissionsQuery);
            console.log(`Form ${formId}: Fallback query returned ${allSubmissionsSnapshot.docs.length} total submissions`);
            
            // Filter for this specific form and sort manually
            const formResponses = allSubmissionsSnapshot.docs
              .filter(doc => {
                const data = doc.data();
                const matchesForm = data.formId === formId;
                console.log(`Form ${formId}: Checking submission ${doc.id}: formId=${data.formId}, matches=${matchesForm}`);
                return matchesForm;
              })
              .sort((a, b) => {
                const aDate = a.data().submittedAt?.toDate?.() || new Date(0);
                const bDate = b.data().submittedAt?.toDate?.() || new Date(0);
                return bDate.getTime() - aDate.getTime(); // Most recent first
              })
              .slice(0, 100); // Limit to 100 responses
            
            console.log(`Form ${formId}: Found ${formResponses.length} responses with fallback query`);
            
            return formResponses.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                formId: data.formId,
                formTitle: data.formTitle || forms.find(f => f.id === formId)?.title || 'Unknown Form',
                formData: data.formData || data.responses || {},
                submittedAt: data.submittedAt?.toDate() || new Date(),
                userAgent: data.userAgent || 'Unknown',
                ipAddress: data.ipAddress || 'Unknown'
              } as FormSubmission;
            });
          } catch (fallbackError) {
            console.error(`Form ${formId}: Both optimized and fallback queries failed:`, fallbackError);
            console.error(`Form ${formId}: Fallback error details:`, fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
            return [];
          }
        }
      });
      
      // Wait for all form responses to be fetched without timeout race condition
      console.log('Waiting for all response promises to complete...');
      const allFormResponses = await Promise.allSettled(responsePromises);
      
      console.log('All response promises completed. Processing results...');
      
      // Extract successful results and handle failures
      const successfulResponses: FormSubmission[][] = [];
      allFormResponses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Form ${userFormIds[index]}: Successfully fetched ${result.value.length} responses`);
          successfulResponses.push(result.value);
        } else {
          console.error(`Form ${userFormIds[index]} failed to fetch responses:`, result.reason);
          successfulResponses.push([]); // Empty array for failed forms
        }
      });
      
      // Flatten the array of responses
      const userResponses = successfulResponses.flat();
      
      // Sort by submission date (most recent first)
      userResponses.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      
      // Apply subscription limitations - limit viewing to maxSubmissionsToShow
      const limitedResponses = userResponses.slice(0, maxSubmissionsToShow);
      
      console.log('Fetched responses:', {
        totalForms: forms.length,
        totalResponses: limitedResponses.length,
        isLimited: isSubscriptionExpired,
        maxAllowed: maxSubmissionsToShow,
        responsesPerForm: successfulResponses.map(responses => responses.length)
      });
      
      // Set responses even if empty
      setResponses(limitedResponses);
      
      // If no responses found, log it for debugging
      if (userResponses.length === 0) {
        console.log('No responses found for any forms. This might be normal if forms are new.');
        console.log('Debug info: Check if there are any documents in the formSubmissions collection');
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  }, [forms]);

  const filterResponses = () => {
    let filtered = responses;

    // Filter by selected form
    if (selectedForm !== 'all') {
      filtered = filtered.filter(response => response.formId === selectedForm);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(response => 
        response.formTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.entries(response.formData).some(([key, value]) => {
          const questionLabel = getQuestionLabel(response.formId, key);
          return questionLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    setFilteredResponses(filtered);
  };

  const updateDisplayedResponses = (allResponses: FormSubmission[], page: number) => {
    const startIndex = (page - 1) * RESPONSES_PER_PAGE;
    const endIndex = startIndex + RESPONSES_PER_PAGE;
    const pageResponses = allResponses.slice(startIndex, endIndex);
    
    setDisplayedResponses(pageResponses);
    setCurrentPage(page);
    
    // Calculate total pages
    const pages = Math.ceil(allResponses.length / RESPONSES_PER_PAGE);
    setTotalPages(pages);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    updateDisplayedResponses(filteredResponses, page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const openLeadViewer = (responseIndex: number) => {
    setSelectedLeadIndex(responseIndex);
    setIsLeadViewerOpen(true);
  };

  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  };

  const getQuestionLabel = (formId: string, questionId: string): string => {
    const form = forms.find(f => f.id === formId);
    console.log('getQuestionLabel called:', { formId, questionId, formFound: !!form });
    
    if (!form || !form.blocks) {
      console.log('Form not found or no blocks:', { formId, form, blocks: form?.blocks });
      return questionId;
    }
    
    console.log('Form blocks:', form.blocks);
    
    for (const block of form.blocks) {
      console.log('Checking block:', block);
      const question = block.questions?.find(q => q.id === questionId);
      if (question) {
        console.log('Question found:', question);
        return question.label;
      }
    }
    
    console.log('Question not found, returning ID:', questionId);
    return questionId;
  };

  const downloadToExcel = () => {
    if (filteredResponses.length === 0) return;
    
    // Prepare data for Excel with question labels as column headers
    const excelData = filteredResponses.map(response => {
      const row: any = {
        'Form Title': response.formTitle,
        'Submitted Date': response.submittedAt.toLocaleDateString(),
        'Submitted Time': response.submittedAt.toLocaleTimeString(),
        'Device': getDeviceInfo(response.userAgent),
        'IP Address': response.ipAddress
      };
      
      // Add form responses with question labels as column headers
      Object.entries(response.formData).forEach(([key, value]) => {
        const questionLabel = getQuestionLabel(response.formId, key);
        row[questionLabel] = typeof value === 'object' && value?.isFile 
          ? `${value.fileName} (${value.fileType})`
          : typeof value === 'string' ? value : JSON.stringify(value);
      });
      
      return row;
    });
    
    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Form Responses');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Download file
    const fileName = `form-responses-${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(data, fileName);
  };

  const downloadToCSV = () => {
    if (filteredResponses.length === 0) return;
    
    // Prepare data for CSV with question labels as column headers
    const csvData = filteredResponses.map(response => {
      const row: any = {
        'Form Title': response.formTitle,
        'Submitted Date': response.submittedAt.toLocaleDateString(),
        'Submitted Time': response.submittedAt.toLocaleTimeString(),
        'Device': getDeviceInfo(response.userAgent),
        'IP Address': response.ipAddress
      };
      
      // Add form responses with question labels as column headers
      Object.entries(response.formData).forEach(([key, value]) => {
        const questionLabel = getQuestionLabel(response.formId, key);
        row[questionLabel] = typeof value === 'object' && value?.isFile 
          ? `${value.fileName} (${value.fileType})`
          : typeof value === 'string' ? value : JSON.stringify(value);
      });
      
      return row;
    });
    
    // Convert to CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `form-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    saveAs(blob, fileName);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Form Responses</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">View and analyze all responses from your forms</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {filteredResponses.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={downloadToExcel}
                    className="flex-1 sm:flex-none min-h-[44px] px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2 text-sm"
                    title="Download responses as Excel file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Excel</span>
                  </button>
                  <button
                    onClick={downloadToCSV}
                    className="flex-1 sm:flex-none min-h-[44px] px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm"
                    title="Download responses as CSV file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
              )}
              <Link
                to="/dashboard"
                className="min-h-[44px] px-4 sm:px-6 py-3 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 transition-all inline-flex items-center justify-center text-sm sm:text-base"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Subscription Status Notifications */}
        {(() => {
          const isSubscriptionExpired = currentUser?.subscription === 'free' && 
                                   (currentUser?.paymentStatus === 'expired' || !currentUser?.subscriptionExpiryDate);
          const isInGracePeriod = currentUser?.paymentStatus === 'grace';
          const isActiveButExpiring = currentUser?.subscription === 'premium' && 
                                     currentUser?.paymentStatus === 'active' && 
                                     currentUser?.daysTillExpiry && 
                                     currentUser?.daysTillExpiry <= 15 && 
                                     currentUser?.daysTillExpiry > 0;
          
          // Countdown Reminder
          if (isActiveButExpiring) {
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800">
                      ⏰ Subscription expires in {currentUser.daysTillExpiry} day{currentUser.daysTillExpiry === 1 ? '' : 's'}
                    </h3>
                    <p className="text-sm text-blue-700">Renew your subscription to avoid service interruptions. View all leads and enjoy unlimited access!</p>
                  </div>
                </div>
              </div>
            );
          }
          
          if (isInGracePeriod) {
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">Grace Period Active</h3>
                    <p className="text-sm text-yellow-700">Your subscription has expired but you're in a 5-day grace period. Some features are limited. Upgrade now to maintain full access.</p>
                  </div>
                </div>
              </div>
            );
          }
          
          if (isSubscriptionExpired) {
            return (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-orange-800">Subscription Expired</h3>
                    <p className="text-sm text-orange-700">
                      You can view your existing forms and last 100 leads. Create new forms, landing pages, and view all leads by upgrading to Premium.
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          
          return null;
        })()}
        
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Responses</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by form title or response content..."
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
            </div>

            {/* Form Filter */}
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Form</label>
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              >
                <option value="all">All Forms</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
              <span>Total: <strong className="text-gray-900">{responses.length}</strong></span>
              <span>Filtered: <strong className="text-gray-900">{filteredResponses.length}</strong></span>
              <span>Forms: <strong className="text-gray-900">{forms.length}</strong></span>
              {filteredResponses.length > 0 && (
                <span>Showing: <strong className="text-gray-900">{displayedResponses.length} of {filteredResponses.length}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Responses Display */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loadingForms || loading ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm sm:text-base">
                {loadingForms ? 'Loading forms...' : 'Loading responses...'}
              </p>
              {!loadingForms && forms.length > 0 && (
                <p className="text-xs sm:text-sm text-gray-500 mt-2">
                  Fetching responses from {forms.length} form{forms.length !== 1 ? 's' : ''}...
                </p>
              )}
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
              <p className="text-gray-600 text-sm sm:text-base">
                {responses.length === 0 
                  ? "You haven't received any form submissions yet. Share your forms to start collecting responses!"
                  : "No responses match your current filters. Try adjusting your search or form selection."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Horizontal Swipeable Cards Layout */}
              <div className="relative">
                {/* Response Counter */}
                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {displayedResponses.length} of {filteredResponses.length} responses
                    </div>
                    <div className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                </div>

                {/* Horizontal Scrollable Cards */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4 p-4 min-w-max">
                    {displayedResponses.map((response, index) => (
                      <motion.div
                        key={response.id}
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
                                {response.formTitle}
                              </h3>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{response.submittedAt.toLocaleDateString()}</span>
                                <span>{response.submittedAt.toLocaleTimeString()}</span>
                              </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div className="font-medium">{getDeviceInfo(response.userAgent)}</div>
                              <div className="truncate max-w-24">{response.ipAddress}</div>
                            </div>
                          </div>
                        </div>

                        {/* Card Content - Form Responses */}
                        <div className="p-4 max-h-96 overflow-y-auto">
                          <div className="space-y-3">
                            {Object.entries(response.formData).map(([key, value]) => (
                              <div key={key} className="border-l-2 border-blue-200 pl-3">
                                <div className="font-medium text-gray-800 text-sm mb-1">
                                  {getQuestionLabel(response.formId, key)}
                                </div>
                                <div className="text-gray-600 text-sm break-words">
                                  {typeof value === 'string' ? (
                                    <span>{value}</span>
                                  ) : typeof value === 'object' && value?.isFile ? (
                                    <span className="text-blue-600 font-medium">
                                      📎 {value.fileName} ({Math.round(value.fileSize / 1024)}KB)
                                    </span>
                                  ) : (
                                    <span>{JSON.stringify(value)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                          <button
                            onClick={() => openLeadViewer(displayedResponses.indexOf(response))}
                            className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            View Full Details
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {displayedResponses.length > 0 && (
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

                {displayedResponses.length > 0 && (
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
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Previous Page Button */}
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span className="hidden sm:inline">Previous Page</span>
                      <span className="sm:hidden">Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      {Array.from({ length: totalPages }, (_, index) => {
                        const pageNumber = index + 1;
                        const isCurrentPage = pageNumber === currentPage;
                        
                        // Show page numbers with smart truncation for many pages
                        if (totalPages <= 7) {
                          // Show all pages if 7 or fewer
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => goToPage(pageNumber)}
                              className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                isCurrentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else {
                          // Smart truncation for many pages
                          if (pageNumber === 1 || pageNumber === totalPages || 
                              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => goToPage(pageNumber)}
                                className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                                  isCurrentPage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                }`}
                              >
                                {pageNumber}
                              </button>
                            );
                          } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                            return <span key={pageNumber} className="px-1 sm:px-2 text-gray-500 text-sm">...</span>;
                          }
                          return null;
                        }
                      })}
                    </div>

                    {/* Next Page Button */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <span className="hidden sm:inline">Next Page</span>
                      <span className="sm:hidden">Next</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Page Info */}
                  <div className="text-center mt-3 text-xs sm:text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • Showing {displayedResponses.length} of {filteredResponses.length} responses
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lead Viewer Modal */}
      <LeadViewer
        responses={filteredResponses}
        forms={forms}
        isOpen={isLeadViewerOpen}
        onClose={() => setIsLeadViewerOpen(false)}
        initialIndex={selectedLeadIndex}
      />
    </div>
  );
};

export default ViewResponses;
