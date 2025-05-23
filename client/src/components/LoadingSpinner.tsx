import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        {/* Dark blue arc */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-4 border-gray-200 border-solid rounded-full" style={{ borderColor: '#e2e8f0', borderTopColor: '#1B263B' }}></div>
        {/* Light blue/teal arc */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-4 border-gray-200 border-solid rounded-full animate-spin" style={{ borderColor: 'transparent', borderTopColor: '#0056a0' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 