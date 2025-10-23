import React from 'react';
import { ArrowLeft, Users, Target, Award, Heart } from 'lucide-react';
import Footer from '../../components/marketing/Footer.jsx';

export default function AboutPage() {
  const values = [
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe sports bring people together. Our platform strengthens club communities by making management effortless.'
    },
    {
      icon: Target,
      title: 'Simplicity Focused',
      description: 'Complex doesn\'t mean better. We design intuitive tools that work for everyone, from tech-savvy managers to casual players.'
    },
    {
      icon: Award,
      title: 'Excellence Driven',
      description: 'We\'re committed to delivering the highest quality platform that clubs can depend on for their daily operations.'
    },
    {
      icon: Heart,
      title: 'Passion Powered',
      description: 'Built by sports enthusiasts who understand the unique challenges and joys of managing athletic communities.'
    }
  ];

  const team = [
    {
      name: 'Leonardo López Linquet',
      role: 'Founder & CEO',
      bio: 'Grew up in a tennis club where he envisioned how technology could transform sports communities. Turned that childhood vision into a platform that changes how clubs operate and players connect.',
      image: '/api/placeholder/150/150'
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
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              About SportsClubNet
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              We're on a mission to transform how sports clubs operate, making management 
              effortless so you can focus on what matters most—your community.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
              Our Story
            </h2>
            <div className="prose prose-lg text-gray-600 space-y-6">
              <p>
                SportsClubNet was born from a simple observation during our founder Leo's childhood at a 
                local tennis club. The club was buzzing with activity and potential, but everything was 
                unorganized—not from lack of care, but from the limitations of the time.
              </p>
              <p>
                To book a court, you had to physically visit the club or call during specific hours. 
                Tournament information was posted on bulletin boards that you could only check in person. 
                Rankings existed in the club manager's notebook, and finding new hitting partners meant 
                asking around until you found someone at your skill level who happened to be free.
              </p>
              <p>
                Leo saw the untapped potential—imagine if you could book courts from anywhere, anytime. 
                What if tournaments were easy to join with just a few clicks? What if you could see 
                live rankings and connect with other players who shared your passion for the sport? 
                The club had all the right ingredients; it just needed the right tools to bring 
                everything together.
              </p>
              <p>
                What started as a simple idea to make court booking more convenient evolved into something 
                much bigger. Leo realized that technology could transform the entire club experience—not 
                just making things easier, but creating stronger communities where players could truly 
                thrive and connect.
              </p>
              <p>
                Today, SportsClubNet serves sports clubs worldwide, turning what began as a booking solution 
                into a complete sports club transformation. Players can reserve courts from their phones, 
                join tournaments with ease, track their progress through rankings, and discover new 
                hitting partners who share their love of the game.
              </p>
              <p>
                What we've learned is that great club software isn't just about efficiency—it's about 
                amplifying the human connections that make sports communities special. SportsClubNet 
                started as a booking idea, but it became something that changes how sports clubs operate 
                and how players experience their favorite sports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Our Values
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {values.map((value, index) => (
                <div key={index} className="bg-gray-50 p-8 rounded-2xl">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <value.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="ml-4 text-xl font-semibold text-gray-900">
                      {value.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Meet the Team
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              The people building the future of club management
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-3xl">
            {team.map((member, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-medium mb-4">
                      {member.role}
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to transform your club?
            </h2>
            <p className="mt-6 text-lg leading-8 text-blue-100">
              Join thousands of clubs worldwide who trust SportsClubNet for their daily operations.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/app"
                className="rounded-md bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get Started Free
              </a>
              <a 
                href="mailto:support@sportsclubnet.com" 
                className="text-base font-semibold leading-6 text-white hover:text-blue-100"
              >
                Contact Us <span aria-hidden="true">→</span>
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