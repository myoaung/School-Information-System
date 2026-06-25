import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import AnnouncementCard from '../components/AnnouncementCard';

export default function HomePage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements')
      .then(res => {
        setAnnouncements(res.data.announcements.slice(0, 3));
      })
      .catch(err => console.error('Error fetching announcements:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to SchoolHub
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Stay connected with your school community. Access announcements, class information, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/announcements"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold text-lg"
            >
              View Announcements
            </Link>
            <Link
              to="/register"
              className="border-2 border-white text-white hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why SchoolHub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-4xl mb-4">📢</div>
              <h3 className="text-xl font-semibold mb-2">Stay Informed</h3>
              <p className="text-gray-600">
                Never miss an important announcement. All updates in one place.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-4xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Class Information</h3>
              <p className="text-gray-600">
                Access schedules, notices, and important documents for your classes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-blue-600 text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Connect</h3>
              <p className="text-gray-600">
                Bridge the gap between students, teachers, and parents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Announcements */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Recent Announcements</h2>
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {announcements.map(announcement => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No announcements yet.</p>
          )}
          <div className="text-center mt-8">
            <Link
              to="/announcements"
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              View All Announcements →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
