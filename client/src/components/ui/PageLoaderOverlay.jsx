import React from 'react';

/**
 * Full-screen loading overlay for app initialization
 * Shows app logo/title with spinner during startup
 * 
 * @param {Object} props
 * @param {boolean} props.isVisible - Controls overlay visibility
 * @param {string} props.message - Optional loading message
 * @returns {JSX.Element}
 */
export const PageLoaderOverlay = ({ 
  isVisible = false, 
  message = "Loading..." 
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="text-center">
        {/* App Logo/Icon */}
        <div className="mb-6 flex justify-center">
          <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <svg 
              className="h-8 w-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
              />
            </svg>
          </div>
        </div>
        
        {/* App Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Club Booking
        </h1>
        
        {/* Spinner */}
        <div className="mb-4 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        </div>
        
        {/* Loading Message */}
        <p className="text-gray-600 text-sm">
          {message}
        </p>
      </div>
    </div>
  );
};

/**
 * Inline spinner component for buttons and form elements
 * 
 * @param {Object} props
 * @param {string} props.size - Spinner size (sm, md, lg)
 * @param {string} props.color - Spinner color
 * @param {string} props.className - Additional classes
 * @returns {JSX.Element}
 */
export const Spinner = ({ 
  size = 'md', 
  color = 'blue-600',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2', 
    lg: 'h-8 w-8 border-4'
  };
  
  // Handle color - support both predefined and custom values
  const borderColor = color === 'white' 
    ? 'border-gray-300 border-t-white' 
    : `border-gray-300 border-t-${color}`;
  
  return (
    <div 
      className={`
        animate-spin rounded-full ${borderColor} ${sizeClasses[size]} ${className}
      `}
      aria-hidden="true"
    />
  );
};

export default PageLoaderOverlay;