import React from 'react';

const TestApp = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-600">
          ResuSync - PDF Download Test
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-700 mb-4">
            This is a test to verify the application is loading correctly.
          </p>
          <div className="space-y-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Test Button
            </button>
            <div className="text-sm text-gray-500">
              If you can see this, the React app is working.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestApp;