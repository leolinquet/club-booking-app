import React, { useState } from 'react';
import { ArrowLeft, Cookie, Settings, Eye, Shield, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function CookiePage() {
  const [expandedSection, setExpandedSection] = useState(null);
  const lastUpdated = "October 19, 2024";

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const cookieTypes = [
    {
      id: 'essential',
      name: 'Essential Cookies',
      icon: Shield,
      purpose: 'Required for basic website functionality',
      canDisable: false,
      description: 'These cookies are necessary for our website to function properly. They enable core functionality such as security, network management, and accessibility.',
      examples: [
        {
          name: 'Session ID',
          purpose: 'Maintains your logged-in session',
          duration: 'Session (until browser closes)',
          provider: 'Club Booking App'
        },
        {
          name: 'Security Token',
          purpose: 'Prevents cross-site request forgery attacks',
          duration: '1 hour',
          provider: 'Club Booking App'
        },
        {
          name: 'Load Balancer',
          purpose: 'Routes your requests to the appropriate server',
          duration: 'Session',
          provider: 'Cloud Infrastructure'
        }
      ]
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      icon: Settings,
      purpose: 'Remember your preferences and settings',
      canDisable: true,
      description: 'These cookies allow us to remember choices you make and provide enhanced, more personal features.',
      examples: [
        {
          name: 'User Preferences',
          purpose: 'Stores your preferred language and timezone',
          duration: '1 year',
          provider: 'Club Booking App'
        },
        {
          name: 'Theme Selection',
          purpose: 'Remembers your light/dark mode preference',
          duration: '6 months',
          provider: 'Club Booking App'
        },
        {
          name: 'Notification Settings',
          purpose: 'Stores your notification preferences',
          duration: '1 year',
          provider: 'Club Booking App'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      icon: Eye,
      purpose: 'Help us understand how you use our website',
      canDisable: true,
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      examples: [
        {
          name: 'Google Analytics',
          purpose: 'Tracks website usage and performance',
          duration: '2 years',
          provider: 'Google'
        },
        {
          name: 'Page Views',
          purpose: 'Counts page visits to improve our content',
          duration: '30 days',
          provider: 'Club Booking App'
        },
        {
          name: 'Error Tracking',
          purpose: 'Helps us identify and fix technical issues',
          duration: '30 days',
          provider: 'Error Monitoring Service'
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      icon: Info,
      purpose: 'Used for advertising and marketing purposes',
      canDisable: true,
      description: 'These cookies are used to track visitors across websites to display relevant and engaging advertisements.',
      examples: [
        {
          name: 'Social Media Pixels',
          purpose: 'Tracks conversions from social media ads',
          duration: '90 days',
          provider: 'Social Media Platforms'
        },
        {
          name: 'Advertising ID',
          purpose: 'Shows relevant advertisements',
          duration: '1 year',
          provider: 'Advertising Networks'
        },
        {
          name: 'Conversion Tracking',
          purpose: 'Measures effectiveness of marketing campaigns',
          duration: '30 days',
          provider: 'Marketing Platforms'
        }
      ]
    }
  ];

  const browserInstructions = [
    {
      browser: 'Chrome',
      steps: [
        'Click the three dots menu in the top right corner',
        'Go to Settings > Privacy and security > Cookies and other site data',
        'Choose your preferred cookie settings'
      ]
    },
    {
      browser: 'Firefox',
      steps: [
        'Click the menu button in the top right corner',
        'Go to Settings > Privacy & Security',
        'Under Cookies and Site Data, click Manage Data'
      ]
    },
    {
      browser: 'Safari',
      steps: [
        'Click Safari in the menu bar',
        'Go to Preferences > Privacy',
        'Choose your cookie preferences under "Cookies and website data"'
      ]
    },
    {
      browser: 'Edge',
      steps: [
        'Click the three dots menu in the top right corner',
        'Go to Settings > Cookies and site permissions',
        'Click on Cookies and site data'
      ]
    }
  ];

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
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center mb-6">
              <Cookie className="h-12 w-12 text-amber-600 mr-4" />
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Cookie Policy
              </h1>
            </div>
            <p className="text-xl leading-8 text-gray-600">
              Learn about how we use cookies and similar technologies to improve your experience 
              on our platform and how you can control them.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="bg-amber-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8 text-center">
              What Are Cookies?
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences, 
                keeping you logged in, and understanding how you use our service.
              </p>
              <p className="text-gray-700 mb-4">
                We also use similar technologies like web beacons, pixels, and local storage to 
                enhance functionality and gather insights about our service usage.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Your Control</h3>
                <p className="text-blue-800 text-sm">
                  You have control over cookies. You can choose which types to accept, 
                  delete existing cookies, or set your browser to refuse them entirely. 
                  However, some features may not work properly without certain cookies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Types of Cookies We Use
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Click on each category to learn more about the specific cookies
            </p>
          </div>

          <div className="space-y-4">
            {cookieTypes.map((type) => (
              <div key={type.id} className="bg-gray-50 rounded-xl border border-gray-200">
                <button
                  onClick={() => toggleSection(type.id)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center">
                    <type.icon className="h-6 w-6 text-gray-600 mr-4" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600">{type.purpose}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium mr-3 ${
                      type.canDisable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {type.canDisable ? 'Optional' : 'Required'}
                    </span>
                    {expandedSection === type.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {expandedSection === type.id && (
                  <div className="px-6 pb-6">
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <p className="text-gray-700 mb-6">{type.description}</p>
                      
                      <h4 className="font-semibold text-gray-900 mb-4">Examples:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-900">Cookie Name</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-900">Purpose</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-900">Duration</th>
                              <th className="text-left py-2 px-3 font-medium text-gray-900">Provider</th>
                            </tr>
                          </thead>
                          <tbody>
                            {type.examples.map((example, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-2 px-3 font-medium text-gray-900">{example.name}</td>
                                <td className="py-2 px-3 text-gray-600">{example.purpose}</td>
                                <td className="py-2 px-3 text-gray-600">{example.duration}</td>
                                <td className="py-2 px-3 text-gray-600">{example.provider}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cookie Management */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Managing Your Cookie Preferences
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              You have several options to control how cookies are used
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Browser Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Browser Settings
              </h3>
              <p className="text-gray-600 mb-6">
                You can control cookies through your browser settings. Here's how to do it in popular browsers:
              </p>
              
              <div className="space-y-4">
                {browserInstructions.map((browser, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-gray-900 mb-2">{browser.browser}</h4>
                    <ol className="text-sm text-gray-600 space-y-1 ml-4">
                      {browser.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="list-decimal list-inside">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>

            {/* Our Cookie Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Our Cookie Preferences
              </h3>
              <p className="text-gray-600 mb-6">
                When you first visit our website, you'll see a cookie banner allowing you to choose 
                your preferences. You can also change these settings at any time.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Essential Cookies</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Always On</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Functional Cookies</span>
                  <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                    Manage
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Analytics Cookies</span>
                  <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                    Manage
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Marketing Cookies</span>
                  <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                    Manage
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium">
                  Update Cookie Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}