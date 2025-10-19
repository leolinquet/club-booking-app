import React from 'react';

export default function Logos() {
  const clubs = [
    'Tennis Club Pro',
    'Basketball League',
    'Soccer Academy',
    'Fitness Center',
    'Racquet Club',
    'Sports Complex'
  ];

  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-semibold text-gray-600">
            Trusted by sports clubs worldwide
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-3 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-6">
          {clubs.map((club, index) => (
            <div
              key={club}
              className="col-span-1 flex justify-center items-center"
            >
              <div className="h-12 w-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500 text-center px-2">
                  {club}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}