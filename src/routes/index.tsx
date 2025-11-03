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
const CreateQuestionPage = lazy(() => import('@/pages/CreateQuestionPage'));
const QuestionsPage = lazy(() => import('@/pages/QuestionsPage'));
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
