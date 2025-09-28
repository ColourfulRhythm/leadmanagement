import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  type: string;
  label: string;
  helpText?: string;
  required: boolean;
  isEditing: boolean;
  options?: string[];
  blockId: string;
  conditionalLogic?: Array<{
    option: string;
    targetBlockId?: string;
    action: 'show' | 'hide' | 'jump';
  }>;
}

interface Block {
  id: string;
  title: string;
  isEditing: boolean;
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

const ModernFormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [formName, setFormName] = useState('Untitled Form');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [media, setMedia] = useState<Media>({ type: '', url: '', primaryText: '', secondaryText: '', description: '', link: '' });
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showLogicModal, setShowLogicModal] = useState<{
    questionId: string;
    optionIndex: number;
    blockId: string;
  } | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [logicAction, setLogicAction] = useState<'show' | 'hide' | 'jump'>('show');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);

  const addBlock = () => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      title: 'New Question Block',
      isEditing: true,
      description: 'Block description'
    };
    
    const defaultQuestion: Question = {
      id: `question-${Date.now()}`,
      type: 'text',
      label: 'New Question',
      helpText: 'Enter your question here',
      required: false,
      isEditing: true,
      blockId: newBlock.id,
      options: [],
      conditionalLogic: []
    };
    
    setBlocks(prev => [...prev, newBlock]);
    setQuestions(prev => [...prev, defaultQuestion]);
  };

  const addQuestionToBlock = (blockId: string) => {
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      type: 'text',
      label: 'New Question',
      helpText: '',
      required: false,
      isEditing: true,
      blockId,
      options: [],
      conditionalLogic: []
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      text: '📝',
      email: '📧',
      phone: '📞',
      select: '📋',
      radio: '🔘',
      checkbox: '☑️',
      textarea: '📄',
      date: '📅',
      file: '📎',
      number: '🔢',
      url: '🔗',
      rating: '⭐'
    };
    return icons[type] || '❓';
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setMedia(prev => ({ ...prev, type: 'image', url: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleMediaLink = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMedia(prev => ({ ...prev, [name]: value }));
  };

  const handleRemoveMedia = () => {
    setMedia({ type: '', url: '', primaryText: '', secondaryText: '', description: '', link: '' });
  };

  const handleSaveLogic = () => {
    if (!showLogicModal) return;
    
    const question = questions.find(q => q.id === showLogicModal.questionId);
    if (question && question.options) {
      const option = question.options[showLogicModal.optionIndex];
      let existingLogic = question.conditionalLogic || [];
      
      // Remove existing logic for this option
      existingLogic = existingLogic.filter(l => l.option !== option);

      // Add new logic if a target is selected
      if (selectedTarget) {
        existingLogic.push({ 
          option, 
          targetBlockId: selectedTarget,
          action: logicAction
        });
      }
      
      setQuestions(questions.map(q => 
        q.id === showLogicModal.questionId
          ? { ...q, conditionalLogic: existingLogic }
          : q
      ));
    }
    
    setShowLogicModal(null);
    setSelectedTarget('');
    setLogicAction('show');
  };

  const handleEditQuestion = (questionId: string) => {
    setEditingQuestion(questionId);
  };

  const handleSaveQuestion = (questionId: string) => {
    setEditingQuestion(null);
  };

  const handleEditBlock = (blockId: string) => {
    setEditingBlock(blockId);
  };

  const handleSaveBlock = (blockId: string) => {
    setEditingBlock(null);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    setQuestions(questions.filter(q => q.blockId !== blockId));
  };

  const handleQuestionTypeChange = (questionId: string, newType: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, type: newType, options: newType === 'text' || newType === 'email' || newType === 'phone' || newType === 'textarea' || newType === 'date' || newType === 'file' || newType === 'number' || newType === 'url' ? [] : q.options }
        : q
    ));
  };

  const handleQuestionChange = (questionId: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, [field]: value }
        : q
    ));
  };

  const handleAddOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && ['select', 'radio', 'checkbox'].includes(question.type)) {
      const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
      setQuestions(questions.map(q => 
        q.id === questionId 
          ? { ...q, options: newOptions }
          : q
      ));
    }
  };

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      setQuestions(questions.map(q => 
        q.id === questionId 
          ? { ...q, options: newOptions }
          : q
      ));
    }
  };

  const handleRemoveOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = question.options.filter((_, index) => index !== optionIndex);
      setQuestions(questions.map(q => 
        q.id === questionId 
          ? { ...q, options: newOptions }
          : q
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Modern Form Builder</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button 
                onClick={() => setShowMediaModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
              >
                🖼️ Media Settings
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                💾 Save Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Form Settings */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Settings</h2>
              
              {/* Form Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Form Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter form name..."
                />
              </div>

              {/* Media Preview */}
              {media.url && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Media Preview</h3>
                  <div className="relative">
                    {media.type === 'image' && (
                      <img 
                        src={media.url} 
                        alt="Form Media" 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    {media.type === 'video' && (
                      <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">🎥 Video Link</span>
                      </div>
                    )}
                    {media.primaryText && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
                        <div className="text-sm font-semibold">{media.primaryText}</div>
                        {media.secondaryText && (
                          <div className="text-xs opacity-90">{media.secondaryText}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={addBlock}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  🚀 Add New Block
                </button>
                
                <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                  📋 Use Template
                </button>
              </div>
            </div>
          </div>

          {/* Center - Form Builder */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            {/* Welcome Screen */}
            {blocks.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center mb-8">
                <div className="text-6xl mb-4">🎯</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Modern Form Builder</h1>
                <p className="text-lg text-gray-600 mb-6">Create beautiful, conversion-focused forms with an intuitive interface.</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={addBlock}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors transform hover:scale-105"
                  >
                    🚀 Start Building
                  </button>
                  <button
                    onClick={() => setShowMediaModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors transform hover:scale-105"
                  >
                    🖼️ Add Media
                  </button>
                </div>
              </div>
            )}

            {/* Form Content */}
            <div className="space-y-6">
              {/* Form Blocks */}
              {blocks.map((block, blockIndex) => (
                <div key={block.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Block Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📋</span>
                        <div>
                          {editingBlock === block.id ? (
                            <input
                              type="text"
                              value={block.title}
                              onChange={(e) => setBlocks(blocks.map(b => 
                                b.id === block.id ? { ...b, title: e.target.value } : b
                              ))}
                              className="text-lg font-semibold px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Block Title"
                            />
                          ) : (
                            <h3 className="text-lg font-semibold text-gray-900">{block.title}</h3>
                          )}
                          {editingBlock === block.id ? (
                            <input
                              type="text"
                              value={block.description || ''}
                              onChange={(e) => setBlocks(blocks.map(b => 
                                b.id === block.id ? { ...b, description: e.target.value } : b
                              ))}
                              className="text-sm text-gray-600 mt-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Block description (optional)"
                            />
                          ) : (
                            block.description && (
                              <p className="text-sm text-gray-600 mt-1">{block.description}</p>
                            )
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        {editingBlock === block.id ? (
                          <>
                            <button
                              onClick={() => handleSaveBlock(block.id)}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                            >
                              ✅ Save
                            </button>
                            <button
                              onClick={() => setEditingBlock(null)}
                              className="px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              ❌ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditBlock(block.id)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              ✏️ Edit
                            </button>
                            
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Block Questions */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {questions
                        .filter(question => question.blockId === block.id)
                        .map((question, questionIndex) => (
                          <div key={question.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl">{getTypeIcon(question.type)}</span>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium bg-white px-3 py-1 rounded-full">
                                      {question.type}
                                    </span>
                                    {question.required && (
                                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-medium">
                                        ⚠️ Required
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <h4 className="font-medium text-gray-900 text-lg">{question.label}</h4>
                                {question.helpText && (
                                  <p className="text-sm text-gray-600 mt-2">{question.helpText}</p>
                                )}
                                
                                {/* Conditional Logic Indicators */}
                                {question.conditionalLogic && question.conditionalLogic.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {question.conditionalLogic.map((logic, idx) => (
                                      <span 
                                        key={idx} 
                                        className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium"
                                      >
                                        🔗 {logic.action}: {logic.option}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                                  ✏️ Edit
                                </button>
                                <button className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors">
                                  🔗 Logic
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {/* Add Question Button */}
                      <button
                        onClick={() => addQuestionToBlock(block.id)}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="text-xl">+</span>
                        Add Question to Block
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Block Button */}
              <button
                onClick={addBlock}
                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all hover:bg-blue-50 flex items-center justify-center gap-3 text-lg font-medium"
              >
                <span className="text-2xl">+</span>
                Add New Question Block
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Settings Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Media Settings</h2>
              <button
                onClick={() => setShowMediaModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Media Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Media Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setMedia(prev => ({ ...prev, type: 'image' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      media.type === 'image' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🖼️</div>
                    <div className="text-sm font-medium">Image</div>
                  </button>
                  <button
                    onClick={() => setMedia(prev => ({ ...prev, type: 'video' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      media.type === 'video' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🎥</div>
                    <div className="text-sm font-medium">Video</div>
                  </button>
                  <button
                    onClick={() => setMedia(prev => ({ ...prev, type: 'embed' }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      media.type === 'embed' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">🔗</div>
                    <div className="text-sm font-medium">Embed</div>
                  </button>
                </div>
              </div>

              {/* Media Upload/Link */}
              {media.type && (
                <div className="space-y-4">
                  {media.type === 'image' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMediaUpload}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  {(media.type === 'video' || media.type === 'embed') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {media.type === 'video' ? 'Video URL' : 'Embed URL'}
                      </label>
                      <input
                        type="url"
                        name="url"
                        value={media.url}
                        onChange={handleMediaLink}
                        placeholder={media.type === 'video' ? 'https://youtube.com/watch?v=...' : 'https://...'}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  {/* Media Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Primary Text</label>
                      <input
                        type="text"
                        name="primaryText"
                        value={media.primaryText || ''}
                        onChange={handleMediaLink}
                        placeholder="Main headline"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Text</label>
                      <input
                        type="text"
                        name="secondaryText"
                        value={media.secondaryText || ''}
                        onChange={handleMediaLink}
                        placeholder="Subtitle or description"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Additional Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Description</label>
                    <textarea
                      name="description"
                      value={media.description || ''}
                      onChange={handleMediaLink}
                      placeholder="Detailed description or context for the media"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* External Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">External Link (Optional)</label>
                    <input
                      type="url"
                      name="link"
                      value={media.link || ''}
                      onChange={handleMediaLink}
                      placeholder="https://..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Media Preview */}
              {media.url && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                  <div className="relative">
                    {media.type === 'image' && (
                      <img 
                        src={media.url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                    {media.type === 'video' && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">🎥 {media.url}</span>
                      </div>
                    )}
                    {media.type === 'embed' && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">🔗 {media.url}</span>
                      </div>
                    )}
                    
                    {/* Overlay Text Preview */}
                    {(media.primaryText || media.secondaryText) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-4 rounded-b-lg">
                        {media.primaryText && (
                          <div className="text-lg font-bold mb-1">{media.primaryText}</div>
                        )}
                        {media.secondaryText && (
                          <div className="text-sm opacity-90">{media.secondaryText}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {media.url && (
                  <button
                    onClick={handleRemoveMedia}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove Media
                  </button>
                )}
                <button
                  onClick={() => setShowMediaModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Logic Modal */}
      {showLogicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Add Conditional Logic</h3>
            <p className="text-gray-600 mb-1">
              When this option is selected...
            </p>
            <p className="font-medium text-gray-800 mb-4">
              {`"${questions.find(q => q.id === showLogicModal.questionId)?.options?.[showLogicModal.optionIndex]}"`}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={logicAction}
                  onChange={(e) => setLogicAction(e.target.value as 'show' | 'hide' | 'jump')}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                >
                  <option value="show">Show Block</option>
                  <option value="hide">Hide Block</option>
                  <option value="jump">Jump to Block</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Block
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                >
                  <option value="">-- Select Target Block --</option>
                  {blocks
                    .filter(b => b.id !== showLogicModal.blockId)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLogicModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLogic}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Logic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernFormBuilder;
