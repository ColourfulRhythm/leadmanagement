import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import GoogleSheetsIntegration from '../components/GoogleSheetsIntegration';
import CRMIntegration from '../components/CRMIntegration';
import ZapierIntegration from '../components/ZapierIntegration';
import { useSEO } from '../hooks/useSEO';

interface FormMedia {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  primaryDescription: string;
  secondaryDescription: string;
}

interface FormBlock {
  id: string;
  title: string;
  description?: string;
  questions: FormQuestion[];
}

interface FormQuestion {
  id: string;
  type: 'short_answer' | 'paragraph' | 'multiple_choice' | 'checkboxes' | 'dropdown' | 'file_upload' | 'linear_scale' | 'multiple_choice_grid' | 'checkbox_grid' | 'date' | 'time';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowedTypes?: string[];
    maxFileSize?: number;
  };
  // Additional properties for specific question types
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: {
    min: string;
    max: string;
  };
  gridRows?: string[];
  gridColumns?: string[];
}

interface Form {
  id: string;
  title: string;
  description?: string;
  media: FormMedia;
  blocks: FormBlock[];
  settings: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: number;
    successMessage: string;
    showProgressBar: boolean;
    allowMultipleSubmissions: boolean;
  };
  status: 'draft' | 'published' | 'archived';
  userId: string;
  submissions: number;
  lastSubmission?: Date;
  createdAt: Date;
  updatedAt: Date;
  shareUrl?: string;
}

