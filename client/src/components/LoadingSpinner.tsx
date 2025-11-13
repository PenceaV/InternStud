import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12">
        {/* Base circle (optional, for background effect) */}
        {/* <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 border-solid rounded-full"></div> */}
        {/* Modern spinner - two arcs rotating */}
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-4 border-b-4 border-[#0056a0] border-solid rounded-full animate-spin-fast" style={{ borderColor: 'transparent', borderTopColor: '#0056a0', borderBottomColor: '#2561A9' }}></div>
        {/* Optional: Another arc or dot for more complex animation */}
        {/* <div className="absolute top-0 left-0 w-full h-full border-4 border-r-4 border-blue-400 border-solid rounded-full animate-spin-slow" style={{ borderColor: 'transparent', borderRightColor: '#003f7a' }}></div> */}
      </div>
    </div>
  );
};

export default LoadingSpinner;

// Add a custom keyframes for faster spin if needed
// You might need to add this in your main CSS file (e.g., index.css or global.css)
/*
@keyframes spin-fast {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-spin-fast {
  animation: spin-fast 0.8s linear infinite;
}
*/ 