import React, { useState } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Define the props interface for CreateAnnouncementForm
interface CreateAnnouncementFormProps {
  onAnnouncementAdded: () => void; // Callback function for successful addition
}

const CreateAnnouncementForm: React.FC<CreateAnnouncementFormProps> = ({ onAnnouncementAdded }) => {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    jobType: '',
    salary: '', // Optional
    requirements: '',
    benefits: '', // Optional
    applicationDeadline: null as Date | null,
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

    console.log('handleSubmit started.');

    if (!user) {
      console.log('handleSubmit: User not authenticated.');
      setError('Utilizatorul nu este autentificat.');
      return;
    }

    // Basic validation
    console.log('handleSubmit: Performing validation.');
    const validationError = !formData.title || !formData.description || !formData.location || !formData.jobType || !formData.requirements || !(formData.applicationDeadline instanceof Date);
    if (validationError) {
      console.log('handleSubmit: Validation failed.', { formData });
      setError('Te rugăm să completezi toate câmpurile obligatorii (marcate cu *) și să selectezi o dată validă.');
      return;
    }

    setLoading(true);
    console.log('handleSubmit: Validation passed, loading set to true.');

    try {
      // Fetch company name from user document to associate with the announcement
      console.log('handleSubmit: Attempting to fetch user document.', user.uid);
      // Use Firebase v9 modular syntax to fetch user document
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
          console.log('handleSubmit: User document not found.');
          setError('Nu s-au putut găsi datele companiei.');
          setLoading(false);
          return;
      }

      const companyName = userDoc.data()?.companyName || 'Unknown Company';
      console.log('handleSubmit: User document fetched, companyName:', companyName);

      const announcementData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        jobType: formData.jobType,
        salary: formData.salary,
        requirements: formData.requirements,
        benefits: formData.benefits,
        applicationDeadline: Timestamp.fromDate(formData.applicationDeadline!), // Convert Date to Timestamp (non-null assertion after validation)
        companyId: user.uid,
        companyName: companyName,
        createdAt: Timestamp.now(),
      };
      
      console.log('handleSubmit: Prepared announcement data:', announcementData);

      console.log('handleSubmit: Attempting to add document to Firestore.');
      await addDoc(collection(db, 'announcements'), announcementData);
      console.log('handleSubmit: Document added successfully.');

      setSuccess(true);
      // Clear form fields after successful submission
      console.log('handleSubmit: Clearing form and setting success.');
      setFormData({
        title: '',
        description: '',
        location: '',
        jobType: '',
        salary: '',
        requirements: '',
        benefits: '',
        applicationDeadline: null,
      });

      // Call the callback function provided by the parent component
      onAnnouncementAdded();

    } catch (err: any) {
      console.error("handleSubmit: Catch block entered, error adding announcement:", err);
      setError('A apărut o eroare la adăugarea anunțului: ' + err.message);
    } finally {
      console.log('handleSubmit: Finally block entered, setting loading to false.');
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-900"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-900"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-900"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] bg-white text-gray-900"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-900"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-900"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-900"
          ></textarea>
        </div>
        <div>
          <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700">Data Limită Aplicare <span className="text-red-500">*</span></label>
          <DatePicker
            selected={formData.applicationDeadline}
            onChange={(date: Date | null) => setFormData({ ...formData, applicationDeadline: date })}
            dateFormat="dd/MM/yyyy"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-900"
            placeholderText="dd/mm/yyyy"
            required
          />
        </div>

        <div className="flex justify-end pt-4">
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