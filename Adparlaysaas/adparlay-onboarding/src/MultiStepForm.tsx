import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

interface FormData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  budget: string;
  timeline: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  additionalFeatures: string[];
  urgency: string;
  financing: string;
  notes: string;
}

const MultiStepForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    interest: '',
    budget: '',
    timeline: '',
    location: '',
    propertyType: '',
    bedrooms: '',
    additionalFeatures: [],
    urgency: '',
    financing: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTotalSteps = () => {
    // Dynamic step calculation based on user selections
    let steps = 6; // Base steps: contact, interest, budget, timeline, review, submit
    
    if (formData.interest === 'Buy') {
      steps += 2; // Add property type and bedrooms
    }
    
    if (formData.budget && parseInt(formData.budget) > 500000) {
      steps += 1; // Add luxury features
    }
    
    return steps;
  };

  const getProgressPercentage = () => {
    return (currentStep / getTotalSteps()) * 100;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Submit form data
      console.log('Form submitted:', formData);
      // Add your submission logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      nextStep();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (summaryRef.current) {
      try {
        const canvas = await html2canvas(summaryRef.current, {
          useCORS: true,
          allowTaint: true
        });
        
        const link = document.createElement('a');
        link.download = `adparlay-summary-${formData.name}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error("Error generating image:", error);
      }
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Step {currentStep} of {getTotalSteps()}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(getProgressPercentage())}% Complete
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${getProgressPercentage()}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Adparlay</h2>
              <p className="text-gray-600">Let's get to know you better to provide the best service</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData({ email: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData({ phone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">What are you looking for?</h2>
              <p className="text-gray-600">Select your primary interest</p>
            </div>
            
            <div className="grid gap-4">
              {['Buy', 'Rent', 'Sell', 'Invest'].map((option) => (
                <motion.button
                  key={option}
                  onClick={() => {
                    updateFormData({ interest: option });
                    nextStep();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-lg">{option}</h3>
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full group-hover:border-blue-500 transition-colors" />
                  </div>
                  <p className="text-gray-600 mt-2">
                    {option === 'Buy' && 'Find your perfect property'}
                    {option === 'Rent' && 'Discover rental opportunities'}
                    {option === 'Sell' && 'List your property'}
                    {option === 'Invest' && 'Explore investment options'}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">What's your budget?</h2>
              <p className="text-gray-600">This helps us find the best options for you</p>
            </div>
            
            <div className="grid gap-4">
              {[
                'Under $200,000',
                '$200,000 - $400,000',
                '$400,000 - $600,000',
                '$600,000 - $800,000',
                '$800,000 - $1,000,000',
                'Over $1,000,000'
              ].map((option) => (
                <motion.button
                  key={option}
                  onClick={() => {
                    updateFormData({ budget: option });
                    nextStep();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <h3 className="font-semibold text-gray-800">{option}</h3>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">What's your timeline?</h2>
              <p className="text-gray-600">When are you looking to move?</p>
            </div>
            
            <div className="grid gap-4">
              {[
                'Immediately (within 30 days)',
                'Soon (1-3 months)',
                'Flexible (3-6 months)',
                'Planning ahead (6+ months)',
                'Just exploring options'
              ].map((option) => (
                <motion.button
                  key={option}
                  onClick={() => {
                    updateFormData({ timeline: option });
                    nextStep();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <h3 className="font-semibold text-gray-800">{option}</h3>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 5:
        // Conditional step based on interest
        if (formData.interest === 'Buy') {
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">What type of property?</h2>
                <p className="text-gray-600">Select your preferred property type</p>
              </div>
              
              <div className="grid gap-4">
                {[
                  'House',
                  'Apartment/Condo',
                  'Townhouse',
                  'Land/Plot',
                  'Commercial',
                  'Mixed-use'
                ].map((option) => (
                  <motion.button
                    key={option}
                    onClick={() => {
                      updateFormData({ propertyType: option });
                      nextStep();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <h3 className="font-semibold text-gray-800">{option}</h3>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          );
        }
        // For other interests, skip to review
        return renderReviewStep();

      case 6:
        // Conditional step for bedrooms (only for buyers)
        if (formData.interest === 'Buy' && formData.propertyType) {
          return (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">How many bedrooms?</h2>
                <p className="text-gray-600">Select your preferred number of bedrooms</p>
              </div>
              
              <div className="grid gap-4">
                {[
                  'Studio/1 bedroom',
                  '2 bedrooms',
                  '3 bedrooms',
                  '4 bedrooms',
                  '5+ bedrooms',
                  'Any number'
                ].map((option) => (
                  <motion.button
                    key={option}
                    onClick={() => {
                      updateFormData({ bedrooms: option });
                      nextStep();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <h3 className="font-semibold text-gray-800">{option}</h3>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          );
        }
        return renderReviewStep();

      default:
        return renderReviewStep();
    }
  };

  const renderReviewStep = () => (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Your Information</h2>
        <p className="text-gray-600">Please review your details before submitting</p>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg space-y-4" ref={summaryRef}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-semibold text-gray-700">Name:</span>
            <p className="text-gray-800">{formData.name}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Email:</span>
            <p className="text-gray-800">{formData.email}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Phone:</span>
            <p className="text-gray-800">{formData.phone}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Interest:</span>
            <p className="text-gray-800">{formData.interest}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Budget:</span>
            <p className="text-gray-800">{formData.budget}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Timeline:</span>
            <p className="text-gray-800">{formData.timeline}</p>
          </div>
          {formData.propertyType && (
                <div>
              <span className="font-semibold text-gray-700">Property Type:</span>
              <p className="text-gray-800">{formData.propertyType}</p>
                </div>
              )}
          {formData.bedrooms && (
                <div>
              <span className="font-semibold text-gray-700">Bedrooms:</span>
              <p className="text-gray-800">{formData.bedrooms}</p>
                </div>
              )}
              </div>
            </div>
          </motion.div>
        );

  const renderSubmitStep = () => (
          <motion.div
      key="submit"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6 text-center"
          >
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600">Your information has been submitted successfully.</p>
      </div>
            
      <div className="space-y-4">
            <button
              onClick={handleDownload}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download Summary
            </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Start Over
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      {renderProgressBar()}
      
        <AnimatePresence mode="wait">
        {currentStep <= getTotalSteps() ? renderStep() : renderSubmitStep()}
        </AnimatePresence>

      {currentStep <= getTotalSteps() && (
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          
          {currentStep === getTotalSteps() ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || !formData.email || !formData.phone}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!formData.name || !formData.email || !formData.phone}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiStepForm; 