import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import PaystackPayment from './PaystackPayment';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Download, FileSpreadsheet, BarChart3, FileText, Filter, FileText as FileIcon, BarChart3 as ChartIcon, Globe, Eye, TrendingUp, Clock } from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart
} from 'recharts';

interface AnalyticsData {
  totalForms: number;
  totalSubmissions: number;
  totalViews: number;
  totalStarts: number;
  totalCompletes: number;
  totalAbandons: number;
  conversionRate: number;
  averageCompletionTime: number;
  // Landing page data
  totalLandingPages: number;
  totalLandingPageViews: number;
  totalLandingPageSubmissions: number;
  topPerformingForms: Array<{
    id: string;
    title: string;
    submissions: number;
    views: number;
    conversionRate: number;
  }>;
  forms: Array<{
    id: string;
    title: string;
  }>;
  topPerformingLandingPages: Array<{
    id: string;
    title: string;
    views: number;
    submissions: number;
    conversionRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    submissions: number;
    views: number;
    starts: number;
    completes: number;
    landingPageViews: number;
    landingPageSubmissions: number;
  }>;
  deviceStats: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  locationStats: Array<{
    location: string;
    count: number;
    percentage: number;
    coordinates?: { lat: number; lng: number };
  }>;
  formPerformance: Array<{
    formId: string;
    title: string;
    submissions: number;
    views: number;
    starts: number;
    completes: number;
    abandons: number;
    conversionRate: number;
    avgTimeToComplete: number;
  }>;
  landingPagePerformance: Array<{
    landingPageId: string;
    title: string;
    views: number;
    submissions: number;
    conversionRate: number;
  }>;
}

