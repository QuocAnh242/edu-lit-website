import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 border-b-2 border-cyan-200 bg-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Left side - Logo and EduLit */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="flex items-center space-x-3 transition-opacity hover:opacity-80"
            >
              <img
                src="/Logo2.png"
                alt="EduLit Logo"
                className="h-10 w-10 object-contain"
              />
              <span
                className="text-4xl font-bold text-cyan-600"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                EduLit
              </span>
            </Link>
          </div>

          {/* Middle - Navigation Links */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-xl font-medium text-gray-700 transition-colors duration-200 hover:text-cyan-600 ${
                isActive
                  ? 'text-cyan-700 underline decoration-cyan-600 decoration-2 underline-offset-8'
                  : ''
              }`
            }
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Home
          </NavLink>

          <NavLink
            to="/lesson"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-xl font-medium text-gray-700 transition-colors duration-200 hover:text-cyan-600 ${
                isActive
                  ? 'text-cyan-700 underline decoration-cyan-600 decoration-2 underline-offset-8'
                  : ''
              }`
            }
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Lesson
          </NavLink>

          <NavLink
            to="/course"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-xl font-medium text-gray-700 transition-colors duration-200 hover:text-cyan-600 ${
                isActive
                  ? 'text-cyan-700 underline decoration-cyan-600 decoration-2 underline-offset-8'
                  : ''
              }`
            }
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Course
          </NavLink>

          {/* Right side - Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link
              to="/signin"
              className="rounded-md border border-cyan-600 px-4 py-2 text-base font-medium text-cyan-600 transition-all duration-200 hover:bg-cyan-50 hover:text-cyan-700"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-cyan-600 px-4 py-2 text-base font-medium text-white transition-colors duration-200 hover:bg-cyan-700"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-cyan-600 focus:text-cyan-600 focus:outline-none"
              aria-label="Open main menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu (hidden by default) */}
        <div className="hidden md:hidden">
          <div className="space-y-1 border-t border-cyan-200 bg-white px-2 pb-3 pt-2 sm:px-3">
            <Link
              to="/"
              className="block rounded-md px-3 py-2 text-lg font-medium text-gray-700 hover:text-cyan-600"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Home
            </Link>
            <Link
              to="/lesson"
              className="block rounded-md px-3 py-2 text-lg font-medium text-gray-700 hover:text-cyan-600"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Lesson
            </Link>
            <Link
              to="/course"
              className="block rounded-md px-3 py-2 text-lg font-medium text-gray-700 hover:text-cyan-600"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Course
            </Link>
            <div className="border-t border-gray-200 pt-2">
              <Link
                to="/signin"
                className="block rounded-md px-3 py-2 text-lg font-medium text-cyan-600 hover:text-cyan-700"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="mt-2 block rounded-md bg-cyan-600 px-3 py-2 text-lg font-medium text-white hover:bg-cyan-700"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
