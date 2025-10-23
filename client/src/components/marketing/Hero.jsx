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
              <a href="#" className="flex items-center group">
                <img 
                  src="/sportsclubnet-high-resolution-logo.png" 
                  alt="SportsClubNet Logo" 
                  className="h-10 w-auto max-w-[150px] object-contain transition-transform group-hover:scale-105"
                />
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
              
              {/* Right illustration */}
              <div className="mt-12 lg:mt-0 lg:w-1/2">
                <div className="max-w-lg mx-auto">
                  <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-2xl p-8 overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    
                    {/* Court time slots illustration */}
                    <div className="relative z-10">
                      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800 text-sm">Sport X</h3>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        {/* Court labels */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          <div></div> {/* Empty space for time column */}
                          <div className="text-xs text-gray-500 text-center font-medium">Court 1</div>
                          <div className="text-xs text-gray-500 text-center font-medium">Court 2</div>
                          <div className="text-xs text-gray-500 text-center font-medium">Court 3</div>
                          <div className="text-xs text-gray-500 text-center font-medium">Court 4</div>
                          <div className="text-xs text-gray-500 text-center font-medium">Court 5</div>
                          <div className="text-xs text-gray-500 text-center font-medium">Court 6</div>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {/* First row - grey (past/unavailable) */}
                          <div className="h-6 flex items-center text-xs text-gray-500 font-medium pr-2">10:00</div>
                          <div className="h-6 bg-gray-300 rounded-sm"></div>
                          <div className="h-6 bg-gray-300 rounded-sm"></div>
                          <div className="h-6 bg-gray-300 rounded-sm"></div>
                          <div className="h-6 bg-gray-300 rounded-sm"></div>
                          <div className="h-6 bg-gray-300 rounded-sm"></div>
                          <div className="h-6 bg-gray-300 rounded-sm"></div>
                          
                          {/* Second row - mixed availability */}
                          <div className="h-6 flex items-center text-xs text-gray-500 font-medium pr-2">12:00</div>
                          <div className="h-6 bg-green-500 rounded-sm"></div>
                          <div className="h-6 bg-red-500 rounded-sm"></div>
                          <div className="h-6 bg-green-500 rounded-sm"></div>
                          <div className="h-6 bg-yellow-500 rounded-sm"></div>
                          <div className="h-6 bg-green-500 rounded-sm"></div>
                          <div className="h-6 bg-green-500 rounded-sm"></div>
                          
                          {/* Third row - mostly available */}
                          <div className="h-6 flex items-center text-xs text-gray-500 font-medium pr-2">14:00</div>
                          <div className="h-6 bg-green-500 rounded-sm"></div>
                          <div className="h-6 bg-green-500 rounded-sm"></div>
                          <div className="h-6 bg-red-500 rounded-sm"></div>
                          <div className="h-6 bg-green-500 rounded-sm"></div>
                          <div className="h-6 bg-green-500 rounded-sm"></div>
                          <div className="h-6 bg-red-500 rounded-sm"></div>
                        </div>
                      </div>
                      
                      {/* Booking status legend */}
                      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 text-sm mb-3">Booking Status</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-sm mr-2"></div>
                            <span className="text-gray-600">Available</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-sm mr-2"></div>
                            <span className="text-gray-600">Booked</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-sm mr-2"></div>
                            <span className="text-gray-600">Yours</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-300 rounded-sm mr-2"></div>
                            <span className="text-gray-600">Unavailable</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Members section */}
                      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800 text-sm">Active Members</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">47</span>
                        </div>
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-xs font-bold">J</span>
                          </div>
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-xs font-bold">S</span>
                          </div>
                          <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-xs font-bold">M</span>
                          </div>
                          <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-white text-xs font-bold">+</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating elements for visual appeal */}
                    <div className="absolute top-4 right-4 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-6 left-4 w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/2 right-2 w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}