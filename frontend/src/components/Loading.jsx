import React from 'react';

const LoadingSpinner = ({ message = "Analyzing your resume..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      {/* Animated AI Brain Icon */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      
      {/* Loading Message */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
        <p className="text-sm text-gray-500 max-w-md">
          Our AI is carefully analyzing your resume and comparing it with the job requirements. This usually takes 10-15 seconds.
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="w-full max-w-md space-y-3 mt-6">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Parsing resume content</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
          <span className="text-sm text-gray-600">Analyzing job requirements</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <span className="text-sm text-gray-600">Generating personalized suggestions</span>
        </div>
      </div>
    </div>
  );
};

const ProgressBar = ({ progress, message }) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const ButtonLoading = ({ children, loading, ...props }) => {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`${props.className} relative ${loading ? 'cursor-not-allowed' : ''}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

export { LoadingSpinner, ProgressBar, ButtonLoading };