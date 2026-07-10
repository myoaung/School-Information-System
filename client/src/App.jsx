import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { FontProvider } from './context/FontContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded page components — each becomes its own chunk
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const AnnouncementDetailPage = lazy(() => import('./pages/AnnouncementDetailPage'));
const ClassesPage = lazy(() => import('./pages/ClassesPage'));
const CurriculumPage = lazy(() => import('./pages/CurriculumPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ChatLogsPage = lazy(() => import('./pages/ChatLogsPage'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'));
const TeachersPage = lazy(() => import('./pages/TeachersPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const TimetablePage = lazy(() => import('./pages/TimetablePage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const AssignmentsPage = lazy(() => import('./pages/AssignmentsPage'));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'));
const GradebookPage = lazy(() => import('./pages/GradebookPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const AcademicPage = lazy(() => import('./pages/AcademicPage'));
const ParentPortalPage = lazy(() => import('./pages/ParentPortalPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const TeacherWorkloadPage = lazy(() => import('./pages/TeacherWorkloadPage'));

function App() {
  return (
    <AuthProvider>
      <FontProvider>
        <ErrorBoundary>
          <Router>
            <Toaster position="top-right" richColors closeButton duration={4000} />
            <div className="min-h-screen flex flex-col">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
              >
                Skip to main content
              </a>
              <Navbar />
              <main id="main-content" className="flex-grow">
                <Suspense
                  fallback={
                    <div className="flex justify-center items-center min-h-[60vh]">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/announcements" element={<AnnouncementsPage />} />
                    <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
                    <Route path="/classes" element={<ClassesPage />} />
                    <Route path="/curriculum" element={<CurriculumPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/chat-logs"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <ChatLogsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/audit-logs"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <AuditLogsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/students"
                      element={
                        <ProtectedRoute>
                          <StudentsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/students/:id"
                      element={
                        <ProtectedRoute>
                          <StudentDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teachers"
                      element={
                        <ProtectedRoute>
                          <TeachersPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/attendance"
                      element={
                        <ProtectedRoute>
                          <AttendancePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/timetable"
                      element={
                        <ProtectedRoute>
                          <TimetablePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/courses"
                      element={
                        <ProtectedRoute>
                          <CoursesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/courses/:id"
                      element={
                        <ProtectedRoute>
                          <CourseDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assignments"
                      element={
                        <ProtectedRoute>
                          <AssignmentsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/quizzes"
                      element={
                        <ProtectedRoute>
                          <QuizzesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/gradebook"
                      element={
                        <ProtectedRoute>
                          <GradebookPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <ProtectedRoute>
                          <ReportsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/resources"
                      element={
                        <ProtectedRoute>
                          <ResourcesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/academic"
                      element={
                        <ProtectedRoute>
                          <AcademicPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/parent"
                      element={
                        <ProtectedRoute requiredRole="parent">
                          <ParentPortalPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/messages"
                      element={
                        <ProtectedRoute>
                          <MessagesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/finance"
                      element={
                        <ProtectedRoute>
                          <FinancePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/certificates"
                      element={
                        <ProtectedRoute>
                          <CertificatesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute>
                          <AnalyticsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teacher-workload"
                      element={
                        <ProtectedRoute requiredRole="admin">
                          <TeacherWorkloadPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <ChatWidget />
            </div>
          </Router>
        </ErrorBoundary>
      </FontProvider>
    </AuthProvider>
  );
}

export default App;
