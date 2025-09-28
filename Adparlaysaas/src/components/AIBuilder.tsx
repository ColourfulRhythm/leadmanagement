import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface AIBuilderProps {
  onSuccess: (formData: any) => void;
  onClose: () => void;
}

const AIBuilder: React.FC<AIBuilderProps> = ({ onSuccess, onClose }) => {
  const { currentUser } = useAuth();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [dailyUsage, setDailyUsage] = useState(0);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);

  useEffect(() => {
    if (currentUser?.id) {
      loadDailyUsage();
    }
  }, [currentUser?.id]);

  const loadDailyUsage = async () => {
    if (!currentUser?.id) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const today = new Date().toDateString();
        const lastUsageDate = userData.lastAIGenerationDate;
        
        if (lastUsageDate === today) {
          setDailyUsage(userData.dailyAIGenerations || 0);
        } else {
          setDailyUsage(0);
        }
      }
    } catch (error) {
      console.error('Error loading daily usage:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const generateForm = async () => {
    if (!description.trim()) {
      setError('Please describe what kind of form you want to create.');
      return;
    }

    if (dailyUsage >= 10) {
      setError('You have reached your daily limit of 10 AI-generated forms. Please try again tomorrow.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const formData = await callGoogleCloudAI(description);
      await updateDailyUsage();
      onSuccess(formData);
    } catch (error) {
      console.error('Error generating form:', error);
      setError('Failed to generate form. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const callGoogleCloudAI = async (prompt: string): Promise<any> => {
    const lowerPrompt = prompt.toLowerCase();
    
    let formType = 'general';
    let questions = [];
    
    if (lowerPrompt.includes('real estate') || lowerPrompt.includes('property') || lowerPrompt.includes('house')) {
      formType = 'real-estate';
      questions = [
        { type: 'short_answer', label: 'Property Address', required: true, placeholder: 'Enter the full property address' },
        { type: 'dropdown', label: 'Property Type', required: true, options: ['House', 'Apartment', 'Condo', 'Townhouse', 'Land'] },
        { type: 'short_answer', label: 'Your Name', required: true, placeholder: 'Enter your full name' },
        { type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
        { type: 'phone', label: 'Phone Number', required: true, placeholder: 'Enter your phone number' },
        { type: 'long_answer', label: 'Additional Requirements', required: false, placeholder: 'Any specific requirements or questions?' }
      ];
    } else if (lowerPrompt.includes('job') || lowerPrompt.includes('employment') || lowerPrompt.includes('hr') || lowerPrompt.includes('recruitment')) {
      formType = 'hr';
      questions = [
        { type: 'short_answer', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
        { type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
        { type: 'phone', label: 'Phone Number', required: true, placeholder: 'Enter your phone number' },
        { type: 'dropdown', label: 'Position Applied For', required: true, options: ['Software Developer', 'Designer', 'Marketing', 'Sales', 'Administrative', 'Other'] },
        { type: 'file_upload', label: 'Resume/CV', required: true, helpText: 'Upload your resume (PDF, DOC, DOCX)' },
        { type: 'long_answer', label: 'Why are you interested in this position?', required: true, placeholder: 'Tell us about your interest and motivation' }
      ];
    } else if (lowerPrompt.includes('event') || lowerPrompt.includes('party') || lowerPrompt.includes('rsvp')) {
      formType = 'event';
      questions = [
        { type: 'short_answer', label: 'Your Name', required: true, placeholder: 'Enter your full name' },
        { type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
        { type: 'dropdown', label: 'Will you attend?', required: true, options: ['Yes, I\'ll be there!', 'No, I can\'t make it', 'Maybe, I\'ll let you know'] },
        { type: 'number', label: 'Number of Guests', required: false, placeholder: 'How many people are you bringing?' },
        { type: 'long_answer', label: 'Dietary Restrictions', required: false, placeholder: 'Any food allergies or dietary preferences?' },
        { type: 'long_answer', label: 'Song Requests', required: false, placeholder: 'Any songs you\'d like to hear at the party?' }
      ];
    } else if (lowerPrompt.includes('feedback') || lowerPrompt.includes('review') || lowerPrompt.includes('survey')) {
      formType = 'feedback';
      questions = [
        { type: 'short_answer', label: 'Full Name', required: true, placeholder: 'Enter your name' },
        { type: 'email', label: 'Email Address', required: true, placeholder: 'Enter your email address' },
        { type: 'dropdown', label: 'Product/Service', required: true, options: ['Product A', 'Product B', 'Service C', 'Service D', 'Other'] },
        { type: 'linear_scale', label: 'Overall Satisfaction', required: true, scaleMin: 1, scaleMax: 5, scaleLabels: { min: 'Very Dissatisfied', max: 'Very Satisfied' } },
        { type: 'long_answer', label: 'What did you like most?', required: false, placeholder: 'Tell us what you enjoyed' },
        { type: 'long_answer', label: 'What could we improve?', required: false, placeholder: 'Share your suggestions for improvement' }
      ];
    } else {
      formType = 'general';
      questions = [
        { type: 'short_answer', label: 'Name', required: true, placeholder: 'Enter your name' },
        { type: 'email', label: 'Email', required: true, placeholder: 'Enter your email address' },
        { type: 'phone', label: 'Phone', required: false, placeholder: 'Enter your phone number' },
        { type: 'dropdown', label: 'Subject', required: true, options: ['General Inquiry', 'Support Request', 'Partnership', 'Feedback', 'Other'] },
        { type: 'long_answer', label: 'Message', required: true, placeholder: 'Tell us how we can help you' }
      ];
    }

    const formTitle = generateFormTitle(prompt, formType);
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      title: formTitle,
      description: `AI-generated form based on: "${prompt}"`,
      media: {
        type: 'image',
        url: '',
        alt: 'Form Media',
        primaryDescription: `Welcome to our ${formType.replace('-', ' ')} form`,
        secondaryDescription: 'Please fill out the information below'
      },
      blocks: [
        {
          id: `block-${Date.now()}`,
          title: 'Page 1',
          description: `AI-generated ${formType.replace('-', ' ')} form`,
          questions: questions.map((q: any, index: number) => ({
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
      ]
    };
  };

  const generateFormTitle = (prompt: string, formType: string): string => {
    const words = prompt.split(' ').slice(0, 4);
    const title = words.join(' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${title} Form`;
  };

  const updateDailyUsage = async () => {
    if (!currentUser?.id) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.id);
      const today = new Date().toDateString();
      
      await updateDoc(userRef, {
        dailyAIGenerations: increment(1),
        lastAIGenerationDate: today
      });
      
      setDailyUsage(prev => prev + 1);
    } catch (error) {
      console.error('Error updating daily usage:', error);
    }
  };

  return (
    <div className="space-y-6">
      {!isLoadingUsage && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 font-medium">Daily Usage</span>
            </div>
            <span className="text-blue-600 font-semibold">{dailyUsage}/10</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            You can generate up to 10 AI forms per day. Resets daily at midnight.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe your form
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., I need a real estate lead capture form for property inquiries, or a job application form for software developers..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={4}
          disabled={isGenerating}
        />
        <p className="text-sm text-gray-500 mt-1">
          Be specific about the type of form, target audience, and key information you want to collect.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={generateForm}
          disabled={isGenerating || dailyUsage >= 10 || !description.trim()}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Generate Form</span>
            </>
          )}
        </button>
        
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">💡 Tips for better results:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Mention the industry or purpose (e.g., "real estate", "job application")</li>
          <li>• Specify the target audience (e.g., "for software developers")</li>
          <li>• Include key information you want to collect</li>
          <li>• Be specific about the form type (e.g., "lead capture", "feedback")</li>
        </ul>
      </div>
    </div>
  );
};

export default AIBuilder;
