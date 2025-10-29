import { Link } from 'react-router-dom';

export function Features() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2
          className="text-center text-3xl font-extrabold text-gray-900"
          style={{ fontFamily: 'LatoBlack, sans-serif' }}
        >
          What You Can Do with EduLit
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-center text-gray-600">
          EduLit combines engaging content and smart tools to enhance teaching
          and learning literature.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group rounded-xl border border-cyan-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M6 2a2 2 0 00-2 2v15a3 3 0 013 3h13V4a2 2 0 00-2-2H6zM7 20a1 1 0 00-1 1h11v-1H7z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Teacher‑Made Lessons
            </h3>
            <p className="mt-2 text-gray-600">
              Structured lesson plans crafted by educators, aligned with
              learning goals.
            </p>
            <Link
              to="/lesson"
              className="mt-4 inline-block text-cyan-700 hover:underline"
            >
              View lessons →
            </Link>
          </div>

          <div className="group rounded-xl border border-cyan-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M12 2L1 7l11 5 9-4.091V17h2V7L12 2zm0 13L1 10v4l11 5 11-5v-4l-11 5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Guided Courses
            </h3>
            <p className="mt-2 text-gray-600">
              Multi‑lesson courses with clear outcomes, assignments, and reading
              lists.
            </p>
            <Link
              to="/course"
              className="mt-4 inline-block text-cyan-700 hover:underline"
            >
              Explore courses →
            </Link>
          </div>

          <div className="group rounded-xl border border-cyan-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0v1H5v-1z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Enroll & Track Progress
            </h3>
            <p className="mt-2 text-gray-600">
              Students enroll easily and see progress, deadlines, and feedback
              in one place.
            </p>
          </div>

          <div className="group rounded-xl border border-cyan-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M9 3H7v2H5v2H3v2h2v2H3v2h2v2H3v2h2v2h2v2h2v-2h2v2h2v-2h2v-2h2v-2h-2v-2h2V9h-2V7h2V5h-2V3h-2v2h-2V3h-2v2H9V3zm0 6h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              AI‑Assisted Grading
            </h3>
            <p className="mt-2 text-gray-600">
              Receive rubric‑aligned feedback and faster grading assistance for
              essays.
            </p>
          </div>

          <div className="group rounded-xl border border-cyan-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3zm-1 13l6-6-1.41-1.41L11 11.17 8.41 8.59 7 10l4 5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Plagiarism Check
            </h3>
            <p className="mt-2 text-gray-600">
              Automatic similarity detection ensures academic integrity across
              submissions.
            </p>
          </div>

          <div className="group rounded-xl border border-cyan-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6"
              >
                <path d="M4 2h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V4a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-900">
              Teacher & Student Community
            </h3>
            <p className="mt-2 text-gray-600">
              Discuss texts, share insights, and collaborate on assignments.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
