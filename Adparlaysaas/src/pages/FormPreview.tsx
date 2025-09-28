import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';

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

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  formData: Record<string, any>;
  submittedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

const FormPreview: React.FC = () => {
  const { formId } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  // Function to convert YouTube URLs to embed URLs
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';
    
    // Handle different YouTube URL formats
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      // Already an embed URL
      return url;
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1`;
    }
    
    // Return original URL if not a YouTube URL
    return url;
  };

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId]);

  // Update document head for social sharing
  useEffect(() => {
    if (form) {
      // Update document title
      document.title = form.title;
      
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
      updateMetaTag('og:title', form.title);
      updateMetaTag('og:description', form.description || 'Adparlay - Build forms that tell your story, guide your buyer journey, and close the gap between interest and purchase.');
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:url', window.location.href);
      updateMetaTag('og:site_name', 'Adparlay');
      
      // Use form media or default preview image
      const previewImage = form.media?.url || `${window.location.origin}/default-preview.svg`;
      updateMetaTag('og:image', previewImage);
      
      // Twitter tags
      updateMetaName('twitter:card', 'summary_large_image');
      updateMetaName('twitter:title', form.title);
      updateMetaName('twitter:description', form.description || 'Adparlay - Build forms that tell your story, guide your buyer journey, and close the gap between interest and purchase.');
      updateMetaName('twitter:image', previewImage);
      
      // General description
      updateMetaName('description', form.description || 'Adparlay - Build forms that tell your story, guide your buyer journey, and close the gap between interest and purchase.');
    }
  }, [form]);

  const fetchForm = async () => {
    try {
      const formDoc = await getDoc(doc(db, 'forms', formId!));
      
      if (formDoc.exists()) {
        const data = formDoc.data();
        
        // Debug: Log form data from Firestore
        console.log('Form data from Firestore:', {
          formId: formDoc.id,
          status: data.status,
          hasStatus: 'status' in data,
          allFields: Object.keys(data)
        });
        
        // Check if form is published
        if (data.status !== 'published') {
          console.log('Form not published, blocking access. Status:', data.status);
          setForm(null);
          return;
        }
        
        const formData: Form = {
          id: formDoc.id,
          title: data.title,
          description: data.description,
          media: data.media || {
            type: 'image',
            url: '',
            alt: 'Form Media',
            primaryDescription: '',
            secondaryDescription: ''
          },
          blocks: data.blocks || [],
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
        setForm(null);
      }
    } catch (error) {
      console.error('FormPreview: Error fetching form:', error);
      setForm(null);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!form) return newErrors;
    
    form.blocks.forEach((block) => {
      block.questions.forEach((question) => {
        if (question.required) {
          const value = formData[question.id];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            newErrors[question.id] = 'This field is required';
          }
        }
      });
    });
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    if (!form) return;
    
    // Debug: Log form status
    console.log('Form status check:', {
      formId: form.id,
      status: form.status,
      isPublished: form.status === 'published'
    });
    
    // Check if form is published
    if (form.status !== 'published') {
      alert(`This form is not published yet. Current status: ${form.status || 'undefined'}. Please contact the form creator to publish it.`);
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Clean form data to remove File objects and other non-serializable data
      const cleanFormData: any = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value instanceof File) {
          cleanFormData[key] = {
            fileName: value.name,
            fileSize: value.size,
            fileType: value.type,
            isFile: true
          };
        } else if (Array.isArray(value)) {
          cleanFormData[key] = value.map(item => 
            item instanceof File ? {
              fileName: item.name,
              fileSize: item.size,
              fileType: item.type,
              isFile: true
            } : item
          );
        } else {
          cleanFormData[key] = value;
        }
      });

      // Create submission
      const submission: FormSubmission = {
        id: `submission-${Date.now()}`,
        formId: form.id,
        formTitle: form.title,
        formData: cleanFormData,
        submittedAt: new Date(),
        userAgent: navigator.userAgent,
        ipAddress: 'Unknown' // In production, you'd get this from your server
      };
      
      // Save submission to Firestore
      const docRef = await addDoc(collection(db, 'formSubmissions'), submission);
      
      // Update form submission count
      await updateDoc(doc(db, 'forms', form.id), {
        submissions: (form.submissions || 0) + 1,
        lastSubmission: new Date()
      });

      // Send email notification to form owner
      try {
        const { emailService } = await import('../services/emailService');
        
        // Get form owner's email from the form data
        if (form.userId) {
          const userDoc = await getDoc(doc(db, 'users', form.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userEmail = userData.email;
            
            if (userEmail) {
              await emailService.sendLeadNotification(userEmail, submission, form);
              console.log('Email notification sent to form owner');
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the form submission if email fails
      }
      
      setSubmitted(true);
      
      // Generate HD PNG summary and auto-save to gallery
      if (formRef.current) {
        try {
          console.log('Generating HD PNG summary...');
          
          // Create a summary element for PNG generation
          const summaryElement = document.createElement('div');
          summaryElement.style.position = 'absolute';
          summaryElement.style.left = '-9999px';
          summaryElement.style.top = '0';
          summaryElement.style.width = '800px';
          summaryElement.style.backgroundColor = form.settings.backgroundColor || '#FFFFFF';
          summaryElement.style.padding = '40px';
          summaryElement.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
          summaryElement.style.color = '#1f2937';
          summaryElement.style.lineHeight = '1.6';
          
          // Add form title and description
          summaryElement.innerHTML = `
            <div style="margin-bottom: 30px; text-align: center;">
              <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 10px; color: #111827;">${form.title}</h1>
              ${form.description ? `<p style="font-size: 18px; color: #6b7280; margin: 0;">${form.description}</p>` : ''}
            </div>
            <div style="border-top: 2px solid #e5e7eb; padding-top: 30px;">
              <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #111827;">Form Responses</h2>
          `;
          
          // Add questions and answers
          form.blocks.forEach((block, blockIndex) => {
            summaryElement.innerHTML += `
              <div style="margin-bottom: 30px;">
                <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 15px; color: #374151;">${block.title}</h3>
            `;
            
            block.questions.forEach((question) => {
              const answer = formData[question.id];
              let answerText = '';
              
              if (answer) {
                if (Array.isArray(answer)) {
                  answerText = answer.join(', ');
                } else if (typeof answer === 'object') {
                  answerText = Object.values(answer).join(', ');
                } else {
                  answerText = String(answer);
                }
              } else {
                answerText = 'No response';
              }
              
              summaryElement.innerHTML += `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                  <p style="font-weight: 600; margin-bottom: 8px; color: #374151;">${question.label}</p>
                  <p style="color: #6b7280; margin: 0;">${answerText}</p>
                </div>
              `;
            });
            
            summaryElement.innerHTML += '</div>';
          });
          
          summaryElement.innerHTML += `
            <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
              Submitted on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
          `;
          
          document.body.appendChild(summaryElement);
          
          const canvas = await html2canvas(summaryElement, {
            backgroundColor: form.settings.backgroundColor || '#FFFFFF',
            scale: 3, // Increased scale for HD quality
            useCORS: true,
            allowTaint: true,
            logging: false, // Disable logging for production
            width: 800,
            height: summaryElement.scrollHeight,
            scrollX: 0,
            scrollY: 0
          });
          
          // Remove the temporary element
          document.body.removeChild(summaryElement);
          
          console.log('Canvas created:', { width: canvas.width, height: canvas.height });
          
          // Create a blob and download with maximum quality
          canvas.toBlob(async (blob) => {
            if (blob) {
              console.log('PNG blob created:', { size: blob.size, type: blob.type });
              
              // Enhanced mobile download handling
              const fileName = `${form.title}-submission-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
              
              // Check if we're on mobile
              const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
              
              if (isMobile) {
                // Mobile-first approach: try Web Share API first, then download
                if ('share' in navigator && (navigator as any).canShare) {
                  try {
                    const file = new File([blob], fileName, { type: 'image/png' });
                    await (navigator as any).share({
                      title: 'Form Submission Summary',
                      text: 'Your form submission summary from AdParlay',
                      files: [file]
                    });
                    console.log('PNG shared via Web Share API');
                    return;
                  } catch (shareError) {
                    console.log('Web Share API failed, falling back to download:', shareError);
                  }
                }
                
                // Fallback: try to trigger download on mobile
                try {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.download = fileName;
                  link.href = url;
                  link.style.display = 'none';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  console.log('PNG downloaded on mobile via fallback');
                } catch (downloadError) {
                  console.log('Mobile download failed, trying alternative method:', downloadError);
                  
                  // Last resort: open in new tab for mobile users to manually save
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  console.log('PNG opened in new tab for manual save');
                }
              } else {
                // Desktop: standard download
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = fileName;
                link.href = url;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('PNG downloaded on desktop');
              }
            }
          }, 'image/png', 1.0); // Maximum quality
        } catch (error) {
          console.error('Error generating PNG:', error);
          // Don't fail the form submission if PNG generation fails
        }
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      console.error('Form data that failed to submit:', formData);
      console.error('Form:', form);
      
      // More user-friendly error message
      let errorMessage = 'There was an error submitting your form. ';
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage += 'Please ensure the form is published and accessible.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message.includes('File object')) {
          errorMessage += 'File upload issue detected. Please try uploading your files again.';
        } else if (error.message.includes('invalid data')) {
          errorMessage += 'Some form data is invalid. Please check your responses and try again.';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again or contact support if the problem persists.';
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
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

  const renderQuestion = (question: FormQuestion) => {
    const value = formData[question.id] || '';
    const error = errors[question.id];
    
    const handleChange = (newValue: any) => {
      setFormData(prev => ({ ...prev, [question.id]: newValue }));
      if (error) {
        setErrors(prev => ({ ...prev, [question.id]: '' }));
      }
    };
    
    switch (question.type) {
      case 'short_answer':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
        );
        
      case 'paragraph':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg resize-none ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
        );
        
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleChange(e.target.value)}
                  className="mr-4 w-5 h-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300"
                />
                <span className="text-lg text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
        
      case 'checkboxes':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleChange([...currentValues, option]);
                    } else {
                      handleChange(currentValues.filter(v => v !== option));
                    }
                  }}
                  className="mr-4 w-5 h-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300"
                />
                <span className="text-lg text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
        
      case 'dropdown':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg appearance-none bg-white ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <option value="">Select an option</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
        
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
        );
        
              case 'time':
        return (
          <input
            type="time"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
        );
        
      case 'file_upload':
        return (
          <div className="space-y-4">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Check file size
                  const maxSize = (question.validation?.maxFileSize || 10) * 1024 * 1024; // Convert MB to bytes
                  if (file.size > maxSize) {
                    alert(`File size must be less than ${question.validation?.maxFileSize || 10}MB`);
                    return;
                  }
                  
                  // Check file type
                  const allowedTypes = question.validation?.allowedTypes || ['image/*', 'application/pdf', 'text/*'];
                  const isAllowed = allowedTypes.some(type => {
                    if (type.endsWith('/*')) {
                      return file.type.startsWith(type.replace('/*', ''));
                    }
                    return file.type === type;
                  });
                  
                  if (!isAllowed) {
                    alert('File type not allowed');
                    return;
                  }
                  
                  handleChange(file);
                }
              }}
              accept={question.validation?.allowedTypes?.join(',') || 'image/*,application/pdf,text/*'}
              className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 ${
                error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            />
            {value && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  File selected: {(value as File).name}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Max file size: {question.validation?.maxFileSize || 10}MB
            </p>
          </div>
        );
        
      case 'linear_scale':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-lg text-gray-600">
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
                      checked={value === scaleValue}
                      onChange={(e) => handleChange(parseInt(e.target.value))}
                      className="mr-2 w-5 h-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">{scaleValue}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
        
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-lg ${
              error ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-medium">Loading your form...</p>
        </motion.div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Form Not Found</h1>
          <p className="text-lg text-gray-600">This form doesn't exist or is not published yet.</p>
        </motion.div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-2xl mx-auto px-6"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Thank You!</h1>
          <p className="text-2xl text-gray-600 mb-8 leading-relaxed">{form.settings.successMessage}</p>
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <p className="text-gray-700 mb-4">Your submission has been recorded successfully.</p>
            <p className="text-sm text-gray-500 mb-6">A summary has been saved to your device.</p>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-700 mb-4">Want to create your own beautiful forms?</p>
              <a 
                href="https://www.adparlay.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <span>Create Your Own Forms</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentBlock = form.blocks[currentBlockIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen overflow-hidden">
        {/* Left/Top Half - Media Section */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full h-[35vh] lg:h-auto lg:w-1/2 relative overflow-hidden flex-shrink-0"
        >
          {form.media.url ? (
            <>
              {form.media.type === 'image' ? (
                <motion.img 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  src={form.media.url} 
                  alt={form.media.alt || 'Form Media'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  {form.media.url.includes('youtube.com') || form.media.url.includes('youtu.be') ? (
                    <motion.iframe
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      src={getYouTubeEmbedUrl(form.media.url)}
                      title="YouTube video"
                      className="w-full aspect-video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <motion.video 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      src={form.media.url} 
                      controls 
                      className="w-full h-full object-cover"
                    />
                  )}
                </>
              )}
              {/* Text Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center p-6 lg:p-12">
                {form.media.primaryDescription && form.media.primaryDescription.trim() !== '' && (
                  <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-2xl lg:text-4xl font-bold text-white mb-4 lg:mb-6 leading-tight text-center"
                  >
                    {form.media.primaryDescription}
                  </motion.h2>
                )}
                
                {form.media.secondaryDescription && form.media.secondaryDescription.trim() !== '' && (
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-lg lg:text-xl text-white leading-relaxed text-center max-w-2xl"
                  >
                    {form.media.secondaryDescription}
                  </motion.p>
                )}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col items-center justify-center p-6 lg:p-12">
              <svg className="w-16 h-16 lg:w-24 lg:h-24 text-blue-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              
              {form.media.primaryDescription && form.media.primaryDescription.trim() !== '' && (
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4 lg:mb-6 leading-tight text-center"
                >
                  {form.media.primaryDescription}
                </motion.h2>
              )}
              
              {form.media.secondaryDescription && form.media.secondaryDescription.trim() !== '' && (
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-lg lg:text-xl text-gray-600 leading-relaxed text-center max-w-2xl"
                >
                  {form.media.secondaryDescription}
                </motion.p>
              )}
            </div>
          )}
        </motion.div>

        {/* Right/Bottom Half - Form Section */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full h-[65vh] lg:h-auto lg:w-1/2 bg-white overflow-y-auto flex-shrink-0 scroll-smooth"
        >
          <div className="p-4 lg:p-8 max-w-2xl mx-auto w-full">
            <div ref={formRef}>
              {form.description && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-6 lg:mb-12 text-center"
                >
                  <p className="text-base lg:text-xl text-gray-600 leading-relaxed">{form.description}</p>
                </motion.div>
              )}
              
              {form.blocks.length > 0 && currentBlock ? (
                <motion.div 
                  key={currentBlockIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  {/* Block Navigation - Moved below title/description */}
                  {form.blocks.length > 1 && (
                    <div className="flex items-center justify-between mb-8 p-4 lg:p-6 bg-gray-50 rounded-3xl overflow-hidden">
                      <button
                        onClick={prevBlock}
                        disabled={currentBlockIndex === 0}
                        className="px-3 lg:px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center space-x-1 lg:space-x-2 text-sm lg:text-base"
                      >
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Previous</span>
                      </button>
                      
                      <div className="text-center flex-shrink-0">
                        <span className="text-sm lg:text-lg font-semibold text-gray-900">
                          {currentBlockIndex + 1} of {form.blocks.length}
                        </span>
                        <div className="w-20 lg:w-32 h-2 bg-gray-200 rounded-full mt-2 mx-auto">
                          <div 
                            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${((currentBlockIndex + 1) / form.blocks.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <button
                        onClick={nextBlock}
                        disabled={currentBlockIndex === form.blocks.length - 1}
                        className="px-3 lg:px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center space-x-1 lg:space-x-2 text-sm lg:text-base"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Current Block */}
                  <div className="bg-white rounded-2xl lg:rounded-3xl shadow-xl border border-gray-100 p-6 lg:p-8">
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">{currentBlock.title}</h3>
                    {currentBlock.description && (
                      <p className="text-base lg:text-lg text-gray-600 mb-6 lg:mb-8 leading-relaxed">{currentBlock.description}</p>
                    )}
                    
                    <div className="space-y-6 lg:space-y-8">
                      {currentBlock.questions.map((question, index) => (
                        <motion.div 
                          key={question.id} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="space-y-3"
                        >
                          <label className="block text-lg font-semibold text-gray-900">
                            {question.label}
                            {question.required && <span className="text-red-500 ml-2">*</span>}
                          </label>
                          
                          {question.helpText && (
                            <p className="text-gray-500 text-base">{question.helpText}</p>
                          )}
                          
                          {renderQuestion(question)}
                          
                          {errors[question.id] && (
                            <motion.p 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-red-500 text-sm mt-2 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {errors[question.id]}
                            </motion.p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  {currentBlockIndex === form.blocks.length - 1 && (
                    <>
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        type="submit"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-4 lg:py-6 px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl lg:rounded-3xl font-bold text-lg lg:text-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl lg:shadow-2xl flex items-center justify-center space-x-3"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Form</span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </>
                        )}
                      </motion.button>
                      
                      {/* User Guidance */}
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-500">
                          Having trouble? Make sure all required fields are filled. 
                          You can go back to previous pages using the navigation above.
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Bottom Navigation - Same as top navigation */}
                  {form.blocks.length > 1 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="flex items-center justify-between mt-8 p-4 lg:p-6 bg-gray-50 rounded-3xl overflow-hidden"
                    >
                      <button
                        onClick={prevBlock}
                        disabled={currentBlockIndex === 0}
                        className="px-3 lg:px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center space-x-1 lg:space-x-2 text-sm lg:text-base"
                      >
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">Previous</span>
                      </button>
                      
                      <div className="text-center flex-shrink-0">
                        <span className="text-sm lg:text-lg font-semibold text-gray-900">
                          {currentBlockIndex + 1} of {form.blocks.length}
                        </span>
                        <div className="w-20 lg:w-32 h-2 bg-gray-200 rounded-full mt-2 mx-auto">
                          <div 
                            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${((currentBlockIndex + 1) / form.blocks.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <button
                        onClick={nextBlock}
                        disabled={currentBlockIndex === form.blocks.length - 1}
                        className="px-3 lg:px-6 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center space-x-1 lg:space-x-2 text-sm lg:text-base"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-xl text-gray-600">No questions in this form.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FormPreview;
