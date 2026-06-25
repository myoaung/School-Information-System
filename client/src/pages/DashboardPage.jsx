import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user, isAdmin, isTeacher } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user.name}!</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Role:</span> <span className="capitalize">{user.role}</span></p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/announcements"
              className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
            >
              View Announcements
            </Link>
            <Link
              to="/classes"
              className="block w-full text-center bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700"
            >
              View Classes
            </Link>
          </div>
        </div>

        {/* Admin/Teacher Actions */}
        {(isAdmin || isTeacher) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Management</h2>
            <div className="space-y-3">
              {isAdmin && (
                <Link
                  to="/admin/announcements"
                  className="block w-full text-center bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                >
                  Manage Announcements
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin/classes"
                  className="block w-full text-center bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
                >
                  Manage Classes
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
