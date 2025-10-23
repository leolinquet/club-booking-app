import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function ComingSoonPage({ title, description }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {title || 'Coming Soon'}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {description || 'This page is under construction. We\'ll have it ready soon!'}
          </p>
        </div>
        
        <div className="space-y-4">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Home
          </a>
          
          <div>
            <a
              href="/app"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Or try the app →
            </a>
          </div>
        </div>
        
        <div className="mt-12 text-sm text-gray-500">
          <p>Questions? Email us at <a href="mailto:support@sportsclubnet.com" className="text-blue-600 hover:text-blue-800">support@sportsclubnet.com</a></p>
        </div>
      </div>
    </div>
  );
}