import React, { useState, useEffect } from 'react';
import Navbar from '../../components/shared/navbar';
import { loadLessonsFromStorage } from '@/utils/lesson-storage';
import { Lesson } from '@/constants/mock-lessons';
import { X, BookOpen, Clock, FileText } from 'lucide-react';

const CoursePage = () => {
  const [courses, setCourses] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Lesson | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Load courses from localStorage
    const loadedCourses = loadLessonsFromStorage();
    setCourses(loadedCourses);
  }, []);

  const handleViewCourse = (course: Lesson) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedCourse(null), 300);
  };

  return (
    <>
      <style>{`
        html {
          overflow-y: scroll;
          scrollbar-gutter: stable;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
        .animate-slide-in { animation: slideIn 0.4s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out forwards; }
      `}</style>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-fade-in-up text-center">
            <h1
              className="mb-4 text-4xl font-bold text-cyan-600"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Courses
            </h1>
            <p
              className="mx-auto max-w-2xl text-lg text-gray-600"
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              Discover our structured courses that provide comprehensive
              learning paths for your educational journey.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {courses.length === 0 ? (
              <div className="animate-fade-in-up col-span-full py-12 text-center">
                <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <p
                  className="text-lg text-gray-500"
                  style={{ fontFamily: 'LatoBlack, sans-serif' }}
                >
                  No courses available yet. Create your first course to get
                  started!
                </p>
              </div>
            ) : (
              courses.map((course, index) => (
                <div
                  key={course.id}
                  className="animate-scale-in flex flex-col rounded-lg border border-cyan-100 bg-white p-6 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  style={{
                    animationDelay: `${0.1 * (index + 1)}s`,
                    opacity: 0
                  }}
                >
                  <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-cyan-100">
                    <span
                      className="text-lg font-medium text-cyan-600"
                      style={{ fontFamily: 'LatoBlack, sans-serif' }}
                    >
                      {course.subject || 'Course'} Image
                    </span>
                  </div>
                  <h3
                    className="mb-2 min-h-[2rem] text-xl font-semibold text-gray-800"
                    style={{ fontFamily: 'LatoBlack, sans-serif' }}
                  >
                    {course.title}
                  </h3>
                  <p
                    className="mb-4 line-clamp-3 min-h-[4.5rem] flex-grow text-gray-600"
                    style={{ fontFamily: 'LatoBlack, sans-serif' }}
                  >
                    {course.description ||
                      'Comprehensive course covering essential topics with practical applications and real-world examples.'}
                  </p>
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="text-sm text-gray-500"
                      style={{ fontFamily: 'LatoBlack, sans-serif' }}
                    >
                      {course.grade} - {course.semester}
                    </span>
                    <span
                      className="text-sm font-medium text-cyan-600"
                      style={{ fontFamily: 'LatoBlack, sans-serif' }}
                    >
                      ★ 4.8
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewCourse(course)}
                    className="w-full rounded-md bg-cyan-600 px-4 py-2 text-white shadow-md transition-all duration-300 hover:scale-105 hover:bg-cyan-700 hover:shadow-lg"
                    style={{ fontFamily: 'LatoBlack, sans-serif' }}
                  >
                    View Course
                  </button>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Modal for viewing course sessions */}
        {showModal && selectedCourse && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity duration-300"
            onClick={handleCloseModal}
          >
            <div
              className="animate-scale-in relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ fontFamily: 'LatoBlack, sans-serif' }}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="mb-2 text-2xl font-bold">
                      {selectedCourse.title}
                    </h2>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="rounded bg-white/20 px-2 py-1">
                        {selectedCourse.grade}
                      </span>
                      <span className="rounded bg-white/20 px-2 py-1">
                        {selectedCourse.semester}
                      </span>
                      <span className="rounded bg-white/20 px-2 py-1">
                        {selectedCourse.subject}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="ml-4 rounded-full p-1 transition-all duration-200 hover:scale-110 hover:bg-white/20"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                {selectedCourse.description && (
                  <p className="mt-3 text-sm text-white/90">
                    {selectedCourse.description}
                  </p>
                )}
              </div>

              {/* Modal Content - Sessions */}
              <div className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-cyan-600" />
                  <h3 className="text-xl font-semibold text-gray-800">
                    Course Sessions ({selectedCourse.sessions.length})
                  </h3>
                </div>

                {selectedCourse.sessions.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-lg text-gray-500">
                      No sessions available for this course yet.
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      Sessions will appear here once they are created.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedCourse.sessions.map((session, index) => (
                      <div
                        key={session.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-5 transition-all duration-300 hover:scale-105 hover:border-cyan-300 hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                                {index + 1}
                              </span>
                              <h4 className="text-lg font-semibold text-gray-800">
                                {session.title}
                              </h4>
                            </div>
                            {session.description && (
                              <p className="mb-3 text-gray-600">
                                {session.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {session.duration}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  onClick={handleCloseModal}
                  className="w-full rounded-md bg-gray-600 px-4 py-2 text-white transition-all duration-200 hover:scale-105 hover:bg-gray-700 hover:shadow-md sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CoursePage;
