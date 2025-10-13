import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-12 border-t-2 border-cyan-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
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
                className="text-3xl font-bold text-cyan-600"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                EduLit
              </span>
            </Link>
            <p className="max-w-sm text-gray-600">
              A literature education website for teachers, students and everyone
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="mb-4 text-lg font-bold text-gray-800"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-700 transition-colors hover:text-cyan-600"
                >
                  Home Page
                </Link>
              </li>
              <li>
                <Link
                  to="/lesson"
                  className="text-gray-700 transition-colors hover:text-cyan-600"
                >
                  Lesson
                </Link>
              </li>
              <li>
                <Link
                  to="/course"
                  className="text-gray-700 transition-colors hover:text-cyan-600"
                >
                  Course
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3
              className="mb-4 text-lg font-bold text-gray-800"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/signin"
                  className="text-gray-700 transition-colors hover:text-cyan-600"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="text-gray-700 transition-colors hover:text-cyan-600"
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="mb-4 text-lg font-bold text-gray-800"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Contact
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li>EduLitPRN@gmail.com</li>
              <li>+98 12345678</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between border-t border-cyan-200 pt-6 md:flex-row">
          <p className="text-sm text-gray-500">
            © 2025 <span className="font-medium">EduLit</span>. All rights
            reserved.
          </p>
          <div className="mt-4 flex items-center space-x-6 md:mt-0">
            <Link
              to="/privacy"
              className="text-sm text-gray-600 transition-colors hover:text-cyan-600"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm text-gray-600 transition-colors hover:text-cyan-600"
            >
              Terms of Service
            </Link>
            <Link
              to="/cookies"
              className="text-sm text-gray-600 transition-colors hover:text-cyan-600"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
