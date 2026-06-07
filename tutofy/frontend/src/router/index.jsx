import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminCourses from '../pages/admin/AdminCourses';
import AdminPayments from '../pages/admin/AdminPayments';
import AdminTutorApplications from '../pages/admin/AdminTutorApplications';

import Landing from '../pages/public/Landing';
import Marketplace from '../pages/public/Marketplace';
import TutorProfile from '../pages/public/TutorProfile';
import Login from '../pages/auth/Login';
import RegisterStudent from '../pages/auth/RegisterStudent';
import RegisterTutor from '../pages/auth/RegisterTutor';
import VerifyEmail from '../pages/auth/VerifyEmail';
import StudentDashboard from '../pages/student/StudentDashboard';
import MyCourses from '../pages/student/MyCourses';
import CourseView from '../pages/student/CourseView';
import LessonView from '../pages/student/LessonView';
import Schedule from '../pages/student/Schedule';
import Messages from '../pages/student/Messages';
import Progress from '../pages/student/Progress';
import Assignments from '../pages/student/Assignments';
import TutorDashboard from '../pages/tutor/TutorDashboard';
import TutorProfileSetup from '../pages/tutor/TutorProfileSetup';
import TutorCourseView from '../pages/tutor/TutorCourseView';
import EditCourse from '../pages/tutor/EditCourse';
import StudentsInCourse from '../pages/tutor/StudentsInCourse';
import CreateCourse from '../pages/tutor/CreateCourse';
import GradeAssignment from '../pages/tutor/GradeAssignment';
import TutorMessages from '../pages/tutor/TutorMessages';
import TutorStudents from '../pages/tutor/TutorStudents';
import TutorGrading from '../pages/tutor/TutorGrading';
import TutorCourses from '../pages/tutor/TutorCourses';
import TutorSchedule from '../pages/tutor/TutorSchedule';
import CourseAttendance from '../pages/tutor/CourseAttendance';
import StudentProfile from '../pages/tutor/StudentProfile';
import CreateQuiz from '../pages/tutor/CreateQuiz';
import EditQuiz from '../pages/tutor/EditQuiz';
import QuizResults from '../pages/tutor/QuizResults';
import TutorPublicProfile from '../pages/tutor/TutorPublicProfile';
import TutorCertificates from '../pages/tutor/TutorCertificates';
import PaymentPage from '../pages/student/PaymentPage';
import QuizAttempt from '../pages/student/QuizAttempt';
import QuizCoverView from '../pages/student/QuizCoverView';
import Certificates from '../pages/student/Certificates';
import StudentMarketplace from '../pages/student/StudentMarketplace';
import StudentTutorProfile from '../pages/student/StudentTutorProfile';
import StudentSettings from '../pages/student/StudentSettings';
import JoinParent from '../pages/auth/JoinParent';
import GoogleCallback from '../pages/auth/GoogleCallback';
import ParentDashboard from '../pages/parent/ParentDashboard';

const s  = (el) => <ProtectedRoute role="student">{el}</ProtectedRoute>;
const t  = (el) => <ProtectedRoute role="tutor">{el}</ProtectedRoute>;
const a  = (el) => <ProtectedRoute role="admin">{el}</ProtectedRoute>;
const p  = (el) => <ProtectedRoute>{el}</ProtectedRoute>;
const par = (el) => <ProtectedRoute role="parent">{el}</ProtectedRoute>;

const router = createBrowserRouter([
  { path: '/',                  element: <Landing /> },
  { path: '/tutors',            element: <Marketplace /> },
  { path: '/tutors/:id',        element: <TutorProfile /> },
  { path: '/login',             element: <Login /> },
  { path: '/register',          element: <RegisterStudent /> },
  { path: '/become-tutor',      element: <RegisterTutor /> },
  { path: '/verify-email',      element: <VerifyEmail /> },
  { path: '/join-parent',       element: <JoinParent /> },
  { path: '/google/callback',   element: <GoogleCallback /> },

  { path: '/payment',                                element: p(<PaymentPage />) },

  { path: '/student/dashboard',                      element: s(<StudentDashboard />) },
  { path: '/student/courses',                        element: s(<MyCourses />) },
  { path: '/student/courses/:id',                    element: s(<CourseView />) },
  { path: '/student/courses/:id/lessons/:lessonId',  element: s(<LessonView />) },
  { path: '/student/courses/:id/quizzes/:quizId',         element: s(<QuizCoverView />) },
  { path: '/student/courses/:id/quizzes/:quizId/attempt', element: <QuizAttempt /> },
  { path: '/student/assignments',                    element: s(<Assignments />) },
  { path: '/student/schedule',                       element: s(<Schedule />) },
  { path: '/student/marketplace',                    element: s(<StudentMarketplace />) },
  { path: '/student/tutors/:id',                     element: s(<StudentTutorProfile />) },
  { path: '/student/messages',                       element: s(<Messages />) },
  { path: '/student/progress',                       element: s(<Progress />) },
  { path: '/student/certificates',                   element: s(<Certificates />) },
  { path: '/student/settings',                       element: s(<StudentSettings />) },

  { path: '/tutor/dashboard',                        element: t(<TutorDashboard />) },
  { path: '/tutor/profile',                          element: t(<TutorProfileSetup />) },
  { path: '/tutor/courses',                          element: t(<TutorCourses />) },
  { path: '/tutor/courses/:id',                      element: t(<TutorCourseView />) },
  { path: '/tutor/courses/:id/edit',                 element: t(<EditCourse />) },
  { path: '/tutor/courses/:id/students',             element: t(<StudentsInCourse />) },
  { path: '/tutor/courses/:id/attendance',           element: t(<CourseAttendance />) },
  { path: '/tutor/courses/:id/quizzes/new',             element: t(<CreateQuiz />) },
  { path: '/tutor/courses/:id/quizzes/:quizId/edit',   element: t(<EditQuiz />) },
  { path: '/tutor/courses/:id/quizzes/:quizId/results',element: t(<QuizResults />) },
  { path: '/tutor/courses/new',                      element: t(<CreateCourse />) },
  { path: '/tutor/assignments/:id/grade',            element: t(<GradeAssignment />) },
  { path: '/tutor/messages',                         element: t(<TutorMessages />) },
  { path: '/tutor/students',                         element: t(<TutorStudents />) },
  { path: '/tutor/students/:studentId',              element: t(<StudentProfile />) },
  { path: '/tutor/grading',                          element: t(<TutorGrading />) },
  { path: '/tutor/schedule',                          element: t(<TutorSchedule />) },
  { path: '/tutor/history',                          element: t(<TutorDashboard />) },
  { path: '/tutor/public-profile',                   element: t(<TutorPublicProfile />) },
  { path: '/tutor/certificates',                     element: t(<TutorCertificates />) },

  { path: '/parent/dashboard',  element: p(<ParentDashboard />) },

  { path: '/admin/dashboard',  element: a(<AdminDashboard />) },
  { path: '/admin/users',      element: a(<AdminUsers />) },
  { path: '/admin/courses',    element: a(<AdminCourses />) },
  { path: '/admin/payments',   element: a(<AdminPayments />) },
  { path: '/admin/tutors',     element: a(<AdminTutorApplications />) },
]);

export default router;
