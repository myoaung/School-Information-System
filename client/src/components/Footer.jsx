import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">SchoolHub</h3>
            <p className="text-gray-400 text-sm">
              Your one-stop platform for school announcements, class information, and staying connected with your school community.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/announcements" className="text-gray-400 hover:text-white text-sm">
                  Announcements
                </Link>
              </li>
              <li>
                <Link to="/classes" className="text-gray-400 hover:text-white text-sm">
                  Classes
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white text-sm">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>123 School Street</li>
              <li>City, State 12345</li>
              <li>Email: info@schoolhub.com</li>
              <li>Phone: (555) 123-4567</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} SchoolHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
