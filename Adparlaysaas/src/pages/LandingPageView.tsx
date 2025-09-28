import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface LandingPage {
  id: string;
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

const LandingPageView: React.FC = () => {
  const { landingId } = useParams();
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Load and initialize Meta Pixel
  useEffect(() => {
    if (landingPage?.pixelId && landingPage.pixelId !== '') {
      // Remove any existing Meta Pixel elements to prevent duplicates
      const existingMetaPixels = document.querySelectorAll('script[data-meta-pixel]');
      const existingNoscripts = document.querySelectorAll('noscript[data-meta-pixel]');
      existingMetaPixels.forEach(element => element.remove());
      existingNoscripts.forEach(element => element.remove());

      // Clear any existing fbq if needed
      if ((window as any).fbq && !(window as any).fbq.loaded) {
        (window as any).fbq = null;
      }

      // Load Meta Pixel script directly into document head
      const script = document.createElement('script');
      script.setAttribute('data-meta-pixel', 'true');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${landingPage.pixelId}');
        fbq('track', 'PageView');
        console.log('Meta Pixel initialized with ID: ${landingPage.pixelId}');
      `;
      document.head.appendChild(script);

      // Add noscript fallback
      const noscript = document.createElement('noscript');
      noscript.setAttribute('data-meta-pixel', 'true');
      const noscriptImg = document.createElement('img');
      noscriptImg.height = 1;
      noscriptImg.width = 1;
      noscriptImg.style.display = 'none';
      noscriptImg.src = `https://www.facebook.com/tr?id=${landingPage.pixelId}&ev=PageView&noscript=1`;
      noscriptImg.alt = '';
      noscript.appendChild(noscriptImg);
      document.head.appendChild(noscript);

      // Return cleanup function
      return () => {
        const scripts = document.querySelectorAll('script[data-meta-pixel]');
        const noscripts = document.querySelectorAll('noscript[data-meta-pixel]');
        scripts.forEach(script => script.remove());
        noscripts.forEach(noscript => noscript.remove());
      };
    }
  }, [landingPage?.pixelId]);

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
        return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
      }
    }
    
    return url; // Return original if no match
  };

  useEffect(() => {
    const fetchLandingPage = async () => {
      if (!landingId) return;
      
      try {
        setLoading(true);
        const docRef = doc(db, 'landingPages', landingId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const landingPageData: LandingPage = {
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
            primaryColor: data.primaryColor || '#3B82F6',
            secondaryColor: data.secondaryColor || '#1F2937',
            fontFamily: data.fontFamily || 'Inter',
            userId: data.userId || '',
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
          };
          console.log('Retrieved landing page data:', landingPageData);
          console.log('Retrieved media URL:', landingPageData.mediaUrl);
          console.log('Retrieved show media:', landingPageData.showMedia);
          setLandingPage(landingPageData);
          
          // Track page view
          await updateDoc(docRef, {
            views: (docSnap.data().views || 0) + 1
          });
        } else {
          console.log('No such landing page!');
        }
      } catch (error) {
        console.error('Error fetching landing page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLandingPage();
  }, [landingId]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!landingPage) return;
    
    try {
      // Track form submission
      const docRef = doc(db, 'landingPages', landingPage.id);
      await updateDoc(docRef, {
        submissions: (landingPage.submissions || 0) + 1,
        updatedAt: new Date()
      });
      
      // Trigger Meta Pixel Lead event
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead');
        console.log('Meta Pixel Lead event fired for pixel:', landingPage.pixelId);
      } else if (landingPage.pixelId) {
        // Fallback if fbq isn't loaded yet
        console.warn('Meta Pixel not loaded, Lead event will not be tracked');
      }
      
      setSubmitted(true);
    } catch (error) {
      console.error('Error tracking submission:', error);
      // Still show success even if tracking fails
      setSubmitted(true);
    }
  };

  // Update document head for social sharing
  useEffect(() => {
    if (landingPage) {
      // Update document title
      document.title = landingPage.title;
      
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
      
      // Open Graph tags
      updateMetaTag('og:title', landingPage.title);
      updateMetaTag('og:description', landingPage.tagline);
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:url', window.location.href);
      updateMetaTag('og:site_name', 'Adparlay');
      
      // Use landing page media or default preview image
      const previewImage = landingPage.mediaUrl || `${window.location.origin}/default-preview.svg`;
      updateMetaTag('og:image', previewImage);
      
      // Twitter tags
      updateMetaName('twitter:card', 'summary_large_image');
      updateMetaName('twitter:title', landingPage.title);
      updateMetaName('twitter:description', landingPage.tagline);
      updateMetaName('twitter:image', previewImage);
      
      // General description
      updateMetaName('description', landingPage.tagline);
    }
  }, [landingPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading landing page...</p>
        </div>
      </div>
    );
  }

  if (!landingPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Landing Page Not Found</h2>
          <p className="text-gray-600">The landing page you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const whatsappLink = landingPage.whatsappNumber ? 
    `https://wa.me/${landingPage.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(landingPage.whatsappMessage)}` : 
    '#';

  return (
    <div className="min-h-screen" style={{ fontFamily: landingPage.fontFamily }}>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div 
          className="text-center py-24 px-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${landingPage.primaryColor}08, ${landingPage.secondaryColor}08)`
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${landingPage.primaryColor}15 0%, transparent 50%),
                          radial-gradient(circle at 70% 80%, ${landingPage.secondaryColor}15 0%, transparent 50%)`
            }}
          />
          <div className="relative z-10">
            {landingPage.showLogo && landingPage.logoUrl && (
              <div className={`mb-8 ${landingPage.logoPosition === 'left' ? 'text-left' : landingPage.logoPosition === 'right' ? 'text-right' : 'text-center'}`}>
                <img 
                  src={landingPage.logoUrl} 
                  alt="Logo" 
                  className="inline-block max-h-20 max-w-48 object-contain"
                />
              </div>
            )}
            <h1 
              className="text-5xl md:text-6xl font-black mb-6 leading-tight"
              style={{ color: landingPage.primaryColor }}
            >
              {landingPage.headline}
            </h1>
            <p 
              className="text-xl md:text-2xl max-w-4xl mx-auto opacity-90"
              style={{ color: landingPage.secondaryColor }}
            >
              {landingPage.tagline}
            </p>
          </div>
        </div>

        {/* Media Section */}
        {landingPage.showMedia && landingPage.mediaUrl && (
          <div className="py-20 px-6 text-center">
            <div className="max-w-5xl mx-auto">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                {(() => {
                  const url = landingPage.mediaUrl;
                  
                  // Handle data URLs (uploaded files)
                  if (url.startsWith('data:image/')) {
                    return (
                      <img 
                        src={url} 
                        alt="Campaign Media" 
                        className="w-full h-auto"
                      />
                    );
                  }
                  
                  if (url.startsWith('data:video/')) {
                    return (
                      <video 
                        src={url} 
                        controls 
                        autoPlay 
                        muted 
                        loop 
                        className="w-full h-auto"
                      />
                    );
                  }
                  
                  // Handle regular file extensions
                  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    return (
                      <img 
                        src={url} 
                        alt="Campaign Media" 
                        className="w-full h-auto"
                      />
                    );
                  }
                  
                  if (url.match(/\.(mp4|webm|mov)$/i)) {
                    return (
                      <video 
                        src={url} 
                        controls 
                        autoPlay 
                        muted 
                        loop 
                        className="w-full h-auto"
                      />
                    );
                  }
                  
                  // Handle YouTube URLs
                  if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    return (
                      <iframe 
                        src={convertToYouTubeEmbed(url)} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen 
                        className="w-full aspect-video"
                      />
                    );
                  }
                  
                  // Fallback for unsupported formats
                  return (
                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                      <p className="text-gray-500">Unsupported media format</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Body Section */}
        <div className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <div 
              className="inline-block text-left p-8 rounded-2xl"
              style={{
                background: `${landingPage.primaryColor}05`,
                border: `1px solid ${landingPage.primaryColor}15`
              }}
            >
              <div 
                className="whitespace-pre-line text-lg leading-relaxed"
                style={{ color: landingPage.secondaryColor }}
              >
                {landingPage.bodyContent}
              </div>
            </div>
          </div>
        </div>

                       {/* CTA Section */}
               <div 
                 className="py-24 px-6 text-center text-white relative overflow-hidden"
                 style={{
                   background: `linear-gradient(135deg, ${landingPage.primaryColor}, ${landingPage.primaryColor}ee)`
                 }}
               >
                 <div className="max-w-3xl mx-auto">
                   <h2 className="text-3xl md:text-4xl font-bold mb-8">
                     {landingPage.buttonLabel}
                   </h2>
                   
                   {landingPage.showForm && landingPage.formUrl ? (
                     <div className="max-w-2xl mx-auto">
                       <iframe 
                         src={`${window.location.origin}/form/${landingPage.formUrl}`}
                         style={{ width: '100%', height: '600px', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                         title="Embedded Form"
                       />
                     </div>
                   ) : landingPage.showForm ? (
                     !submitted ? (
                       <div className="max-w-2xl mx-auto">
                         <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-2xl border border-white/20">
                           <form onSubmit={handleFormSubmit} className="space-y-8">
                             {/* Form Grid - Framer Style */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div className="space-y-3">
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                   Full Name
                                 </label>
                                 <input
                                   type="text"
                                   required
                                   className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                                   placeholder="Enter your full name"
                                 />
                               </div>
                               <div className="space-y-3">
                                 <label className="block text-sm font-medium text-gray-700 mb-2">
                                   Email Address
                                 </label>
                                 <input
                                   type="email"
                                   required
                                   className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                                   placeholder="Enter your email"
                                 />
                               </div>
                             </div>
                             
                             <div className="space-y-3">
                               <label className="block text-sm font-medium text-gray-700 mb-2">
                                 Phone Number
                               </label>
                               <input
                                 type="tel"
                                 className="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                                 placeholder="Enter your phone number"
                               />
                             </div>
                             
                             {/* Action Buttons - Framer Style Grid */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                               <button
                                 type="submit"
                                 className="w-full py-4 px-6 text-lg font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                                 style={{
                                   background: landingPage.primaryColor,
                                   color: 'white',
                                   boxShadow: `0 4px 14px ${landingPage.primaryColor}30`
                                 }}
                               >
                                 {landingPage.buttonLabel}
                               </button>
                               
                               {landingPage.whatsappNumber && (
                                 <a
                                   href={whatsappLink}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="w-full py-4 px-6 text-lg font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                                   style={{
                                     boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)'
                                   }}
                                 >
                                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                                   </svg>
                                   WhatsApp
                                 </a>
                               )}
                             </div>
                           </form>
                         </div>
                       </div>
                     ) : (
                       <div className="bg-white rounded-3xl p-8 shadow-2xl">
                         <div className="text-center">
                           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                             <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                             </svg>
                           </div>
                           <h3 className="text-2xl font-bold mb-4" style={{ color: landingPage.primaryColor }}>
                             Thank You!
                           </h3>
                           <p className="text-gray-600 mb-6">
                             Your submission has been received. We'll be in touch soon!
                           </p>
                           <a
                             href="/register"
                             className="inline-block px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 hover:shadow-xl"
                             style={{
                               background: landingPage.primaryColor,
                               color: 'white'
                             }}
                           >
                             Build Your One Page on AdParlay
                           </a>
                         </div>
                       </div>
                     )
                   ) : (
                     <div className="bg-white rounded-3xl p-8 shadow-2xl">
                       <div className="text-center space-y-6">
                         {landingPage.buttonLink && (
                           <a
                             href={landingPage.buttonLink}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="inline-block px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 hover:shadow-xl"
                             style={{
                               background: landingPage.primaryColor,
                               color: 'white'
                             }}
                           >
                             {landingPage.buttonLabel}
                           </a>
                         )}
                         
                         {landingPage.whatsappNumber && (
                           <a
                             href={whatsappLink}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors"
                           >
                             💬 WhatsApp
                           </a>
                         )}
                       </div>
                     </div>
                   )}
                 </div>
               </div>

        {/* Additional Links Section */}
        {landingPage.additionalLinks && landingPage.additionalLinks.length > 0 && (
          <div className="py-20 px-6 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 
                className="text-3xl font-bold text-center mb-12"
                style={{ color: landingPage.primaryColor }}
              >
                Additional Resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {landingPage.additionalLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border border-gray-200"
                  >
                    <h3 
                      className="text-lg font-semibold mb-2"
                      style={{ color: landingPage.primaryColor }}
                    >
                      {link.label}
                    </h3>
                    {link.description && (
                      <p className="text-gray-600 text-sm">
                        {link.description}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPageView;
