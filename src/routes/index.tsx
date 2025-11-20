import NotFound from '@/pages/not-found';
import { Suspense, lazy } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
// import ProtectedRoute from './ProtectedRoute';

const DashboardLayout = lazy(
  () => import('@/components/layout/dashboard-layout')
);

const SignInPage = lazy(() => import('@/pages/auth/signin'));
const SignUpPage = lazy(() => import('@/pages/auth/signup'));
const HomePage = lazy(() => import('@/pages/HomePage/index'));
const LessonPage = lazy(() => import('@/pages/SyllabusPage/index'));
const CoursePage = lazy(() => import('@/pages/Course/index'));
const UserProfilePage = lazy(() => import('@/pages/UserProfile/index'));
const CreateQuestionPage = lazy(() => import('@/pages/CreateQuestionPage'));
const QuestionsPage = lazy(() => import('@/pages/QuestionsPage'));
const ViewQuestionPage = lazy(() => import('@/pages/ViewQuestionPage'));
const EditQuestionPage = lazy(() => import('@/pages/EditQuestionPage'));
const AssessmentPage = lazy(() => import('@/pages/AssessmentPage'));
const CreateLessonPage = lazy(
  () => import('@/pages/SyllabusPage/CreateLessonPage')
);
const EditLessonPage = lazy(
  () => import('@/pages/SyllabusPage/EditLessonPage')
);
const CreateSessionPage = lazy(
  () => import('@/pages/SyllabusPage/CreateSessionPage')
);
const EditSessionPage = lazy(
  () => import('@/pages/SyllabusPage/EditSessionPage')
);
const ViewSessionPage = lazy(
  () => import('@/pages/SyllabusPage/ViewSessionPage')
);
const SessionsPage = lazy(() => import('@/pages/SessionsPage'));
const LessonContextPage = lazy(() => import('@/pages/LessonContext'));
const LessonContextsPage = lazy(
  () => import('@/pages/LessonContextsPage/LessonContextsPage')
);
const ActivitiesPage = lazy(
  () => import('@/pages/ActivitiesPage/ActivitiesPage')
);
// ----------------------------------------------------------------------

export default function AppRouter() {
  const dashboardRoutes = [
    {
      // element: (
      //   <DashboardLayout>
      //     <Suspense>
      //       {/* <Outlet /> */}
      //     </Suspense>
      //   </DashboardLayout>
      // ),
      element: <Outlet />,
      children: [
        {
          path: '/',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <HomePage />
            </Suspense>
          ),
          index: true
        },
        {
          path: '/profile',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <UserProfilePage />
            </Suspense>
          )
        },
        {
          path: '/syllabus',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <LessonPage />
            </Suspense>
          )
        },
        {
          path: '/course',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <CoursePage />
            </Suspense>
          )
        },
        {
          path: '/questions',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <QuestionsPage />
            </Suspense>
          )
        },
        {
          path: '/questions/create',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <CreateQuestionPage />
            </Suspense>
          )
        },
        {
          path: '/questions/:questionId',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <ViewQuestionPage />
            </Suspense>
          )
        },
        {
          path: '/questions/edit/:questionId',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <EditQuestionPage />
            </Suspense>
          )
        },
        {
          path: '/assessments',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <AssessmentPage />
            </Suspense>
          )
        },
        {
          path: '/courses/create',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <CreateLessonPage />
            </Suspense>
          )
        },
        {
          path: '/courses/:lessonId/edit',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <EditLessonPage />
            </Suspense>
          )
        },
        {
          path: '/course/:courseId/sessions',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <SessionsPage />
            </Suspense>
          )
        },
        {
          path: '/courses/:lessonId/create-session',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <CreateSessionPage />
            </Suspense>
          )
        },
        {
          path: '/courses/:lessonId/sessions/:sessionId/edit',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <EditSessionPage />
            </Suspense>
          )
        },
        {
          path: '/courses/:lessonId/sessions/:sessionId',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <ViewSessionPage />
            </Suspense>
          )
        },
        {
          path: '/courses/:lessonId/sessions/:sessionId/edit',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <EditSessionPage />
            </Suspense>
          )
        },
        {
          path: '/session/:sessionId/lesson-contexts',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <LessonContextPage />
            </Suspense>
          )
        },
        {
          path: '/session/:sessionId/lessoncontexts',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <LessonContextsPage />
            </Suspense>
          )
        },
        {
          path: '/lessoncontext/:lessonContextId/activities',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <ActivitiesPage />
            </Suspense>
          )
        }
      ]
    }
  ];

  const publicRoutes = [
    {
      path: '/signin',
      element: <SignInPage />
    },
    {
      path: '/signup',
      element: <SignUpPage />
    },
    {
      path: '/404',
      element: <NotFound />
    }
    // {
    //   path: '*',
    //   element: <Navigate to="/404" replace />
    // }
  ];

  const routes = useRoutes([...dashboardRoutes, ...publicRoutes]);

  return routes;
}
