import React from 'react';
import Navbar from '../../components/shared/navbar';

const LessonPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1
            className="mb-4 text-4xl font-bold text-cyan-600"
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Lessons
          </h1>
          <p
            className="mx-auto max-w-2xl text-lg text-gray-600"
            style={{ fontFamily: 'LatoBlack, sans-serif' }}
          >
            Explore our comprehensive collection of educational lessons designed
            to enhance your learning experience.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder lesson cards */}
          {[1, 2, 3, 4, 5, 6].map((lesson) => (
            <div
              key={lesson}
              className="rounded-lg border border-cyan-100 bg-white p-6 shadow-md transition-shadow duration-200 hover:shadow-lg"
            >
              <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-cyan-100">
                <span
                  className="text-lg font-medium text-cyan-600"
                  style={{ fontFamily: 'LatoBlack, sans-serif' }}
                >
                  Lesson {lesson} Image
                </span>
              </div>
              <h3
                className="mb-2 text-xl font-semibold text-gray-800"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Lesson Title {lesson}
              </h3>
              <p
                className="mb-4 text-gray-600"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Brief description of the lesson content and learning objectives.
              </p>
              <button
                className="w-full rounded-md bg-cyan-600 px-4 py-2 text-white transition-colors duration-200 hover:bg-cyan-700"
                style={{ fontFamily: 'LatoBlack, sans-serif' }}
              >
                Start Lesson
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LessonPage;
