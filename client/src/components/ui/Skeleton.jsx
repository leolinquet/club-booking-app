import React from 'react';

/**
 * Reusable Skeleton component with shimmer animation
 * 
 * @param {Object} props
 * @param {string} props.className - Additional Tailwind classes for sizing and spacing
 * @returns {JSX.Element}
 */
export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`
        relative overflow-hidden rounded-md bg-gray-200 
        animate-pulse
        before:absolute before:inset-0
        before:-translate-x-full before:animate-[shimmer_2s_infinite]
        before:bg-gradient-to-r before:from-transparent 
        before:via-white/60 before:to-transparent
        ${className}
      `}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton variants for common use cases
 */
export const SkeletonText = ({ lines = 1, className = '' }) => {
  if (lines === 1) {
    return <Skeleton className={`h-4 w-full ${className}`} />;
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  );
};

export const SkeletonAvatar = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  return (
    <Skeleton 
      className={`rounded-full ${sizeClasses[size]} ${className}`} 
    />
  );
};

export const SkeletonButton = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 px-3',
    md: 'h-10 px-4',
    lg: 'h-12 px-6'
  };
  
  return (
    <Skeleton 
      className={`rounded-lg ${sizeClasses[size]} ${className}`} 
    />
  );
};

export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <SkeletonText lines={2} />
          <div className="flex justify-between items-center pt-2">
            <SkeletonText className="w-20" />
            <SkeletonButton size="sm" className="w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;