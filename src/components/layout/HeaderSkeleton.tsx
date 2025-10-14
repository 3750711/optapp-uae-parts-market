import React from 'react';
import { Link } from 'react-router-dom';

const HeaderSkeleton = () => {
  return (
    <header className="bg-white shadow-sm pwa-safe-sticky-top z-50 border-b border-gray-100">
      <div className="container flex items-center justify-between py-3 md:py-4 px-4 md:px-8 mx-auto">
        <Link to="/" className="text-2xl font-extrabold tracking-tight">
          <span className="text-primary">partsbay</span>
          <span className="text-secondary">.ae</span>
        </Link>

        <nav className="flex flex-col md:flex-row items-center gap-2 md:gap-5">
          {/* Navigation placeholder */}
        </nav>

        <div className="flex items-center space-x-3">
          {/* Language toggle skeleton */}
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
          
          {/* User avatar skeleton */}
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    </header>
  );
};

export default HeaderSkeleton;