import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const CreateAnnouncementForm: React.FC = () => {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    jobType: '',
    salary: '', // Optional
    requirements: '',
    benefits: '', // Optional
    applicationDeadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSuccess(false); // Hide success message on input change
    setError(null); // Hide error message on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) {
      setError('User not authenticated.');
      return;
    }

    // Basic validation
    if (!formData.title || !formData.description || !formData.location || !formData.jobType || !formData.requirements || !formData.applicationDeadline) {
      setError('Please fill in all required fields (marked with *)');
      return;
    }

    setLoading(true);

    try {
      // Fetch company name from user document to associate with the announcement
      const userDoc = await db.collection('users').doc(user.uid).get(); // Use db.collection and .doc
      const companyName = userDoc.data()?.companyName || 'Unknown Company';

      await addDoc(collection(db, 'announcements'), {
        ...formData,
        companyId: user.uid,
        companyName: companyName,
        createdAt: Timestamp.now(),
      });

      setSuccess(true);
      // Clear form fields after successful submission
      setFormData({
        title: '',
        description: '',
        location: '',
        jobType: '',
        salary: '',
        requirements: '',
        benefits: '',
        applicationDeadline: '',
      });

    } catch (err: any) {
      console.error("Error adding announcement:", err);
      setError('Failed to add announcement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1B263B] mb-6">Adaugă Anunț Nou</h2>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 text-center">
          Anunț adăugat cu succes!
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titlu Anunț <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0]"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descriere Job <span className="text-red-500">*</span></label>
          <textarea
            name="description"
            id="description"
            required
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0]"
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Locație <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="location"
              id="location"
              required
              value={formData.location}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0]"
            />
          </div>
          <div>
            <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">Tip Job <span className="text-red-500">*</span></label>
            <select
              name="jobType"
              id="jobType"
              required
              value={formData.jobType}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] bg-white"
            >
              <option value="">Selectează Tipul</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="project-based">Project-based</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Salariu (Opțional)</label>
          <input
            type="text"
            name="salary"
            id="salary"
            value={formData.salary}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0]"
          />
        </div>
        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">Cerințe <span className="text-red-500">*</span></label>
          <textarea
            name="requirements"
            id="requirements"
            required
            value={formData.requirements}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0]"
          ></textarea>
        </div>
        <div>
          <label htmlFor="benefits" className="block text-sm font-medium text-gray-700">Beneficii (Opțional)</label>
          <textarea
            name="benefits"
            id="benefits"
            value={formData.benefits}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0]"
          ></textarea>
        </div>
        <div>
          <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700">Data Limită Aplicare <span className="text-red-500">*</span></label>
          <input
            type="date"
            name="applicationDeadline"
            id="applicationDeadline"
            required
            value={formData.applicationDeadline}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0]"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-[#0056a0] text-white rounded-md hover:bg-[#003f7a] transition-colors"
            disabled={loading}
          >
            {loading ? 'Se Adaugă...' : 'Adaugă Anunțul'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAnnouncementForm; 