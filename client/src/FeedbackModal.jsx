import React, { useState, useRef } from 'react';

const FeedbackModal = ({ isOpen, onClose, user, userClubs, currentClub, API }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    category: '',
    message: '',
    email: user?.email || '',
    club_id: currentClub?.id || '',
    allow_contact: true
  });
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && !submitted) {
      setFormData({
        rating: 0,
        category: '',
        message: '',
        email: user?.email || '',
        club_id: currentClub?.id || '',
        allow_contact: true
      });
      setAttachment(null);
      setErrors({});
    }
  }, [isOpen, user, currentClub, submitted]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStarClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, attachment: 'Please select an image file' }));
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setErrors(prev => ({ ...prev, attachment: 'Image must be smaller than 2MB' }));
        return;
      }

      setAttachment(file);
      setErrors(prev => ({ ...prev, attachment: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please enter your feedback';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length > 2000) {
      newErrors.message = 'Message must be less than 2000 characters';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    
    try {
      let attachment_data = null;
      if (attachment) {
        attachment_data = await convertFileToBase64(attachment);
      }

      const payload = {
        ...formData,
        club_id: formData.club_id ? parseInt(formData.club_id) : null,
        rating: formData.rating || undefined,
        attachment_data
      };

      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'x-app-version': '1.0.0' // TODO: Get from actual app version
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API}/api/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const error = await response.json();
        setErrors({ submit: error.error || 'Failed to submit feedback' });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <h3 className="text-lg font-semibold mb-2">Thank you for your feedback!</h3>
            <p className="text-gray-600 mb-4">
              We appreciate you taking the time to help us improve the app.
            </p>
            {user?.is_manager && (
              <p className="text-sm text-blue-600 mb-4">
                <a href="/admin/feedback" className="hover:underline">
                  View feedback status (Admin)
                </a>
              </p>
            )}
            <button
              onClick={handleClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Give Feedback</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (optional)
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="text-2xl focus:outline-none transition-colors"
                  disabled={submitting}
                >
                  <span className={star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={submitting}
            >
              <option value="">Select a category</option>
              <option value="bug">Bug Report</option>
              <option value="ux">User Experience</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your feedback *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Tell us what's on your mind..."
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={submitting}
            />
            <div className="flex justify-between mt-1">
              {errors.message ? (
                <p className="text-sm text-red-600">{errors.message}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  {formData.message.length}/2000 characters
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={submitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Club Selector */}
          {userClubs && userClubs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related to club (optional)
              </label>
              <select
                value={formData.club_id}
                onChange={(e) => handleInputChange('club_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="">General feedback</option>
                {userClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachment (optional)
            </label>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Choose Image
              </button>
              {attachment && (
                <span className="text-sm text-gray-600 truncate flex-1">
                  {attachment.name}
                </span>
              )}
            </div>
            {errors.attachment && (
              <p className="mt-1 text-sm text-red-600">{errors.attachment}</p>
            )}
          </div>

          {/* Allow Contact */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allow_contact"
              checked={formData.allow_contact}
              onChange={(e) => handleInputChange('allow_contact', e.target.checked)}
              className="mr-2"
              disabled={submitting}
            />
            <label htmlFor="allow_contact" className="text-sm text-gray-700">
              Allow us to contact you about this feedback
            </label>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || !formData.category || !formData.message.trim()}
            >
              {submitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;