import React, { useState } from 'react';
import { ArrowLeft, Users, MessageCircle, Heart, Star, Bookmark, Search, Filter, TrendingUp, Calendar, User, ExternalLink } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Posts', count: 342 },
    { id: 'general', name: 'General Discussion', count: 89 },
    { id: 'help', name: 'Help & Support', count: 76 },
    { id: 'features', name: 'Feature Requests', count: 43 },
    { id: 'integrations', name: 'Integrations', count: 28 },
    { id: 'announcements', name: 'Announcements', count: 15 },
    { id: 'showcase', name: 'Club Showcase', count: 34 }
  ];

  const featuredPosts = [
    {
      id: 1,
      title: 'Best Practices for Managing Large Tennis Clubs',
      author: 'Sarah Chen',
      authorRole: 'Club Manager',
      category: 'general',
      replies: 23,
      likes: 45,
      views: 1204,
      timeAgo: '2 days ago',
      isPinned: true,
      excerpt: 'After managing a 500+ member tennis club for 3 years, here are the key strategies that have helped us maintain smooth operations...'
    },
    {
      id: 2,
      title: 'New Tournament Management Features Coming Soon!',
      author: 'Club Booking Team',
      authorRole: 'Staff',
      category: 'announcements',
      replies: 15,
      likes: 67,
      views: 892,
      timeAgo: '4 days ago',
      isPinned: true,
      excerpt: 'We\'re excited to announce new tournament management features that will make organizing competitions easier than ever...'
    },
    {
      id: 3,
      title: 'Integration with Popular Calendar Apps',
      author: 'Mike Rodriguez',
      authorRole: 'Developer',
      category: 'integrations',
      replies: 31,
      likes: 28,
      views: 756,
      timeAgo: '1 week ago',
      isPinned: false,
      excerpt: 'Has anyone successfully integrated Club Booking with Google Calendar or Outlook? Looking for tips on syncing court bookings...'
    }
  ];

  const recentPosts = [
    {
      id: 4,
      title: 'How do you handle no-shows and last-minute cancellations?',
      author: 'Jennifer Walsh',
      authorRole: 'Club Manager',
      category: 'help',
      replies: 8,
      likes: 12,
      views: 234,
      timeAgo: '3 hours ago',
      hasNewReplies: true
    },
    {
      id: 5,
      title: 'Feature Request: Mobile push notifications for booking confirmations',
      author: 'David Park',
      authorRole: 'Member',
      category: 'features',
      replies: 5,
      likes: 18,
      views: 156,
      timeAgo: '6 hours ago',
      hasNewReplies: false
    },
    {
      id: 6,
      title: 'Showcase: How we increased member engagement by 40%',
      author: 'Amanda Foster',
      authorRole: 'Club Manager',
      category: 'showcase',
      replies: 12,
      likes: 32,
      views: 445,
      timeAgo: '1 day ago',
      hasNewReplies: true
    },
    {
      id: 7,
      title: 'Question about setting up court pricing and peak hours',
      author: 'Robert Kim',
      authorRole: 'New User',
      category: 'help',
      replies: 4,
      likes: 7,
      views: 123,
      timeAgo: '1 day ago',
      hasNewReplies: false
    },
    {
      id: 8,
      title: 'API documentation for booking webhooks?',
      author: 'Lisa Thompson',
      authorRole: 'Developer',
      category: 'integrations',
      replies: 2,
      likes: 9,
      views: 89,
      timeAgo: '2 days ago',
      hasNewReplies: true
    }
  ];

  const communityStats = [
    { label: 'Active Members', value: '2,847', icon: Users },
    { label: 'Total Posts', value: '342', icon: MessageCircle },
    { label: 'Clubs Represented', value: '156', icon: Star },
    { label: 'Countries', value: '23', icon: TrendingUp }
  ];

  const topContributors = [
    {
      name: 'Sarah Chen',
      role: 'Club Manager',
      posts: 47,
      likes: 234,
      badge: 'Super Contributor'
    },
    {
      name: 'Mike Rodriguez',
      role: 'Developer',
      posts: 31,
      likes: 189,
      badge: 'Technical Expert'
    },
    {
      name: 'Amanda Foster',
      role: 'Club Manager',
      posts: 28,
      likes: 156,
      badge: 'Community Helper'
    },
    {
      name: 'David Park',
      role: 'Product Manager',
      posts: 23,
      likes: 143,
      badge: 'Feature Advocate'
    }
  ];

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'staff': return 'bg-purple-100 text-purple-800';
      case 'club manager': return 'bg-blue-100 text-blue-800';
      case 'developer': return 'bg-green-100 text-green-800';
      case 'product manager': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPosts = [...featuredPosts, ...recentPosts].filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center mb-6">
              <Users className="h-12 w-12 text-blue-200 mr-4" />
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Community Forum
              </h1>
            </div>
            <p className="text-xl leading-8 text-blue-100 mb-8">
              Connect with club managers, share experiences, and get help from the Club Booking community.
            </p>
            
            <div className="bg-blue-800/50 backdrop-blur-sm rounded-xl p-6 mb-8">
              <p className="text-lg font-medium mb-4">
                🚀 Coming Soon! 
              </p>
              <p className="text-blue-100">
                Our community forum is currently in development. Join our mailing list to be notified when it launches.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 font-medium">
                Join Waitlist
              </button>
              <a href="/contact" className="border border-blue-300 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Community Stats Preview */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Growing Community
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Join thousands of club managers and members already using Club Booking
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {communityStats.map((stat, index) => (
              <div key={index} className="text-center bg-gray-50 rounded-xl p-6">
                <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview of Forum Features */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Featured Discussions (Preview)
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search discussions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {featuredPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4 opacity-75">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {post.isPinned && (
                            <div className="text-blue-600">
                              <Bookmark className="h-4 w-4" />
                            </div>
                          )}
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {post.title}
                          </h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(post.authorRole)}`}>
                          {post.authorRole}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.replies} replies
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes} likes
                          </span>
                        </div>
                        <span>{post.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-sm mb-4">
                    This is a preview of what our community forum will look like
                  </p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium opacity-50 cursor-not-allowed">
                    View All Discussions (Coming Soon)
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Preview */}
            <div className="lg:col-span-1 space-y-6">
              {/* Categories */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.slice(0, 5).map((category) => (
                    <button
                      key={category.id}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors opacity-75"
                      disabled
                    >
                      <span>{category.name}</span>
                      <span className="text-xs text-gray-400">{category.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top Contributors Preview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Top Contributors</h3>
                <div className="space-y-3">
                  {topContributors.slice(0, 4).map((contributor, index) => (
                    <div key={index} className="flex items-center justify-between opacity-75">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {contributor.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {contributor.posts} posts • {contributor.likes} likes
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {contributor.badge}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Guidelines */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                <h3 className="font-semibold text-blue-900 mb-3">Community Guidelines</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Be respectful and professional</li>
                  <li>• Share knowledge and experiences</li>
                  <li>• Help others solve problems</li>
                  <li>• Stay on topic and relevant</li>
                  <li>• Search before posting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Notified Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Be the First to Know
            </h2>
            <p className="mt-4 text-lg text-gray-600 mb-8">
              Get notified when our community forum launches and be among the first to join the conversation.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">What to Expect:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Q&A with club management experts</li>
                    <li>• Feature requests and feedback</li>
                    <li>• Integration tips and tricks</li>
                    <li>• Club success stories</li>
                  </ul>
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-2">Early Access Benefits:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Priority support responses</li>
                    <li>• Beta feature previews</li>
                    <li>• Direct feedback to our team</li>
                    <li>• Community contributor badges</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Join Waitlist
                </a>
                <a
                  href="/help"
                  className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-100 font-medium"
                >
                  Visit Help Center
                </a>
              </div>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>
                In the meantime, feel free to reach out directly through our{' '}
                <a href="/contact" className="text-blue-600 hover:text-blue-800 underline">
                  contact page
                </a>{' '}
                or{' '}
                <a href="/help" className="text-blue-600 hover:text-blue-800 underline">
                  help center
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}