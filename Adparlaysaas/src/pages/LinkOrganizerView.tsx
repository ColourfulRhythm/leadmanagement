import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { SocialMediaIcons } from '../components/SocialMediaIcons';
import { formatUrl } from '../utils/formatUrl';
import { Link, User, Camera, ExternalLink, Pencil } from 'lucide-react';
import html2canvas from 'html2canvas';

interface LinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
  customIcon?: string;
  iconType?: 'default' | 'custom';
  color?: string;
  type: 'link' | 'social' | 'product' | 'poll' | 'quiz' | 'form' | 'embed';
  isVisible: boolean;
  order: number;
  clicks?: number;
}

interface ProductItem {
  id: string;
  title: string;
  description: string;
  price?: string;
  image?: string;
  url: string;
  category?: string;
  isVisible: boolean;
  order: number;
  clicks?: number;
}

interface LinkOrganizer {
  id: string;
  userId: string;
  title: string;
  description?: string;
  profileImage?: string;
  profileName?: string;
  bio?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };
  backgroundStyle?: {
    type: 'gradient' | 'solid' | 'image';
    primaryColor?: string;
    secondaryColor?: string;
    imageUrl?: string;
  };
  links: LinkItem[];
  products: ProductItem[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LinkOrganizerView: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [linkOrganizer, setLinkOrganizer] = useState<LinkOrganizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'links' | 'shop'>('links');
  const profileSectionRef = useRef<HTMLDivElement>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const generatePreviewImage = async () => {
    if (!linkOrganizer) return;

    try {
      console.log('Generating preview image for social media...');
      
      // Create canvas for preview image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas dimensions (social media optimized)
      canvas.width = 1200;
      canvas.height = 630; // 1.91:1 ratio for social media
      
      // Create gradient background (similar to the glass card effect)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1F2937');
      gradient.addColorStop(1, '#111827');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add glass morphism effect
      ctx.fillStyle = 'rgba(31, 41, 55, 0.7)';
      ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
      
      // Add border radius effect (simplified)
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      
      // Load and draw profile image
      if (linkOrganizer.profileImage) {
        try {
          await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              // Draw profile image (circular)
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2 - 80;
              const radius = 80;
              
              ctx.save();
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
              ctx.restore();
              
              // Add border to profile image
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = 4;
              ctx.stroke();
              
              resolve(void 0);
            };
            img.onerror = reject;
            img.src = linkOrganizer.profileImage || '';
          });
        } catch (error) {
          console.log('Could not load profile image, using default');
        }
      }
      
      // Add profile name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(linkOrganizer.profileName || 'Link Page', canvas.width / 2, canvas.height / 2 + 60);
      
      // Add bio
      if (linkOrganizer.bio) {
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '24px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        
        // Wrap text for bio
        const words = linkOrganizer.bio.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width - 200 && currentLine !== '') {
            lines.push(currentLine);
            currentLine = words[i] + ' ';
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);
        
        // Draw bio lines
        lines.slice(0, 2).forEach((line, index) => {
          ctx.fillText(line.trim(), canvas.width / 2, canvas.height / 2 + 120 + (index * 35));
        });
      }
      
      // Add social media icons (simplified representation)
      const socialLinks = linkOrganizer.socialLinks || {};
      const socialPlatforms = Object.keys(socialLinks).filter(platform => 
        socialLinks[platform as keyof typeof socialLinks]
      );
      
      if (socialPlatforms.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${socialPlatforms.length} social links`, canvas.width / 2, canvas.height / 2 + 200);
      }
      
      // Add Adparlay branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '18px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Adparlay', canvas.width / 2, canvas.height - 40);
      
      const dataUrl = canvas.toDataURL('image/png', 0.9);
      console.log('Preview image generated successfully:', {
        dataUrlLength: dataUrl.length,
        isDataUrl: dataUrl.startsWith('data:image/'),
        timestamp: new Date().toISOString()
      });
      
      // Convert data URL to blob URL for better social media compatibility
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        console.log('Created blob URL for preview image');
        setPreviewImageUrl(blobUrl);
      } catch (error) {
        console.log('Failed to create blob URL, using data URL');
        setPreviewImageUrl(dataUrl);
      }
    } catch (error) {
      console.error('Error generating preview image:', error);
      // Fallback to profile image or default
      setPreviewImageUrl(linkOrganizer.profileImage || 'https://adparlay.com/logo512.png');
    }
  };

  const fetchLinkOrganizer = async () => {
    if (!linkId) return;

    try {
      const docRef = doc(db, 'linkOrganizers', linkId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setLinkOrganizer({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as LinkOrganizer);
      } else {
        setError('Link page not found');
      }
    } catch (error) {
      console.error('Error fetching link organizer:', error);
      setError('Error loading link page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (linkId) {
      fetchLinkOrganizer();
    }
  }, [linkId]);

  // No need to generate preview image anymore since we're using profile image directly
  // useEffect(() => {
  //   if (linkOrganizer) {
  //     generatePreviewImage();
  //   }
  // }, [linkOrganizer]);

  // Update document head for social sharing
  useEffect(() => {
    if (linkOrganizer) {
      // Update document title
      document.title = `${linkOrganizer.profileName || 'Link Page'} - Adparlay`;
      
      // Update or create meta tags for social sharing
      const updateMetaTag = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      const updateMetaName = (name: string, content: string) => {
        let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      // Use profile image if it's a public URL, otherwise use default
      // Social media platforms need public URLs, not data URLs or blob URLs
      const previewImage = (linkOrganizer.profileImage && linkOrganizer.profileImage.startsWith('http')) 
        ? linkOrganizer.profileImage 
        : 'https://adparlay.com/logo512.png';
      
      // Debug logging
      console.log('Social media preview setup:', {
        hasPreviewImageUrl: !!previewImageUrl,
        hasProfileImage: !!linkOrganizer.profileImage,
        usingFallback: !previewImageUrl && !linkOrganizer.profileImage,
        previewImageUrl: previewImageUrl ? 'Generated' : 'Not generated',
        finalImage: previewImage.substring(0, 100) + '...',
        isDataUrl: previewImage.startsWith('data:image/'),
        timestamp: new Date().toISOString()
      });
      
      // Open Graph tags
      updateMetaTag('og:title', `${linkOrganizer.profileName || 'Link Page'} - Adparlay`);
      updateMetaTag('og:description', linkOrganizer.bio || 'Check out my links and products');
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:url', window.location.href);
      updateMetaTag('og:site_name', 'Adparlay');
      updateMetaTag('og:image', previewImage);
      
      // Twitter tags
      updateMetaName('twitter:card', 'summary_large_image');
      updateMetaName('twitter:title', `${linkOrganizer.profileName || 'Link Page'} - Adparlay`);
      updateMetaName('twitter:description', linkOrganizer.bio || 'Check out my links and products');
      updateMetaName('twitter:image', previewImage);
      
      // Basic meta description
      updateMetaName('description', linkOrganizer.bio || 'Check out my links and products');
    }
  }, [linkOrganizer, previewImageUrl]);

  const handleLinkClick = async (link: LinkItem) => {
    try {
      // Update click count
      const linkRef = doc(db, 'linkOrganizers', linkId!);
      await updateDoc(linkRef, {
        [`links.${link.id}.clicks`]: increment(1)
      });

      // Format URL using smart formatting
      const formattedUrl = formatUrl(link.url);

      // Open link in new tab
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error updating click count:', error);
      
      // Format URL using smart formatting
      const formattedUrl = formatUrl(link.url);
      
      // Still open the link even if click tracking fails
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleProductClick = async (product: ProductItem) => {
    try {
      // Update click count
      const linkRef = doc(db, 'linkOrganizers', linkId!);
      await updateDoc(linkRef, {
        [`products.${product.id}.clicks`]: increment(1)
      });

      // Format URL using smart formatting
      const formattedUrl = formatUrl(product.url);

      // Open link in new tab
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error updating click count:', error);
      
      // Format URL using smart formatting
      const formattedUrl = formatUrl(product.url);
      
      // Still open the link even if click tracking fails
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !linkOrganizer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
          <p className="text-gray-300">{error || 'This link page does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  // Additional safety check to ensure linkOrganizer has the required structure
  if (!linkOrganizer || typeof linkOrganizer !== 'object') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle both array and object data structures for links and products
  const getVisibleLinks = (): LinkItem[] => {
    try {
      if (!linkOrganizer?.links) return [];
      
      console.log('Links data structure:', {
        type: typeof linkOrganizer.links,
        isArray: Array.isArray(linkOrganizer.links),
        keys: typeof linkOrganizer.links === 'object' ? Object.keys(linkOrganizer.links) : 'N/A'
      });
      
      if (Array.isArray(linkOrganizer.links)) {
        return (linkOrganizer.links as LinkItem[]).filter((link: LinkItem) => link && link.isVisible);
      } else if (typeof linkOrganizer.links === 'object' && linkOrganizer.links !== null) {
        // Handle object structure where keys are link IDs
        return Object.values(linkOrganizer.links as Record<string, LinkItem>).filter((link: LinkItem) => link && link.isVisible);
      }
      return [];
    } catch (error) {
      console.error('Error processing links:', error);
      return [];
    }
  };

  const getVisibleProducts = (): ProductItem[] => {
    try {
      if (!linkOrganizer?.products) return [];
      
      if (Array.isArray(linkOrganizer.products)) {
        return (linkOrganizer.products as ProductItem[]).filter((product: ProductItem) => product && product.isVisible);
      } else if (typeof linkOrganizer.products === 'object' && linkOrganizer.products !== null) {
        // Handle object structure where keys are product IDs
        return Object.values(linkOrganizer.products as Record<string, ProductItem>).filter((product: ProductItem) => product && product.isVisible);
      }
      return [];
    } catch (error) {
      console.error('Error processing products:', error);
      return [];
    }
  };

  const visibleLinks = getVisibleLinks();
  const visibleProducts = getVisibleProducts();

  return (
    <div className="min-h-screen gradient-bg text-white font-sans flex flex-col items-center p-4 sm:p-8">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        
        /* Subtle abstract gradient background */
        .gradient-bg {
          background: linear-gradient(135deg, 
            #0f0f23 0%, 
            #1a1a2e 25%, 
            #16213e 50%, 
            #0f3460 75%, 
            #533483 100%);
          background-size: 400% 400%;
          -webkit-animation: gradientShift 20s ease infinite;
          -moz-animation: gradientShift 20s ease infinite;
          -o-animation: gradientShift 20s ease infinite;
          animation: gradientShift 20s ease infinite;
        }
        
        @-webkit-keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @-moz-keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @-o-keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .glass-card {
          background-color: rgba(31, 31, 31, 0.8);
          /* Fallback for browsers without backdrop-filter support */
          background: linear-gradient(135deg, rgba(31, 31, 31, 0.9), rgba(45, 45, 45, 0.8));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 4px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        /* Fallback for browsers that don't support backdrop-filter */
        @supports not (backdrop-filter: blur(20px)) {
          .glass-card {
            background: linear-gradient(135deg, rgba(31, 31, 31, 0.95), rgba(45, 45, 45, 0.9));
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
        }
        
        /* Cross-browser centering fix for link accordion */
        .link-item-container {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
          -webkit-box-pack: center;
          -ms-flex-pack: center;
          justify-content: center;
          width: 100%;
          min-height: 80px;
          /* Ensure proper centering on all browsers */
          text-align: center;
        }
        
        .link-item-content {
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -ms-flex-direction: column;
          flex-direction: column;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
          -webkit-box-pack: center;
          -ms-flex-pack: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          max-width: 100%;
        }
        
        .link-item-text {
          text-align: center;
          width: 100%;
          padding: 0 8px;
          /* Force text centering */
          display: block;
        }
        
        .link-item-icon {
          -ms-flex-negative: 0;
          flex-shrink: 0;
          margin-bottom: 12px;
          display: -webkit-box;
          display: -ms-flexbox;
          display: flex;
          -webkit-box-pack: center;
          -ms-flex-pack: center;
          justify-content: center;
          -webkit-box-align: center;
          -ms-flex-align: center;
          align-items: center;
        }
        
        /* Ensure text centering works across all browsers */
        .link-item-title, .link-item-description {
          text-align: center !important;
          margin-left: auto;
          margin-right: auto;
          display: block;
          width: 100%;
        }
        
        /* Additional cross-browser support */
        .link-item-title {
          /* Prevent text from breaking layout */
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        /* Mobile touch improvements */
        .mobile-clickable {
          -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1);
          touch-action: manipulation;
          cursor: pointer;
        }
        
        /* Ensure buttons are properly sized for touch */
        @media (max-width: 768px) {
          .glass-card {
            min-height: 60px;
          }
          
          .link-item-container {
            min-height: 60px;
            padding: 8px;
          }
          
          button {
            min-height: 44px; /* iOS recommended touch target size */
          }
        }
        `}
      </style>

      <main className="w-full max-w-lg">
        {/* Profile Header with Glass Morphism */}
        <div ref={profileSectionRef} className="glass-card rounded-[36px] p-6 mb-8 text-center transition-all duration-300">
              {linkOrganizer.profileImage ? (
                  <img 
                    src={linkOrganizer.profileImage} 
              alt={`${linkOrganizer.profileName}'s Profile`}
              className="w-28 h-28 rounded-full mx-auto mb-4 border-4 border-gray-700 object-cover shadow-xl"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-700 mx-auto mb-4 border-4 border-gray-600 flex items-center justify-center shadow-xl">
              <User size={32} className="text-gray-400" />
                </div>
              )}
              
          <h1 className="text-4xl font-extrabold mb-1 tracking-tight text-white">
                {linkOrganizer.profileName}
              </h1>
              
          <p className="text-gray-400 text-lg font-light max-w-xs mx-auto mb-4">
                {linkOrganizer.bio && linkOrganizer.bio.length > 120 
                  ? `${linkOrganizer.bio.substring(0, 120)}...` 
                  : linkOrganizer.bio}
              </p>

          {/* Social Links */}
              {linkOrganizer.socialLinks && 
               typeof linkOrganizer.socialLinks === 'object' && 
               Object.values(linkOrganizer.socialLinks).some(link => link) && (
                <div className="mb-4">
                  <SocialMediaIcons 
                    socialLinks={linkOrganizer.socialLinks}
                    size="sm"
                    className="opacity-90"
                  />
                </div>
              )}
        </div>

        {/* Tab Navigation */}
        <div className="glass-card rounded-2xl p-2 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveView('links')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 rounded-xl ${
                activeView === 'links'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Link size={16} />
                <span>Links</span>
                {visibleLinks.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {visibleLinks.length}
                  </span>
                )}
              </div>
            </button>
            
            <button
              onClick={() => setActiveView('shop')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-300 rounded-xl ${
                activeView === 'shop'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Camera size={16} />
                <span>Shop</span>
                {visibleProducts.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {visibleProducts.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeView === 'links' && (
              <motion.div
                key="links"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-4"
              >
                  {visibleLinks.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Link size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No links yet</h3>
                    <p className="text-gray-400 text-sm">Links will appear here when added</p>
                    </div>
                  ) : (
                  visibleLinks
                      .sort((a: LinkItem, b: LinkItem) => a.order - b.order)
                      .map((link: LinkItem, index: number) => (
                        <motion.button
                          key={link.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                        className="glass-card rounded-2xl p-4 transition-all duration-300 cursor-pointer group w-full text-left mobile-clickable"
                        onClick={() => handleLinkClick(link)}
                      >
                        <div className="link-item-container">
                          <div className="link-item-content">
                            {/* Icon Circle */}
                            <div
                              className="link-item-icon p-3 rounded-full flex items-center justify-center transition-colors duration-300 shadow-lg"
                              style={{ backgroundColor: link.color || '#70d6ff' }}
                            >
                              {(() => {
                                // Show custom icon if available, otherwise use default icons
                                if (link.customIcon && link.iconType === 'custom') {
                                  return (
                                    <img 
                                      src={link.customIcon} 
                                      alt={link.title} 
                                      className="w-5 h-5 object-cover"
                                    />
                                  );
                                }
                                // Dynamically select icon based on the string name
                                const iconMap: { [key: string]: any } = { Link, User, Camera: Pencil };
                                const IconComponent = link.icon ? iconMap[link.icon] || Link : Link;
                                return <IconComponent size={20} className="text-white" />;
                              })()}
                            </div>
                            {/* Link Title */}
                            <div className="link-item-text">
                              <span className="link-item-title text-xl font-medium text-white block">
                                {link.title}
                              </span>
                              {link.description && (
                                <p className="link-item-description text-sm text-gray-400 mt-1">
                                  {link.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        </motion.button>
                    ))
                )}
              </motion.div>
            )}

            {activeView === 'shop' && (
              <motion.div
                key="shop"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-4"
              >
                  {visibleProducts.length === 0 ? (
                  <div className="glass-card rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No products yet</h3>
                    <p className="text-gray-400 text-sm">Products will appear here when added</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {visibleProducts.map((product: ProductItem, index: number) => (
                        <motion.button
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                        className="glass-card rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 group mobile-clickable"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                        {/* Product Image */}
                        <div className="aspect-square relative overflow-hidden">
                          {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                              <Camera size={24} className="text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
                        </div>
                          
                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 leading-tight">
                              {product.title}
                            </h3>
                          <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>
                            {product.price && (
                            <div className="text-sm font-bold text-green-400 mb-3">
                                {product.price}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-400 font-medium">View Product</span>
                            <ExternalLink size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform duration-200" />
                          </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Watermark */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 opacity-60 font-medium">
            Adparlay link organizer
          </p>
        </div>
      </main>
    </div>
  );
};

export default LinkOrganizerView;
