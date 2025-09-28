import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { FormsService } from './services/formsService';
import { Form } from './services/formsService';

const FormPreview: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const summaryRef = React.useRef<HTMLDivElement>(null);
  
  console.log('FormPreview: Component rendered with formId:', formId);
  console.log('FormPreview: Current URL:', window.location.href);
  
  useEffect(() => {
    const fetchForm = async () => {
      if (formId) {
        try {
          console.log('🔍 FormPreview: Attempting to fetch form:', formId);
          
          // Track form view for analytics
          try {
            await FormsService.trackEvent({
              form_id: formId,
              event_type: 'view',
              ip_address: 'client-side',
              user_agent: navigator.userAgent,
              session_id: sessionStorage.getItem('session_id') || 'unknown'
            });
          } catch (analyticsError) {
            console.warn('Analytics tracking failed:', analyticsError);
            // Don't fail the form fetch for analytics errors
          }

          // First try Firebase (primary method)
          let foundForm = await FormsService.getForm(formId);
          console.log('🔍 FormPreview: Firebase form fetch result:', foundForm);
          
          // If not found in Firebase, try localStorage (fallback)
          if (!foundForm) {
            console.log('🔍 FormPreview: Form not in Firebase, trying localStorage...');
            foundForm = FormsService.getFormFromLocalStorage(formId);
            console.log('🔍 FormPreview: localStorage form fetch result:', foundForm);
          }
          
          if (foundForm) {
            setForm(foundForm);
          } else {
            console.log('❌ FormPreview: Form not found in any storage');
            setForm(null);
          }
        } catch (error) {
          console.error('❌ FormPreview: Failed to fetch form:', error);
          setForm(null);
        }
      }
      setLoading(false);
    };
    fetchForm();
  }, [formId]);

  const handleDownloadImage = async () => {
    if (summaryRef.current) {
      try {
        const dataUrl = await toPng(summaryRef.current);
        const link = document.createElement('a');
        link.download = `${form?.title || 'Form'}-submission.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        alert('Could not generate image.');
      }
    }
  };

  useEffect(() => {
    if (submitted) {
      handleDownloadImage();
    }
    // eslint-disable-next-line
  }, [submitted]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl">Loading form...</div>;
  if (!form) return (
    <div className="min-h-screen flex items-center justify-center text-xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Form Not Found</h1>
        <p className="text-gray-600">Form ID: {formId}</p>
        <p className="text-gray-600 mt-2">The form you're looking for doesn't exist or has been removed.</p>
      </div>
    </div>
  );
  if (!form.blocks || !form.questions) return (
    <div className="min-h-screen flex items-center justify-center text-xl">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Form</h1>
        <p className="text-gray-600">This form appears to be corrupted or incomplete.</p>
      </div>
    </div>
  );

  const blocks = form.blocks;
  const questions = form.questions;
  const media = form.media || {};

  const block = blocks[currentBlockIndex] || blocks[0];
  const blockQuestions = questions.filter((q: any) => q.blockId === block?.id) || [];
  const question = blockQuestions[currentQuestionIndex] || blockQuestions[0];

  // Helper to check if all required questions in the block are answered
  const allRequiredAnswered = blockQuestions.every((q: any) => {
    if (!q.required) return true;
    const val = answers[q.id];
    if (q.type === 'checkbox') return Array.isArray(val) && val.length > 0;
    return val && val !== '';
  });

  // Helper: Get next block index based on conditional logic
  const getNextBlockIndex = (question: any, selectedOption: string) => {
    if (question && question.conditionalLogic && Array.isArray(question.conditionalLogic)) {
      const logic = question.conditionalLogic.find((l: any) => l.option === selectedOption);
      if (logic && logic.targetBlockId) {
        const idx = blocks.findIndex((b: any) => b.id === logic.targetBlockId);
        if (idx !== -1) return idx;
      }
    }
    // Default: next block
    return currentBlockIndex + 1;
  };

  // Handler for next (with logic)
  const handleNext = async () => {
    // Track start event on first question
    if (currentBlockIndex === 0 && currentQuestionIndex === 0) {
      try {
        await FormsService.trackEvent({
          form_id: formId!,
          event_type: 'start',
          ip_address: 'client-side',
          user_agent: navigator.userAgent,
          session_id: sessionStorage.getItem('session_id') || 'unknown'
        });
      } catch (error) {
        console.error('Failed to track start event:', error);
      }
    }

    // Find the first radio/select question in the block with an answer
    const logicQuestion = blockQuestions.find((q: any) =>
      (q.type === 'radio' || q.type === 'select') && answers[q.id]
    );
    if (logicQuestion) {
      const selectedOption = answers[logicQuestion.id];
      // Check if this option has logic
      const logic = logicQuestion.conditionalLogic?.find((l: any) => l.option === selectedOption);
      if (logic && logic.targetBlockId) {
        const nextBlockIdx = blocks.findIndex((b: any) => b.id === logic.targetBlockId);
        if (nextBlockIdx !== -1 && nextBlockIdx < blocks.length) {
          setCurrentBlockIndex(nextBlockIdx);
          setCurrentQuestionIndex(0);
          return;
        }
      }
    }
    // Default: next block or submit
    if (currentBlockIndex < blocks.length - 1) {
      setCurrentBlockIndex(currentBlockIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      handleSubmit();
    }
  };

  // Handler for previous block
  const handlePrevBlock = () => {
    if (currentBlockIndex > 0) {
      setCurrentBlockIndex(currentBlockIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;
    
    setSubmitting(true);
    try {
      console.log('📝 Submitting form response...');
      console.log('📝 Form ID:', form.id);
      console.log('📝 Answers:', answers);
      
      // Submit form response to Firebase (lead collection)
      const responseId = await FormsService.submitFormResponse(form.id, answers);
      
      console.log('✅ Form response submitted successfully:', responseId);
      
      // Track completion analytics
      await FormsService.trackEvent({
        form_id: form.id,
        event_type: 'complete',
        ip_address: 'client-side',
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('session_id') || 'unknown',
        metadata: { 
          response_id: responseId,
          total_questions: Object.keys(answers).length,
          has_contact_info: Object.values(answers).some(answer => 
            typeof answer === 'string' && (answer.includes('@') || answer.match(/^[\+]?[1-9][\d]{0,15}$/))
          )
        }
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('❌ Submission failed:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        {/* Hidden summary for image generation */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div
            ref={summaryRef}
            className="w-[370px] rounded-2xl shadow-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 overflow-hidden font-sans"
            style={{ fontFamily: 'Inter, Arial, sans-serif' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 py-4 px-6 flex items-center gap-3">
              <div className="bg-white rounded-full p-2 shadow text-green-500">
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#22c55e"/><path d="M8 12.5l2.5 2.5L16 9.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="text-white text-xl font-bold flex-1 text-center">{form.title || 'Untitled Form'}</div>
            </div>
            {/* Answers */}
            <div className="p-6">
              <ul className="space-y-4">
                {Object.entries(answers).map(([key, value]) => {
                  const question = questions.find((q: any) => q.id === key);
                  if (!question) return null;
                  return (
                    <li key={key} className="flex items-start gap-3 border-b border-blue-100 pb-3 last:border-b-0">
                      <div className="mt-1 text-blue-500">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><text x="12" y="16" textAnchor="middle" fontSize="14" fill="#fff" fontFamily="Arial">Q</text></svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 text-base mb-1">{question.label}</div>
                        <div className="text-gray-700 text-sm flex items-center gap-2">
                          <span className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-1 font-medium">
                            {Array.isArray(value) ? value.join(', ') : value}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="text-xs text-gray-400 text-center pb-3">Generated by Adparlay</div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-4">Thank you for your submission!</h2>
        <p className="text-gray-700">We have received your response.</p>
        <p className="text-gray-500 mt-4">A summary image of your submission has been downloaded.</p>
        {/* Call to action for sign up */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 bg-blue-50 rounded-xl p-6 max-w-md mx-auto shadow">
          <div className="text-lg font-semibold text-blue-900">Want to create interactive forms that convert leads?</div>
          <div className="text-blue-700 mb-2">Start generating leads in a more engaging way!</div>
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold shadow hover:bg-blue-700 transition-all text-lg"
            onClick={() => window.location.href = '/'}
          >
            Start Generating Leads
          </button>
        </div>
      </div>
    );
  }

  // If last block and last question, show submit button
  const isLastBlock = currentBlockIndex === blocks.length - 1;
  const isLastQuestion = currentQuestionIndex === blockQuestions.length - 1;

  // --- Responsive Split Layout ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Media Section */}
      {media.url && (
        <div className="md:w-1/2 w-full flex items-center justify-center bg-black/80 md:min-h-screen min-h-[220px] max-h-[50vh] md:max-h-none p-0 md:p-8 relative">
          {media.type === 'image' && (
            <img
              src={media.url}
              alt="Form Media"
              className="w-full h-full max-h-[50vh] md:max-h-[80vh] object-cover rounded-none md:rounded-3xl shadow-xl border border-gray-200"
              style={{ background: '#222' }}
            />
          )}
          {media.type === 'video' && (
            <iframe
              src={media.url}
              title="Embedded Video"
              className="w-full h-full max-h-[50vh] md:max-h-[80vh] object-cover rounded-none md:rounded-3xl shadow-xl border border-gray-200"
              allowFullScreen
            />
          )}
          {/* Overlay Texts */}
          {(media.primaryText || media.secondaryText) && (
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
              {media.primaryText && <div className="text-lg font-bold mb-1">{media.primaryText}</div>}
              {media.secondaryText && <div className="text-base opacity-80">{media.secondaryText}</div>}
            </div>
          )}
        </div>
      )}
      {/* Form Section */}
      <div className="md:w-1/2 w-full flex flex-col items-center justify-center p-4 md:p-12">
        <div className="p-6 max-w-lg w-full bg-white rounded-2xl shadow-xl mx-auto relative z-10">
          <h1 className="text-2xl font-extrabold text-center mb-6">{form.title || 'Untitled Form'}</h1>
          <h2 className="text-xl font-bold mb-4 text-center">{block.title}</h2>
          <form onSubmit={e => {
            e.preventDefault();
            handleNext();
          }}>
            <div className="mb-6 space-y-6">
              {blockQuestions.map((question: any) => (
                <div key={question.id} className="mb-4">
                  <div className="mb-2 text-lg font-medium">{question.label} {question.required && <span className="text-red-500">*</span>}</div>
                  {question.helpText && <div className="mb-2 text-gray-500 text-sm">{question.helpText}</div>}
                  {(() => {
                    switch (question.type) {
                      case 'text':
                      case 'email':
                      case 'phone':
                      case 'date':
                      case 'file':
                        return (
                          <input
                            type={question.type === 'phone' ? 'tel' : question.type}
                            className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                            value={answers[question.id] || ''}
                            onChange={e => setAnswers(a => ({ ...a, [question.id]: e.target.value }))}
                            disabled={false}
                          />
                        );
                      case 'textarea':
                        return (
                          <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                            value={answers[question.id] || ''}
                            onChange={e => setAnswers(a => ({ ...a, [question.id]: e.target.value }))}
                            rows={4}
                            disabled={false}
                          />
                        );
                      case 'select':
                        return (
                          <select
                            className="w-full p-3 border border-gray-300 rounded-lg mb-2"
                            value={answers[question.id] || ''}
                            onChange={e => {
                              setAnswers(a => ({ ...a, [question.id]: e.target.value }));
                              // If you want to auto-advance on select, uncomment:
                              // handleNext(question, e.target.value);
                            }}
                          >
                            <option value="">Select...</option>
                            {(question.options || []).map((opt: string, idx: number) => (
                              <option key={idx} value={opt}>{opt}</option>
                            ))}
                          </select>
                        );
                      case 'radio':
                        return (
                          <div className="space-y-2">
                            {(question.options || []).map((opt: string, idx: number) => (
                              <label key={idx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={question.id}
                                  value={opt}
                                  checked={answers[question.id] === opt}
                                  onChange={e => {
                                    setAnswers(a => ({ ...a, [question.id]: opt }));
                                    // If you want to auto-advance on radio, uncomment:
                                    // handleNext(question, opt);
                                  }}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        );
                      case 'checkbox':
                        return (
                          <div className="space-y-2">
                            {(question.options || []).map((opt: string, idx: number) => (
                              <label key={idx} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  name={question.id}
                                  value={opt}
                                  checked={Array.isArray(answers[question.id]) && answers[question.id].includes(opt)}
                                  onChange={e => {
                                    setAnswers(a => {
                                      const prev = Array.isArray(a[question.id]) ? a[question.id] : [];
                                      if (e.target.checked) {
                                        return { ...a, [question.id]: [...prev, opt] };
                                      } else {
                                        return { ...a, [question.id]: prev.filter((v: string) => v !== opt) };
                                      }
                                    });
                                  }}
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        );
                      default:
                        return null;
                    }
                  })()}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handlePrevBlock}
                disabled={currentBlockIndex === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="submit"
                className="w-full ml-4 py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors"
                disabled={!allRequiredAnswered || submitting}
              >
                {isLastBlock ? (submitting ? 'Submitting...' : 'Submit') : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormPreview;
