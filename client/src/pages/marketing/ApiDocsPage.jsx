import React, { useState } from 'react';
import { ArrowLeft, Code, Book, Key, Play, Copy, Check, ExternalLink, Terminal, Shield } from 'lucide-react';

export default function ApiDocsPage() {
  const [activeEndpoint, setActiveEndpoint] = useState('auth');
  const [copiedCode, setCopiedCode] = useState('');

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const navigationSections = [
    {
      title: 'Getting Started',
      items: [
        { id: 'overview', title: 'Overview' },
        { id: 'auth', title: 'Authentication' },
        { id: 'errors', title: 'Error Handling' },
        { id: 'rate-limits', title: 'Rate Limits' }
      ]
    },
    {
      title: 'Endpoints',
      items: [
        { id: 'clubs', title: 'Clubs' },
        { id: 'bookings', title: 'Bookings' },
        { id: 'users', title: 'Users' },
        { id: 'sports', title: 'Sports & Courts' }
      ]
    },
    {
      title: 'Webhooks',
      items: [
        { id: 'webhooks', title: 'Webhook Events' },
        { id: 'security', title: 'Security' }
      ]
    }
  ];

  const endpoints = {
    auth: {
      title: 'Authentication',
      description: 'SportsClubNet API uses JWT tokens for authentication. Include your token in the Authorization header.',
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-3">Getting Your API Key</h4>
            <p className="text-gray-600 mb-4">
              API keys are available to club managers. Contact support to request API access for your club.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> API access is currently in beta. Features and endpoints may change.
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Making Authenticated Requests</h4>
            <div className="bg-gray-900 rounded-lg p-4 relative">
              <button
                onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_API_KEY" https://api.clubbooking.app/v1/clubs', 'auth-curl')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedCode === 'auth-curl' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.clubbooking.app/v1/clubs`}
              </pre>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">JavaScript Example</h4>
            <div className="bg-gray-900 rounded-lg p-4 relative">
              <button
                onClick={() => copyToClipboard(`const response = await fetch('https://api.clubbooking.app/v1/clubs', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`, 'auth-js')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedCode === 'auth-js' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-blue-400 text-sm overflow-x-auto">
{`const response = await fetch('https://api.clubbooking.app/v1/clubs', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`}
              </pre>
            </div>
          </div>
        </div>
      )
    },
    clubs: {
      title: 'Clubs API',
      description: 'Manage club information, settings, and membership.',
      content: (
        <div className="space-y-8">
          {/* GET /clubs */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">GET</span>
              <code className="text-lg font-semibold">/v1/clubs</code>
            </div>
            <p className="text-gray-600 mb-4">Retrieve all clubs you have access to.</p>
            
            <div className="bg-gray-900 rounded-lg p-4 relative mb-4">
              <button
                onClick={() => copyToClipboard(`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.clubbooking.app/v1/clubs`, 'clubs-get')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedCode === 'clubs-get' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     https://api.clubbooking.app/v1/clubs`}
              </pre>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-semibold mb-2">Response</h5>
              <pre className="text-sm text-gray-800 overflow-x-auto">
{`{
  "clubs": [
    {
      "id": 123,
      "name": "Downtown Tennis Club",
      "code": "DTC2024",
      "timezone": "America/New_York",
      "manager_id": 456,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}`}
              </pre>
            </div>
          </div>

          {/* POST /clubs */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">POST</span>
              <code className="text-lg font-semibold">/v1/clubs</code>
            </div>
            <p className="text-gray-600 mb-4">Create a new club.</p>
            
            <div className="bg-gray-900 rounded-lg p-4 relative mb-4">
              <button
                onClick={() => copyToClipboard(`curl -X POST \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{"name": "My Tennis Club", "timezone": "America/New_York"}' \\
     https://api.clubbooking.app/v1/clubs`, 'clubs-post')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedCode === 'clubs-post' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X POST \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{"name": "My Tennis Club", "timezone": "America/New_York"}' \\
     https://api.clubbooking.app/v1/clubs`}
              </pre>
            </div>
          </div>
        </div>
      )
    },
    bookings: {
      title: 'Bookings API',
      description: 'Manage court bookings, availability, and reservations.',
      content: (
        <div className="space-y-8">
          {/* GET /bookings */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono">GET</span>
              <code className="text-lg font-semibold">/v1/bookings</code>
            </div>
            <p className="text-gray-600 mb-4">Get bookings for a specific club and date range.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h5 className="font-semibold mb-2">Query Parameters</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><code>club_id</code> (required) - Club ID</li>
                <li><code>start_date</code> (required) - Start date (YYYY-MM-DD)</li>
                <li><code>end_date</code> (optional) - End date (YYYY-MM-DD)</li>
                <li><code>sport</code> (optional) - Filter by sport</li>
              </ul>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 relative mb-4">
              <button
                onClick={() => copyToClipboard(`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     "https://api.clubbooking.app/v1/bookings?club_id=123&start_date=2024-03-01"`, 'bookings-get')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedCode === 'bookings-get' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     "https://api.clubbooking.app/v1/bookings?club_id=123&start_date=2024-03-01"`}
              </pre>
            </div>
          </div>

          {/* POST /bookings */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">POST</span>
              <code className="text-lg font-semibold">/v1/bookings</code>
            </div>
            <p className="text-gray-600 mb-4">Create a new booking.</p>
            
            <div className="bg-gray-900 rounded-lg p-4 relative mb-4">
              <button
                onClick={() => copyToClipboard(`curl -X POST \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{
       "club_id": 123,
       "sport": "tennis",
       "court_index": 0,
       "date": "2024-03-15",
       "time": "14:00",
       "username": "john_doe"
     }' \\
     https://api.clubbooking.app/v1/bookings`, 'bookings-post')}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
              >
                {copiedCode === 'bookings-post' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
              <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X POST \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{
       "club_id": 123,
       "sport": "tennis",
       "court_index": 0,
       "date": "2024-03-15",
       "time": "14:00",
       "username": "john_doe"
     }' \\
     https://api.clubbooking.app/v1/bookings`}
              </pre>
            </div>
          </div>
        </div>
      )
    },
    errors: {
      title: 'Error Handling',
      description: 'Understanding API error responses and status codes.',
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold mb-3">HTTP Status Codes</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <code className="font-mono">200 OK</code>
                  <span className="text-gray-600">Request successful</span>
                </div>
                <div className="flex justify-between">
                  <code className="font-mono">201 Created</code>
                  <span className="text-gray-600">Resource created successfully</span>
                </div>
                <div className="flex justify-between">
                  <code className="font-mono">400 Bad Request</code>
                  <span className="text-gray-600">Invalid request data</span>
                </div>
                <div className="flex justify-between">
                  <code className="font-mono">401 Unauthorized</code>
                  <span className="text-gray-600">Invalid or missing API key</span>
                </div>
                <div className="flex justify-between">
                  <code className="font-mono">403 Forbidden</code>
                  <span className="text-gray-600">Insufficient permissions</span>
                </div>
                <div className="flex justify-between">
                  <code className="font-mono">404 Not Found</code>
                  <span className="text-gray-600">Resource not found</span>
                </div>
                <div className="flex justify-between">
                  <code className="font-mono">429 Too Many Requests</code>
                  <span className="text-gray-600">Rate limit exceeded</span>
                </div>
                <div className="flex justify-between">
                  <code className="font-mono">500 Internal Server Error</code>
                  <span className="text-gray-600">Server error</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">Error Response Format</h4>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-red-400 text-sm overflow-x-auto">
{`{
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "Court is already booked for this time slot",
    "details": {
      "court_index": 0,
      "time": "14:00",
      "existing_booking_id": 789
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-50 border-b">
        <nav className="mx-auto max-w-7xl px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-2 h-5 w-5" />
              <span className="font-medium">Back to Home</span>
            </a>
            <a href="/app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Try the App
            </a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-900 text-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center mb-6">
              <Code className="h-12 w-12 text-blue-400 mr-4" />
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                API Documentation
              </h1>
            </div>
            <p className="text-xl leading-8 text-gray-300">
              Build powerful integrations with the SportsClubNet API. 
              Manage bookings, clubs, and members programmatically.
            </p>
            
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="bg-gray-800 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-400">Base URL:</span>
                <code className="text-blue-400 ml-2">https://api.clubbooking.app/v1</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Status Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center text-sm text-yellow-800">
            <Shield className="h-4 w-4 mr-2" />
            <strong>Beta API:</strong>
            <span className="ml-1">The API is currently in beta. Endpoints and responses may change.</span>
            <a href="/contact" className="ml-2 text-yellow-600 hover:text-yellow-800 underline">
              Request Access
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="space-y-6">
                {navigationSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveEndpoint(item.id)}
                          className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            activeEndpoint === item.id
                              ? 'bg-blue-100 text-blue-700 font-medium'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {item.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
                <div className="space-y-2 text-sm">
                  <a href="/help" className="block text-blue-600 hover:text-blue-800">
                    Help Center
                  </a>
                  <a href="/contact" className="block text-blue-600 hover:text-blue-800">
                    Contact Support
                  </a>
                  <a href="/community" className="block text-blue-600 hover:text-blue-800">
                    Community Forum
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="prose prose-blue max-w-none">
              {endpoints[activeEndpoint] && (
                <div>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {endpoints[activeEndpoint].title}
                    </h2>
                    <p className="text-lg text-gray-600">
                      {endpoints[activeEndpoint].description}
                    </p>
                  </div>
                  
                  <div className="bg-white">
                    {endpoints[activeEndpoint].content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <section className="bg-gray-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Contact us to request API access and start building your integration.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="/contact"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Request API Access
              </a>
              <a
                href="/help"
                className="border border-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium"
              >
                View Help Center
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}