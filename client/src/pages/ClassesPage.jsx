import { useState, useEffect } from 'react';
import api from '../services/api';

export default function ClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data.classes);
    } catch (err) {
      setError('Failed to load classes');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Classes</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map(cls => (
            <div key={cls.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{cls.name}</h2>
                {cls.description && (
                  <p className="text-gray-600 mb-4">{cls.description}</p>
                )}
                <div className="space-y-2 text-sm text-gray-500">
                  {cls.teacher_name && (
                    <p>
                      <span className="font-medium">Teacher:</span> {cls.teacher_name}
                    </p>
                  )}
                  {cls.schedule && (
                    <p>
                      <span className="font-medium">Schedule:</span> {cls.schedule}
                    </p>
                  )}
                  {cls.room && (
                    <p>
                      <span className="font-medium">Room:</span> {cls.room}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Students:</span> {cls.student_count}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No classes available.</p>
        </div>
      )}
    </div>
  );
}
