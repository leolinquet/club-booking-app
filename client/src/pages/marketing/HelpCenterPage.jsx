import React, { useState } from 'react';
import { ArrowLeft, Search, Book, Users, Calendar, Settings, MessageCircle, HelpCircle, ChevronRight, ExternalLink } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'getting-started', name: 'Getting Started', icon: Book },
    { id: 'bookings', name: 'Bookings', icon: Calendar },
    { id: 'club-management', name: 'Club Management', icon: Settings },
    { id: 'members', name: 'Members', icon: Users },
    { id: 'account', name: 'Account & Billing', icon: MessageCircle }
  ];

  const articles = [
    {
      id: 1,
      title: 'Getting Started with Club Booking',
      category: 'getting-started',
      excerpt: 'Learn the basics of setting up your club and making your first booking.',
      readTime: '5 min read',
      popular: true
    },
    {
      id: 2,
      title: 'How to Create and Join a Club',
      category: 'getting-started',
      excerpt: 'Step-by-step guide to creating a new club or joining an existing one.',
      readTime: '3 min read',
      popular: true
    },
    {
      id: 3,
      title: 'Making Your First Court Booking',
      category: 'bookings',
      excerpt: 'Complete guide to booking courts, selecting time slots, and managing reservations.',
      readTime: '4 min read',
      popular: true
    },
    {
      id: 4,
      title: 'Understanding Time Slots and Availability',
      category: 'bookings',
      excerpt: 'How our booking system works and tips for finding the best time slots.',
      readTime: '3 min read',
      popular: false
    },
    {
      id: 5,
      title: 'Canceling and Modifying Bookings',
      category: 'bookings',
      excerpt: 'Learn how to cancel or modify your court reservations.',
      readTime: '2 min read',
      popular: false
    },
    {
      id: 6,
      title: 'Setting Up Courts and Sports',
      category: 'club-management',
      excerpt: 'Manager guide to configuring sports, courts, and operating hours.',
      readTime: '6 min read',
      popular: false
    },
    {
      id: 7,
      title: 'Managing Club Members and Permissions',
      category: 'club-management',
      excerpt: 'How to invite members, set permissions, and manage your club roster.',
      readTime: '5 min read',
      popular: false
    },
    {
      id: 8,
      title: 'Club Announcements and Communications',
      category: 'club-management',
      excerpt: 'Using announcements to communicate with your club members.',
      readTime: '3 min read',
      popular: false
    },
    {
      id: 9,
      title: 'Finding Partners and Connecting with Members',
      category: 'members',
      excerpt: 'Use our partner-finding features to connect with other players.',
      readTime: '4 min read',
      popular: true
    },
    {
      id: 10,
      title: 'Club Messaging and Chat Features',
      category: 'members',
      excerpt: 'How to use our messaging system to communicate with other members.',
      readTime: '3 min read',
      popular: false
    },
    {
      id: 11,
      title: 'Tournament Organization and Management',
      category: 'club-management',
      excerpt: 'Complete guide to setting up and running tournaments in your club.',
      readTime: '8 min read',
      popular: false
    },
    {
      id: 12,
      title: 'Account Settings and Profile Management',
      category: 'account',
      excerpt: 'Managing your personal account, profile, and notification preferences.',
      readTime: '4 min read',
      popular: false
    },
    {
      id: 13,
      title: 'Billing and Subscription Management',
      category: 'account',
      excerpt: 'Understanding billing, changing plans, and managing your subscription.',
      readTime: '5 min read',
      popular: false
    },
    {
      id: 14,
      title: 'Troubleshooting Common Issues',
      category: 'getting-started',
      excerpt: 'Solutions to frequently encountered problems and error messages.',
      readTime: '6 min read',
      popular: true
    }
  ];

  const quickLinks = [
    { title: 'Contact Support', href: '/contact', external: false },
    { title: 'System Status', href: '/status', external: false },
    { title: 'Community Forum', href: '/community', external: false },
    { title: 'API Documentation', href: '/docs', external: false },
    { title: 'Video Tutorials', href: '#', external: true },
    { title: 'Feature Requests', href: '#', external: true }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularArticles = articles.filter(article => article.popular);

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
      <section className="bg-blue-600 text-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Help Center
            </h1>
            <p className="mt-6 text-xl leading-8 text-blue-100">
              Everything you need to know about Club Booking. 
              Find answers, learn features, and get the most out of our platform.
            </p>
            
            {/* Search Bar */}
            <div className="mt-8 mx-auto max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Popular Articles
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Most helpful articles from our community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularArticles.map((article) => (
              <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categories.find(cat => cat.id === article.category)?.name}
                  </span>
                  <span className="text-sm text-gray-500">{article.readTime}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {article.excerpt}
                </p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  Read article
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories and Articles */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Browse by Category
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <category.icon className="h-5 w-5 mr-3" />
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Quick Links */}
              <div className="mt-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">
                  Quick Links
                </h4>
                <div className="space-y-2">
                  {quickLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="flex items-center text-sm text-gray-600 hover:text-blue-600 py-1"
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {link.title}
                      {link.external && <ExternalLink className="ml-1 h-3 w-3" />}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Articles List */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCategory === 'all' ? 'All Articles' : categories.find(cat => cat.id === selectedCategory)?.name}
                </h3>
                <span className="text-sm text-gray-500">
                  {filteredArticles.length} articles
                </span>
              </div>

              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {categories.find(cat => cat.id === article.category)?.name}
                          </span>
                          <span className="text-sm text-gray-500">{article.readTime}</span>
                          {article.popular && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Popular
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {article.title}
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          {article.excerpt}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No articles found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search or browse a different category.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Still Need Help?
            </h2>
            <p className="mt-4 text-lg text-gray-600 mb-8">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Contact Support
                </h3>
                <p className="text-gray-600 mb-4">
                  Get personalized help from our support team
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  Get Support
                </a>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Community Forum
                </h3>
                <p className="text-gray-600 mb-4">
                  Connect with other club managers and users
                </p>
                <a
                  href="/community"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-100"
                >
                  Join Community
                </a>
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