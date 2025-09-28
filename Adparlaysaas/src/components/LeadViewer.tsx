import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Eye, EyeOff } from 'lucide-react';

interface FormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  formData: Record<string, any>;
  submittedAt: Date;
  userAgent: string;
  ipAddress: string;
}

interface Form {
  id: string;
  title: string;
  blocks?: Array<{
    title: string;
    questions: Array<{
      id: string;
      label: string;
      type: string;
    }>;
  }>;
}

interface LeadViewerProps {
  responses: FormSubmission[];
  forms: Form[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

const LeadViewer: React.FC<LeadViewerProps> = ({
  responses,
  forms,
  isOpen,
  onClose,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showImages, setShowImages] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const currentResponse = responses[currentIndex];

  const getQuestionLabel = (formId: string, questionId: string): string => {
    const form = forms.find(f => f.id === formId);
    if (!form || !form.blocks) return questionId;
    
    for (const block of form.blocks) {
      const question = block.questions?.find(q => q.id === questionId);
      if (question) return question.label;
    }
    return questionId;
  };

  const getDeviceInfo = (userAgent: string) => {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Unknown';
  };

  const isImageFile = (value: any): boolean => {
    if (typeof value === 'object' && value !== null) {
      return value.isFile && value.fileType?.startsWith('image/');
    }
    return false;
  };

  const isVideoFile = (value: any): boolean => {
    if (typeof value === 'object' && value !== null) {
      return value.isFile && value.fileType?.startsWith('video/');
    }
    return false;
  };

  const downloadFile = (value: any) => {
    if (!value || !value.fileData) return;
    
    try {
      // Convert base64 to blob
      const byteCharacters = atob(value.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: value.fileType });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = value.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const renderFilePreview = (value: any, questionLabel: string) => {
    if (!value || typeof value !== 'object') return null;

    if (isImageFile(value)) {
      return (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              📷 {value.fileName} ({Math.round(value.fileSize / 1024)}KB)
            </div>
            <button
              onClick={() => downloadFile(value)}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download
            </button>
          </div>
          {showImages && value.fileData && (
            <div className="bg-gray-100 rounded-lg p-2 text-center">
              <img
                src={`data:${value.fileType};base64,${value.fileData}`}
                alt={value.fileName}
                className="max-w-full h-auto max-h-48 rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
              <div className="text-gray-500 text-sm hidden">
                Image preview not available
              </div>
            </div>
          )}
          {!value.fileData && (
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-gray-500 text-sm">
                Image data not available for preview
              </div>
              <div className="text-xs text-gray-400 mt-1">
                File: {value.fileName}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isVideoFile(value)) {
      return (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              🎥 {value.fileName} ({Math.round(value.fileSize / 1024)}KB)
            </div>
            <button
              onClick={() => downloadFile(value)}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download
            </button>
          </div>
          {showImages && value.fileData && (
            <div className="bg-gray-100 rounded-lg p-2 text-center">
              <video
                src={`data:${value.fileType};base64,${value.fileData}`}
                controls
                className="max-w-full h-auto max-h-48 rounded border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                  if (nextElement) {
                    nextElement.style.display = 'block';
                  }
                }}
              />
              <div className="text-gray-500 text-sm hidden">
                Video preview not available
              </div>
            </div>
          )}
          {!value.fileData && (
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-gray-500 text-sm">
                Video data not available for preview
              </div>
              <div className="text-xs text-gray-400 mt-1">
                File: {value.fileName}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (value.isFile) {
      return (
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              📎 {value.fileName} ({Math.round(value.fileSize / 1024)}KB)
            </div>
            <button
              onClick={() => downloadFile(value)}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < responses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const downloadCurrentLead = () => {
    if (!currentResponse) return;

    const leadData = {
      'Form Title': currentResponse.formTitle,
      'Submitted Date': currentResponse.submittedAt.toLocaleDateString(),
      'Submitted Time': currentResponse.submittedAt.toLocaleTimeString(),
      'Device': getDeviceInfo(currentResponse.userAgent),
      'IP Address': currentResponse.ipAddress,
      ...Object.fromEntries(
        Object.entries(currentResponse.formData).map(([key, value]) => [
          getQuestionLabel(currentResponse.formId, key),
          typeof value === 'object' && value?.isFile 
            ? `${value.fileName} (${value.fileType})`
            : typeof value === 'string' ? value : JSON.stringify(value)
        ])
      )
    };

    const csvContent = [
      Object.keys(leadData).join(','),
      Object.values(leadData).map(value => 
        typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      ).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-${currentResponse.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !currentResponse) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Lead {currentIndex + 1} of {responses.length}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImages(!showImages)}
                className={`p-2 rounded-lg transition-colors ${
                  showImages 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
                title={showImages ? 'Hide images' : 'Show images'}
              >
                {showImages ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCurrentLead}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download this lead"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ maxHeight: 'calc(95vh - 140px)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentResponse.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Lead Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Form:</span>
                    <div className="text-gray-900">{currentResponse.formTitle}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <div className="text-gray-900">
                      {currentResponse.submittedAt.toLocaleDateString()} at {currentResponse.submittedAt.toLocaleTimeString()}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Device:</span>
                    <div className="text-gray-900">{getDeviceInfo(currentResponse.userAgent)}</div>
                  </div>
                </div>
              </div>

              {/* Form Responses - Horizontal Layout */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Responses</h3>
                {(() => {
                  const form = forms.find(f => f.id === currentResponse.formId);
                  if (!form || !form.blocks) {
                    // Fallback to original behavior if no form structure
                    const entries = Object.entries(currentResponse.formData);
                    return (
                      <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                          {entries.map(([key, value]) => {
                            const questionLabel = getQuestionLabel(currentResponse.formId, key);
                            return (
                              <div key={key} className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-100">
                                  {questionLabel}
                                </div>
                                <div className="text-gray-700">
                                  {typeof value === 'object' && value !== null ? (
                                    renderFilePreview(value, questionLabel)
                                  ) : (
                                    <div className="whitespace-pre-wrap break-words">
                                      {typeof value === 'string' ? value : JSON.stringify(value)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Get all questions in order
                  const orderedQuestions: Array<{id: string, label: string, type: string}> = [];
                  form.blocks.forEach(block => {
                    if (block.questions) {
                      orderedQuestions.push(...block.questions);
                    }
                  });

                  const questionsWithAnswers = orderedQuestions.filter(question => 
                    currentResponse.formData[question.id] !== undefined
                  );

                  return (
                    <div className="overflow-x-auto pb-4">
                      <div className="flex gap-4 min-w-max">
                        {questionsWithAnswers.map((question, index) => {
                          const value = currentResponse.formData[question.id];
                          
                          return (
                            <div key={question.id} className="flex-shrink-0 w-80 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                              <div className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-100">
                                {index + 1}. {question.label}
                              </div>
                              <div className="text-gray-700">
                                {typeof value === 'object' && value !== null ? (
                                  renderFilePreview(value, question.label)
                                ) : (
                                  <div className="whitespace-pre-wrap break-words">
                                    {typeof value === 'string' ? value : JSON.stringify(value)}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50 gap-4">
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {/* Page Indicators */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {responses.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={goToNext}
            disabled={currentIndex === responses.length - 1}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LeadViewer;
