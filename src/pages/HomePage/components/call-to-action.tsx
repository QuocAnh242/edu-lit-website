import { Link } from 'react-router-dom';

export function CallToAction() {
  return (
    <section className="bg-cyan-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-cyan-200 bg-white p-8 text-center shadow-sm">
          <h2
            className="text-3xl font-extrabold text-gray-900"
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Join EduLit today
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Start exploring literature lessons and courses. Sign up to enroll,
            submit work, and get insightful feedback.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="rounded-md bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-cyan-700"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Create free account
            </Link>
            <Link
              to="/signin"
              className="rounded-md border border-cyan-600 px-6 py-3 text-base font-semibold text-cyan-600 transition-all hover:bg-cyan-50"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
