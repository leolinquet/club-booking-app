import React, { useState } from 'react';
import { ArrowLeft, Search, Book, Users, Calendar, Settings, MessageCircle, HelpCircle, ChevronRight, ExternalLink, Clock } from 'lucide-react';
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
      title: 'Getting Started with SportsClubNet',
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
      title: 'Tournament Management System',
      category: 'club-management',
      excerpt: 'Organize and run professional tournaments with registration, brackets, and results tracking.',
      readTime: '6 min read',
      popular: false
    },
    {
      id: 12,
      title: 'Advanced Booking Analytics',
      category: 'club-management',
      excerpt: 'Detailed analytics and reporting features in development.',
      readTime: '4 min read',
      popular: false,
      comingSoon: true
    },
    {
      id: 13,
      title: 'Mobile App Features Guide',
      category: 'getting-started',
      excerpt: 'Mobile app documentation and features guide coming soon.',
      readTime: '5 min read',
      popular: false,
      comingSoon: true
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
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="text-5xl font-bold mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Find answers, learn features, and get the most out of SportsClubNet with our comprehensive help resources.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, features, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-5 text-lg rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-blue-300 focus:outline-none shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Help Cards */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get started quickly
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Jump right into the most important topics to get up and running with SportsClubNet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularArticles.map((article) => {
              const categoryData = categories.find(cat => cat.id === article.category);
              const IconComponent = categoryData?.icon || HelpCircle;
              
              const cardContent = (
                <div className={`bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-all duration-300 h-full ${
                  article.comingSoon 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-xl hover:border-blue-200 group-hover:-translate-y-1'
                }`}>
                  <div className="flex items-center mb-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        article.comingSoon 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-gray-100 text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-700'
                      }`}>
                        {article.comingSoon ? 'Coming Soon' : categoryData?.name}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className={`text-xl font-semibold mb-3 transition-colors ${
                    article.comingSoon 
                      ? 'text-gray-500' 
                      : 'text-gray-900 group-hover:text-blue-900'
                  }`}>
                    {article.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{article.readTime}</span>
                    {!article.comingSoon && (
                      <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                        Read guide
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                    {article.comingSoon && (
                      <div className="flex items-center text-gray-400 font-medium">
                        Coming Soon
                      </div>
                    )}
                  </div>
                </div>
              );
              
              return article.comingSoon ? (
                <div key={article.id} className="group cursor-not-allowed">
                  {cardContent}
                </div>
              ) : (
                <a key={article.id} href={`/help-center/article/${article.id}`} className="group">
                  {cardContent}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Browse All Articles */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse all help topics
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore our comprehensive library of guides and tutorials organized by topic
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {category.name}
                  {selectedCategory === category.id && (
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {filteredArticles.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map((article) => {
              const categoryData = categories.find(cat => cat.id === article.category);
              const IconComponent = categoryData?.icon || HelpCircle;
              
              const cardContent = (
                <div className={`bg-white border border-gray-200 rounded-xl p-6 transition-all duration-300 h-full ${
                  article.comingSoon 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-lg hover:border-blue-200 group-hover:-translate-y-0.5'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                        article.comingSoon 
                          ? 'bg-gray-100' 
                          : 'bg-gray-100 group-hover:bg-blue-100'
                      }`}>
                        <IconComponent className={`h-5 w-5 transition-colors ${
                          article.comingSoon 
                            ? 'text-gray-400' 
                            : 'text-gray-600 group-hover:text-blue-600'
                        }`} />
                      </div>
                      <div className="ml-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          article.comingSoon 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-gray-100 text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-700'
                        }`}>
                          {article.comingSoon ? 'Coming Soon' : categoryData?.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {article.popular && !article.comingSoon && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                          ⭐ Popular
                        </span>
                      )}
                      {!article.comingSoon && (
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      )}
                    </div>
                  </div>
                  
                  <h3 className={`text-lg font-semibold mb-3 transition-colors ${
                    article.comingSoon 
                      ? 'text-gray-500' 
                      : 'text-gray-900 group-hover:text-blue-900'
                  }`}>
                    {article.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {article.readTime}
                    </span>
                    {!article.comingSoon && (
                      <span className="text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                        Read article →
                      </span>
                    )}
                    {article.comingSoon && (
                      <span className="text-gray-400 font-medium">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              );
              
              return article.comingSoon ? (
                <div key={article.id} className="group cursor-not-allowed">
                  {cardContent}
                </div>
              ) : (
                <a key={article.id} href={`/help-center/article/${article.id}`} className="group">
                  {cardContent}
                </a>
              );
            })}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                <HelpCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No articles found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any articles matching your search. Try adjusting your search terms or browse a different category.
              </p>
              <button
                onClick={() => {setSelectedCategory('all'); setSearchQuery('');}}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse all articles
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Still need help?
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Can't find what you're looking for? We're here to help you succeed with SportsClubNet.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6 group-hover:bg-blue-200 transition-colors">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Contact Support
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Get personalized help from our friendly support team. We typically respond within 24 hours.
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Get Support
                </a>
              </div>
            </div>

            <div className="group">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6 group-hover:bg-green-200 transition-colors">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Community Forum
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Connect with other club managers, share tips, and learn from the community.
                </p>
                <a
                  href="/community"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Join Community
                </a>
              </div>
            </div>

            <div className="group">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-6 group-hover:bg-purple-200 transition-colors">
                  <Book className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Video Tutorials
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Watch step-by-step video guides to learn SportsClubNet features visually.
                </p>
                <a
                  href="/help-center/article/1"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Watch Videos
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Quick Links
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {link.title}
                  {link.external && <ExternalLink className="ml-1 h-3 w-3" />}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}