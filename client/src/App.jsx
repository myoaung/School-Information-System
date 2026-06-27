import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FontProvider } from './context/FontContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AnnouncementDetailPage from './pages/AnnouncementDetailPage';
import ClassesPage from './pages/ClassesPage';
import CurriculumPage from './pages/CurriculumPage';
import ContactPage from './pages/ContactPage';
import ChatLogsPage from './pages/ChatLogsPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import TeachersPage from './pages/TeachersPage';
import AttendancePage from './pages/AttendancePage';
import TimetablePage from './pages/TimetablePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import AssignmentsPage from './pages/AssignmentsPage';
import QuizzesPage from './pages/QuizzesPage';
import GradebookPage from './pages/GradebookPage';
import ReportsPage from './pages/ReportsPage';
import ResourcesPage from './pages/ResourcesPage';
import AcademicPage from './pages/AcademicPage';
import ChatWidget from './components/ChatWidget';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <FontProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
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
              </Routes>
            </main>
            <Footer />
            <ChatWidget />
          </div>
        </Router>
      </FontProvider>
    </AuthProvider>
  );
}

export default App;
