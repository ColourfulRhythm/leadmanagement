import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import OptimizedVideo from '../components/OptimizedVideo';
import { createOptimizedScrollHandler, createOptimizedTouchHandler } from '../utils/performanceUtils';
import { useSEO } from '../hooks/useSEO';

interface LandingPage {
  id?: string;
  title: string;
  headline: string;
  tagline: string;
  mediaUrl: string;
  showMedia: boolean;
  bodyContent: string;
  buttonLabel: string;
  buttonLink: string;
  formUrl: string;
  whatsappMessage: string;
  whatsappNumber: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published';
  views: number;
  submissions: number;
  showForm: boolean;
  pixelId: string;
  additionalLinks: Array<{
    id: string;
    label: string;
    url: string;
    description: string;
  }>;
  logoUrl: string;
  logoPosition: 'left' | 'center' | 'right';
  showLogo: boolean;
}

const LandingPageBuilder: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // SEO optimization
  useSEO({
    title: 'Landing Page Builder - Adparlay | Create High-Converting Landing Pages',
    description: 'Build beautiful landing pages with Adparlay\'s premium landing page builder. Create forms that tell your story and guide your buyer journey.',
    keywords: 'landing page builder, high converting landing pages, lead capture landing pages, form landing pages',
    canonical: 'https://adparlaysaas.web.app/landing-builder'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [landingPage, setLandingPage] = useState<LandingPage>({
    title: 'My Campaign Landing Page',
    headline: 'Transform Your Business Today',
    tagline: 'Join thousands of successful businesses using our platform',
    mediaUrl: '',
    showMedia: true,
    bodyContent: '• Increase your conversion rates\n• Boost customer engagement\n• Drive more sales\n• Professional results guaranteed',
    buttonLabel: 'Join Now',
    buttonLink: '',
    formUrl: '',
    whatsappMessage: 'Hi! I\'m interested in your campaign.',
    whatsappNumber: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    fontFamily: 'Inter',
    userId: currentUser?.id || '',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
    views: 0,
    submissions: 0,
    showForm: true,
    pixelId: '',
    additionalLinks: [],
    logoUrl: '',
    logoPosition: 'left',
    showLogo: false
  });

  const [userForms, setUserForms] = useState<Array<{ id: string; title: string }>>([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  
  // Performance optimization refs
  const scrollHandlerRef = useRef<ReturnType<typeof createOptimizedScrollHandler> | null>(null);
  const touchHandlerRef = useRef<ReturnType<typeof createOptimizedTouchHandler> | null>(null);

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat', 'Source Sans Pro', 'Ubuntu'
  ];

  const colorPresets = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#1F2937' },
    { name: 'Green', primary: '#10B981', secondary: '#064E3B' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#4C1D95' },
    { name: 'Red', primary: '#EF4444', secondary: '#7F1D1D' },
    { name: 'Orange', primary: '#F59E0B', secondary: '#92400E' },
    { name: 'Teal', primary: '#14B8A6', secondary: '#0F766E' }
  ];

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchUserForms();
    
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
      fetchLandingPage(editId);
    }
  }, [currentUser, navigate]);

  // Performance optimizations
  useEffect(() => {
    // Set up optimized scroll and touch handlers
    scrollHandlerRef.current = createOptimizedScrollHandler(() => {
      // Handle scroll events efficiently
    });
    
    touchHandlerRef.current = createOptimizedTouchHandler(() => {
      // Handle touch events efficiently
    });

    // Add passive event listeners
    if (scrollHandlerRef.current) {
      scrollHandlerRef.current.add();
    }

    return () => {
      // Cleanup
      if (scrollHandlerRef.current) {
        scrollHandlerRef.current.remove();
      }
    };
  }, []);

  const fetchUserForms = async () => {
    if (!currentUser?.id) return;
    
    try {
      const formsQuery = query(
        collection(db, 'forms'),
        where('userId', '==', currentUser.id)
      );
      
      const formsSnapshot = await getDocs(formsQuery);
      const formsData = formsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Form'
        };
      });
      
      setUserForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      // Fallback to empty array on error
      setUserForms([]);
    }
  };

  const fetchLandingPage = async (landingPageId: string) => {
    try {
      const docRef = doc(db, 'landingPages', landingPageId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLandingPage({
          id: docSnap.id,
          title: data.title || '',
          headline: data.headline || '',
          tagline: data.tagline || '',
          mediaUrl: data.mediaUrl || '',
          showMedia: data.showMedia !== undefined ? data.showMedia : true,
          bodyContent: data.bodyContent || '',
          buttonLabel: data.buttonLabel || 'Join Now',
          buttonLink: data.buttonLink || '',
          formUrl: data.formUrl || '',
          whatsappMessage: data.whatsappMessage || '',
          whatsappNumber: data.whatsappNumber || '',
          primaryColor: data.primaryColor || '#10B981',
          secondaryColor: data.secondaryColor || '#1F2937',
          fontFamily: data.fontFamily || 'Inter',
          userId: data.userId || currentUser?.id || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          status: data.status || 'draft',
          views: data.views || 0,
          submissions: data.submissions || 0,
            showForm: data.showForm !== undefined ? data.showForm : true,
            pixelId: data.pixelId || '',
            additionalLinks: data.additionalLinks || [],
            logoUrl: data.logoUrl || '',
            logoPosition: data.logoPosition || 'left',
            showLogo: data.showLogo !== undefined ? data.showLogo : false
        });
      }
    } catch (error) {
      console.error('Error fetching landing page:', error);
    }
  };

  const handleInputChange = (field: keyof LandingPage, value: string | boolean) => {
    setLandingPage(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Utility function to convert YouTube URLs to embed format
  const convertToYouTubeEmbed = (url: string): string => {
    if (!url) return '';
    
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?autoplay=0&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
      }
    }
    
    return url; // Return original if no match
  };

  const handleColorChange = (type: 'primary' | 'secondary', color: string) => {
    setLandingPage(prev => ({
      ...prev,
      [type === 'primary' ? 'primaryColor' : 'secondaryColor']: color
    }));
  };

  const handleFontChange = (font: string) => {
    setLandingPage(prev => ({
      ...prev,
      fontFamily: font
    }));
    setShowFontPicker(false);
  };

  const addAdditionalLink = () => {
    const newLink = {
      id: Date.now().toString(),
      label: '',
      url: '',
      description: ''
    };
    setLandingPage(prev => ({
      ...prev,
      additionalLinks: [...prev.additionalLinks, newLink]
    }));
  };

  const updateAdditionalLink = (id: string, field: string, value: string) => {
    setLandingPage(prev => ({
      ...prev,
      additionalLinks: prev.additionalLinks.map(link =>
        link.id === id ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeAdditionalLink = (id: string) => {
    setLandingPage(prev => ({
      ...prev,
      additionalLinks: prev.additionalLinks.filter(link => link.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit triggered, currentUser:', currentUser);
      if (!currentUser || !currentUser.id) {
    console.log('No currentUser or currentUser.id, returning. currentUser:', currentUser);
    alert('Please log in to save your landing page.');
    return;
  }

          try {
        setSaving(true);
        console.log('Starting save process, landingPage:', landingPage);
        
        // Validate required fields
        if (!landingPage.title || !landingPage.headline) {
          alert('Please fill in the title and headline fields.');
          return;
        }
        
        const landingPageData = {
          ...landingPage,
          userId: currentUser.id,
          updatedAt: new Date(),
          status: 'published',
          // Ensure proper serialization of dates and arrays
          createdAt: landingPage.createdAt || new Date(),
          additionalLinks: landingPage.additionalLinks || []
        };
        console.log('landingPageData to save:', landingPageData);
        console.log('Media URL being saved:', landingPageData.mediaUrl);
        console.log('Show Media being saved:', landingPageData.showMedia);

      if (landingPage.id) {
        // Update existing landing page
        await updateDoc(doc(db, 'landingPages', landingPage.id), landingPageData);
        console.log('Landing page updated successfully');
      } else {
        // Create new landing page
        landingPageData.createdAt = new Date();
        landingPageData.views = 0;
        landingPageData.submissions = 0;
        
        console.log('Creating new landing page in Firestore...');
        const docRef = await addDoc(collection(db, 'landingPages'), landingPageData);
        console.log('Document created with ID:', docRef.id);
        
        // Update with the generated ID
        await updateDoc(doc(db, 'landingPages', docRef.id), {
          id: docRef.id
        });

        // Update local state with the ID
        setLandingPage(prev => ({
          ...prev,
          id: docRef.id
        }));
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error saving landing page:', error);
      alert('Error saving landing page. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Debounce input changes for better performance
  const [debouncedLandingPage, setDebouncedLandingPage] = useState(landingPage);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLandingPage(landingPage);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [landingPage]);

  const generatePreviewHTML = useCallback(() => {
    const metaPixelId = debouncedLandingPage.pixelId || 'YOUR_PIXEL_ID_HERE';
    const whatsappLink = debouncedLandingPage.whatsappNumber ? 
      `https://wa.me/${debouncedLandingPage.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(debouncedLandingPage.whatsappMessage)}` : 
      '#';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${debouncedLandingPage.title}</title>
    
    <!-- Social Media Meta Tags -->
    <meta property="og:title" content="${debouncedLandingPage.title}">
    <meta property="og:description" content="${debouncedLandingPage.tagline}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Adparlay">
    <meta property="og:image" content="${debouncedLandingPage.mediaUrl || window.location.origin + '/default-preview.svg'}">
    
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${debouncedLandingPage.title}">
    <meta name="twitter:description" content="${debouncedLandingPage.tagline}">
    <meta name="twitter:image" content="${debouncedLandingPage.mediaUrl || window.location.origin + '/default-preview.svg'}">
    
    <meta name="description" content="${debouncedLandingPage.tagline}">
    
    <!-- Meta Pixel Code -->
    <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Meta Pixel Code -->
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Lato:wght@300;400;700;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Source+Sans+Pro:wght@300;400;600;700;900&family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: '${debouncedLandingPage.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: ${debouncedLandingPage.secondaryColor}; 
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 0 20px; 
        }
        
        .header { 
            text-align: center; 
            padding: 120px 0 80px; 
            background: linear-gradient(135deg, ${debouncedLandingPage.primaryColor}08, ${debouncedLandingPage.secondaryColor}08);
            position: relative;
            overflow: hidden;
            animation: fadeInUp 1s ease-out;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, ${debouncedLandingPage.primaryColor}15 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, ${debouncedLandingPage.secondaryColor}15 0%, transparent 50%);
            z-index: 0;
        }
        
        .header > * { position: relative; z-index: 1; }
        
        .headline { 
            font-size: clamp(2.5rem, 5vw, 4rem); 
            font-weight: 900; 
            color: ${debouncedLandingPage.primaryColor}; 
            margin-bottom: 24px; 
            line-height: 1.1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            animation: slideInLeft 1.2s ease-out 0.2s both;
        }
        
        @keyframes slideInLeft {
            from {
                opacity: 0;
                transform: translateX(-50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .tagline { 
            font-size: clamp(1.1rem, 2.5vw, 1.5rem); 
            color: ${debouncedLandingPage.secondaryColor}; 
            max-width: 700px; 
            margin: 0 auto; 
            opacity: 0.9;
            animation: slideInRight 1.2s ease-out 0.4s both;
        }
        
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(50px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .media-section { 
            padding: 80px 0; 
            text-align: center; 
            animation: fadeIn 1s ease-out 0.6s both;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .media-container {
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            position: relative;
        }
        
        .media-placeholder { 
            width: 100%; 
            height: 500px; 
            background: linear-gradient(45deg, ${debouncedLandingPage.primaryColor}10, ${debouncedLandingPage.secondaryColor}10);
            border-radius: 24px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin: 0 auto; 
            border: 2px dashed ${debouncedLandingPage.primaryColor}30;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .media-placeholder:hover {
            transform: translateY(-5px);
            box-shadow: 0 30px 60px rgba(0,0,0,0.15);
        }
        
        .media-placeholder img,
        .media-placeholder video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 22px;
        }
        
        .body-section { 
            padding: 80px 0; 
            background: white;
            position: relative;
            animation: fadeIn 1s ease-out 0.8s both;
        }
        
        .body-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, ${debouncedLandingPage.primaryColor}20, transparent);
        }
        
        .body-content { 
            max-width: 800px; 
            margin: 0 auto; 
            text-align: center; 
        }
        
        .body-content ul { 
            list-style: none; 
            text-align: left; 
            display: inline-block; 
            background: ${debouncedLandingPage.primaryColor}05;
            padding: 32px 48px;
            border-radius: 16px;
            border: 1px solid ${debouncedLandingPage.primaryColor}15;
        }
        
        .body-content li { 
            margin-bottom: 20px; 
            padding-left: 32px; 
            position: relative; 
            font-size: 1.1rem;
            color: ${debouncedLandingPage.secondaryColor};
            animation: slideInUp 0.6s ease-out both;
        }
        
        .body-content li:nth-child(1) { animation-delay: 0.1s; }
        .body-content li:nth-child(2) { animation-delay: 0.2s; }
        .body-content li:nth-child(3) { animation-delay: 0.3s; }
        .body-content li:nth-child(4) { animation-delay: 0.4s; }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .body-content li:before { 
            content: "✓"; 
            position: absolute; 
            left: 0; 
            color: ${debouncedLandingPage.primaryColor}; 
            font-weight: bold; 
            font-size: 1.3rem;
            background: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .cta-section { 
            padding: 100px 0; 
            text-align: center; 
            background: linear-gradient(135deg, ${debouncedLandingPage.primaryColor}, ${debouncedLandingPage.primaryColor}ee);
            color: white;
            position: relative;
            overflow: hidden;
            animation: fadeIn 1s ease-out 1s both;
        }
        
        .cta-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            z-index: 0;
        }
        
        .cta-section > * { position: relative; z-index: 1; }
        
        .form-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: rgba(255, 255, 255, 0.95); 
            backdrop-filter: blur(10px);
            padding: 48px; 
            border-radius: 16px; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(255,255,255,0.2);
            animation: scaleIn 0.8s ease-out 1.2s both;
        }
        
        @keyframes scaleIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        .form-container h2 { 
            color: ${debouncedLandingPage.secondaryColor}; 
            margin-bottom: 32px; 
            font-size: 1.8rem;
            font-weight: 700;
        }
        
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .form-group { 
            margin-bottom: 32px; 
            text-align: left; 
        }
        
        .form-group label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 500; 
            color: #374151; 
            font-size: 0.875rem;
        }
        
        .form-group input, 
        .form-group textarea { 
            width: 100%; 
            padding: 16px; 
            border: 1px solid #d1d5db; 
            border-radius: 8px; 
            font-size: 16px; 
            transition: all 0.2s ease; 
            background: #f9fafb;
            color: #111827;
        }
        
        .form-group input:focus, 
        .form-group textarea:focus { 
            outline: none; 
            border-color: transparent;
            background: white;
            box-shadow: 0 0 0 2px #3b82f6;
        }
        
        .form-group input::placeholder {
            color: #6b7280;
        }
        
        .submit-btn { 
            width: 100%; 
            padding: 16px 24px; 
            background: ${debouncedLandingPage.primaryColor}; 
            color: white; 
            border: none; 
            border-radius: 8px; 
            font-size: 18px; 
            font-weight: 600; 
            cursor: pointer; 
            transition: all 0.2s ease; 
            box-shadow: 0 4px 14px ${debouncedLandingPage.primaryColor}30;
        }
        
        .submit-btn:hover { 
            background: ${debouncedLandingPage.secondaryColor}; 
            transform: scale(1.02); 
            box-shadow: 0 8px 25px ${debouncedLandingPage.primaryColor}40;
        }
        
        .whatsapp-btn { 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            gap: 8px; 
            width: 100%; 
            padding: 16px 24px; 
            background: #25D366; 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            transition: all 0.2s ease; 
            box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);
            border: none;
            font-size: 18px;
        }
        
        .whatsapp-btn:hover { 
            background: #16a34a; 
            transform: scale(1.02); 
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
        }
        
        .cta-buttons {
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: center;
        }
        
        .button-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 32px;
        }
        
        .cta-btn {
            display: inline-block;
            padding: 18px 32px;
            background: ${debouncedLandingPage.primaryColor};
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 18px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(0,0,0,0.1);
            border: none;
            cursor: pointer;
        }
        
        .cta-btn:hover {
            background: ${debouncedLandingPage.secondaryColor};
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .thank-you { 
            text-align: center; 
            padding: 40px 20px; 
        }
        
        .thank-you h2 { 
            color: ${debouncedLandingPage.primaryColor}; 
            margin-bottom: 20px; 
            font-size: 2rem;
        }
        
        .signup-btn { 
            display: inline-block; 
            padding: 16px 32px; 
            background: ${debouncedLandingPage.primaryColor}; 
            color: white; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: 600; 
            font-size: 18px; 
            transition: all 0.3s ease; 
            box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        }
        
        .signup-btn:hover { 
            background: ${debouncedLandingPage.secondaryColor}; 
            transform: translateY(-2px); 
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        @media (max-width: 768px) { 
            .headline { font-size: 2.5rem; } 
            .tagline { font-size: 1.2rem; } 
            .container { padding: 0 16px; } 
            .form-container { margin: 0 16px; padding: 32px; } 
            .body-content ul { padding: 24px 32px; }
            .cta-buttons { flex-direction: column; }
            .form-grid { grid-template-columns: 1fr; gap: 16px; }
            .button-grid { grid-template-columns: 1fr !important; gap: 16px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${debouncedLandingPage.showLogo && debouncedLandingPage.logoUrl ? `
                <div class="logo-container" style="text-align: ${debouncedLandingPage.logoPosition}; margin-bottom: 40px;">
                    <img src="${debouncedLandingPage.logoUrl}" alt="Logo" style="max-height: 80px; max-width: 200px; object-fit: contain;">
                </div>
            ` : ''}
            <h1 class="headline">${debouncedLandingPage.headline}</h1>
            <p class="tagline">${debouncedLandingPage.tagline}</p>
        </div>
        
        ${debouncedLandingPage.showMedia ? `
        <div class="media-section">
            <div class="media-container">
                <div class="media-placeholder">
                    ${(() => {
                        const url = debouncedLandingPage.mediaUrl;
                        if (!url) return '<p style="color: #6b7280; font-size: 1.2rem;">Media Placeholder</p>';
                        
                        // Handle data URLs (uploaded files)
                        if (url.startsWith('data:image/')) {
                            return `<img src="${url}" alt="Campaign Media" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">`;
                        }
                        
                        if (url.startsWith('data:video/')) {
                            return `<video src="${url}" controls autoplay loop muted playsinline preload="metadata" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
                        }
                        
                        // Handle regular file extensions
                        if (url.match(/\\.(jpg|jpeg|png|gif|webp)$/i)) {
                            return `<img src="${url}" alt="Campaign Media" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">`;
                        }
                        
                        if (url.match(/\\.(mp4|webm|mov)$/i)) {
                            return `<video src="${url}" controls autoplay loop muted playsinline preload="metadata" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
                        }
                        
                        // Handle YouTube URLs
                        if (url.includes('youtube.com') || url.includes('youtu.be')) {
                            return `<iframe src="${convertToYouTubeEmbed(url)}" 
                                     frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                     allowfullscreen loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" style="width: 100%; height: 100%;"></iframe>`;
                        }
                        
                        return '<p style="color: #6b7280; font-size: 1.2rem;">Unsupported media format</p>';
                    })()}
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="body-section">
            <div class="body-content">
                <div style="white-space: pre-line;">${debouncedLandingPage.bodyContent}</div>
                
                ${debouncedLandingPage.additionalLinks && debouncedLandingPage.additionalLinks.length > 0 ? `
                <div class="additional-links" style="margin-top: 40px;">
                    <h3 style="color: ${debouncedLandingPage.secondaryColor}; margin-bottom: 24px; font-size: 1.5rem; font-weight: 600;">Additional Resources</h3>
                    <div class="links-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        ${debouncedLandingPage.additionalLinks.map(link => `
                            <div class="link-card" style="background: white; padding: 24px; border-radius: 12px; border: 1px solid ${debouncedLandingPage.primaryColor}20; box-shadow: 0 4px 6px rgba(0,0,0,0.05); transition: all 0.3s ease;">
                                <h4 style="color: ${debouncedLandingPage.primaryColor}; margin-bottom: 8px; font-size: 1.1rem; font-weight: 600;">
                                    <a href="${link.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='${debouncedLandingPage.secondaryColor}'" onmouseout="this.style.color='${debouncedLandingPage.primaryColor}'">
                                        ${link.label}
                                    </a>
                                </h4>
                                <p style="color: ${debouncedLandingPage.secondaryColor}; font-size: 0.95rem; line-height: 1.5; margin: 0;">${link.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="cta-section">
            <div class="form-container">
                <h2>${debouncedLandingPage.buttonLabel}</h2>
                
                ${debouncedLandingPage.showForm && debouncedLandingPage.formUrl ? `
                    <iframe 
                        src="${window.location.origin}/form/${debouncedLandingPage.formUrl}" 
                        style="width: 100%; height: 600px; border: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
                        title="Embedded Form"
                    ></iframe>
                ` : debouncedLandingPage.showForm ? `
                    <form id="campaignForm" onsubmit="handleFormSubmit(event)">
                        <div class="form-grid">
                        <div class="form-group">
                            <label for="name">Full Name</label>
                                <input type="text" id="name" name="name" required placeholder="Enter your full name">
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email Address</label>
                                <input type="email" id="email" name="email" required placeholder="Enter your email">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="phone">Phone Number</label>
                            <input type="tel" id="phone" name="phone" placeholder="Enter your phone number">
                        </div>
                        
                        <div class="button-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 32px;">
                        <button type="submit" class="submit-btn">${debouncedLandingPage.buttonLabel}</button>
                            ${debouncedLandingPage.whatsappNumber ? `
                                <a href="https://wa.me/${debouncedLandingPage.whatsappNumber}?text=${encodeURIComponent(debouncedLandingPage.whatsappMessage)}" 
                                   class="whatsapp-btn" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 18px 32px; background: #25D366; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.2s ease;">
                                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                    </svg>
                                    WhatsApp
                                </a>
                            ` : ''}
                        </div>
                    </form>
                ` : `
                    <div class="cta-buttons">
                        ${debouncedLandingPage.buttonLink ? `
                            <a href="${debouncedLandingPage.buttonLink}" class="cta-btn" target="_blank">
                                ${debouncedLandingPage.buttonLabel}
                            </a>
                        ` : ''}
                        ${debouncedLandingPage.whatsappNumber ? `
                            <a href="${whatsappLink}" class="whatsapp-btn" target="_blank">
                                💬 WhatsApp
                            </a>
                        ` : ''}
                    </div>
                `}
                
                ${debouncedLandingPage.showForm && debouncedLandingPage.whatsappNumber ? 
                    `<a href="${whatsappLink}" class="whatsapp-btn" target="_blank">
                        💬 WhatsApp
                    </a>` : 
                    ''
                }
            </div>
        </div>
    </div>
    
    <script>
        function handleFormSubmit(e) {
            e.preventDefault();
            
            // Trigger Meta Pixel Lead event
            if (typeof fbq !== 'undefined') {
                fbq('track', 'Lead');
            }
            
            // Show thank you message
            document.querySelector('.form-container').innerHTML = \`
                <div class="thank-you">
                    <h2>Thank You!</h2>
                    <p>Your submission has been received. We'll be in touch soon!</p>
                    <a href="/register" class="signup-btn">Build Your One Page on AdParlay</a>
                </div>
            \`;
        }
    </script>
</body>
</html>
    `;
  }, [debouncedLandingPage]);

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Landing Page Created!</h2>
            <p className="text-gray-600 mb-6">
              Your landing page has been successfully created and saved.
            </p>
            
            {/* Landing Page Link */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Landing Page Link</h3>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={`${window.location.origin}/landing/${landingPage.id}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/landing/${landingPage.id}`);
                    alert('Link copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Copy
                </button>
              </div>
              <div className="flex space-x-3 mt-3">
                <a
                  href={`/landing/${landingPage.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  View Live Page
                </a>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Edit Page
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Share this link with your audience to drive traffic to your landing page
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => setSubmitted(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Another Page
              </button>
              <Link
                to="/dashboard"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View All Landing Pages
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">AdParlay</span>
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </button>
              <Link
                to="/dashboard"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View All Landing Pages
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {previewMode ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Preview: {landingPage.title}</h2>
            </div>
            <div className="p-6">
              <iframe
                srcDoc={generatePreviewHTML()}
                className="w-full h-[800px] border border-gray-200 rounded-lg"
                title="Landing Page Preview"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Editor Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Landing Page Builder</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={landingPage.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter page title"
                    aria-describedby="title-help"
                    aria-required="true"
                  />
                  <p id="title-help" className="text-xs text-gray-500 mt-1">
                    This will be used as the page title and in the browser tab
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={landingPage.headline}
                    onChange={(e) => handleInputChange('headline', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter main headline"
                    aria-describedby="headline-help"
                    aria-required="true"
                  />
                  <p id="headline-help" className="text-xs text-gray-500 mt-1">
                    The main heading that will appear prominently on your landing page
                  </p>
                </motion.div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tagline
                  </label>
                  <textarea
                    value={landingPage.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supporting text"
                  />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Show Media Section
                  </label>
                  <button
                    type="button"
                    onClick={() => setLandingPage(prev => ({ ...prev, showMedia: !prev.showMedia }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setLandingPage(prev => ({ ...prev, showMedia: !prev.showMedia }));
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      landingPage.showMedia ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    aria-pressed={landingPage.showMedia}
                    aria-label={`${landingPage.showMedia ? 'Hide' : 'Show'} media section`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        landingPage.showMedia ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {landingPage.showMedia && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Media (Image or Video)
                  </label>
                  
                  {/* File Upload */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Upload File</label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            // Check file size (max 500KB)
                            if (file.size > 500 * 1024) {
                              alert('File size must be less than 500KB. Please use a smaller image or provide a URL instead.');
                              return;
                            }
                            
                            // Convert to data URL for preview
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              handleInputChange('mediaUrl', result);
                            };
                            reader.readAsDataURL(file);
                          } catch (error) {
                            console.error('Error processing file:', error);
                            alert('Error processing file. Please try again.');
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: JPG, PNG, GIF, MP4, WebM. Max size: 500KB. For larger files, use URL.
                    </p>
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Or Enter URL</label>
                    <input
                      type="url"
                      value={landingPage.mediaUrl}
                      onChange={(e) => handleInputChange('mediaUrl', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  {/* Media Preview */}
                  {landingPage.mediaUrl && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                      {(() => {
                        const url = landingPage.mediaUrl;
                        
                        // Handle data URLs (uploaded files)
                        if (url.startsWith('data:image/')) {
                          return (
                            <img 
                              src={url} 
                          alt="Media preview" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                          );
                        }
                        
                        if (url.startsWith('data:video/')) {
                          return (
                            <video
                              src={url} 
                              controls 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          );
                        }
                        
                        // Handle regular file extensions
                        if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                          return (
                            <img 
                              src={url} 
                              alt="Media preview" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          );
                        }
                        
                        if (url.match(/\.(mp4|webm|mov)$/i)) {
                          return (
                        <OptimizedVideo
                              src={url} 
                          type="direct"
                          title="Media preview"
                          controls 
                          className="w-full h-32"
                        />
                          );
                        }
                        
                        // Handle YouTube URLs
                        if (url.includes('youtube.com') || url.includes('youtu.be')) {
                          return (
                        <OptimizedVideo
                              src={url}
                          type="youtube"
                          title="YouTube video"
                          controls
                          className="w-full h-32"
                        />
                          );
                        }
                        
                        return (
                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Media preview</span>
                        </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                )}

                {/* Logo Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Show Logo
                    </label>
                    <button
                      type="button"
                      onClick={() => setLandingPage(prev => ({ ...prev, showLogo: !prev.showLogo }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setLandingPage(prev => ({ ...prev, showLogo: !prev.showLogo }));
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        landingPage.showLogo ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                      aria-pressed={landingPage.showLogo}
                      aria-label={`${landingPage.showLogo ? 'Hide' : 'Show'} logo`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          landingPage.showLogo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {landingPage.showLogo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo (PNG file)
                      </label>
                      
                      {/* File Upload */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Upload Logo</label>
                        <input
                          type="file"
                          accept="image/png"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                // Check file size (max 500KB)
                                if (file.size > 500 * 1024) {
                                  alert('Logo file size must be less than 500KB. Please use a smaller image.');
                                  return;
                                }
                                
                                // Convert to data URL for preview
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const result = e.target?.result as string;
                                  handleInputChange('logoUrl', result);
                                };
                                reader.readAsDataURL(file);
                              } catch (error) {
                                console.error('Error processing logo file:', error);
                                alert('Error processing logo file. Please try again.');
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Supported: PNG only. Max size: 500KB. Recommended: 200x80px or similar aspect ratio.
                        </p>
                      </div>
                      
                      {/* URL Input */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Or Enter Logo URL</label>
                        <input
                          type="url"
                          value={landingPage.logoUrl}
                          onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://example.com/logo.png"
                        />
                      </div>

                      {/* Logo Position */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Logo Position</label>
                        <div className="flex space-x-3">
                          {['left', 'center', 'right'].map((position) => (
                            <button
                              key={position}
                              type="button"
                              onClick={() => handleInputChange('logoPosition', position)}
                              className={`px-4 py-2 rounded-lg border transition-colors ${
                                landingPage.logoPosition === position
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {position.charAt(0).toUpperCase() + position.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Logo Preview */}
                      {landingPage.logoUrl && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                          <div className="flex justify-center">
                            <img 
                              src={landingPage.logoUrl} 
                              alt="Logo preview" 
                              className="max-h-16 max-w-32 object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Content
                  </label>
                  <textarea
                    value={landingPage.bodyContent}
                    onChange={(e) => handleInputChange('bodyContent', e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter campaign details, benefits, or bullet points"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use bullet points (•) for lists. Each line will be displayed as a separate bullet point.
                  </p>
                </div>

                {/* Additional Links Section */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Links</h3>
                    <motion.button
                      type="button"
                      onClick={addAdditionalLink}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                    >
                      Add Link
                    </motion.button>
                  </div>
                  
                  {landingPage.additionalLinks.map((link, index) => (
                    <div key={link.id} className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Link {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeAdditionalLink(link.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Link Label
                          </label>
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => updateAdditionalLink(link.id, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="e.g., Download Guide, Learn More"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            URL
                          </label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateAdditionalLink(link.id, 'url', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="https://example.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description
                          </label>
                          <textarea
                            value={link.description}
                            onChange={(e) => updateAdditionalLink(link.id, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Brief description of what this link offers"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {landingPage.additionalLinks.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No additional links added yet. Click "Add Link" to include extra resources.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={landingPage.buttonLabel}
                    onChange={(e) => handleInputChange('buttonLabel', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Join Now, Get Started"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Button Link
                  </label>
                  <input
                    type="url"
                    value={landingPage.buttonLink}
                    onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com or /register"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the URL where the button should link to
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Show Built-in Form
                  </label>
                  <button
                    type="button"
                    onClick={() => setLandingPage(prev => ({ ...prev, showForm: !prev.showForm }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      landingPage.showForm ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        landingPage.showForm ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {landingPage.showForm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Form URL (Optional)
                    </label>
                    <select
                      value={landingPage.formUrl}
                      onChange={(e) => handleInputChange('formUrl', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a form</option>
                      {userForms.map(form => (
                        <option key={form.id} value={form.id}>{form.title}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      <Link to="/builder" className="text-blue-600 hover:underline">
                        Create new form
                    </Link> if you don't see what you need.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={landingPage.whatsappNumber}
                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890 (with country code)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter WhatsApp number with country code (e.g., +1234567890)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Message
                  </label>
                  <input
                    type="text"
                    value={landingPage.whatsappMessage}
                    onChange={(e) => handleInputChange('whatsappMessage', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Default WhatsApp message"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This message will be pre-filled when users click WhatsApp
                  </p>
                </div>

                {/* Color Customization */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Colors</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={landingPage.primaryColor}
                          onChange={(e) => handleColorChange('primary', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={landingPage.primaryColor}
                          onChange={(e) => handleColorChange('primary', e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={landingPage.secondaryColor}
                          onChange={(e) => handleColorChange('secondary', e.target.value)}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={landingPage.secondaryColor}
                          onChange={(e) => handleColorChange('secondary', e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          handleColorChange('primary', preset.primary);
                          handleColorChange('secondary', preset.secondary);
                        }}
                        className="p-3 border border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                        title={preset.name}
                      >
                        <div className="flex space-x-1 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: preset.secondary }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meta Pixel Configuration */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Meta Pixel Configuration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Pixel ID
                      </label>
                      <input
                        type="text"
                        placeholder="123456789012345"
                        value={landingPage.pixelId}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => {
                          setLandingPage(prev => ({
                            ...prev,
                            pixelId: e.target.value
                          }));
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your Meta Pixel ID to track conversions
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-blue-800 font-medium">Meta Pixel Setup</span>
                      </div>
                      <p className="text-blue-700 text-sm">
                        The Meta Pixel script will be automatically added to your landing page. 
                        Form submissions will trigger the 'Lead' event for conversion tracking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Font Customization */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customize Font</h3>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowFontPicker(!showFontPicker)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium">{landingPage.fontFamily}</span>
                      <svg className="w-5 h-5 float-right text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showFontPicker && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {fontOptions.map((font) => (
                          <button
                            key={font}
                            type="button"
                            onClick={() => handleFontChange(font)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                            style={{ fontFamily: font }}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </motion.button>
                  <motion.button
                  type="submit"
                  disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {saving ? (landingPage.id ? 'Updating Landing Page...' : 'Creating Landing Page...') : (landingPage.id ? 'Update Landing Page' : 'Create Landing Page')}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Live Preview</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  srcDoc={generatePreviewHTML()}
                  className="w-full h-[600px]"
                  title="Live Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPageBuilder;
