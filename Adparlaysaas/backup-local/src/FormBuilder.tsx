import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ModernFormBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [formName, setFormName] = useState('Untitled Form');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);

  const addBlock = () => {
    const newBlock = {
      id: `block-${Date.now()}`,
      title: 'New Question Block',
      isEditing: true
    };
    
    const defaultQuestion = {
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
    const newQuestion = {
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
      file: '📎'
    };
    return icons[type] || '❓';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => alert('Form saved! (This is a demo version)')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                💾 Save Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Form Settings */}
          <div className="lg:col-span-1">
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
          <div className="lg:col-span-2">
            {/* Welcome Screen */}
            {blocks.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center mb-8">
                <div className="text-6xl mb-4">🎯</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Modern Form Builder</h1>
                <p className="text-lg text-gray-600 mb-6">Create beautiful, conversion-focused forms with an intuitive interface.</p>
                
                <button
                  onClick={addBlock}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors transform hover:scale-105"
                >
                  🚀 Start Building
                </button>
              </div>
            )}

            {/* Form Content */}
            <div className="space-y-6">
              {/* Form Blocks */}
              {blocks.map((block, blockIndex) => (
                <div key={block.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Block Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📋</span>
                        <h3 className="text-lg font-semibold text-gray-900">{block.title}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                          ✏️ Edit
                        </button>
                        
                        <button className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors">
                          🗑️ Delete
                        </button>
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getTypeIcon(question.type)}</span>
                                <div>
                                  <h4 className="font-medium text-gray-900">{question.label}</h4>
                                  {question.helpText && (
                                    <p className="text-sm text-gray-600">{question.helpText}</p>
                                  )}
                                  {question.required && (
                                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full mt-1">
                                        Required
                                      </span>
                                  )}
                                </div>
                              </div>
                              
                              <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                                ✏️ Edit
                              </button>
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
    </div>
  );
};

export default ModernFormBuilder;
