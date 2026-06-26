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