const FormBuilder: React.FC = () => {
  const { formId } = useParams();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // SEO optimization
  useSEO({
    title: 'Form Builder - Adparlay | Create Beautiful Lead Capture Forms',
    description: 'Build stunning forms with Adparlay\'s drag-and-drop form builder. Create lead capture forms, surveys, and questionnaires with split-screen preview.',
    keywords: 'form builder, drag and drop forms, lead capture forms, survey builder, questionnaire creator',
    canonical: 'https://adparlaysaas.web.app/form-builder'
  });
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showQuestionTypeModal, setShowQuestionTypeModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState(false);
  const [showCRMModal, setShowCRMModal] = useState(false);
  const [showZapierModal, setShowZapierModal] = useState(false);
  const [showIntegrationsDropdown, setShowIntegrationsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const integrationsDropdownRef = useRef<HTMLDivElement>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Handle click outside to close integrations dropdown and mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (integrationsDropdownRef.current && !integrationsDropdownRef.current.contains(event.target as Node)) {
        setShowIntegrationsDropdown(false);
      }
      // Close mobile menu when clicking outside
      setShowMobileMenu(false);
    };

    if (showIntegrationsDropdown || showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIntegrationsDropdown, showMobileMenu]);
  const [activeShareTab, setActiveShareTab] = useState<'link' | 'embed'>('link');
  const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(null);
  const [editingBlock, setEditingBlock] = useState<FormBlock | null>(null);
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [mediaError, setMediaError] = useState<string>('');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!form || !currentUser?.id) {
      console.log('Auto-save skipped: form or currentUser missing', { form: !!form, userId: currentUser?.id });
      return;
    }
    
    // Skip auto-save if manual save is in progress
    if (saving) {
      console.log('Auto-save skipped: manual save in progress');
      return;
    }
    
    // Validate media before auto-saving
    const mediaValidation = validateMedia(form.media);
    if (!mediaValidation.isValid) {
      console.log('Auto-save skipped: invalid media', mediaValidation.error);
      return;
    }
    
    try {
      console.log('Auto-saving form...', { formId: form.id, userId: currentUser.id });
      
      // Clean the form data to remove undefined values and ensure all required fields
      const cleanFormData = {
        id: form.id || `form-${Date.now()}`,
        title: form.title || 'Untitled Form',
        description: form.description || '',
        media: {
          type: String(form.media?.type || 'image'),
          url: String(form.media?.url || ''),
          alt: String(form.media?.alt || 'Form Media'),
          primaryDescription: String(form.media?.primaryDescription || ''),
          secondaryDescription: String(form.media?.secondaryDescription || '')
        },
        blocks: (form.blocks || []).map(block => ({
          id: block.id || `block-${Date.now()}`,
          title: block.title || 'Untitled Page',
          description: block.description || '',
          questions: (block.questions || []).map(question => ({
            id: question.id || `question-${Date.now()}`,
            type: question.type || 'short_answer',
            label: question.label || 'Untitled Question',
            placeholder: question.placeholder || '',
            required: question.required !== undefined ? question.required : false,
            options: question.options || [],
            helpText: question.helpText || '',
            validation: question.validation || {},
            scaleMin: question.scaleMin || 1,
            scaleMax: question.scaleMax || 5,
            scaleLabels: question.scaleLabels || { min: '1', max: '5' },
            gridRows: question.gridRows || [],
            gridColumns: question.gridColumns || []
          }))
        })),
        settings: {
          primaryColor: form.settings?.primaryColor || '#3B82F6',
          backgroundColor: form.settings?.backgroundColor || '#FFFFFF',
          fontFamily: form.settings?.fontFamily || 'Inter',
          borderRadius: form.settings?.borderRadius || 8,
          successMessage: form.settings?.successMessage || 'Thank you for your submission!',
          showProgressBar: form.settings?.showProgressBar !== undefined ? form.settings.showProgressBar : true,
          allowMultipleSubmissions: form.settings?.allowMultipleSubmissions !== undefined ? form.settings.allowMultipleSubmissions : false,
        },
        status: form.status || 'draft',
        userId: currentUser.id,
        submissions: form.submissions || 0,
        createdAt: form.createdAt || new Date(),
        updatedAt: new Date(),
        shareUrl: form.shareUrl || ''
      };
      
      if (form.id && form.id !== '') {
        // Update existing form
        await updateDoc(doc(db, 'forms', form.id), cleanFormData);
        console.log('Form auto-saved successfully');
        setLastSaved(new Date());
      } else {
        // Create new form
        const newFormRef = doc(collection(db, 'forms'));
        const newFormData = {
          ...cleanFormData,
          id: newFormRef.id,
          createdAt: new Date(),
        };
        await setDoc(newFormRef, newFormData);
        console.log('Form auto-created successfully with ID:', newFormRef.id);
        
        // Update the form state with the new ID
        setForm(prev => prev ? { ...prev, id: newFormRef.id } : null);
        
        // Navigate to the new form
        navigate(`/builder/${newFormRef.id}`);
      }
    } catch (error) {
      console.error('Error auto-saving form:', error);
      console.error('Form data that failed to auto-save:', form);
    }
  }, [form, formId, currentUser?.id, navigate]);

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    if (form && currentUser?.id) {
      console.log('Auto-save useEffect: Form and user available, setting up auto-save');
      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log('Auto-save timeout triggered');
        autoSave();
      }, 2000);
    } else {
      console.log('Auto-save useEffect: Form or user not available', { 
        hasForm: !!form, 
        hasUserId: !!currentUser?.id 
      });
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [form, autoSave, currentUser?.id]);

  useEffect(() => {
    if (formId) {
      fetchForm();
    } else {
      createNewForm();
    }
  }, [formId, currentUser?.id]);

  const createNewForm = async () => {
    if (!currentUser?.id) {
      console.error('createNewForm: No currentUser.id available');
      return;
    }
    
    // Check form limits for free users
    if (currentUser.subscription === 'free') {
      try {
        // Count existing forms for this user
        const formsQuery = query(
          collection(db, 'forms'),
          where('userId', '==', currentUser.id)
        );
        const formsSnapshot = await getDocs(formsQuery);
        const currentFormCount = formsSnapshot.size;
        
        if (currentFormCount >= (currentUser.maxForms || 3)) {
          alert(`You have reached the limit of ${currentUser.maxForms || 3} forms on the free plan. Please upgrade to Premium to create unlimited forms, or delete some existing forms.`);
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking form limits:', error);
        // Continue with form creation if we can't check limits
      }
    }
    
    try {
      console.log('createNewForm: Creating new form for user:', currentUser.id);
      
              // Check if template data is available
        const template = location.state?.template;
        const isFromTemplate = location.state?.isFromTemplate;
        const aiGeneratedForm = location.state?.aiGeneratedForm;
        const isFromAI = location.state?.isFromAI;
      
              // Create new form in Firestore immediately
        const newFormRef = doc(collection(db, 'forms'));
        const newForm: Form = {
          id: newFormRef.id,
          title: aiGeneratedForm ? aiGeneratedForm.title : template ? `${template.name} Form` : 'Untitled Form',
          description: aiGeneratedForm ? aiGeneratedForm.description : template ? template.description : '',
          media: {
            type: 'image',
            url: '',
            alt: 'Form Media',
            primaryDescription: aiGeneratedForm ? aiGeneratedForm.media.primaryDescription : template ? `Welcome to our ${template.name.toLowerCase()} form` : 'Welcome to our form',
            secondaryDescription: aiGeneratedForm ? aiGeneratedForm.media.secondaryDescription : template ? 'Please fill out the information below' : 'Please fill out the information below'
          },
          blocks: aiGeneratedForm ? aiGeneratedForm.blocks : template ? [
            {
              id: `block-${Date.now()}`,
              title: 'Page 1',
              description: template.description,
              questions: template.questions.map((q: any, index: number) => ({
                id: `question-${Date.now()}-${index}`,
                type: q.type,
                label: q.label,
                placeholder: q.placeholder || '',
                required: q.required !== undefined ? q.required : false,
                options: q.options || [],
                helpText: q.helpText || '',
                validation: q.validation || {},
                scaleMin: q.scaleMin || 1,
                scaleMax: q.scaleMax || 5,
                scaleLabels: q.scaleLabels || { min: '1', max: '5' },
                gridRows: q.gridRows || [],
                gridColumns: q.gridColumns || []
              }))
            }
          ] : [
          {
            id: `block-${Date.now()}`,
            title: 'Page 1',
            description: 'Start your form here',
            questions: []
          }
        ],
        settings: {
          primaryColor: '#3B82F6',
          backgroundColor: '#FFFFFF',
          fontFamily: 'Inter',
          borderRadius: 8,
          successMessage: 'Thank you for your submission!',
          showProgressBar: true,
          allowMultipleSubmissions: false,
        },
        status: 'draft',
        submissions: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: currentUser.id,
        shareUrl: ''
      };
      
      console.log('createNewForm: Form data to save:', newForm);
      
      // Save to Firestore immediately
      await setDoc(newFormRef, newForm);
      console.log('createNewForm: New form saved to Firestore with ID:', newFormRef.id);
      
      // Set form state and navigate
      setForm(newForm);
      console.log('createNewForm: Form state updated, navigating to:', `/builder/${newFormRef.id}`);
      navigate(`/builder/${newFormRef.id}`);
      
      // Set last saved time
      setLastSaved(new Date());
      
      // Trigger immediate save to ensure form is persisted
      console.log('createNewForm: Triggering immediate save...');
      setTimeout(() => {
        if (newForm) {
          console.log('createNewForm: Executing immediate save...');
          autoSave();
        }
      }, 1000);
      
    } catch (error) {
      console.error('createNewForm: Error creating new form:', error);
      console.error('createNewForm: Error details:', error);
      alert('Error creating new form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchForm = async () => {
    try {
      const formDoc = await getDoc(doc(db, 'forms', formId!));
      
      if (formDoc.exists()) {
        const data = formDoc.data();
        const formData: Form = {
          id: formDoc.id,
          title: data.title,
          description: data.description,
          media: data.media || {
            type: 'image',
            url: '',
            alt: 'Form Media',
            primaryDescription: 'Welcome to our form',
            secondaryDescription: 'Please fill out the information below'
          },
          blocks: data.blocks || [
            {
              id: `block-${Date.now()}`,
              title: 'Page 1',
              description: 'Start your form here',
              questions: []
            }
          ],
          settings: data.settings || {
            primaryColor: '#3B82F6',
            backgroundColor: '#FFFFFF',
            fontFamily: 'Inter',
            borderRadius: 8,
            successMessage: 'Thank you for your submission!',
            showProgressBar: true,
            allowMultipleSubmissions: false,
          },
          status: data.status || 'draft',
          userId: data.userId,
          submissions: data.submissions || 0,
          lastSubmission: data.lastSubmission?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          shareUrl: data.shareUrl
        };
        setForm(formData);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching form:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const saveForm = async () => {
    if (!form || !currentUser?.id) {
      console.error('Cannot save: form or currentUser is missing', { form: !!form, userId: currentUser?.id });
      alert('Cannot save form. Please ensure you are logged in.');
      return;
    }
    
    // Prevent multiple simultaneous saves
    if (saving) {
      console.log('Save already in progress, skipping...');
      return;
    }
    
    // Validate media before saving
    const mediaValidation = validateMedia(form.media);
    if (!mediaValidation.isValid) {
      alert(`Cannot save form: ${mediaValidation.error}\n\nPlease fix the media issue before saving.`);
      setShowMediaModal(true); // Open media modal to let user fix the issue
      return;
    }
    
    let cleanFormData: any = null;
    
    try {
      setSaving(true);
      console.log('Starting form save...', { formId: form.id, userId: currentUser.id });
      
      // Clean the form data to remove undefined values and ensure all required fields
      cleanFormData = {
        id: form.id || `form-${Date.now()}`,
        title: form.title || 'Untitled Form',
        description: form.description || '',
        media: {
          type: String(form.media?.type || 'image'),
          url: String(form.media?.url || ''),
          alt: String(form.media?.alt || 'Form Media'),
          primaryDescription: String(form.media?.primaryDescription || ''),
          secondaryDescription: String(form.media?.secondaryDescription || '')
        },
        blocks: (form.blocks || []).map(block => ({
          id: block.id || `block-${Date.now()}`,
          title: block.title || 'Untitled Page',
          description: block.description || '',
          questions: (block.questions || []).map(question => ({
            id: question.id || `question-${Date.now()}`,
            type: question.type || 'short_answer',
            label: question.label || 'Untitled Question',
            placeholder: question.placeholder || '',
            required: question.required !== undefined ? question.required : false,
            options: question.options || [],
            helpText: question.helpText || '',
            validation: question.validation || {},
            scaleMin: question.scaleMin || 1,
            scaleMax: question.scaleMax || 5,
            scaleLabels: question.scaleLabels || { min: '1', max: '5' },
            gridRows: question.gridRows || [],
            gridColumns: question.gridColumns || []
          }))
        })),
        settings: {
          primaryColor: form.settings?.primaryColor || '#3B82F6',
          backgroundColor: form.settings?.backgroundColor || '#FFFFFF',
          fontFamily: form.settings?.fontFamily || 'Inter',
          borderRadius: form.settings?.borderRadius || 8,
          successMessage: form.settings?.successMessage || 'Thank you for your submission!',
          showProgressBar: form.settings?.showProgressBar !== undefined ? form.settings.showProgressBar : true,
          allowMultipleSubmissions: form.settings?.allowMultipleSubmissions !== undefined ? form.settings.allowMultipleSubmissions : false,
        },
        status: form.status || 'draft',
        userId: currentUser.id,
        submissions: form.submissions || 0,
        createdAt: form.createdAt || new Date(),
        updatedAt: new Date(),
        shareUrl: form.shareUrl || ''
      };
      
      console.log('Clean form data prepared:', cleanFormData);
      
      if (form.id && form.id !== '') {
        // Update existing form
        console.log('Updating existing form...', form.id);
        await updateDoc(doc(db, 'forms', form.id), cleanFormData);
        console.log('Form updated successfully');
      } else {
        // Create new form
        console.log('Creating new form...');
        const newFormRef = doc(collection(db, 'forms'));
        const newFormData = {
          ...cleanFormData,
          id: newFormRef.id,
          createdAt: new Date(),
        };
        await setDoc(newFormRef, newFormData);
        console.log('Form created successfully with ID:', newFormRef.id);
        
        // Update the form state with the new ID
        setForm(prev => prev ? { ...prev, id: newFormRef.id } : null);
        
        // Navigate to the new form
        navigate(`/builder/${newFormRef.id}`);
      }
      
      setLastSaved(new Date());
      console.log('Form saved successfully at:', new Date().toISOString());
      
      // Show success message
      alert('Form saved successfully!');
      
    } catch (error) {
      console.error('Error saving form:', error);
      console.error('Form data that failed to save:', form);
      console.error('Media data that failed:', form?.media);
      console.error('Clean form data that failed:', cleanFormData);
      alert(`Error saving form: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setSaving(false);
    }
    
    // Safety timeout to ensure saving state is reset
    setTimeout(() => {
      if (saving) {
        console.log('Safety timeout: Resetting saving state');
        setSaving(false);
      }
    }, 5000); // Reduced to 5 second timeout for faster recovery
  };

  const unpublishForm = async () => {
    if (!form || !currentUser?.id) {
      console.error('Cannot unpublish: form or currentUser is missing', { form: !!form, userId: currentUser?.id });
      alert('Cannot unpublish form. Please ensure you are logged in.');
      return;
    }
    
    try {
      setSaving(true);
      console.log('Unpublishing form...', { formId: form.id, userId: currentUser.id });
      
      // Clean the form data to remove undefined values and ensure all required fields
      const cleanFormData = {
        id: form.id || `form-${Date.now()}`,
        title: form.title || 'Untitled Form',
        description: form.description || '',
        media: {
          type: String(form.media?.type || 'image'),
          url: String(form.media?.url || ''),
          alt: String(form.media?.alt || 'Form Media'),
          primaryDescription: String(form.media?.primaryDescription || ''),
          secondaryDescription: String(form.media?.secondaryDescription || '')
        },
        blocks: (form.blocks || []).map(block => ({
          id: block.id || `block-${Date.now()}`,
          title: block.title || 'Untitled Page',
          description: block.description || '',
          questions: (block.questions || []).map(question => ({
            id: question.id || `question-${Date.now()}`,
            type: question.type || 'short_answer',
            label: question.label || 'Untitled Question',
            placeholder: question.placeholder || '',
            required: question.required !== undefined ? question.required : false,
            options: question.options || [],
            helpText: question.helpText || '',
            validation: question.validation || {},
            scaleMin: question.scaleMin || 1,
            scaleMax: question.scaleMax || 5,
            scaleLabels: question.scaleLabels || { min: '1', max: '5' },
            gridRows: question.gridRows || [],
            gridColumns: question.gridColumns || []
          }))
        })),
        settings: {
          primaryColor: form.settings?.primaryColor || '#3B82F6',
          backgroundColor: form.settings?.backgroundColor || '#FFFFFF',
          fontFamily: form.settings?.fontFamily || 'Inter',
          borderRadius: form.settings?.borderRadius || 8,
          successMessage: form.settings?.successMessage || 'Thank you for your submission!',
          showProgressBar: form.settings?.showProgressBar !== undefined ? form.settings.showProgressBar : true,
          allowMultipleSubmissions: form.settings?.allowMultipleSubmissions !== undefined ? form.settings.allowMultipleSubmissions : false,
        },
        status: 'draft',
        userId: currentUser.id,
        submissions: form.submissions || 0,
        createdAt: form.createdAt || new Date(),
        updatedAt: new Date(),
        shareUrl: form.shareUrl || ''
      };
      
      console.log('Clean form data for unpublishing:', cleanFormData);
      
      if (form.id && form.id !== '') {
        console.log('Unpublishing existing form...', form.id);
        await updateDoc(doc(db, 'forms', form.id), cleanFormData);
        setForm(prev => prev ? { ...prev, status: 'draft' } : null);
        console.log('Form unpublished successfully');
        alert('Form unpublished! It is no longer accessible to the public.');
      }
    } catch (error) {
      console.error('Error unpublishing form:', error);
      console.error('Form data that failed to unpublish:', form);
      alert(`Error unpublishing form: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const publishForm = async () => {
    if (!form || !currentUser?.id) {
      console.error('Cannot publish: form or currentUser is missing', { form: !!form, userId: currentUser?.id });
      alert('Cannot publish form. Please ensure you are logged in.');
      return;
    }
    
    try {
      setSaving(true);
      console.log('Publishing form...', { formId: form.id, userId: currentUser.id });
      
      // Clean the form data to remove undefined values and ensure all required fields
      const cleanFormData = {
        id: form.id || `form-${Date.now()}`,
        title: form.title || 'Untitled Form',
        description: form.description || '',
        media: {
          type: String(form.media?.type || 'image'),
          url: String(form.media?.url || ''),
          alt: String(form.media?.alt || 'Form Media'),
          primaryDescription: String(form.media?.primaryDescription || ''),
          secondaryDescription: String(form.media?.secondaryDescription || '')
        },
        blocks: (form.blocks || []).map(block => ({
          id: block.id || `block-${Date.now()}`,
          title: block.title || 'Untitled Page',
          description: block.description || '',
          questions: (block.questions || []).map(question => ({
            id: question.id || `question-${Date.now()}`,
            type: question.type || 'short_answer',
            label: question.label || 'Untitled Question',
            placeholder: question.placeholder || '',
            required: question.required !== undefined ? question.required : false,
            options: question.options || [],
            helpText: question.helpText || '',
            validation: question.validation || {},
            scaleMin: question.scaleMin || 1,
            scaleMax: question.scaleMax || 5,
            scaleLabels: question.scaleLabels || { min: '1', max: '5' },
            gridRows: question.gridRows || [],
            gridColumns: question.gridColumns || []
          }))
        })),
        settings: {
          primaryColor: form.settings?.primaryColor || '#3B82F6',
          backgroundColor: form.settings?.backgroundColor || '#FFFFFF',
          fontFamily: form.settings?.fontFamily || 'Inter',
          borderRadius: form.settings?.borderRadius || 8,
          successMessage: form.settings?.successMessage || 'Thank you for your submission!',
          showProgressBar: form.settings?.showProgressBar !== undefined ? form.settings.showProgressBar : true,
          allowMultipleSubmissions: form.settings?.allowMultipleSubmissions !== undefined ? form.settings.allowMultipleSubmissions : false,
        },
        status: 'published',
        userId: currentUser.id,
        submissions: form.submissions || 0,
        createdAt: form.createdAt || new Date(),
        updatedAt: new Date(),
        shareUrl: generateShareUrl()
      };
      
      console.log('Clean form data for publishing:', cleanFormData);
      
      if (form.id && form.id !== '') {
        console.log('Publishing existing form...', form.id);
        await updateDoc(doc(db, 'forms', form.id), cleanFormData);
        setForm(prev => prev ? { ...prev, status: 'published', shareUrl: generateShareUrl() } : null);
        console.log('Form published successfully');
        alert('Form published! It is now accessible to the public.');
      } else {
        console.log('Creating and publishing new form...');
        const newFormRef = doc(collection(db, 'forms'));
        const newFormData = {
          ...cleanFormData,
          id: newFormRef.id,
          createdAt: new Date(),
        };
        await setDoc(newFormRef, newFormData);
        console.log('Form created and published successfully with ID:', newFormRef.id);
        
        // Update the form state with the new ID
        setForm(prev => prev ? { ...prev, id: newFormRef.id, status: 'published', shareUrl: generateShareUrl() } : null);
        
        // Navigate to the new form
        navigate(`/builder/${newFormRef.id}`);
        alert('Form created and published! It is now accessible to the public.');
      }
    } catch (error) {
      console.error('Error publishing form:', error);
      console.error('Form data that failed to publish:', form);
      alert(`Error publishing form: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const addBlock = () => {
    if (!form) return;
    
    const newBlock: FormBlock = {
      id: `block-${Date.now()}`,
      title: `Page ${form.blocks.length + 1}`,
      description: 'Add your description here',
      questions: []
    };
    
    setForm(prev => prev ? {
      ...prev,
      blocks: [...prev.blocks, newBlock]
    } : null);
  };

  const updateBlock = (blockId: string, updates: Partial<FormBlock>) => {
    if (!form) return;
    
    setForm(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    } : null);
  };

  const deleteBlock = (blockId: string) => {
    if (!form) return;
    
    setForm(prev => prev ? {
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId)
    } : null);
  };

  const addQuestion = (blockId: string, type: FormQuestion['type']) => {
    if (!form) return;
    
    const newQuestion: FormQuestion = {
      id: `question-${Date.now()}`,
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Question`,
      placeholder: `Enter ${type}`,
      required: false,
      helpText: '',
      options: type === 'multiple_choice' || type === 'checkboxes' || type === 'multiple_choice_grid' || type === 'checkbox_grid' ? ['Option 1', 'Option 2'] : undefined
    };
    
    setForm(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId 
          ? { ...block, questions: [...block.questions, newQuestion] }
          : block
      )
    } : null);
    
    setActiveQuestion(newQuestion.id);
    setShowQuestionModal(true);
    setEditingQuestion(newQuestion);
  };

  const updateQuestion = (blockId: string, questionId: string, updates: Partial<FormQuestion>) => {
    if (!form) return;
    
    setForm(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId 
          ? {
              ...block,
              questions: block.questions.map(question => 
                question.id === questionId ? { ...question, ...updates } : question
              )
            }
          : block
      )
    } : null);
  };

  const deleteQuestion = (blockId: string, questionId: string) => {
    if (!form) return;
    
    setForm(prev => prev ? {
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId 
          ? { ...block, questions: block.questions.filter(question => question.id !== questionId) }
          : block
      )
    } : null);
    
    if (activeQuestion === questionId) {
      setActiveQuestion(null);
    }
  };

  const validateMedia = (media: FormMedia): { isValid: boolean; error: string } => {
    // Clear any previous errors
    setMediaError('');
    
    if (!media.url || media.url.trim() === '') {
      return { isValid: true, error: '' }; // Empty media is allowed
    }
    
    if (media.type === 'image') {
      // Check if it's a data URL (uploaded file)
      if (media.url.startsWith('data:image/')) {
        // Extract base64 data to check size
        const base64Data = media.url.split(',')[1];
        if (base64Data) {
          const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
          const sizeInKB = sizeInBytes / 1024;
          
          if (sizeInKB > 500) { // 500KB limit
            return { 
              isValid: false, 
              error: `Image file is too large (${sizeInKB.toFixed(0)}KB). Maximum size is 500KB. Please choose a smaller image.` 
            };
          }
        }
      }
      
      // Check if it's a URL
      if (media.url.startsWith('http')) {
        // Basic URL validation
        try {
          new URL(media.url);
        } catch {
          return { isValid: false, error: 'Invalid image URL. Please enter a valid URL.' };
        }
      }
    }
    
    if (media.type === 'video') {
      if (media.url.startsWith('http')) {
        // Basic URL validation for video
        try {
          new URL(media.url);
        } catch {
          return { isValid: false, error: 'Invalid video URL. Please enter a valid URL.' };
        }
      }
    }
    
    return { isValid: true, error: '' };
  };

  const updateMedia = (media: FormMedia) => {
    if (!form) return;
    
    // Validate media before updating
    const validation = validateMedia(media);
    if (!validation.isValid) {
      setMediaError(validation.error);
      return; // Don't update if invalid
    }
    
    // Clear any previous errors
    setMediaError('');
    
    // If there's a save in progress, wait for it to complete
    if (saving) {
      console.log('Media update delayed: save in progress');
      setTimeout(() => updateMedia(media), 1000);
      return;
    }
    
    setForm(prev => prev ? {
      ...prev,
      media
    } : null);
  };

  const generateShareUrl = () => {
    if (!form) return '';
    return `${window.location.origin}/form/${form.id}`;
  };



  const shortenUrl = async (url: string) => {
    try {
      const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const shortened = await response.text();
        setShortenedUrl(shortened);
        return shortened;
      }
    } catch (error) {
      console.error('Error shortening URL:', error);
    }
    return url;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Error copying to clipboard. Please try again.');
    }
  };

  const getQuestionIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      short_answer: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      paragraph: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      multiple_choice: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      checkboxes: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M3 7l2 2 4-4" />
        </svg>
      ),
      dropdown: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
      file_upload: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      linear_scale: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      multiple_choice_grid: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      checkbox_grid: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      date: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      time: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    return icons[type] || (
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const nextBlock = () => {
    if (form && currentBlockIndex < form.blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
    }
  };

  const prevBlock = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const saveQuestion = () => {
    if (editingQuestion && currentBlock) {
      updateQuestion(currentBlock.id, editingQuestion.id, editingQuestion);
      setShowQuestionModal(false);
      setEditingQuestion(null);
    }
  };

  const saveBlock = () => {
    if (editingBlock) {
      updateBlock(editingBlock.id, editingBlock);
      setShowBlockModal(false);
      setEditingBlock(null);
    }
  };

  const generateShortenedUrl = async () => {
    const shareUrl = generateShareUrl();
    const shortened = await shortenUrl(shareUrl);
    setShortenedUrl(shortened);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form builder...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Form not found</p>
        </div>
      </div>
    );
  }

  const currentBlock = form.blocks[currentBlockIndex];

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
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Compact Form Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Form Title - Compact */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={form?.title || ''}
                onChange={(e) => setForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="text-lg sm:text-xl font-semibold bg-transparent text-gray-900 border-none outline-none placeholder-gray-400 w-full truncate"
                placeholder="Untitled Form"
              />
            </div>
            
            {/* Actions - Mobile Hamburger + Desktop Buttons */}
            <div className="flex items-center gap-2">
              {/* Last Saved - Hidden on mobile */}
              {lastSaved && (
                <div className="hidden lg:block text-xs text-gray-500 whitespace-nowrap">
                  Saved {lastSaved.toLocaleTimeString()}
                </div>
              )}
              
              {/* Desktop Actions */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Primary Action - Save */}
                <button
                  onClick={saveForm}
                  disabled={saving}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    saving
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Save</span>
                    </>
                  )}
                </button>

                {/* Secondary Actions */}
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{previewMode ? 'Edit' : 'Preview'}</span>
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Share</span>
                </button>

                {/* Integrations - Desktop */}
                <div className="relative" ref={integrationsDropdownRef}>
                  <button
                    onClick={() => setShowIntegrationsDropdown(!showIntegrationsDropdown)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>Integrations</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Desktop Integrations Dropdown */}
                  {showIntegrationsDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-900">Integrations</h3>
                          <p className="text-xs text-gray-500">Connect your form to external tools</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            setShowGoogleSheetsModal(true);
                            setShowIntegrationsDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900">Google Sheets</div>
                            <div className="text-sm text-gray-500">Sync leads to spreadsheets</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowCRMModal(true);
                            setShowIntegrationsDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900">CRM Tools</div>
                            <div className="text-sm text-gray-500">HubSpot, Zoho, Salesforce</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowZapierModal(true);
                            setShowIntegrationsDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <div>
                            <div className="font-medium text-gray-900">Zapier</div>
                            <div className="text-sm text-gray-500">Connect 5,000+ apps</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Hamburger Menu */}
              <div className="sm:hidden relative">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Mobile Actions Menu */}
                {showMobileMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="py-2">
                      {/* Save */}
                      <button
                        onClick={() => {
                          saveForm();
                          setShowMobileMenu(false);
                        }}
                        disabled={saving}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                          saving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">{saving ? 'Saving...' : 'Save'}</div>
                          <div className="text-sm text-gray-500">Save your form</div>
                        </div>
                      </button>

                      {/* Preview */}
                      <button
                        onClick={() => {
                          setPreviewMode(!previewMode);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">{previewMode ? 'Edit' : 'Preview'}</div>
                          <div className="text-sm text-gray-500">Toggle preview mode</div>
                        </div>
                      </button>

                      {/* Share */}
                      <button
                        onClick={() => {
                          setShowShareModal(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Share</div>
                          <div className="text-sm text-gray-500">Share your form</div>
                        </div>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-gray-100 my-2"></div>

                      {/* Integrations */}
                      <div className="px-4 py-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Integrations</div>
                      </div>

                      {/* Google Sheets */}
                      <button
                        onClick={() => {
                          setShowGoogleSheetsModal(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Google Sheets</div>
                          <div className="text-sm text-gray-500">Sync to spreadsheets</div>
                        </div>
                      </button>

                      {/* CRM */}
                      <button
                        onClick={() => {
                          setShowCRMModal(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">CRM</div>
                          <div className="text-sm text-gray-500">Manage leads</div>
                        </div>
                      </button>

                      {/* Zapier */}
                      <button
                        onClick={() => {
                          setShowZapierModal(true);
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Zapier</div>
                          <div className="text-sm text-gray-500">Automate workflows</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left side buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {previewMode ? 'Exit Preview' : 'Preview'}
              </button>
            </div>
            
            {/* Right side buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowMediaModal(true)}
                className={`min-h-[44px] px-4 py-2 text-white text-sm rounded-lg font-medium transition-colors ${
                  mediaError 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {mediaError ? 'Fix Media' : 'Media'}
              </button>
              
              <button
                onClick={() => setShowSettingsModal(true)}
                className="min-h-[44px] px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Settings
              </button>
              
              {mediaError && (
                <div className="flex items-center gap-2 text-red-400 text-xs bg-red-50 px-2 py-1 rounded">
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Issue</span>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split Screen */}
      {previewMode ? (
        /* Preview Mode - Show Form as it would appear to users */
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)]">
          {/* Left/Top Half - Media Section (Read-only) */}
          <div className="w-full lg:w-1/2 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
            <div className="p-6 flex-1 flex flex-col justify-center items-center">
              {form.media.url ? (
                <div className="text-center">
                  {form.media.type === 'image' ? (
                    <img 
                      src={form.media.url} 
                      alt={form.media.alt || 'Form Media'} 
                      className="w-full h-64 object-cover rounded-2xl mb-6"
                    />
                  ) : (
                    <video 
                      src={form.media.url} 
                      controls 
                      className="w-full h-64 object-cover rounded-2xl mb-6"
                    />
                  )}
                  
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {form.media.primaryDescription}
                  </h2>
                  
                  {form.media.secondaryDescription && (
                    <p className="text-lg text-[#A3A3A3]">
                      {form.media.secondaryDescription}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {form.media.primaryDescription}
                  </h2>
                  
                  {form.media.secondaryDescription && (
                    <p className="text-lg text-[#A3A3A3]">
                      {form.media.secondaryDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right/Bottom Half - Form Preview */}
          <div className="w-full lg:w-1/2 bg-[#111] flex flex-col">
            <div className="p-6 flex-1">
              <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-4">{form.title}</h1>
                {form.description && (
                  <p className="text-lg text-[#A3A3A3] mb-8">{form.description}</p>
                )}
                
                {form.blocks.length > 0 && currentBlock ? (
                  <div className="space-y-6">
                    {/* Block Navigation */}
                    {form.blocks.length > 1 && (
                      <div className="flex items-center justify-between mb-6 p-4 bg-[#1a1a1a] rounded-2xl border border-[#333]">
                        <button
                          onClick={prevBlock}
                          disabled={currentBlockIndex === 0}
                          className="px-4 py-2 text-[#A3A3A3] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          ← Previous
                        </button>
                        
                        <span className="text-sm font-medium text-[#A3A3A3]">
                          {currentBlockIndex + 1} of {form.blocks.length}
                        </span>
                        
                        <button
                          onClick={nextBlock}
                          disabled={currentBlockIndex === form.blocks.length - 1}
                          className="px-4 py-2 text-[#A3A3A3] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                    
                    {/* Current Block Preview */}
                    <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] p-6">
                      <h3 className="text-xl font-semibold text-white mb-4">{currentBlock.title}</h3>
                      {currentBlock.description && (
                        <p className="text-[#A3A3A3] mb-6">{currentBlock.description}</p>
                      )}
                      
                      <div className="space-y-6">
                        {currentBlock.questions.map((question) => (
                          <div key={question.id} className="space-y-2">
                            <label className="block text-sm font-medium text-white">
                              {question.label}
                              {question.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {question.helpText && (
                              <p className="text-sm text-[#A3A3A3]">{question.helpText}</p>
                            )}
                            
                            {/* Render question preview based on type */}
                            {question.type === 'short_answer' && (
                              <input
                                type="text"
                                placeholder={question.placeholder || 'Enter your answer'}
                                className="w-full px-4 py-3 border-2 border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all bg-[#222] text-white placeholder-[#A3A3A3]"
                                disabled
                              />
                            )}
                            
                            {question.type === 'paragraph' && (
                              <textarea
                                placeholder={question.placeholder || 'Enter your answer'}
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all resize-none bg-[#222] text-white placeholder-[#A3A3A3]"
                                disabled
                              />
                            )}
                            
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="space-y-2">
                                {question.options.map((option, index) => (
                                  <label key={index} className="flex items-center p-3 border-2 border-[#333] rounded-lg hover:border-[#8B5CF6] cursor-pointer bg-[#222]">
                                    <input
                                      type="radio"
                                      name={question.id}
                                      className="mr-3 w-4 h-4 text-[#8B5CF6] focus:ring-[#8B5CF6] border-[#333]"
                                      disabled
                                    />
                                    <span className="text-white">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'checkboxes' && question.options && (
                              <div className="space-y-2">
                                {question.options.map((option, index) => (
                                  <label key={index} className="flex items-center p-3 border-2 border-[#333] rounded-lg hover:border-[#8B5CF6] cursor-pointer bg-[#222]">
                                    <input
                                      type="checkbox"
                                      className="mr-3 w-4 h-4 text-[#8B5CF6] focus:ring-[#8B5CF6] border-[#333]"
                                      disabled
                                    />
                                    <span className="text-white">{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            
                            {question.type === 'dropdown' && question.options && (
                              <select className="w-full px-4 py-3 border-2 border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all bg-[#222] text-white" disabled>
                                <option value="">Select an option</option>
                                {question.options.map((option, index) => (
                                  <option key={index} value={option}>{option}</option>
                                ))}
                              </select>
                            )}
                            
                            {question.type === 'date' && (
                              <input
                                type="date"
                                className="w-full px-4 py-3 border-2 border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all bg-[#222] text-white"
                                disabled
                              />
                            )}
                            
                            {question.type === 'time' && (
                              <input
                                type="time"
                                className="w-full px-4 py-3 border-2 border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all bg-[#222] text-white"
                                disabled
                              />
                            )}
                            
                            {question.type === 'linear_scale' && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm text-[#A3A3A3]">
                                  <span>{question.scaleLabels?.min || '1'}</span>
                                  <span>{question.scaleLabels?.max || '5'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  {Array.from({ length: (question.scaleMax || 5) - (question.scaleMin || 1) + 1 }, (_, i) => {
                                    const scaleValue = (question.scaleMin || 1) + i;
                                    return (
                                      <label key={scaleValue} className="flex flex-col items-center">
                                        <input
                                          type="radio"
                                          name={question.id}
                                          value={scaleValue}
                                          className="mr-1 w-4 h-4 text-[#8B5CF6] focus:ring-[#8B5CF6] border-[#333]"
                                          disabled
                                        />
                                        <span className="text-xs text-[#A3A3A3]">{scaleValue}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-[#A3A3A3]">No questions in this form.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Builder Mode - Show Form Builder Interface */
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)]">
          {/* Left/Top Half - Static Media Section */}
          <div className="w-full lg:w-1/2 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
            <div className="p-6 flex-1">
              <h3 className="text-lg font-semibold text-white mb-4">Media Section</h3>
              
              {form.media.url ? (
                <div className="space-y-4">
                  {form.media.type === 'image' ? (
                    <img 
                      src={form.media.url} 
                      alt={form.media.alt || 'Form Media'} 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <video 
                      src={form.media.url} 
                      controls 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Primary Description</label>
                      <input
                        type="text"
                        value={form.media.primaryDescription}
                        onChange={(e) => updateMedia({ ...form.media, primaryDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent text-sm bg-[#222] text-white placeholder-[#A3A3A3]"
                        placeholder="Primary description"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-1">Secondary Description</label>
                      <textarea
                        value={form.media.secondaryDescription}
                        onChange={(e) => updateMedia({ ...form.media, secondaryDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent text-sm bg-[#222] text-white placeholder-[#A3A3A3]"
                        rows={3}
                        placeholder="Secondary description"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-[#A3A3A3] mb-4">No media added yet</p>
                  <button
                    onClick={() => setShowMediaModal(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      mediaError 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                    }`}
                  >
                    {mediaError ? 'Fix Media Issue' : 'Add Media'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Between Media and Form */}
          <div className="w-full bg-[#1a1a1a] border-b border-[#333] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={addBlock}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Page
                </button>
                
                {currentBlock && (
                  <button
                    onClick={() => {
                      setSelectedBlockId(currentBlock.id);
                      setShowQuestionTypeModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Question
                  </button>
                )}
              </div>
              
              <div className="text-sm text-gray-400">
                {currentBlock ? `${currentBlock.questions.length} questions` : 'No questions'}
              </div>
            </div>
          </div>

          {/* Right/Bottom Half - Form Builder */}
          <div className="w-full lg:w-1/2 bg-[#111] flex flex-col">
            <div className="p-6 flex-1">
              {/* Block Navigation */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {currentBlock?.title || 'No Blocks'}
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={prevBlock}
                    disabled={currentBlockIndex === 0}
                    className="px-2 py-1 text-sm text-[#A3A3A3] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Previous
                  </button>
                  
                  <span className="text-sm text-[#A3A3A3]">
                    {currentBlockIndex + 1} of {form.blocks.length}
                  </span>
                  
                  <button
                    onClick={nextBlock}
                    disabled={currentBlockIndex === form.blocks.length - 1}
                    className="px-2 py-1 text-sm text-[#A3A3A3] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
              
              {currentBlock ? (
                <div className="space-y-4">
                  {/* Block Info */}
                  <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-white">{currentBlock.title}</h4>
                        <p className="text-sm text-[#A3A3A3]">{currentBlock.description}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingBlock(currentBlock);
                            setShowBlockModal(true);
                          }}
                          className="px-2 py-1 bg-[#8B5CF6] text-white text-xs rounded hover:bg-[#7C3AED] transition-colors"
                        >
                          Edit
                        </button>
                        
                        <button
                          onClick={() => deleteBlock(currentBlock.id)}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Questions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-white">Questions</h5>
                    </div>
                    
                    {currentBlock.questions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                        </div>
                        <p className="text-[#A3A3A3]">No questions added to this page yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentBlock.questions.map((question, questionIndex) => (
                          <motion.div
                            key={question.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-[#1a1a1a] rounded-lg p-3 border-2 transition-all ${
                              activeQuestion === question.id 
                                ? 'border-[#8B5CF6] bg-[#1a1a1a]' 
                                : 'border-[#333] hover:border-[#444]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xl">{getQuestionIcon(question.type)}</span>
                                <div>
                                  <h6 className="font-medium text-white text-sm">{question.label}</h6>
                                  <p className="text-xs text-[#A3A3A3]">{question.type}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingQuestion(question);
                                    setShowQuestionModal(true);
                                  }}
                                  className="px-2 py-1 bg-[#8B5CF6] text-white text-xs rounded hover:bg-[#7C3AED] transition-colors"
                                >
                                  Edit
                                </button>
                                
                                <button
                                  onClick={() => deleteQuestion(currentBlock.id, question.id)}
                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            
                            <span className="text-xs text-[#A3A3A3]">
                              {question.required ? 'Required' : 'Optional'}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-[#A3A3A3]">No blocks added yet. Start building your form by adding pages above.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Edit Modal */}
      {showQuestionModal && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#333]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Question</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Label</label>
                  <input
                    type="text"
                    value={editingQuestion.label}
                    onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, label: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Placeholder</label>
                  <input
                    type="text"
                    value={editingQuestion.placeholder}
                    onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, placeholder: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Help Text</label>
                  <textarea
                    value={editingQuestion.helpText}
                    onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, helpText: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                    rows={2}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required"
                    checked={editingQuestion.required}
                    onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, required: e.target.checked } : null)}
                    className="mr-2 w-4 h-4 text-[#8B5CF6] focus:ring-[#8B5CF6] border-[#333]"
                  />
                  <label htmlFor="required" className="text-sm text-white">Required</label>
                </div>
                
                {(editingQuestion.type === 'multiple_choice' || editingQuestion.type === 'checkboxes' || editingQuestion.type === 'dropdown') && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Options</label>
                    <div className="space-y-2">
                      {editingQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(editingQuestion.options || [])];
                              newOptions[index] = e.target.value;
                              setEditingQuestion(prev => prev ? { ...prev, options: newOptions } : null);
                            }}
                            className="flex-1 px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                          />
                          <button
                            onClick={() => {
                              const newOptions = editingQuestion.options?.filter((_, i) => i !== index);
                              setEditingQuestion(prev => prev ? { ...prev, options: newOptions } : null);
                            }}
                            className="px-2 py-2 text-red-600 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newOptions = [...(editingQuestion.options || []), `Option ${(editingQuestion.options?.length || 0) + 1}`];
                          setEditingQuestion(prev => prev ? { ...prev, options: newOptions } : null);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}

                {editingQuestion.type === 'linear_scale' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Min Value</label>
                        <input
                          type="number"
                          value={editingQuestion.scaleMin || 1}
                          onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, scaleMin: parseInt(e.target.value) || 1 } : null)}
                          className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white"
                          min="1"
                          max="10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Max Value</label>
                        <input
                          type="number"
                          value={editingQuestion.scaleMax || 5}
                          onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, scaleMax: parseInt(e.target.value) || 5 } : null)}
                          className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white"
                          min="2"
                          max="10"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Min Label</label>
                        <input
                          type="text"
                          value={editingQuestion.scaleLabels?.min || '1'}
                          onChange={(e) => setEditingQuestion(prev => prev ? { 
                            ...prev, 
                            scaleLabels: { 
                              min: e.target.value,
                              max: prev.scaleLabels?.max || '5'
                            } 
                          } : null)}
                          className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Max Label</label>
                        <input
                          type="text"
                          value={editingQuestion.scaleLabels?.max || '5'}
                          onChange={(e) => setEditingQuestion(prev => prev ? { 
                            ...prev, 
                            scaleLabels: { 
                              min: prev.scaleLabels?.min || '1',
                              max: e.target.value 
                            } 
                          } : null)}
                          className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editingQuestion.type === 'file_upload' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">File Types</label>
                    <div className="space-y-2">
                      {['image/*', 'application/pdf', 'text/*', 'video/*'].map((fileType) => (
                        <label key={fileType} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingQuestion.validation?.allowedTypes?.includes(fileType) || false}
                            onChange={(e) => {
                              const currentTypes = editingQuestion.validation?.allowedTypes || [];
                              const newTypes = e.target.checked 
                                ? [...currentTypes, fileType]
                                : currentTypes.filter(type => type !== fileType);
                              setEditingQuestion(prev => prev ? { 
                                ...prev, 
                                validation: { 
                                  ...prev.validation, 
                                  allowedTypes: newTypes 
                                } 
                              } : null);
                            }}
                            className="mr-2 w-4 h-4 text-[#8B5CF6] focus:ring-[#8B5CF6] border-[#333]"
                          />
                          <span className="text-sm text-white">{fileType}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-white mb-2">Max File Size (MB)</label>
                      <input
                        type="number"
                        value={editingQuestion.validation?.maxFileSize || 10}
                        onChange={(e) => setEditingQuestion(prev => prev ? { 
                          ...prev, 
                          validation: { 
                            ...prev.validation, 
                            maxFileSize: parseInt(e.target.value) || 10 
                          } 
                        } : null)}
                        className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowQuestionModal(false);
                    setEditingQuestion(null);
                  }}
                  className="px-4 py-2 text-[#A3A3A3] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={saveQuestion}
                  className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Edit Modal */}
      {showBlockModal && editingBlock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#333]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Block</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Title</label>
                  <input
                    type="text"
                    value={editingBlock.title}
                    onChange={(e) => setEditingBlock(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Description</label>
                  <textarea
                    value={editingBlock.description}
                    onChange={(e) => setEditingBlock(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={saveBlock}
                    className="flex-1 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowBlockModal(false)}
                    className="flex-1 px-4 py-2 bg-[#333] text-white rounded-lg font-medium hover:bg-[#444] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#333]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Add Media</h3>
              
              {/* Media Error Display */}
              {mediaError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-red-400 text-sm font-medium">{mediaError}</span>
                  </div>
                  <p className="text-red-300 text-xs mt-1">Please fix this issue before saving your form.</p>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Media Type</label>
                  <select
                    value={form.media.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'image' | 'video';
                      // Clear URL when switching types to prevent conflicts
                      const newMedia = { 
                        ...form.media, 
                        type: newType,
                        url: '', // Clear URL when switching types
                        alt: '' // Clear alt text when switching types
                      };
                      updateMedia(newMedia);
                    }}
                    className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {form.media.type === 'image' ? 'Image URL or Upload' : 'Video URL'}
                  </label>
                  <input
                    type="url"
                    value={form.media.url}
                    onChange={(e) => updateMedia({ ...form.media, url: e.target.value })}
                    className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                    placeholder={form.media.type === 'image' ? "Enter image URL or upload a file" : "Enter video URL"}
                  />
                  
                  {form.media.type === 'video' && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 mb-2">
                        Supported formats: YouTube, Vimeo, direct video links
                      </p>
                      <p className="text-xs text-blue-400">
                        💡 For YouTube: Use any YouTube URL (e.g., https://youtube.com/watch?v=VIDEO_ID)
                      </p>
                    </div>
                  )}
                  
                  {form.media.type === 'image' && (
                    <div className="mt-2 space-y-2">
                      <label className="block text-sm font-medium text-white mb-2">Or Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              // Check file size before processing
                              const sizeInKB = file.size / 1024;
                              if (sizeInKB > 500) {
                                setMediaError(`Image file is too large (${sizeInKB.toFixed(0)}KB). Maximum size is 500KB. Please choose a smaller image.`);
                                return;
                              }
                              
                              // Check file type
                              if (!file.type.startsWith('image/')) {
                                setMediaError('Please select a valid image file.');
                                return;
                              }
                              
                              // Clear any previous errors
                              setMediaError('');
                              
                              // Convert to data URL
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                updateMedia({ ...form.media, url: dataUrl });
                              };
                              reader.onerror = () => {
                                setMediaError('Error reading image file. Please try again.');
                              };
                              reader.readAsDataURL(file);
                            } catch (error) {
                              console.error('Error uploading image:', error);
                              setMediaError('Error uploading image. Please try again.');
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#8B5CF6] file:text-white hover:file:bg-[#7C3AED]"
                      />
                      <p className="text-xs text-gray-400">Maximum file size: 500KB. Supported formats: JPG, PNG, GIF, WebP</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Alt Text</label>
                  <input
                    type="text"
                    value={form.media.alt}
                    onChange={(e) => updateMedia({ ...form.media, alt: e.target.value })}
                    className="w-full px-3 py-2 border border-[#333] rounded-lg focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent bg-[#222] text-white placeholder-[#A3A3A3]"
                    placeholder="Alt text for accessibility"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      if (mediaError) {
                        alert('Please fix the media error before saving.');
                        return;
                      }
                      setShowMediaModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!!mediaError}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      updateMedia({ ...form.media, url: '', alt: '' });
                      setMediaError('');
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    Clear Media
                  </button>
                  <button
                    onClick={() => setShowMediaModal(false)}
                    className="flex-1 px-4 py-2 bg-[#333] text-white rounded-lg font-medium hover:bg-[#444] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#333]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Form Settings</h3>
              
              <div className="space-y-6">
                {/* Color Customization - Premium Only */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-white">Color Customization</h4>
                    {currentUser?.subscription === 'free' && (
                      <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">Premium Feature</span>
                    )}
                  </div>
                  
                  {currentUser?.subscription === 'premium' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Primary Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={form.settings.primaryColor}
                            onChange={(e) => {
                              const newSettings = { ...form.settings, primaryColor: e.target.value };
                              setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                            }}
                            className="w-12 h-10 border border-[#333] rounded-lg cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={form.settings.primaryColor}
                            onChange={(e) => {
                              const newSettings = { ...form.settings, primaryColor: e.target.value };
                              setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                            }}
                            className="flex-1 px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white text-sm font-mono"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Background Color</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={form.settings.backgroundColor}
                            onChange={(e) => {
                              const newSettings = { ...form.settings, backgroundColor: e.target.value };
                              setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                            }}
                            className="w-12 h-10 border border-[#333] rounded-lg cursor-pointer bg-transparent"
                          />
                          <input
                            type="text"
                            value={form.settings.backgroundColor}
                            onChange={(e) => {
                              const newSettings = { ...form.settings, backgroundColor: e.target.value };
                              setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                            }}
                            className="flex-1 px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white text-sm font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#222] p-4 rounded-lg border border-[#333]">
                      <div className="flex items-center space-x-3 mb-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-yellow-400 text-sm font-medium">Premium Feature</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Customize your form colors to match your brand. Upgrade to Premium to unlock this feature.
                      </p>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          // You can add navigation to upgrade page here
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </div>

                {/* Font Customization - Premium Only */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-white">Font Customization</h4>
                    {currentUser?.subscription === 'free' && (
                      <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">Premium Feature</span>
                    )}
                  </div>
                  
                  {currentUser?.subscription === 'premium' ? (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Font Family</label>
                      <select
                        value={form.settings.fontFamily}
                        onChange={(e) => {
                          const newSettings = { ...form.settings, fontFamily: e.target.value };
                          setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                        }}
                        className="w-full px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Source Sans Pro">Source Sans Pro</option>
                        <option value="Ubuntu">Ubuntu</option>
                      </select>
                    </div>
                  ) : (
                    <div className="bg-[#222] p-4 rounded-lg border border-[#333]">
                      <div className="flex items-center space-x-3 mb-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-yellow-400 text-sm font-medium">Premium Feature</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Choose from premium fonts to make your form stand out. Upgrade to Premium to unlock this feature.
                      </p>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          // You can add navigation to upgrade page here
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </div>

                {/* Border Radius - Premium Only */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-white">Border Radius</h4>
                    {currentUser?.subscription === 'free' && (
                      <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">Premium Feature</span>
                    )}
                  </div>
                  
                  {currentUser?.subscription === 'premium' ? (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Border Radius (px)</label>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={form.settings.borderRadius}
                        onChange={(e) => {
                          const newSettings = { ...form.settings, borderRadius: parseInt(e.target.value) || 8 };
                          setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                        }}
                        className="w-full px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#222] p-4 rounded-lg border border-[#333]">
                      <div className="flex items-center space-x-3 mb-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-yellow-400 text-sm font-medium">Premium Feature</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Customize the border radius of your form elements. Upgrade to Premium to unlock this feature.
                      </p>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          // You can add navigation to upgrade page here
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </div>

                {/* Success Message - Premium Only */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-white">Success Message</h4>
                    {currentUser?.subscription === 'free' && (
                      <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">Premium Feature</span>
                    )}
                  </div>
                  
                  {currentUser?.subscription === 'premium' ? (
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Custom Success Message</label>
                      <textarea
                        value={form.settings.successMessage}
                        onChange={(e) => {
                          const newSettings = { ...form.settings, successMessage: e.target.value };
                          setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white"
                        placeholder="Thank you for your submission!"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#222] p-4 rounded-lg border border-[#333]">
                      <div className="flex items-center space-x-3 mb-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-yellow-400 text-sm font-medium">Premium Feature</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Customize the success message shown after form submission. Upgrade to Premium to unlock this feature.
                      </p>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          // You can add navigation to upgrade page here
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </div>

                {/* Form Behavior - Premium Only */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-white">Form Behavior</h4>
                    {currentUser?.subscription === 'free' && (
                      <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">Premium Feature</span>
                    )}
                  </div>
                  
                  {currentUser?.subscription === 'premium' ? (
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={form.settings.showProgressBar}
                          onChange={(e) => {
                            const newSettings = { ...form.settings, showProgressBar: e.target.checked };
                            setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                          }}
                          className="w-4 h-4 text-blue-600 bg-[#222] border-[#333] rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-white text-sm">Show Progress Bar</span>
                      </label>
                      
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={form.settings.allowMultipleSubmissions}
                          onChange={(e) => {
                            const newSettings = { ...form.settings, allowMultipleSubmissions: e.target.checked };
                            setForm(prev => prev ? { ...prev, settings: newSettings } : null);
                          }}
                          className="w-4 h-4 text-blue-600 bg-[#222] border-[#333] rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-white text-sm">Allow Multiple Submissions</span>
                      </label>
                    </div>
                  ) : (
                    <div className="bg-[#222] p-4 rounded-lg border border-[#333]">
                      <div className="flex items-center space-x-3 mb-3">
                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-yellow-400 text-sm font-medium">Premium Feature</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        Advanced form behavior settings for better user experience. Upgrade to Premium to unlock this feature.
                      </p>
                      <button
                        onClick={() => {
                          setShowSettingsModal(false);
                          // You can add navigation to upgrade page here
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Upgrade to Premium
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2 bg-[#333] text-white rounded-lg font-medium hover:bg-[#444] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Type Modal */}
      {showQuestionTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#333]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Select Question Type</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { type: 'short_answer' as const, label: 'Short Answer', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  ) },
                  { type: 'paragraph' as const, label: 'Paragraph', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) },
                  { type: 'multiple_choice' as const, label: 'Multiple Choice', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) },
                  { type: 'checkboxes' as const, label: 'Checkboxes', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M3 7l2 2 4-4" />
                    </svg>
                  ) },
                  { type: 'dropdown' as const, label: 'Dropdown', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) },
                  { type: 'date' as const, label: 'Date', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) },
                  { type: 'time' as const, label: 'Time', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) },
                  { type: 'linear_scale' as const, label: 'Linear Scale', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ) },
                  { type: 'file_upload' as const, label: 'File Upload', icon: (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  ) }
                ].map((questionType) => (
                  <button
                    key={questionType.type}
                    onClick={() => {
                      addQuestion(selectedBlockId, questionType.type);
                      setShowQuestionTypeModal(false);
                    }}
                    className="p-4 border border-[#333] rounded-lg hover:border-[#8B5CF6] hover:bg-[#222] transition-all text-left"
                  >
                    <div className="mb-2">{questionType.icon}</div>
                    <h4 className="font-medium text-white">{questionType.label}</h4>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowQuestionTypeModal(false)}
                className="mt-6 px-4 py-2 bg-[#333] text-white rounded-lg font-medium hover:bg-[#444] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-xl max-w-2xl w-full border border-[#333]">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Share & Embed Form</h3>
              
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-[#222] p-1 rounded-lg">
                <button
                  onClick={() => setActiveShareTab('link')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeShareTab === 'link' 
                      ? 'bg-[#8B5CF6] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Share Link
                </button>
                <button
                  onClick={() => setActiveShareTab('embed')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeShareTab === 'embed' 
                      ? 'bg-[#8B5CF6] text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Embed Code
                </button>
              </div>
              
              {/* Tab Content */}
              {activeShareTab === 'link' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Shareable Link</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={form.shareUrl || `${window.location.origin}/form/${form.id}`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(form.shareUrl || `${window.location.origin}/form/${form.id}`)}
                        className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Shortened Link</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={shortenedUrl || 'Generate shortened link'}
                        readOnly
                        className="flex-1 px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white text-sm"
                      />
                      <button
                        onClick={generateShortenedUrl}
                        className="px-4 py-2 bg-[#EC4899] text-white rounded-lg font-medium hover:bg-[#DB2777] transition-colors"
                      >
                        Shorten
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Basic Embed */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Basic Embed (Responsive)</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={`<iframe src="${window.location.origin}/form/${form.id}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></iframe>`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white text-xs font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(`<iframe src="${window.location.origin}/form/${form.id}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></iframe>`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {/* Custom Size Embed */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Custom Size Embed</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={`<iframe src="${window.location.origin}/form/${form.id}" width="800" height="500" frameborder="0" style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></iframe>`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white text-xs font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(`<iframe src="${window.location.origin}/form/${form.id}" width="800" height="500" frameborder="0" style="border: none; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></iframe>`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {/* Minimal Embed */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Minimal Embed (No Styling)</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={`<iframe src="${window.location.origin}/form/${form.id}" width="100%" height="600" frameborder="0"></iframe>`}
                        readOnly
                        className="flex-1 px-3 py-2 border border-[#333] rounded-lg bg-[#222] text-white text-xs font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(`<iframe src="${window.location.origin}/form/${form.id}" width="100%" height="600" frameborder="0"></iframe>`)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  {/* Embed Instructions */}
                  <div className="bg-[#222] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">How to Use:</h4>
                    <div className="text-xs text-gray-400 space-y-1">
                      <p>• <strong>Copy</strong> any of the embed codes above</p>
                      <p>• <strong>Paste</strong> the code into your website's HTML</p>
                      <p>• <strong>Customize</strong> width, height, and styling as needed</p>
                      <p>• <strong>Responsive:</strong> Use width="100%" for mobile-friendly embedding</p>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full px-4 py-2 bg-[#333] text-white rounded-lg font-medium hover:bg-[#444] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Integration Modal */}
      {form && (
        <GoogleSheetsIntegration
          formId={form.id}
          formTitle={form.title}
          isOpen={showGoogleSheetsModal}
          onClose={() => setShowGoogleSheetsModal(false)}
        />
      )}

      {/* CRM Integration Modal */}
      {form && (
        <CRMIntegration
          formId={form.id}
          formTitle={form.title}
          isOpen={showCRMModal}
          onClose={() => setShowCRMModal(false)}
        />
      )}

      {/* Zapier Integration Modal */}
      {form && (
        <ZapierIntegration
          formId={form.id}
          formTitle={form.title}
          isOpen={showZapierModal}
          onClose={() => setShowZapierModal(false)}
        />
      )}
    </div>
  );
};

export default FormBuilder;
