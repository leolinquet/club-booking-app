import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

export default function Hero() {
  return (
    <section className="bg-white">
      {/* Navigation */}
      <header>
        <nav className="mx-auto max-w-7xl px-6 lg:px-8" aria-label="Top">
          <div className="flex w-full items-center justify-between border-b border-gray-200 py-6">
            <div className="flex items-center">
              <a href="#" className="text-2xl font-bold text-gray-900">
                Club Booking
              </a>
            </div>
            <div className="ml-10 space-x-8 lg:block">
              <div className="flex items-center space-x-6">
                <a href="#features" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  Features
                </a>
                <a href="#how-it-works" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  How It Works
                </a>
                <a href="#faq" className="text-base font-medium text-gray-500 hover:text-gray-900">
                  FAQ
                </a>
                <a 
                  href="/app" 
                  className="text-base font-medium text-gray-500 hover:text-gray-900"
                >
                  Login
                </a>
                <a
                  href="/help-center"
                  className="text-base font-medium text-gray-500 hover:text-gray-900"
                >
                  Help Center
                </a>
                <a
                  href="/app"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <div className="mx-auto max-w-7xl">
        <div className="pb-8 bg-white sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="text-center lg:text-left lg:flex lg:items-start lg:space-x-8">
              {/* Left content */}
              <div className="lg:w-1/2">
                <h1 className="text-4xl tracking-tight font-bold text-gray-900 sm:text-5xl xl:text-6xl">
                  <span className="block">All-in-one club</span>
                  <span className="block text-blue-600">management</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto lg:mx-0 md:mt-5 md:text-xl">
                  Built for sports clubs. Simple for managers. Fast for players.
                </p>
                <p className="mt-2 text-lg text-gray-600 sm:text-xl">
                  Bookings, members, tournaments.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row sm:justify-center lg:justify-start gap-3">
                  <a
                    href="/app"
                    className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                  <a
                    href="/app"
                    className="flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Try Demo
                  </a>
                </div>
              </div>
              
              {/* Right image */}
              <div className="mt-12 lg:mt-0 lg:w-1/2">
                <div className="max-w-lg mx-auto">
                  <img
                    className="w-full rounded-2xl shadow-2xl"
                    src="/assets/marketing/hero.svg"
                    alt="Club management dashboard showing court booking interface"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}