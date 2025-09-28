import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface LinkItem {
  id: string;
  title: string;
  url: string;
  description?: string;
  icon?: string;
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
  username?: string;
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

const UsernameView: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [linkOrganizer, setLinkOrganizer] = useState<LinkOrganizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'links' | 'shop'>('links');
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  useEffect(() => {
    if (username) {
      fetchLinkOrganizerByUsername();
    }
  }, [username]);

  const fetchLinkOrganizerByUsername = async () => {
    if (!username) return;

    console.log('Fetching link organizer for username:', username);

    try {
      // Try to find by username - simplified approach
      const linkOrganizersQuery = query(
        collection(db, 'linkOrganizers'),
        where('username', '==', username)
      );
      
      const querySnapshot = await getDocs(linkOrganizersQuery);
      
      console.log('Query results:', querySnapshot.size, 'documents found');
      
      if (querySnapshot.empty) {
        console.log('No link organizer found for username:', username);
        setError('Link page not found');
        setLoading(false);
        return;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      console.log('Found link organizer data:', data);
      console.log('Document ID:', doc.id);
      
      // Set the link organizer data to render directly
      setLinkOrganizer({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        links: data.links || [],
        products: data.products || []
      } as LinkOrganizer);

    } catch (error) {
      console.error('Error fetching link organizer:', error);
      // If it's a permissions error, try a different approach
      if (error instanceof Error && error.message.includes('permissions')) {
        setError('This link page is private or not available');
      } else {
        setError('Error loading link page');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = async (link: LinkItem) => {
    try {
      // Update click count
      const linkRef = doc(db, 'linkOrganizers', linkOrganizer!.id);
      await updateDoc(linkRef, {
        [`links.${link.id}.clicks`]: increment(1)
      });

      // Open link in new tab
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error updating click count:', error);
      // Still open the link even if click tracking fails
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleProductClick = async (product: ProductItem) => {
    try {
      // Update click count
      const linkRef = doc(db, 'linkOrganizers', linkOrganizer!.id);
      await updateDoc(linkRef, {
        [`products.${product.id}.clicks`]: increment(1)
      });

      // Open link in new tab
      window.open(product.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error updating click count:', error);
      // Still open the link even if click tracking fails
      window.open(product.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setCurrentX(e.touches[0].clientX);
    const deltaX = currentX - startX;
    
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0 && activeView === 'shop') {
        setSwipeDirection('right');
      } else if (deltaX < 0 && activeView === 'links') {
        setSwipeDirection('left');
      }
    }
  };

  const handleTouchEnd = () => {
    const deltaX = currentX - startX;
    
    if (Math.abs(deltaX) > 100) {
      if (deltaX > 0 && activeView === 'shop') {
        setActiveView('links');
      } else if (deltaX < 0 && activeView === 'links') {
        setActiveView('shop');
      }
    }
    
    setSwipeDirection(null);
    setStartX(0);
    setCurrentX(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !linkOrganizer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600">{error || 'This link page does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  const visibleLinks = linkOrganizer.links.filter(link => link.isVisible);
  const visibleProducts = linkOrganizer.products.filter(product => product.isVisible);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first container */}
      <div className="max-w-sm mx-auto bg-white min-h-screen relative overflow-hidden">
        {/* Swipe indicator */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex space-x-1">
            <div 
              className={`w-2 h-2 rounded-full transition-colors ${
                activeView === 'links' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            ></div>
            <div 
              className={`w-2 h-2 rounded-full transition-colors ${
                activeView === 'shop' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            ></div>
          </div>
        </div>

        {/* Main content with swipe support */}
        <div 
          className="relative w-full h-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${swipeDirection === 'left' ? '-10px' : swipeDirection === 'right' ? '10px' : '0'})`,
            transition: swipeDirection ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          <AnimatePresence mode="wait">
            {activeView === 'links' && (
              <motion.div
                key="links"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {/* Header */}
                <div 
                  className="h-64 relative"
                  style={{
                    background: linkOrganizer.backgroundStyle?.type === 'gradient' 
                      ? `linear-gradient(135deg, ${linkOrganizer.backgroundStyle.primaryColor}, ${linkOrganizer.backgroundStyle.secondaryColor})`
                      : linkOrganizer.backgroundStyle?.primaryColor || '#1F2937'
                  }}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                  <div className="relative p-6 h-full flex flex-col items-center justify-center text-white">
                    {linkOrganizer.profileImage && (
                      <img 
                        src={linkOrganizer.profileImage} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full mb-4 border-4 border-white border-opacity-30"
                      />
                    )}
                    <h1 className="text-2xl font-bold mb-2 text-center">{linkOrganizer.profileName}</h1>
                    <p className="text-center text-white text-opacity-90 text-sm leading-relaxed">
                      {linkOrganizer.bio}
                    </p>
                  </div>
                </div>

                {/* Links */}
                <div className="p-6 space-y-4">
                  {visibleLinks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <p className="text-gray-600">No links available yet</p>
                    </div>
                  ) : (
                    visibleLinks.map((link, index) => (
                      <motion.div
                        key={link.id}
                        className="relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Street Sign Style Link */}
                        <motion.button
                          onClick={() => handleLinkClick(link)}
                          className="block w-full relative overflow-hidden cursor-pointer group"
                          style={{ 
                            backgroundColor: link.color || linkOrganizer.theme.primaryColor,
                            borderRadius: '8px'
                          }}
                        >
                          {/* Double Border Effect */}
                          <div 
                            className="absolute inset-0 border-4 border-white"
                            style={{ borderRadius: '8px' }}
                          />
                          <div 
                            className="absolute inset-1 border-2 border-white border-opacity-80"
                            style={{ borderRadius: '4px' }}
                          />
                          
                          {/* Content */}
                          <div className="relative p-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {link.icon && (
                                <div className="w-6 h-6 flex items-center justify-center">
                                  {link.icon.startsWith('http') ? (
                                    <img src={link.icon} alt="Icon" className="w-full h-full object-cover rounded" />
                                  ) : (
                                    <span className="text-white text-lg">{link.icon}</span>
                                  )}
                                </div>
                              )}
                              <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                                {link.title}
                              </h3>
                              {/* Description Toggle Button - Positioned absolutely to not affect layout */}
                              {link.description && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Toggle description visibility
                                    const desc = document.getElementById(`desc-${link.id}`);
                                    if (desc) {
                                      desc.style.display = desc.style.display === 'none' ? 'block' : 'none';
                                    }
                                  }}
                                  className="absolute top-2 right-2 text-white text-opacity-80 hover:text-opacity-100 transition-opacity text-xs bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.button>
                        
                        {/* Collapsible Description */}
                        {link.description && (
                          <div 
                            id={`desc-${link.id}`}
                            className="mt-2 p-3 bg-gray-100 rounded-lg text-sm text-gray-700 hidden"
                            style={{ display: 'none' }}
                          >
                            {link.description}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Social Links */}
                {Object.values(linkOrganizer.socialLinks || {}).some(link => link) && (
                  <div className="px-6 pb-6">
                    <div className="flex justify-center space-x-6">
                      {linkOrganizer.socialLinks?.instagram && (
                        <a 
                          href={linkOrganizer.socialLinks.instagram} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="transform hover:scale-110 transition-transform"
                        >
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </div>
                        </a>
                      )}
                      {linkOrganizer.socialLinks?.twitter && (
                        <a 
                          href={linkOrganizer.socialLinks.twitter} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="transform hover:scale-110 transition-transform"
                        >
                          <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white shadow-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                          </div>
                        </a>
                      )}
                      {linkOrganizer.socialLinks?.linkedin && (
                        <a 
                          href={linkOrganizer.socialLinks.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="transform hover:scale-110 transition-transform"
                        >
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                          </div>
                        </a>
                      )}
                      {linkOrganizer.socialLinks?.youtube && (
                        <a 
                          href={linkOrganizer.socialLinks.youtube} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="transform hover:scale-110 transition-transform"
                        >
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </div>
                        </a>
                      )}
                      {linkOrganizer.socialLinks?.tiktok && (
                        <a 
                          href={linkOrganizer.socialLinks.tiktok} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="transform hover:scale-110 transition-transform"
                        >
                          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white shadow-lg">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeView === 'shop' && (
              <motion.div
                key="shop"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {/* Shop Header */}
                <div 
                  className="h-32 relative"
                  style={{
                    background: linkOrganizer.backgroundStyle?.type === 'gradient' 
                      ? `linear-gradient(135deg, ${linkOrganizer.backgroundStyle.primaryColor}, ${linkOrganizer.backgroundStyle.secondaryColor})`
                      : linkOrganizer.backgroundStyle?.primaryColor || '#1F2937'
                  }}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                  <div className="relative p-6 h-full flex flex-col items-center justify-center text-white">
                    <h1 className="text-xl font-bold mb-1">Shop</h1>
                    <p className="text-sm opacity-90">{linkOrganizer.profileName}</p>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="p-4">
                  {visibleProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <p className="text-gray-600">No products available yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {visibleProducts.map((product, index) => (
                        <motion.button
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {product.image ? (
                            <div className="aspect-square relative">
                              <img 
                                src={product.image} 
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          
                          <div className="p-3">
                            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                              {product.title}
                            </h3>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                            {product.price && (
                              <div className="text-sm font-bold text-green-600 mb-2">
                                {product.price}
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-blue-600 font-medium">View Product</span>
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Swipe hint */}
        {activeView === 'links' && visibleProducts.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-medium shadow-lg">
            ← Swipe for Shop
          </div>
        )}
        {activeView === 'shop' && visibleLinks.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-medium shadow-lg">
            Swipe for Links →
          </div>
        )}
      </div>
    </div>
  );
};

export default UsernameView;
