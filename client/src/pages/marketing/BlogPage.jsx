import React from 'react';
import { ArrowLeft, Calendar, Clock, ArrowRight, User } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function BlogPage() {
  const featuredPost = {
    title: 'The Complete Guide to Modern Club Management',
    excerpt: 'Discover how successful sports clubs are transforming their operations with digital tools, streamlined processes, and member-focused strategies.',
    date: '2024-12-15',
    readTime: '8 min read',
    category: 'Club Management',
    image: '/api/placeholder/600/300'
  };

  const posts = [
    {
      title: '5 Ways to Increase Member Engagement at Your Sports Club',
      excerpt: 'Learn proven strategies to build a more active, connected club community that keeps members coming back.',
      date: '2024-12-10',
      readTime: '5 min read',
      category: 'Member Engagement',
      author: 'Leo Lopez-Linquet'
    },
    {
      title: 'Tournament Organization Made Simple: A Step-by-Step Guide',
      excerpt: 'From planning to execution, discover how to run smooth tournaments that players love and managers can handle with ease.',
      date: '2024-12-05',
      readTime: '7 min read',
      category: 'Tournaments',
      author: 'SportsClubNet Team'
    },
    {
      title: 'Why Digital Court Booking Beats Paper Schedules Every Time',
      excerpt: 'Explore the benefits of switching from manual booking systems to digital platforms, with real club success stories.',
      date: '2024-11-28',
      readTime: '6 min read',
      category: 'Technology',
      author: 'Leo Lopez-Linquet'
    },
    {
      title: 'Building Community: How Sports Clubs Create Lasting Connections',
      excerpt: 'The secret to successful clubs isn\'t just great facilities—it\'s fostering genuine connections between members.',
      date: '2024-11-20',
      readTime: '4 min read',
      category: 'Community Building',
      author: 'SportsClubNet Team'
    },
    {
      title: 'Revenue Optimization for Sports Clubs: Beyond Just Court Fees',
      excerpt: 'Discover innovative ways clubs are diversifying revenue streams while providing more value to their members.',
      date: '2024-11-15',
      readTime: '6 min read',
      category: 'Business',
      author: 'Leo Lopez-Linquet'
    },
    {
      title: 'The Psychology of Peak Performance in Club Sports',
      excerpt: 'Understanding what drives athletes can help club managers create environments where everyone thrives.',
      date: '2024-11-08',
      readTime: '5 min read',
      category: 'Sports Psychology',
      author: 'Guest Author'
    }
  ];

  const categories = [
    'All Posts',
    'Club Management',
    'Member Engagement', 
    'Tournaments',
    'Technology',
    'Community Building',
    'Business',
    'Sports Psychology'
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
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Club Management Blog
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Insights, tips, and stories from the world of sports club management. 
              Learn from industry experts and successful club managers.
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="bg-blue-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Blog Coming Soon!
            </h2>
            <p className="text-gray-600 mb-6">
              We're working on bringing you valuable content about club management, 
              member engagement, and industry insights. Check back soon!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@sportsclubnet.com?subject=Blog%20Notifications"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Get Notified When We Launch
              </a>
              <a
                href="/app"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
              >
                Explore the App Instead
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Preview of Planned Content */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              What to Expect
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Here's a preview of the content we're preparing for you
            </p>
          </div>

          {/* Featured Article Preview */}
          <div className="mb-16">
            <div className="bg-gray-50 rounded-2xl overflow-hidden">
              <div className="p-8 sm:p-12">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    Featured Article
                  </span>
                  <span className="text-gray-500 text-sm">{featuredPost.category}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {featuredPost.title}
                </h3>
                <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Dec 15, 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Article Grid Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Categories Preview */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              Planned Categories
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.slice(1).map((category, index) => (
                <span 
                  key={index}
                  className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-gray-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Stay in the Loop
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Get notified when we publish new articles about club management, industry trends, and success stories.
            </p>
            <div className="mt-8">
              <a
                href="mailto:support@sportsclubnet.com?subject=Blog%20Newsletter%20Signup"
                className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Subscribe for Updates
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}