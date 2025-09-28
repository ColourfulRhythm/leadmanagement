import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useSEO } from '../hooks/useSEO';

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
  id?: string;
  userId: string;
  title: string;
  description?: string;
  profileImage?: string;
  profileName?: string;
  bio?: string;
  username?: string;
  isPublic?: boolean;
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

const LinkOrganizerBuilder: React.FC = () => {
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // SEO optimization
  useSEO({
    title: 'Link Organizer Builder - Adparlay | Create Beautiful Link Pages',
    description: 'Build stunning link organizer pages with Adparlay. Create mobile-first link pages with shop integration, engagement widgets, and AI-powered design.',
    keywords: 'link organizer, linktree alternative, bio link, social media links, mobile-first design',
    canonical: 'https://adparlaysaas.web.app/link-organizer-builder'
  });

  const [linkOrganizer, setLinkOrganizer] = useState<LinkOrganizer>({
    userId: currentUser?.id || '',
    title: 'My Link Page',
    description: 'Welcome to my link page',
    profileName: currentUser?.displayName || 'Your Name',
    bio: 'Add a short bio here...',
    username: currentUser?.email?.split('@')[0] || 'username', // Default username from email
    isPublic: true, // Make link organizers public by default
    socialLinks: {},
    backgroundStyle: {
      type: 'gradient',
      primaryColor: '#1F2937',
      secondaryColor: '#374151'
    },
    links: [],
    products: [],
    theme: {
      primaryColor: '#1F2937',
      secondaryColor: '#374151',
      accentColor: '#8B5CF6',
      fontFamily: 'Inter'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [activeTab, setActiveTab] = useState<'design' | 'links' | 'shop'>('design');
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states for adding/editing
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    description: '',
    icon: '',
    color: '#8B5CF6',
    type: 'link' as LinkItem['type']
  });

  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    image: '',
    url: '',
    category: ''
  });

  // Username availability states
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null);
  const [usernameLocked, setUsernameLocked] = useState(false);

  // Debounced username checking
  const checkUsernameLive = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    // Check format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    
    try {
      const isAvailable = await checkUsernameAvailability(username, linkOrganizer.id);
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus(null);
    }
  };

  // Debounce username checking
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load existing link organizer data when editing
  const fetchLinkOrganizer = async (linkOrganizerId: string) => {
    try {
      const docRef = doc(db, 'linkOrganizers', linkOrganizerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Convert Firestore timestamps to Date objects
        const linkOrganizerData = {
          ...data,
          id: linkOrganizerId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          links: data.links || [],
          products: data.products || []
        } as LinkOrganizer;
        
        setLinkOrganizer(linkOrganizerData);
        // Lock username if editing existing organizer
        if (linkOrganizerData.username) {
          setUsernameLocked(true);
        }
      } else {
        console.error('Link organizer not found');
        alert('Link organizer not found');
        navigate('/link-organizer-builder');
      }
    } catch (error) {
      console.error('Error fetching link organizer:', error);
      alert('Error loading link organizer data');
      navigate('/link-organizer-builder');
    }
  };

  // Load data when component mounts or ID changes
  useEffect(() => {
    if (id && currentUser) {
      fetchLinkOrganizer(id);
    }
  }, [id, currentUser, navigate]);

  const linkTypes = [
    { 
      value: 'link', 
      label: 'Regular Link', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    },
    { 
      value: 'social', 
      label: 'Social Media', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      value: 'product', 
      label: 'Product', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    { 
      value: 'poll', 
      label: 'Poll', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      value: 'quiz', 
      label: 'Quiz', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      value: 'form', 
      label: 'Form', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      value: 'embed', 
      label: 'Embed', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  const colorPalettes = [
    { name: 'Dark Mode', primary: '#1F2937', secondary: '#374151' },
    { name: 'Purple Gradient', primary: '#8B5CF6', secondary: '#EC4899' },
    { name: 'Blue Ocean', primary: '#3B82F6', secondary: '#06B6D4' },
    { name: 'Green Forest', primary: '#10B981', secondary: '#059669' },
    { name: 'Orange Sunset', primary: '#F59E0B', secondary: '#EF4444' },
    { name: 'Pink Rose', primary: '#EC4899', secondary: '#F97316' }
  ];

  const handleImageUpload = async (file: File, type: 'profile' | 'icon') => {
    if (!file) return;

    setUploadingImage(true);
    try {
      // Check file size (max 2MB for better quality)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file size must be less than 2MB. Please use a smaller image.');
        return;
      }
      
      // Convert to base64 for better persistence and cropping
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          if (type === 'profile') {
            setLinkOrganizer(prev => ({ ...prev, profileImage: result }));
            // Open crop modal for profile images
            cropProfileImage(result);
          } else {
            setLinkForm(prev => ({ ...prev, icon: result }));
          }
        }
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const cropProfileImage = (imageUrl: string) => {
    // Create a simple crop interface
    const cropModal = document.createElement('div');
    cropModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    const cropContent = document.createElement('div');
    cropContent.className = 'bg-white rounded-lg p-6 max-w-md w-full';
    
    cropContent.innerHTML = `
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2">Crop Profile Image</h3>
        <div class="relative w-48 h-48 mx-auto border-2 border-gray-300 rounded-lg overflow-hidden">
          <img id="cropImage" src="${imageUrl}" class="w-full h-full object-cover" style="transform-origin: center; transform: scale(1);" />
          <div class="absolute inset-0 border-2 border-blue-500 rounded-full pointer-events-none"></div>
        </div>
        <div class="mt-2 text-center">
          <input type="range" id="scaleSlider" min="0.5" max="2" step="0.1" value="1" class="w-full" />
          <p class="text-sm text-gray-600 mt-1">Adjust size</p>
        </div>
      </div>
      <div class="flex gap-2 justify-end">
        <button id="cancelCrop" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
        <button id="applyCrop" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Apply Crop</button>
      </div>
    `;
    
    cropModal.appendChild(cropContent);
    document.body.appendChild(cropModal);
    
    const img = cropContent.querySelector('#cropImage') as HTMLImageElement;
    const scaleSlider = cropContent.querySelector('#scaleSlider') as HTMLInputElement;
    const cancelBtn = cropContent.querySelector('#cancelCrop') as HTMLButtonElement;
    const applyBtn = cropContent.querySelector('#applyCrop') as HTMLButtonElement;
    
    scaleSlider.addEventListener('input', (e) => {
      const scale = (e.target as HTMLInputElement).value;
      img.style.transform = `scale(${scale})`;
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(cropModal);
    });
    
    applyBtn.addEventListener('click', () => {
      // Create a canvas to crop the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200; // Profile image size
      canvas.height = 200;
      
      if (ctx) {
        // Draw the cropped image
        ctx.drawImage(img, 0, 0, 200, 200);
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Update the profile image
        setLinkOrganizer(prev => ({ ...prev, profileImage: croppedDataUrl }));
        
        document.body.removeChild(cropModal);
      }
    });
  };

  const checkUsernameAvailability = async (username: string, excludeId?: string): Promise<boolean> => {
    if (!username) return false;
    
    try {
      const q = query(
        collection(db, 'linkOrganizers'),
        where('username', '==', username)
      );
      const querySnapshot = await getDocs(q);
      
      // Check if any existing document has this username (excluding current document if updating)
      return querySnapshot.docs.every(doc => doc.id === excludeId);
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;

    // Validate username
    if (!linkOrganizer.username || linkOrganizer.username.trim() === '') {
      alert('Please enter a username for your link organizer.');
      return;
    }

    // Check username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(linkOrganizer.username)) {
      alert('Username can only contain letters, numbers, underscores, and hyphens.');
      return;
    }

    // Check username length
    if (linkOrganizer.username.length < 3 || linkOrganizer.username.length > 20) {
      alert('Username must be between 3 and 20 characters long.');
      return;
    }

    // Check if this is a new link organizer and user is free tier
    if (!linkOrganizer.id && currentUser.subscription === 'free') {
      // Check how many link organizers the user already has
      try {
        const userOrganizersQuery = query(
          collection(db, 'linkOrganizers'),
          where('userId', '==', currentUser.id)
        );
        const userOrganizersSnapshot = await getDocs(userOrganizersQuery);
        
        if (userOrganizersSnapshot.size >= 1) {
          alert('Free users can only create 1 link organizer. Upgrade to Premium to create multiple link organizers.');
          return;
        }
      } catch (error) {
        console.error('Error checking user link organizers:', error);
        alert('Error checking your link organizer limit. Please try again.');
        return;
      }
    }

    // Check username availability
    const isUsernameAvailable = await checkUsernameAvailability(linkOrganizer.username, linkOrganizer.id);
    if (!isUsernameAvailable) {
      alert('This username is already taken. Please choose a different username.');
      return;
    }

    setLoading(true);
    try {
      const organizerData = {
        ...linkOrganizer,
        userId: currentUser.id,
        updatedAt: new Date()
      };

      console.log('Saving link organizer data:', organizerData);

      if (linkOrganizer.id) {
        // Update existing
        await updateDoc(doc(db, 'linkOrganizers', linkOrganizer.id), organizerData);
        console.log('Updated existing link organizer:', linkOrganizer.id);
      } else {
        // Create new
        const docRef = await addDoc(collection(db, 'linkOrganizers'), organizerData);
        setLinkOrganizer(prev => ({ ...prev, id: docRef.id }));
        console.log('Created new link organizer:', docRef.id);
      }
      
      alert('Link organizer saved successfully!');
    } catch (error) {
      console.error('Error saving link organizer:', error);
      alert('Error saving link organizer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = () => {
    if (!linkForm.title || !linkForm.url) {
      alert('Please fill in title and URL');
      return;
    }

    const newLink: LinkItem = {
      id: editingLink?.id || Date.now().toString(),
      title: linkForm.title,
      url: linkForm.url,
      description: linkForm.description,
      icon: linkForm.icon,
      color: linkForm.color,
      type: linkForm.type,
      isVisible: true,
      order: linkOrganizer.links.length,
      clicks: 0
    };

    if (editingLink) {
      setLinkOrganizer(prev => ({
        ...prev,
        links: prev.links.map(link => link.id === editingLink.id ? newLink : link)
      }));
    } else {
      setLinkOrganizer(prev => ({
        ...prev,
        links: [...prev.links, newLink]
      }));
    }

    setLinkForm({ title: '', url: '', description: '', icon: '', color: '#8B5CF6', type: 'link' });
    setEditingLink(null);
    setShowAddLink(false);
  };

  const handleAddProduct = () => {
    if (!productForm.title || !productForm.url) {
      alert('Please fill in title and URL');
      return;
    }

    const newProduct: ProductItem = {
      id: editingProduct?.id || Date.now().toString(),
      title: productForm.title,
      description: productForm.description,
      price: productForm.price,
      image: productForm.image,
      url: productForm.url,
      category: productForm.category,
      isVisible: true,
      order: linkOrganizer.products.length,
      clicks: 0
    };

    if (editingProduct) {
      setLinkOrganizer(prev => ({
        ...prev,
        products: prev.products.map(product => product.id === editingProduct.id ? newProduct : product)
      }));
    } else {
      setLinkOrganizer(prev => ({
        ...prev,
        products: [...prev.products, newProduct]
      }));
    }

    setProductForm({ title: '', description: '', price: '', image: '', url: '', category: '' });
    setEditingProduct(null);
    setShowAddProduct(false);
  };

  const handleDeleteLink = (linkId: string) => {
    setLinkOrganizer(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== linkId)
    }));
  };

  const handleDeleteProduct = (productId: string) => {
    setLinkOrganizer(prev => ({
      ...prev,
      products: prev.products.filter(product => product.id !== productId)
    }));
  };

  const toggleLinkVisibility = (linkId: string) => {
    setLinkOrganizer(prev => ({
      ...prev,
      links: prev.links.map(link => 
        link.id === linkId ? { ...link, isVisible: !link.isVisible } : link
      )
    }));
  };

  const toggleProductVisibility = (productId: string) => {
    setLinkOrganizer(prev => ({
      ...prev,
      products: prev.products.map(product => 
        product.id === productId ? { ...product, isVisible: !product.isVisible } : product
      )
    }));
  };

  const PreviewComponent = () => (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div 
        className="h-48 relative"
        style={{
          background: linkOrganizer.backgroundStyle?.type === 'gradient' 
            ? `linear-gradient(135deg, ${linkOrganizer.backgroundStyle.primaryColor}, ${linkOrganizer.backgroundStyle.secondaryColor})`
            : linkOrganizer.backgroundStyle?.primaryColor || '#8B5CF6'
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
          <h1 className="text-2xl font-bold mb-2">{linkOrganizer.profileName}</h1>
          <p className="text-center text-white text-opacity-90">{linkOrganizer.bio}</p>
        </div>
      </div>

      {/* Links */}
      <div className="p-6 space-y-4">
        {linkOrganizer.links.filter(link => link.isVisible).map((link, index) => (
          <motion.div
            key={link.id}
            className="relative"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Street Sign Style Link */}
            <motion.a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
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
                    <span className="text-white text-lg">
                      {link.icon}
                    </span>
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
            </motion.a>
            
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
        ))}
      </div>

      {/* Social Links */}
      {Object.values(linkOrganizer.socialLinks || {}).some(link => link) && (
        <div className="px-6 pb-6">
          <div className="flex justify-center space-x-4">
            {linkOrganizer.socialLinks?.instagram && (
              <a href={linkOrganizer.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
              </a>
            )}
            {linkOrganizer.socialLinks?.twitter && (
              <a href={linkOrganizer.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
              </a>
            )}
            {linkOrganizer.socialLinks?.linkedin && (
              <a href={linkOrganizer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
              </a>
            )}
            {linkOrganizer.socialLinks?.youtube && (
              <a href={linkOrganizer.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
              </a>
            )}
            {linkOrganizer.socialLinks?.tiktok && (
              <a href={linkOrganizer.socialLinks.tiktok} target="_blank" rel="noopener noreferrer">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </div>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-4 z-50 mx-4 rounded-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Link Organizer Builder</h1>
                <p className="text-xs sm:text-sm text-gray-600">Create beautiful link pages</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              {linkOrganizer.id && (
                <button
                  onClick={() => {
                    // Use username-based URL if available, otherwise fall back to ID-based
                    const linkUrl = linkOrganizer.username 
                      ? `https://www.adparlay.com/${linkOrganizer.username}`
                      : `https://www.adparlay.com/link/${linkOrganizer.id}`;
                    navigator.clipboard.writeText(linkUrl);
                    alert('Link copied to clipboard!');
                  }}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Copy Link
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
        {previewMode ? (
          <div className="flex justify-center">
            <PreviewComponent />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Builder Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {[
                  { 
                    id: 'design', 
                    label: 'Design', 
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                    )
                  },
                  { 
                    id: 'links', 
                    label: 'Links', 
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    )
                  },
                  { 
                    id: 'shop', 
                    label: 'Shop', 
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    )
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 min-h-[44px] py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className={`${activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'}`}>
                      {tab.icon}
                    </div>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'design' && (
                  <motion.div
                    key="design"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Design Settings</h2>
                    
                    {/* Profile Section */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500">adparlay.com/</span>
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={linkOrganizer.username || ''}
                              onChange={(e) => {
                                const newUsername = e.target.value;
                                setLinkOrganizer(prev => ({ ...prev, username: newUsername }));
                                
                                // Clear existing timeout
                                if (usernameCheckTimeout) {
                                  clearTimeout(usernameCheckTimeout);
                                }
                                
                                // Set new timeout for debounced checking
                                const timeout = setTimeout(() => {
                                  checkUsernameLive(newUsername);
                                }, 500);
                                setUsernameCheckTimeout(timeout);
                                
                                // Reset lock if username changes
                                if (usernameLocked && newUsername !== linkOrganizer.username) {
                                  setUsernameLocked(false);
                                }
                              }}
                              disabled={usernameLocked}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent pr-12 ${
                                usernameStatus === 'available' 
                                  ? 'border-green-500 focus:ring-green-500 bg-green-50' 
                                  : usernameStatus === 'taken' || usernameStatus === 'invalid'
                                  ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                  : 'border-gray-300 focus:ring-blue-500'
                              } ${usernameLocked ? 'bg-gray-100' : ''}`}
                              placeholder="yourusername"
                            />
                            
                            {/* Status indicator */}
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {usernameStatus === 'checking' && (
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              )}
                              {usernameStatus === 'available' && !usernameLocked && (
                                <button
                                  onClick={() => setUsernameLocked(true)}
                                  className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
                                  title="Lock this username"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              {usernameStatus === 'available' && usernameLocked && (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white" title="Username locked">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                </div>
                              )}
                              {usernameStatus === 'taken' && (
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white" title="Username taken">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              )}
                              {usernameStatus === 'invalid' && (
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white" title="Invalid username">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Unlock button for locked usernames */}
                          {usernameLocked && (
                            <button
                              onClick={() => {
                                setUsernameLocked(false);
                                setUsernameStatus(null);
                              }}
                              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                              title="Unlock username to change"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        
                        {/* Status messages */}
                        {usernameStatus === 'available' && !usernameLocked && (
                          <p className="text-xs text-green-600 mt-1">✅ Username is available! Click the checkmark to lock it.</p>
                        )}
                        {usernameStatus === 'taken' && (
                          <p className="text-xs text-red-600 mt-1">❌ Username is already taken. Please choose a different one.</p>
                        )}
                        {usernameStatus === 'invalid' && (
                          <p className="text-xs text-red-600 mt-1">❌ Username can only contain letters, numbers, underscores, and hyphens.</p>
                        )}
                        {usernameLocked && (
                          <p className="text-xs text-green-600 mt-1">🔒 Username locked. Your link: adparlay.com/{linkOrganizer.username}</p>
                        )}
                        {!usernameStatus && !usernameLocked && (
                          <p className="text-xs text-gray-500 mt-1">Type a username to check availability</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Name</label>
                        <input
                          type="text"
                          value={linkOrganizer.profileName || ''}
                          onChange={(e) => setLinkOrganizer(prev => ({ ...prev, profileName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={linkOrganizer.bio || ''}
                          onChange={(e) => setLinkOrganizer(prev => ({ ...prev, bio: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Add a short bio..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
                        <div className="flex items-center space-x-4">
                          {linkOrganizer.profileImage && (
                            <img 
                              src={linkOrganizer.profileImage} 
                              alt="Profile" 
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'profile');
                              }}
                              className="hidden"
                              id="profile-upload"
                            />
                            <label
                              htmlFor="profile-upload"
                              className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              {uploadingImage ? 'Uploading...' : 'Upload Image'}
                            </label>
                          </div>
                        </div>
                        <div className="mt-2">
                          <input
                            type="url"
                            value={linkOrganizer.profileImage || ''}
                            onChange={(e) => setLinkOrganizer(prev => ({ ...prev, profileImage: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            placeholder="Or paste image URL here"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color Themes */}
                    <div className="mt-8">
                      <label className="block text-sm font-medium text-gray-700 mb-4">Color Theme</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {colorPalettes.map((palette) => (
                          <button
                            key={palette.name}
                            onClick={() => setLinkOrganizer(prev => ({
                              ...prev,
                              theme: {
                                ...prev.theme,
                                primaryColor: palette.primary,
                                secondaryColor: palette.secondary
                              },
                              backgroundStyle: {
                                type: prev.backgroundStyle?.type || 'gradient',
                                ...prev.backgroundStyle,
                                primaryColor: palette.primary,
                                secondaryColor: palette.secondary
                              }
                            }))}
                            className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <div 
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: palette.primary }}
                              ></div>
                              <div 
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: palette.secondary }}
                              ></div>
                            </div>
                            <div className="text-sm font-medium text-gray-900">{palette.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="mt-8">
                      <label className="block text-sm font-medium text-gray-700 mb-4">Social Media Links</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { 
                            key: 'instagram', 
                            label: 'Instagram', 
                            placeholder: 'https://instagram.com/username',
                            icon: (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                            ),
                            color: 'bg-gradient-to-r from-purple-500 to-pink-500'
                          },
                          { 
                            key: 'twitter', 
                            label: 'Twitter', 
                            placeholder: 'https://twitter.com/username',
                            icon: (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                              </svg>
                            ),
                            color: 'bg-blue-400'
                          },
                          { 
                            key: 'linkedin', 
                            label: 'LinkedIn', 
                            placeholder: 'https://linkedin.com/in/username',
                            icon: (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            ),
                            color: 'bg-blue-600'
                          },
                          { 
                            key: 'youtube', 
                            label: 'YouTube', 
                            placeholder: 'https://youtube.com/@username',
                            icon: (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            ),
                            color: 'bg-red-600'
                          },
                          { 
                            key: 'tiktok', 
                            label: 'TikTok', 
                            placeholder: 'https://tiktok.com/@username',
                            icon: (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                              </svg>
                            ),
                            color: 'bg-black'
                          }
                        ].map((social) => (
                          <div key={social.key} className="relative">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`w-8 h-8 ${social.color} rounded-lg flex items-center justify-center text-white`}>
                                {social.icon}
                              </div>
                              <label className="block text-sm font-medium text-gray-700">{social.label}</label>
                            </div>
                            <input
                              type="url"
                              value={linkOrganizer.socialLinks?.[social.key as keyof typeof linkOrganizer.socialLinks] || ''}
                              onChange={(e) => setLinkOrganizer(prev => ({
                                ...prev,
                                socialLinks: {
                                  ...prev.socialLinks,
                                  [social.key]: e.target.value
                                }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={social.placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'links' && (
                  <motion.div
                    key="links"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Links ({linkOrganizer.links.length})</h2>
                      <button
                        onClick={() => {
                          setEditingLink(null);
                          setLinkForm({ title: '', url: '', description: '', icon: '', color: '#8B5CF6', type: 'link' });
                          setShowAddLink(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        + Add Link
                      </button>
                    </div>

                    <div className="space-y-4">
                      {linkOrganizer.links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={link.isVisible}
                                onChange={() => toggleLinkVisibility(link.id)}
                                className="rounded border-gray-300"
                              />
                              <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: link.color }}></span>
                            </div>
                            <div>
                              <div className="font-medium">{link.title}</div>
                              <div className="text-sm text-gray-600">{link.url}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingLink(link);
                                setLinkForm({
                                  title: link.title,
                                  url: link.url,
                                  description: link.description || '',
                                  icon: link.icon || '',
                                  color: link.color || '#8B5CF6',
                                  type: link.type
                                });
                                setShowAddLink(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'shop' && (
                  <motion.div
                    key="shop"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Shop Products ({linkOrganizer.products.length})</h2>
                      <button
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({ title: '', description: '', price: '', image: '', url: '', category: '' });
                          setShowAddProduct(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        + Add Product
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {linkOrganizer.products.map((product) => (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <input
                              type="checkbox"
                              checked={product.isVisible}
                              onChange={() => toggleProductVisibility(product.id)}
                              className="rounded border-gray-300"
                            />
                            <div className="flex space-x-1">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setProductForm({
                                    title: product.title,
                                    description: product.description,
                                    price: product.price || '',
                                    image: product.image || '',
                                    url: product.url,
                                    category: product.category || ''
                                  });
                                  setShowAddProduct(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          {product.image && (
                            <img 
                              src={product.image} 
                              alt={product.title}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          
                          <h3 className="font-semibold text-gray-900 mb-1">{product.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                          {product.price && (
                            <div className="text-lg font-bold text-green-600">{product.price}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Mobile Preview</h3>
                  <PreviewComponent />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Link Modal */}
      {showAddLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingLink ? 'Edit Link' : 'Add New Link'}
                </h3>
                <button
                  onClick={() => setShowAddLink(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {linkTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setLinkForm(prev => ({ ...prev, type: type.value as LinkItem['type'] }))}
                        className={`p-3 rounded-lg border-2 transition-all flex items-center space-x-2 ${
                          linkForm.type === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className={`${linkForm.type === type.value ? 'text-blue-600' : 'text-gray-500'}`}>
                          {type.icon}
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={linkForm.title}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter link title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                  <input
                    type="url"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <input
                    type="text"
                    value={linkForm.description}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Short description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon (Optional)</label>
                  <div className="flex items-center space-x-4">
                    {linkForm.icon && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                        {linkForm.icon.startsWith('http') ? (
                          <img src={linkForm.icon} alt="Icon" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{linkForm.icon}</span>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'icon');
                        }}
                        className="hidden"
                        id="icon-upload"
                      />
                      <label
                        htmlFor="icon-upload"
                        className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Upload Icon
                      </label>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={linkForm.icon}
                      onChange={(e) => setLinkForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="🔗 or any emoji, or paste image URL"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <input
                    type="color"
                    value={linkForm.color}
                    onChange={(e) => setLinkForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-12 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddLink(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLink}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingLink ? 'Update' : 'Add'} Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Title</label>
                  <input
                    type="text"
                    value={productForm.title}
                    onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter product title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Product description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (Optional)</label>
                  <input
                    type="text"
                    value={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="$29.99"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <div className="space-y-3">
                    {/* Image Upload */}
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Check file size (500KB = 500 * 1024 bytes)
                            if (file.size > 500 * 1024) {
                              alert('Image size must be less than 500KB. Please choose a smaller image.');
                              return;
                            }
                            
                            // Create object URL for preview
                            const imageUrl = URL.createObjectURL(file);
                            setProductForm(prev => ({ ...prev, image: imageUrl }));
                          }
                        }}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <label
                        htmlFor="product-image-upload"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                      >
                        Upload Image
                      </label>
                      <span className="text-xs text-gray-500">Max 500KB</span>
                    </div>
                    
                    {/* Image Preview */}
                    {productForm.image && (
                      <div className="relative">
                        <img
                          src={productForm.image}
                          alt="Product preview"
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          onClick={() => setProductForm(prev => ({ ...prev, image: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    
                    {/* Or URL Input */}
                    <div className="text-center text-gray-500 text-sm">OR</div>
                    <input
                      type="url"
                      value={productForm.image.startsWith('blob:') ? '' : productForm.image}
                      onChange={(e) => {
                        if (!e.target.value.startsWith('blob:')) {
                          setProductForm(prev => ({ ...prev, image: e.target.value }));
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product URL</label>
                  <input
                    type="url"
                    value={productForm.url}
                    onChange={(e) => setProductForm(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/product"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Electronics, Fashion, etc."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkOrganizerBuilder;
