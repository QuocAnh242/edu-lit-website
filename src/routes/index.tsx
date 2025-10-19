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
const LessonPage = lazy(() => import('@/pages/Lesson/index'));
const CoursePage = lazy(() => import('@/pages/Course/index'));
// ----------------------------------------------------------------------

export default function AppRouter() {
  const dashboardRoutes = [
    {
      element: (
        <DashboardLayout>
          <Suspense>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        {
          path: '/',
          element: <HomePage />,
          index: true
        },
        {
          path: '/lesson',
          element: <LessonPage />
        },
        {
          path: '/course',
          element: <CoursePage />
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
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />
    }
  ];

  const routes = useRoutes([...dashboardRoutes, ...publicRoutes]);

  return routes;
}
