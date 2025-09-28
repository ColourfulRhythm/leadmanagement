import React, { useState, useEffect } from 'react';

interface Question {
  id: string;
  type: string;
  label: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  conditionalLogic?: Array<{
    option: string;
    targetBlockId?: string;
    action: 'show' | 'hide' | 'jump';
  }>;
  blockId: string;
}

interface Block {
  id: string;
  title: string;
  description?: string;
}

interface Media {
  type: 'image' | 'video' | 'embed' | '';
  url: string;
  primaryText?: string;
  secondaryText?: string;
  description?: string;
  link?: string;
}

interface FormPreviewProps {
  blocks: Block[];
  questions: Question[];
  media: Media;
}

const FormPreview: React.FC<FormPreviewProps> = ({ blocks, questions, media }) => {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [submitted, setSubmitted] = useState(false);
  const [visibleBlocks, setVisibleBlocks] = useState<Set<string>>(new Set(blocks.map(b => b.id)));

  // Initialize visible blocks
  useEffect(() => {
    setVisibleBlocks(new Set(blocks.map(b => b.id)));
  }, [blocks]);

  if (blocks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <p>No form content to preview.</p>
        </div>
      </div>
    );
  }

  const currentBlock = blocks[currentBlockIndex];
  const blockQuestions = questions.filter(q => q.blockId === currentBlock?.id);
  const currentQuestion = blockQuestions[currentQuestionIndex];

  if (!currentBlock || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">❌</div>
          <p>Form preview data is missing or invalid.</p>
        </div>
      </div>
      );
  }

  // Handle conditional logic
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Check for conditional logic
    const question = questions.find(q => q.id === questionId);
    if (question?.conditionalLogic) {
      question.conditionalLogic.forEach(logic => {
        if (logic.option === value) {
          switch (logic.action) {
            case 'show':
              setVisibleBlocks(prev => {
                const newSet = new Set(prev);
                newSet.add(logic.targetBlockId!);
                return newSet;
              });
              break;
            case 'hide':
              setVisibleBlocks(prev => {
                const newSet = new Set(prev);
                newSet.delete(logic.targetBlockId!);
                return newSet;
              });
              break;
            case 'jump':
              if (logic.targetBlockId) {
                const targetIndex = blocks.findIndex(b => b.id === logic.targetBlockId);
                if (targetIndex !== -1) {
                  setCurrentBlockIndex(targetIndex);
                  setCurrentQuestionIndex(0);
                }
              }
              break;
          }
        }
      });
    }
  };

  const getNextQuestionIndex = () => {
    if (currentQuestionIndex < blockQuestions.length - 1) {
      return currentQuestionIndex + 1;
    } else if (currentBlockIndex < blocks.length - 1) {
      return 0; // Start of next block
    }
    return -1; // End of form
  };

  const getPreviousQuestionIndex = () => {
    if (currentQuestionIndex > 0) {
      return currentQuestionIndex - 1;
    } else if (currentBlockIndex > 0) {
      const prevBlockQuestions = questions.filter(q => q.blockId === blocks[currentBlockIndex - 1]?.id);
      return prevBlockQuestions.length - 1;
    }
    return -1; // Beginning of form
  };

  const handleNext = () => {
    const nextQuestionIndex = getNextQuestionIndex();
    if (nextQuestionIndex === -1) {
      // End of form
      setSubmitted(true);
    } else if (nextQuestionIndex === 0 && currentQuestionIndex < blockQuestions.length - 1) {
      // Next block
      setCurrentBlockIndex(currentBlockIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Next question in same block
      setCurrentQuestionIndex(nextQuestionIndex);
    }
  };

  const handlePrevious = () => {
    const prevQuestionIndex = getPreviousQuestionIndex();
    if (prevQuestionIndex === -1) {
      // Beginning of form
      return;
    } else if (prevQuestionIndex === blockQuestions.length - 1 && currentQuestionIndex === 0) {
      // Previous block
      setCurrentBlockIndex(currentBlockIndex - 1);
      const prevBlockQuestions = questions.filter(q => q.blockId === blocks[currentBlockIndex - 1]?.id);
      setCurrentQuestionIndex(prevBlockQuestions.length - 1);
    } else {
      // Previous question in same block
      setCurrentQuestionIndex(prevQuestionIndex);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id] || '';
    
    switch (question.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'date':
        return (
          <input
            type={question.type === 'phone' ? 'tel' : question.type}
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder={`Enter your ${question.type}`}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            placeholder="Enter your answer..."
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">Select an option...</option>
            {question.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-3">
            {question.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-3">
            {question.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  name={question.id}
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleAnswerChange(question.id, [...currentValues, option]);
                    } else {
                      handleAnswerChange(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter a number"
          />
        );
      
      case 'url':
        return (
          <input
            type="url"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="https://example.com"
          />
        );
      
      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleAnswerChange(question.id, star)}
                className={`text-2xl transition-colors ${
                  value >= star ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400`}
              >
                ⭐
              </button>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter your answer..."
          />
        );
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank you for your submission!</h2>
          <p className="text-lg text-gray-600 mb-6">We have received your response and will get back to you soon.</p>
          <button
            onClick={() => {
              setSubmitted(false);
              setCurrentBlockIndex(0);
              setCurrentQuestionIndex(0);
              setAnswers({});
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  const isFirstQuestion = currentBlockIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion = currentBlockIndex === blocks.length - 1 && currentQuestionIndex === blockQuestions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile Layout: Media on top (40% height), Form below */}
      <div className="lg:hidden flex flex-col h-screen">
        
        {/* Top Section - Media (40% height) */}
        <div className="h-[40vh] bg-white relative overflow-hidden">
          {media.url ? (
            <div className="h-full relative">
              {media.type === 'image' && (
                <img
                  src={media.url}
                  alt="Form Media"
                  className="w-full h-full object-cover"
                />
              )}
              {media.type === 'video' && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <iframe
                    src={media.url}
                    title="Form Video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
              {media.type === 'embed' && (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <iframe
                    src={media.url}
                    title="Form Embed"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
              
              {/* Overlay Text */}
              {(media.primaryText || media.secondaryText) && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <div className="text-center text-white px-4">
                    {media.primaryText && (
                      <h1 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">
                        {media.primaryText}
                      </h1>
                    )}
                    {media.secondaryText && (
                      <p className="text-lg sm:text-xl opacity-90 drop-shadow-md">
                        {media.secondaryText}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
              <div className="text-center text-gray-600">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-sm">No media selected</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Section - Form (60% height) */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-4 sm:p-6">
            
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentBlockIndex + 1} of {blocks.length}</span>
                <span>{Math.round(((currentBlockIndex + 1) / blocks.length) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentBlockIndex + 1) / blocks.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Block Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentBlock.title}</h2>
              {currentBlock.description && (
                <p className="text-gray-600">{currentBlock.description}</p>
              )}
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {currentQuestion.label}
                  {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {currentQuestion.helpText && (
                  <p className="text-gray-600 text-sm">{currentQuestion.helpText}</p>
                )}
              </div>

              {/* Question Input */}
              <div className="mb-4">
                {renderQuestionInput(currentQuestion)}
              </div>

              {/* Validation Message */}
              {currentQuestion.required && !answers[currentQuestion.id] && (
                <p className="text-red-500 text-sm mt-2">This field is required</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  isFirstQuestion
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Previous
              </button>

              <button
                onClick={handleNext}
                disabled={currentQuestion.required && !answers[currentQuestion.id]}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentQuestion.required && !answers[currentQuestion.id]
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLastQuestion ? 'Submit' : 'Next →'}
              </button>
            </div>

            {/* Question Counter */}
            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                Question {currentQuestionIndex + 1} of {blockQuestions.length} in this section
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout: Split screen (Media left, Form right) */}
      <div className="hidden lg:flex flex-row min-h-screen">
        
        {/* Left Side - Media Section */}
        <div className="w-1/2 bg-white sticky top-0 h-screen">
          <div className="h-full flex flex-col">
            {/* Media Content */}
            {media.url ? (
              <div className="flex-1 relative overflow-hidden">
                {media.type === 'image' && (
                  <img
                    src={media.url}
                    alt="Form Media"
                    className="w-full h-full object-cover"
                  />
                )}
                {media.type === 'video' && (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <iframe
                      src={media.url}
                      title="Form Video"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
                {media.type === 'embed' && (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <iframe
                      src={media.url}
                      title="Form Embed"
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}
                
                {/* Overlay Text */}
                {(media.primaryText || media.secondaryText) && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-center text-white px-8">
                      {media.primaryText && (
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                          {media.primaryText}
                        </h1>
                      )}
                      {media.secondaryText && (
                        <p className="text-xl lg:text-2xl opacity-90 drop-shadow-md">
                          {media.secondaryText}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                <div className="text-center text-gray-600">
                  <div className="text-6xl mb-4">🖼️</div>
                  <p className="text-lg">No media selected</p>
                </div>
              </div>
            )}
            
            {/* Media Description */}
            {media.description && (
              <div className="p-6 bg-white border-t border-gray-200">
                <p className="text-gray-700 text-sm leading-relaxed">{media.description}</p>
                {media.link && (
                  <a
                    href={media.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Learn More →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="w-1/2 flex-1">
          <div className="max-w-2xl mx-auto p-6 lg:p-8">
            
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Question {currentBlockIndex + 1} of {blocks.length}</span>
                <span>{Math.round(((currentBlockIndex + 1) / blocks.length) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentBlockIndex + 1) / blocks.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Block Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentBlock.title}</h2>
              {currentBlock.description && (
                <p className="text-gray-600 text-lg">{currentBlock.description}</p>
              )}
            </div>

            {/* Question */}
            <div className="mb-8">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentQuestion.label}
                  {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                {currentQuestion.helpText && (
                  <p className="text-gray-600 text-sm">{currentQuestion.helpText}</p>
                )}
              </div>

              {/* Question Input */}
              <div className="mb-6">
                {renderQuestionInput(currentQuestion)}
              </div>

              {/* Validation Message */}
              {currentQuestion.required && !answers[currentQuestion.id] && (
                <p className="text-red-500 text-sm mt-2">This field is required</p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isFirstQuestion
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ← Previous
              </button>

              <button
                onClick={handleNext}
                disabled={currentQuestion.required && !answers[currentQuestion.id]}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentQuestion.required && !answers[currentQuestion.id]
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLastQuestion ? 'Submit Form' : 'Next →'}
              </button>
            </div>

            {/* Question Counter */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {blockQuestions.length} in this section
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
