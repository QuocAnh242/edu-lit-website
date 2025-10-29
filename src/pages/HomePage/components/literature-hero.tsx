import { Link } from 'react-router-dom';

export function LiteratureHero() {
  return (
    <section className="border-b-2 border-cyan-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1
              className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Learn Literature with EduLit
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Explore curated lessons and structured courses created by
              teachers. Students can enroll, learn at their own pace, and
              leverage AI-powered grading with built-in plagiarism checks.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/lesson"
                className="rounded-md bg-cyan-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-cyan-700"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Browse Lessons
              </Link>
              <Link
                to="/course"
                className="rounded-md border border-cyan-600 px-6 py-3 text-base font-semibold text-cyan-600 transition-all hover:bg-cyan-50"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Explore Courses
              </Link>
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-cyan-600" />
                Trusted by teachers
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-cyan-600" />
                Loved by students
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-cyan-50" />
            <img
              src="/Logo2.png"
              alt="EduLit Illustration"
              className="mx-auto h-64 w-64 rounded-2xl object-contain shadow-lg md:h-80 md:w-80"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
