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
const LessonPage = lazy(() => import('@/pages/LessonPage/index'));
const CoursePage = lazy(() => import('@/pages/Course/index'));
const CreateQuestionPage = lazy(() => import('@/pages/CreateQuestionPage'));
const QuestionsPage = lazy(() => import('@/pages/QuestionsPage'));
const CreateLessonPage = lazy(
  () => import('@/pages/LessonPage/CreateLessonPage')
);
const EditLessonPage = lazy(() => import('@/pages/LessonPage/EditLessonPage'));
const CreateSessionPage = lazy(
  () => import('@/pages/LessonPage/CreateSessionPage')
);
const EditSessionPage = lazy(
  () => import('@/pages/LessonPage/EditSessionPage')
);
const ViewSessionPage = lazy(
  () => import('@/pages/LessonPage/ViewSessionPage')
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
          path: '/lessons',
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
          path: '/lessons/create',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <CreateLessonPage />
            </Suspense>
          )
        },
        {
          path: '/lessons/:lessonId/edit',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <EditLessonPage />
            </Suspense>
          )
        },
        {
          path: '/lessons/:lessonId/create-session',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <CreateSessionPage />
            </Suspense>
          )
        },
        {
          path: '/lessons/:lessonId/sessions/:sessionId/edit',
          element: (
            <Suspense fallback={<div>Loading...</div>}>
              <EditSessionPage />
            </Suspense>
          )
        },
        {
          path: '/lessons/:lessonId/sessions/:sessionId',
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
