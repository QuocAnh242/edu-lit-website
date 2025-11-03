import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/shared/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  GraduationCap,
  Clock,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import __helpers from '@/helpers';
import {
  Lesson as BaseLessonType,
  Session as BaseSessionType
} from '@/constants/mock-lessons';
import {
  loadLessonsFromStorage,
  deleteLesson as deleteLessonFromStorage,
  deleteSession as deleteSessionFromStorage
} from '@/utils/lesson-storage';

// Extended types with count properties for UI
interface Session extends BaseSessionType {
  // Count properties for UI
}

interface Lesson extends Omit<BaseLessonType, 'sessions'> {
  sessionsCount: number;
  sessions: Session[];
}

export default function LessonPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [viewAsTeacher, setViewAsTeacher] = useState(false); // Toggle for demo

  // Load lessons from localStorage
  const loadLessons = () => {
    setIsLoading(true);
    // Load from localStorage
    setTimeout(() => {
      const storedLessons = loadLessonsFromStorage();
      const formattedLessons = storedLessons.map((lesson) => ({
        ...lesson,
        sessionsCount: lesson.sessions.length,
        sessions: lesson.sessions
      }));
      setLessons(formattedLessons);
      setIsLoading(false);
    }, 500);
  };

  // Get user role and load lessons
  useEffect(() => {
    const role = __helpers.getUserRole();
    // Auto set viewAsTeacher if user is actually a teacher
    if (role === 'ADMIN' || role === 'TEACHER') {
      setViewAsTeacher(true);
    }

    // Load lessons
    loadLessons();
  }, []);

  const isTeacher = () => {
    // Use toggle for demo purposes
    return viewAsTeacher;
  };

  const handleCreateLesson = () => {
    navigate('/courses/create');
  };

  const handleCreateSession = (lessonId: string) => {
    navigate(`/courses/${lessonId}/create-session`);
  };

  const handleViewSession = (lessonId: string, sessionId: string) => {
    navigate(`/courses/${lessonId}/sessions/${sessionId}`);
  };

  const handleEditLesson = (lessonId: string) => {
    navigate(`/courses/${lessonId}/edit`);
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this course and all its sessions?'
      )
    ) {
      deleteLessonFromStorage(lessonId);
      loadLessons(); // Reload to reflect changes
    }
  };

  const handleEditSession = (lessonId: string, sessionId: string) => {
    navigate(`/courses/${lessonId}/sessions/${sessionId}/edit`);
  };

  const handleDeleteSession = (lessonId: string, sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSessionFromStorage(lessonId, sessionId);
      loadLessons(); // Reload to reflect changes
    }
  };

  return (
    <>
      <style>{`
        html {
          overflow-y: scroll;
          scrollbar-gutter: stable;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="animate-fade-in-up mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 flex items-center gap-2 text-4xl font-bold text-cyan-600">
                <BookOpen className="h-10 w-10 transition-transform hover:scale-110" />
                Literature Syllabus
              </h1>
              <p className="text-lg text-gray-600">
                {isTeacher()
                  ? 'Manage courses details and sessions for Literature Syllabus'
                  : 'View courses details and sessions for Literature Syllabus'}
              </p>
            </div>
            {isTeacher() && (
              <Button
                onClick={handleCreateLesson}
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Create New Course
              </Button>
            )}
          </div>

          {/* Role Toggle & Badge */}
          <div className="animate-slide-in mb-6 flex items-center gap-4">
            <Badge
              variant={isTeacher() ? 'default' : 'secondary'}
              className="text-base transition-all duration-200 hover:scale-105"
            >
              <GraduationCap className="mr-1 h-4 w-4" />
              {isTeacher() ? 'Teacher' : 'Student'}
            </Badge>

            {/* Demo Toggle - Remove in production */}
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2">
              <RefreshCw className="h-4 w-4 text-orange-600" />
              <Label
                htmlFor="role-toggle"
                className="text-sm font-medium text-orange-700"
              >
                Switch View (Demo):
              </Label>
              <Switch
                id="role-toggle"
                checked={viewAsTeacher}
                onCheckedChange={setViewAsTeacher}
              />
              <span className="text-sm font-medium text-orange-700">
                {viewAsTeacher ? 'Teacher' : 'Student'}
              </span>
            </div>
          </div>

          {/* Stats Cards - Only for Teachers */}
          {isTeacher() && !isLoading && lessons.length > 0 && (
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card
                className="animate-scale-in border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.1s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-blue-700">
                    Total Lessons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {lessons.length}
                  </div>
                </CardContent>
              </Card>
              <Card
                className="animate-scale-in border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.2s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-cyan-700">
                    Total Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cyan-600">
                    {lessons.reduce((sum, l) => sum + l.sessionsCount, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card
                className="animate-scale-in border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{ animationDelay: '0.3s', opacity: 0 }}
              >
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-purple-700">
                    Latest Lesson
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-purple-600">
                    {lessons.length > 0
                      ? new Date(
                          lessons[lessons.length - 1].createdAt
                        ).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lessons Accordion */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <BookOpen className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="mb-2 text-xl font-semibold text-gray-700">
                  No Lessons Yet
                </h3>
                <p className="mb-4 text-gray-500">
                  {isTeacher()
                    ? 'Get started by creating your first lesson'
                    : 'Teacher has not created any lessons yet'}
                </p>
                {isTeacher() && (
                  <Button onClick={handleCreateLesson} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create First Lesson
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <Card
                  key={lesson.id}
                  className="animate-slide-in scroll-mt-4 shadow-lg transition-all duration-300 hover:shadow-2xl"
                  style={{
                    animationDelay: `${0.1 * (index + 1)}s`,
                    opacity: 0
                  }}
                >
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value={lesson.id} className="border-none">
                      <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 p-0 text-white">
                        <AccordionTrigger className="w-full px-6 py-4 hover:no-underline [&[data-state=open]>div>svg]:rotate-90">
                          <div className="flex w-full items-start justify-between gap-4">
                            <div className="flex flex-1 items-start gap-4 text-left">
                              <FolderOpen className="mt-1 h-6 w-6 flex-shrink-0 transition-all duration-300 hover:scale-125" />
                              <div className="flex-1">
                                <CardTitle className="mb-2 text-2xl">
                                  {lesson.title}
                                </CardTitle>
                                <p className="text-sm text-blue-100">
                                  {lesson.description}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white transition-all duration-200 hover:scale-105 hover:bg-white/30"
                                  >
                                    📚 {lesson.subject || 'Ngữ Văn'}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white transition-all duration-200 hover:scale-105 hover:bg-white/30"
                                  >
                                    🎓 {lesson.grade}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white transition-all duration-200 hover:scale-105 hover:bg-white/30"
                                  >
                                    📅 {lesson.semester}
                                  </Badge>
                                  <Badge
                                    variant="secondary"
                                    className="bg-white/20 text-white transition-all duration-200 hover:scale-105 hover:bg-white/30"
                                  >
                                    📖 {lesson.sessionsCount} Sessions
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Lesson Actions */}
                            {isTeacher() && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditLesson(lesson.id);
                                  }}
                                  className="text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
                                  title="Edit Course"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(lesson.id);
                                  }}
                                  className="text-white transition-all duration-200 hover:scale-110 hover:bg-white/20"
                                  title="Delete Course"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </AccordionTrigger>
                      </CardHeader>

                      <AccordionContent className="pb-0 transition-all duration-300 ease-in-out">
                        <CardContent className="space-y-4 pt-6">
                          {/* Create Session Button */}
                          {isTeacher() && (
                            <div className="flex justify-end">
                              <Button
                                onClick={() => handleCreateSession(lesson.id)}
                                variant="outline"
                                className="gap-2 border-slate-300 transition-all duration-200 hover:scale-105 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                                size="sm"
                              >
                                <Plus className="h-4 w-4" />
                                Create New Session
                              </Button>
                            </div>
                          )}

                          {/* Sessions List */}
                          {lesson.sessions.length === 0 ? (
                            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
                              <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                              <p className="font-medium text-slate-600">
                                No sessions in this lesson yet.
                              </p>
                              {isTeacher() && (
                                <p className="mt-1 text-sm text-slate-500">
                                  Click "Create New Session" to add one.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {lesson.sessions.map((session, index) => (
                                <div
                                  key={session.id}
                                  className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-md"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="mb-2 flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="border-blue-200 bg-blue-50 text-blue-700 transition-all duration-200 hover:scale-110"
                                        >
                                          #{index + 1}
                                        </Badge>
                                        <h4 className="font-semibold text-slate-800 transition-colors duration-200 group-hover:text-blue-700">
                                          {session.title}
                                        </h4>
                                      </div>
                                      <p className="mb-3 text-sm leading-relaxed text-slate-600">
                                        {session.description}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="h-4 w-4 text-slate-400" />
                                          <span>{session.duration}</span>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                          Created:{' '}
                                          {new Date(
                                            session.createdAt
                                          ).toLocaleDateString('vi-VN')}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Session Actions */}
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          handleViewSession(
                                            lesson.id,
                                            session.id
                                          )
                                        }
                                        title="View Session"
                                        className="transition-all duration-200 hover:scale-110 hover:bg-blue-50"
                                      >
                                        <Eye className="h-4 w-4 text-blue-600" />
                                      </Button>

                                      {isTeacher() && (
                                        <>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              handleEditSession(
                                                lesson.id,
                                                session.id
                                              )
                                            }
                                            title="Edit Session"
                                            className="transition-all duration-200 hover:scale-110 hover:bg-green-50"
                                          >
                                            <Edit className="h-4 w-4 text-green-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              handleDeleteSession(
                                                lesson.id,
                                                session.id
                                              )
                                            }
                                            title="Delete Session"
                                            className="transition-all duration-200 hover:scale-110 hover:bg-red-50"
                                          >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>
              ))}
            </div>
          )}

          {/* Student View Info */}
          {!isTeacher() && lessons.length > 0 && (
            <div className="mt-8">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <p className="text-sm text-blue-700">
                    💡 <strong>Note:</strong> You are viewing as a student.
                    Click on lesson titles to expand and view sessions. Use the{' '}
                    <Eye className="mx-1 inline h-4 w-4" /> icon to view session
                    details.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