interface AdvancedAnalyticsProps {
  userId: string;
  isProUser?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ userId, isProUser = false }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showFormFilter, setShowFormFilter] = useState(false);
  
  // Refs for chart containers
  const chartsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('AdvancedAnalytics useEffect triggered with userId:', userId);
    if (userId && userId.trim() !== '') {
      fetchAnalyticsData();
    } else {
      console.error('AdvancedAnalytics: No valid userId provided:', userId);
      setLoading(false);
    }
  }, [userId, dateRange, selectedForm, lastRefresh]);

  const handleRefresh = () => {
    setLastRefresh(new Date());
    fetchAnalyticsData();
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      console.log('Fetching analytics data for user:', userId);
      
      // Fetch real data from Firebase
      console.log('AdvancedAnalytics: Querying forms with userId:', userId);
      
      // Use a simpler query that doesn't require composite index
      let forms: any[] = [];
      try {
        const formsQuery = query(
          collection(db, 'forms'),
          where('userId', '==', userId)
        );
        
        console.log('AdvancedAnalytics: Forms query created:', formsQuery);
        
        const formsSnapshot = await getDocs(formsQuery);
        console.log('AdvancedAnalytics: Forms query result:', formsSnapshot.size, 'forms found');
        
        forms = formsSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('AdvancedAnalytics: Form data:', { id: doc.id, title: data.title, userId: data.userId });
          return {
            id: doc.id,
            ...data
          };
        }) as any[];
      } catch (error) {
        console.error('AdvancedAnalytics: Error with forms query, trying fallback:', error);
        // Fallback: get all forms and filter manually
        try {
          const allFormsQuery = query(collection(db, 'forms'));
          const allFormsSnapshot = await getDocs(allFormsQuery);
          forms = allFormsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((form: any) => form.userId === userId) as any[];
          console.log('AdvancedAnalytics: Fallback forms query successful, found:', forms.length);
        } catch (fallbackError) {
          console.error('AdvancedAnalytics: Fallback forms query also failed:', fallbackError);
          forms = [];
        }
      }

      console.log('Forms found:', forms.length, forms.map(f => ({ id: f.id, title: f.title, submissions: f.submissions })));

      // If no forms found with userId, log for debugging
      if (forms.length === 0) {
        console.log('AdvancedAnalytics: No forms found with userId:', userId);
      }

      // Fetch form submissions - handle case when no forms exist yet
      let submissions: any[] = [];
      if (forms.length > 0) {
        try {
          // Use a simpler query that doesn't require composite index
          const submissionsQuery = query(
            collection(db, 'formSubmissions')
          );
          const submissionsSnapshot = await getDocs(submissionsQuery);
          
          const allSubmissions = submissionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[];
          
          // Filter submissions that belong to user's forms
          submissions = allSubmissions.filter(sub => 
            forms.some(form => form.id === sub.formId)
          );
          
          console.log('AdvancedAnalytics: Submissions query successful, found:', submissions.length);
        } catch (error) {
          console.error('AdvancedAnalytics: Error with submissions query:', error);
          submissions = [];
        }
      }

      console.log('Submissions found:', submissions.length, submissions.map(s => ({ id: s.id, formId: s.formId, submittedAt: s.submittedAt })));

      // Fetch landing pages data
      let landingPages: any[] = [];
      try {
        const landingPagesQuery = query(
          collection(db, 'landingPages'),
          where('userId', '==', userId)
        );
        const landingPagesSnapshot = await getDocs(landingPagesQuery);
        landingPages = landingPagesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        console.log('Landing pages found:', landingPages.length);
      } catch (error) {
        console.error('Error fetching landing pages:', error);
        landingPages = [];
      }

      // Calculate analytics from real data
      const totalForms = forms.length;
      const totalSubmissions = submissions.length;
      const totalLandingPages = landingPages.length;
      const totalLandingPageViews = landingPages.reduce((sum, page) => sum + (page.views || 0), 0);
      const totalLandingPageSubmissions = landingPages.reduce((sum, page) => sum + (page.submissions || 0), 0);
      
      console.log('AdvancedAnalytics: Processing data:', { totalForms, totalSubmissions, forms, submissions });
      
      // For now, we'll use estimated values for views/starts since we don't track them yet
      // In a real implementation, you'd track these in separate collections
      const totalViews = totalSubmissions * 2.5; // Estimate: 2.5 views per submission
      const totalStarts = totalSubmissions * 1.8; // Estimate: 1.8 starts per submission
      const totalCompletes = totalSubmissions;
      const totalAbandons = totalStarts - totalCompletes;
      const conversionRate = totalViews > 0 ? (totalCompletes / totalViews) * 100 : 0;
      const averageCompletionTime = 2.5; // Default estimate

      // Calculate daily stats for the selected date range
      const days = parseInt(dateRange);
      const dailyStats = Array.from({ length: days }, (_, i) => {
        const date = subDays(new Date(), days - 1 - i);
        const daySubmissions = submissions.filter(sub => {
          const subDate = sub.submittedAt?.toDate?.() || new Date(sub.submittedAt);
          return format(subDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        }).length;
        
        // For landing pages, we'll estimate daily views and submissions
        // In a real implementation, you'd track these with timestamps
        const dayLandingPageViews = Math.floor(totalLandingPageViews / days);
        const dayLandingPageSubmissions = Math.floor(totalLandingPageSubmissions / days);
        
        return {
          date: format(date, 'MMM dd'),
          submissions: daySubmissions,
          views: Math.floor(daySubmissions * 2.5),
          starts: Math.floor(daySubmissions * 1.8),
          completes: daySubmissions,
          landingPageViews: dayLandingPageViews,
          landingPageSubmissions: dayLandingPageSubmissions,
        };
      });

      // Calculate top performing forms
      const formStats = forms.map(form => {
        const formSubmissions = submissions.filter(sub => sub.formId === form.id).length;
        const formViews = formSubmissions * 2.5; // Estimate
        const conversionRate = formViews > 0 ? (formSubmissions / formViews) * 100 : 0;
        
        return {
          id: form.id,
          title: form.title || 'Untitled Form',
          submissions: formSubmissions,
          views: Math.floor(formViews),
          conversionRate: Math.round(conversionRate * 10) / 10,
        };
      }).sort((a, b) => b.submissions - a.submissions).slice(0, 5);

      // Calculate top performing landing pages
      const landingPageStats = landingPages.map(page => {
        const pageViews = page.views || 0;
        const pageSubmissions = page.submissions || 0;
        const conversionRate = pageViews > 0 ? (pageSubmissions / pageViews) * 100 : 0;
        
        return {
          id: page.id,
          title: page.title || 'Untitled Landing Page',
          views: pageViews,
          submissions: pageSubmissions,
          conversionRate: Math.round(conversionRate * 10) / 10,
        };
      }).sort((a, b) => b.views - a.views).slice(0, 5);

      // Device stats (estimated for now)
      const deviceStats = [
        { device: 'Desktop', count: Math.floor(totalViews * 0.55), percentage: 55 },
        { device: 'Mobile', count: Math.floor(totalViews * 0.40), percentage: 40 },
        { device: 'Tablet', count: Math.floor(totalViews * 0.05), percentage: 5 },
      ];

      // Location stats with coordinates for world map
      const locationStats = [
        { 
          location: 'Nigeria', 
          count: Math.floor((totalViews + totalLandingPageViews) * 0.60), 
          percentage: 60,
          coordinates: { lat: 9.0765, lng: 7.3986 }
        },
        { 
          location: 'United States', 
          count: Math.floor((totalViews + totalLandingPageViews) * 0.15), 
          percentage: 15,
          coordinates: { lat: 39.8283, lng: -98.5795 }
        },
        { 
          location: 'United Kingdom', 
          count: Math.floor((totalViews + totalLandingPageViews) * 0.10), 
          percentage: 10,
          coordinates: { lat: 55.3781, lng: -3.4360 }
        },
        { 
          location: 'Canada', 
          count: Math.floor((totalViews + totalLandingPageViews) * 0.05), 
          percentage: 5,
          coordinates: { lat: 56.1304, lng: -106.3468 }
        },
        { 
          location: 'Germany', 
          count: Math.floor((totalViews + totalLandingPageViews) * 0.05), 
          percentage: 5,
          coordinates: { lat: 51.1657, lng: 10.4515 }
        },
        { 
          location: 'Other', 
          count: Math.floor((totalViews + totalLandingPageViews) * 0.05), 
          percentage: 5,
          coordinates: { lat: 20.0, lng: 0.0 }
        },
      ];

      // Form performance details
      const formPerformance = forms.map(form => {
        const formSubmissions = submissions.filter(sub => sub.formId === form.id).length;
        const formViews = formSubmissions * 2.5;
        const formStarts = formSubmissions * 1.8;
        const formCompletes = formSubmissions;
        const formAbandons = formStarts - formCompletes;
        const formConversionRate = formViews > 0 ? (formCompletes / formViews) * 100 : 0;
        
        return {
          formId: form.id,
          title: form.title || 'Untitled Form',
          submissions: formSubmissions,
          views: Math.floor(formViews),
          starts: Math.floor(formStarts),
          completes: formCompletes,
          abandons: Math.floor(formAbandons),
          conversionRate: Math.round(formConversionRate * 10) / 10,
          avgTimeToComplete: 2.5, // Default estimate
        };
      });

      // Landing page performance details
      const landingPagePerformance = landingPages.map(page => {
        const pageViews = page.views || 0;
        const pageSubmissions = page.submissions || 0;
        const conversionRate = pageViews > 0 ? (pageSubmissions / pageViews) * 100 : 0;
        
        return {
          landingPageId: page.id,
          title: page.title || 'Untitled Landing Page',
          views: pageViews,
          submissions: pageSubmissions,
          conversionRate: Math.round(conversionRate * 10) / 10,
        };
      });

      const realAnalyticsData: AnalyticsData = {
        totalForms,
        totalSubmissions,
        totalViews: Math.floor(totalViews),
        totalStarts: Math.floor(totalStarts),
        totalCompletes,
        totalAbandons: Math.floor(totalAbandons),
        conversionRate: Math.round(conversionRate * 10) / 10,
        averageCompletionTime,
        totalLandingPages,
        totalLandingPageViews,
        totalLandingPageSubmissions,
        topPerformingForms: formStats,
        forms: forms.map(form => ({ id: form.id, title: form.title || 'Untitled Form' })),
        topPerformingLandingPages: landingPageStats,
        dailyStats,
        deviceStats,
        locationStats,
        formPerformance,
        landingPagePerformance,
      };

      console.log('Final analytics data:', realAnalyticsData);
      console.log('Setting analytics data with:', { totalForms, totalSubmissions });

      // Ensure we always set the analytics data, even if it's 0
      setAnalyticsData(realAnalyticsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fallback to empty data if there's an error
      setAnalyticsData({
        totalForms: 0,
        totalSubmissions: 0,
        totalViews: 0,
        totalStarts: 0,
        totalCompletes: 0,
        totalAbandons: 0,
        conversionRate: 0,
        averageCompletionTime: 0,
        totalLandingPages: 0,
        totalLandingPageViews: 0,
        totalLandingPageSubmissions: 0,
        topPerformingForms: [],
        forms: [],
        topPerformingLandingPages: [],
        dailyStats: [],
        deviceStats: [],
        locationStats: [],
        formPerformance: [],
        landingPagePerformance: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!analyticsData) return;

    const workbook = XLSX.utils.book_new();

    // Daily stats sheet (available for all users)
    const dailyData = [
      ['Date', 'Submissions', 'Views', 'Starts', 'Completes'],
      ...analyticsData.dailyStats.map(stat => [
        stat.date,
        stat.submissions,
        stat.views,
        stat.starts,
        stat.completes,
      ]),
    ];
    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Stats');

    // Conversion funnel data (available for all users)
    const funnelData = [
      ['Stage', 'Count', 'Percentage'],
      ['Views', analyticsData.totalViews, '100%'],
      ['Starts', analyticsData.totalStarts, `${((analyticsData.totalStarts / analyticsData.totalViews) * 100).toFixed(1)}%`],
      ['Completes', analyticsData.totalCompletes, `${analyticsData.conversionRate.toFixed(1)}%`],
    ];
    const funnelSheet = XLSX.utils.aoa_to_sheet(funnelData);
    XLSX.utils.book_append_sheet(workbook, funnelSheet, 'Conversion Funnel');

    // Pro user sheets
    if (isProUser) {
      // Overview sheet
      const overviewData = [
        ['Metric', 'Value'],
        ['Total Forms', analyticsData.totalForms],
        ['Total Submissions', analyticsData.totalSubmissions],
        ['Total Views', analyticsData.totalViews],
        ['Total Starts', analyticsData.totalStarts],
        ['Total Completes', analyticsData.totalCompletes],
        ['Total Abandons', analyticsData.totalAbandons],
        ['Total Landing Pages', analyticsData.totalLandingPages],
        ['Total Landing Page Views', analyticsData.totalLandingPageViews],
        ['Total Landing Page Submissions', analyticsData.totalLandingPageSubmissions],
        ['Conversion Rate (%)', analyticsData.conversionRate],
        ['Average Completion Time (min)', analyticsData.averageCompletionTime],
      ];
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

      // Form performance sheet
      const formData = [
        ['Form Title', 'Submissions', 'Views', 'Starts', 'Completes', 'Abandons', 'Conversion Rate (%)', 'Avg Time (min)'],
        ...analyticsData.formPerformance.map(form => [
          form.title,
          form.submissions,
          form.views,
          form.starts,
          form.completes,
          form.abandons,
          form.conversionRate,
          form.avgTimeToComplete,
        ]),
      ];
      const formSheet = XLSX.utils.aoa_to_sheet(formData);
      XLSX.utils.book_append_sheet(workbook, formSheet, 'Form Performance');

      // Device stats sheet
      const deviceData = [
        ['Device', 'Count', 'Percentage (%)'],
        ...analyticsData.deviceStats.map(device => [
          device.device,
          device.count,
          device.percentage,
        ]),
      ];
      const deviceSheet = XLSX.utils.aoa_to_sheet(deviceData);
      XLSX.utils.book_append_sheet(workbook, deviceSheet, 'Device Stats');

      // Location stats sheet
      const locationData = [
        ['Location', 'Count', 'Percentage (%)'],
        ...analyticsData.locationStats.map(location => [
          location.location,
          location.count,
          location.percentage,
        ]),
      ];
      const locationSheet = XLSX.utils.aoa_to_sheet(locationData);
      XLSX.utils.book_append_sheet(workbook, locationSheet, 'Location Stats');

      // Landing page performance sheet
      if (analyticsData.landingPagePerformance.length > 0) {
        const landingPageData = [
          ['Landing Page Title', 'Views', 'Submissions', 'Conversion Rate (%)'],
          ...analyticsData.landingPagePerformance.map(page => [
            page.title,
            page.views,
            page.submissions,
            page.conversionRate,
          ]),
        ];
        const landingPageSheet = XLSX.utils.aoa_to_sheet(landingPageData);
        XLSX.utils.book_append_sheet(workbook, landingPageSheet, 'Landing Page Performance');
      }
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `adparlay-analytics-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const downloadChartsAsImages = async () => {
    if (!chartsRef.current) return;
    
    try {
      // Get all chart containers
      const chartContainers = chartsRef.current.querySelectorAll('.chart-container');
      
      if (chartContainers.length === 0) {
        alert('No charts found to download.');
        return;
      }
      
      // Create a zip-like download for multiple images
      const downloadPromises = Array.from(chartContainers).map(async (container, index) => {
        const canvas = await html2canvas(container as HTMLElement, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
          useCORS: true,
        });
        
        return new Promise<{ name: string; blob: Blob }>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const title = (container as HTMLElement).querySelector('h3')?.textContent || `Chart ${index + 1}`;
              const filename = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
              resolve({ name: `${filename}.png`, blob });
            }
          }, 'image/png');
        });
      });
      
      const chartImages = await Promise.all(downloadPromises);
      
      // Download each chart as a separate file
      chartImages.forEach(({ name, blob }) => {
        saveAs(blob, `adparlay-${name}`);
      });
      
      alert(`Downloaded ${chartImages.length} chart(s) successfully!`);
    } catch (error) {
      console.error('Error downloading charts:', error);
      alert('Error downloading charts. Please try again.');
    }
  };

  const exportToPDF = () => {
    if (!analyticsData) return;
    
    if (!isProUser) {
      alert('PDF export is a Pro feature. Please upgrade to access this functionality.');
      return;
    }
    
    // PDF export functionality for pro users
    // Using window.print() for now - can be enhanced with jsPDF later
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1f2937; margin-bottom: 20px;">AdParlay Analytics Report</h1>
        <p style="color: #6b7280; margin-bottom: 30px;">Generated on ${new Date().toLocaleDateString()}</p>
        
        <h2 style="color: #374151; margin-bottom: 15px;">Key Metrics</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>Total Forms:</strong> ${analyticsData.totalForms}</p>
          <p><strong>Total Submissions:</strong> ${analyticsData.totalSubmissions}</p>
          <p><strong>Total Landing Pages:</strong> ${analyticsData.totalLandingPages}</p>
          <p><strong>Total Landing Page Views:</strong> ${analyticsData.totalLandingPageViews}</p>
          <p><strong>Conversion Rate:</strong> ${analyticsData.conversionRate}%</p>
          <p><strong>Average Completion Time:</strong> ${analyticsData.averageCompletionTime} min</p>
        </div>
        
        <h2 style="color: #374151; margin-bottom: 15px;">Daily Submissions Trend</h2>
        <p style="color: #6b7280;">Showing data for the selected time period</p>
        
        <h2 style="color: #374151; margin-bottom: 15px;">Conversion Funnel</h2>
        <p><strong>Views:</strong> ${analyticsData.totalViews}</p>
        <p><strong>Starts:</strong> ${analyticsData.totalStarts}</p>
        <p><strong>Completes:</strong> ${analyticsData.totalCompletes}</p>
      </div>
    `;
    
    document.body.appendChild(printContent);
    window.print();
    document.body.removeChild(printContent);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading analytics data...</p>
      </div>
    );
  }

  // Debug: Log the current analytics data
  console.log('AdvancedAnalytics render: Current data:', {
    totalForms: analyticsData.totalForms,
    totalSubmissions: analyticsData.totalSubmissions,
    hasData: analyticsData.totalForms > 0 || analyticsData.totalSubmissions > 0
  });

  // Show message if no data
  if (analyticsData.totalForms === 0 && analyticsData.totalSubmissions === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
        <p className="text-gray-600 mb-4">
          Start building forms and collecting leads to see your analytics data here.
        </p>
        <div className="text-sm text-gray-500 mb-4">
          Debug: Forms: {analyticsData.totalForms}, Submissions: {analyticsData.totalSubmissions}
        </div>
        <button 
          onClick={() => window.location.href = '/builder'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Your First Form
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Export */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into your form performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 flex-shrink-0"
            title="Refresh analytics data"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent flex-shrink-0"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          {/* Form Filter */}
          <div className="relative">
          <button
              onClick={() => setShowFormFilter(!showFormFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filter by Form</span>
            </button>
            {showFormFilter && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Select Form</h3>
                  <select
                    value={selectedForm}
                    onChange={(e) => setSelectedForm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Forms</option>
                    {analyticsData?.forms?.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            {showExportDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-2">
                  <button
                    onClick={() => {
                      exportToExcel();
                      setShowExportDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Export to Excel</span>
          </button>
                  <button
                    onClick={() => {
                      downloadChartsAsImages();
                      setShowExportDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span>Download Charts</span>
          </button>
          {isProUser && (
            <button
                      onClick={() => {
                        exportToPDF();
                        setShowExportDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4 text-red-600" />
              <span>Export to PDF</span>
            </button>
          )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Grid - Pro Users Only */}
      {isProUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[
            { title: 'Total Forms', value: analyticsData.totalForms, icon: FileIcon, color: 'bg-blue-500' },
            { title: 'Total Submissions', value: analyticsData.totalSubmissions, icon: ChartIcon, color: 'bg-green-500' },
            { title: 'Landing Pages', value: analyticsData.totalLandingPages, icon: Globe, color: 'bg-indigo-500' },
            { title: 'Landing Page Views', value: analyticsData.totalLandingPageViews, icon: Eye, color: 'bg-teal-500' },
            { title: 'Conversion Rate', value: `${analyticsData.conversionRate}%`, icon: TrendingUp, color: 'bg-purple-500' },
            { title: 'Avg Completion Time', value: `${analyticsData.averageCompletionTime} min`, icon: Clock, color: 'bg-orange-500' },
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center text-white`}>
                  <metric.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Submissions Trend - Available for all users */}
        <div className="chart-container bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Submissions Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="submissions" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="views" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="chart-container bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { stage: 'Views', count: analyticsData.totalViews, color: '#8884d8' },
              { stage: 'Starts', count: analyticsData.totalStarts, color: '#82ca9d' },
              { stage: 'Completes', count: analyticsData.totalCompletes, color: '#ffc658' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Distribution - Pro Users Only */}
        {isProUser && (
          <div className="chart-container bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.deviceStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percentage }) => `${device} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.deviceStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Performing Forms - Pro Users Only */}
        {isProUser && (
          <div className="chart-container bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Forms</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.topPerformingForms}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="submissions" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Landing Page Analytics - Pro Users Only */}
        {isProUser && analyticsData.totalLandingPages > 0 && (
          <div className="chart-container bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Landing Page Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.topPerformingLandingPages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#10b981" name="Views" />
                <Bar dataKey="submissions" fill="#3b82f6" name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pro User Upgrade Message */}
      {!isProUser && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unlock Advanced Analytics</h3>
          <p className="text-gray-600 mb-4">
            Upgrade to Pro to access detailed form performance, device analytics, geographic insights, and PDF export capabilities.
          </p>
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Detailed Form Performance Table - Pro Users Only */}
      {isProUser && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Form Performance Details</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Starts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abandons</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.formPerformance.map((form, index) => (
                  <tr key={form.formId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{form.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.submissions}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.views}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.starts}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.completes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.abandons}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.conversionRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{form.avgTimeToComplete} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Geographic Distribution - Pro Users Only */}
      {isProUser && (
        <div className="chart-container bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* World Map */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">World Map</h4>
              <div className="relative">
                <svg viewBox="0 0 1000 500" className="w-full h-64">
                  {/* Simplified world map paths */}
                  <path d="M100,200 L200,180 L300,200 L400,190 L500,200 L600,180 L700,200 L800,190 L900,200 L900,300 L800,320 L700,300 L600,320 L500,300 L400,320 L300,300 L200,320 L100,300 Z" 
                        fill="#e5e7eb" stroke="#9ca3af" strokeWidth="1"/>
                  
                  {/* Location markers */}
                  {analyticsData.locationStats.map((location, index) => {
                    if (!location.coordinates) return null;
                    
                    // Convert lat/lng to SVG coordinates (simplified projection)
                    const x = ((location.coordinates.lng + 180) / 360) * 1000;
                    const y = ((90 - location.coordinates.lat) / 180) * 500;
                    
                    // Calculate marker size based on count
                    const maxCount = Math.max(...analyticsData.locationStats.map(l => l.count));
                    const markerSize = Math.max(8, (location.count / maxCount) * 20);
                    
                    return (
                      <g key={location.location}>
                        <circle
                          cx={x}
                          cy={y}
                          r={markerSize}
                          fill="#3b82f6"
                          opacity={0.7}
                          className="hover:opacity-100 transition-opacity cursor-pointer"
                        />
                        <text
                          x={x}
                          y={y - markerSize - 5}
                          textAnchor="middle"
                          className="text-xs font-medium fill-gray-700"
                        >
                          {location.count}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Legend */}
                <div className="mt-4 space-y-2">
                  <h5 className="text-sm font-medium text-gray-600">Locations</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {analyticsData.locationStats.map((location) => (
                      <div key={location.location} className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">{location.location}</span>
                        <span className="text-gray-500">({location.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bar Chart */}
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Location Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.locationStats}>
              <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L6 6l12 12" />
              </svg>
            </button>
            <PaystackPayment
              onSuccess={() => {
                setShowPaymentModal(false);
                window.location.reload(); // Refresh to show updated subscription
              }}
              onClose={() => setShowPaymentModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
