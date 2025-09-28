import React, { useState } from 'react';
import { FormsService } from '../services/formsService';

interface PostSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  formTitle: string;
}

const PostSaveModal: React.FC<PostSaveModalProps> = ({ isOpen, onClose, formId, formTitle }) => {
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  if (!isOpen) return null;

  const shareUrl = FormsService.generateShareUrl(formId);

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePreview = () => {
    setPreviewUrl(shareUrl);
    window.open(shareUrl, '_blank');
  };

  const handlePublish = async () => {
    try {
      await FormsService.publishForm(formId, true);
      alert('Form published successfully!');
    } catch (error) {
      alert('Failed to publish form: ' + error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Form Saved Successfully!</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-2">Your form "{formTitle}" has been saved.</p>
          <p className="text-sm text-gray-500">Share these links with others to collect responses:</p>
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Preview Link:</label>
            <div className="flex items-center border rounded-lg p-2 bg-gray-50">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={() => handleCopyLink(shareUrl)}
                className={`ml-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Short Share Link:</label>
            <div className="flex items-center border rounded-lg p-2 bg-gray-50">
              <input
                type="text"
                value={FormsService.generateShortShareUrl(formId)}
                readOnly
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(FormsService.generateShortShareUrl(formId));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`ml-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <button
            onClick={handlePreview}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Preview Form
          </button>
          
          <button
            onClick={handlePublish}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Publish Form
          </button>
          
          <button
            onClick={() => {
              const allLinks = `Preview Link: ${shareUrl}\nShort Link: ${FormsService.generateShortShareUrl(formId)}`;
              handleCopyLink(allLinks);
            }}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Copy All Links
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Continue Editing
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>• Preview: See how your form looks to respondents</p>
          <p>• Publish: Make your form live and start collecting responses</p>
          <p>• Continue Editing: Go back to the form builder</p>
        </div>
      </div>
    </div>
  );
};

export default PostSaveModal;
