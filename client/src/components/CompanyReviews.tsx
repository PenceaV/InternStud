import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig'; // Import auth
import LoadingSpinner from './LoadingSpinner';
import { FaStar } from 'react-icons/fa';
import { Timestamp } from 'firebase/firestore';

interface Company {
  id: string;
  companyName: string;
  // Add other relevant company details if needed
}

interface EligibleCompany extends Company {
  jobTitle: string; // The job title the student had at this company
}

interface Review {
  id?: string; // id is optional when creating a new review
  companyId: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  studentName: string;
}

const API_BASE_URL = 'http://localhost:3001/api';

const CompanyReviews: React.FC = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const userId = user?.uid; // Get the logged-in user's ID
  const [eligibleCompanies, setEligibleCompanies] = useState<EligibleCompany[]>([]);
  const [loadingEligibleCompanies, setLoadingEligibleCompanies] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<EligibleCompany | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State to hold existing reviews for display (optional for now, but good for future)
  const [companyReviews, setCompanyReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEligibleCompanies();
    }
  }, [user]);

  // Function to fetch companies the student is eligible to review
  const fetchEligibleCompanies = async () => {
    setLoadingEligibleCompanies(true);
    setError(null);
    try {
      if (!userId) return; // Don't fetch if user ID is not available

      const response = await fetch(`${API_BASE_URL}/eligible-companies?userId=${userId}`);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to fetch eligible companies. Response status:', response.status, 'Body:', errorBody);
        throw new Error(`Failed to fetch eligible companies: ${response.status} ${response.statusText}`);
      }

      const data: EligibleCompany[] = await response.json();
      setEligibleCompanies(data);

    } catch (err: any) {
      console.error('Error fetching eligible companies:', err);
      // setError('Failed to load eligible companies: ' + err.message);
      // Set a generic message indicating the feature is not fully implemented yet
      setError('Această funcționalitate este în curs de implementare.');
    } finally {
      setLoadingEligibleCompanies(false);
    }
  };

  // Function to fetch existing reviews for a company (optional for now)
  const fetchCompanyReviews = async (companyId: string) => {
    setLoadingReviews(true);
    setError(null);
    try {
      const q = query(collection(db, 'companyReviews'), where('companyId', '==', companyId));
      const querySnapshot = await getDocs(q);
      const reviewsList: Review[] = [];
      querySnapshot.forEach((doc) => {
        reviewsList.push({ ...doc.data() as Review, companyId: doc.data().companyId, studentId: doc.data().studentId, rating: doc.data().rating, comment: doc.data().comment, createdAt: doc.data().createdAt, studentName: doc.data().studentName });
      });
      setCompanyReviews(reviewsList);
    } catch (err: any) {
      console.error('Error fetching company reviews:', err);
      setError('Failed to load reviews: ' + err.message);
    } finally {
      setLoadingReviews(false);
    }
  };


  // Function to handle submitting a review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCompany || rating === 0 || !comment.trim()) {
      alert('Please select a company, provide a rating, and write a comment.');
      return;
    }

    setSubmittingReview(true);
    setError(null);
    setReviewSubmitted(false);

    try {
      if (!userId) { // Should not happen if button is disabled, but good practice
        setError('User not authenticated.');
        setSubmittingReview(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          companyId: selectedCompany.id,
          rating: rating,
          comment: comment.trim(),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Failed to submit review. Response status:', response.status, 'Body:', errorBody);
        throw new Error(`Failed to submit review: ${response.status} ${response.statusText}`);
      }

      // If submission is successful, you might want to refresh the eligible companies list
      // or add the review to the displayed list without refetching all.
      // For now, we'll just show a success message and clear the form.

      setReviewSubmitted(true);
      setRating(0);
      setComment('');
      setSelectedCompany(null); // Clear selected company after submission

    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loadingAuth || loadingEligibleCompanies) {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10 text-xl">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto space-y-6">
      {eligibleCompanies.length === 0 ? (
        <div className="text-center text-gray-600 text-xl mt-10 p-6 bg-gray-100 rounded-lg">
          <p>Nu ai nicio companie la care să poți lăsa o recenzie momentan.</p>
          <p className="text-sm mt-2">Poți lăsa o recenzie pentru companiile la care ai avut o experiență (job/internship) cu data de sfârșit în trecut.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-[#1B263B]">Selectează o companie pentru a lăsa o recenzie:</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eligibleCompanies.map((company) => (
              <li key={company.id}>
                <button
                  onClick={() => setSelectedCompany(company)}
                  className={`w-full text-left p-4 rounded-md border transition-colors ${selectedCompany?.id === company.id ? 'border-blue-500 bg-blue-50 hover:bg-blue-100' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                >
                  <p className="font-semibold text-gray-800">{company.companyName}</p>
                  <p className="text-sm text-gray-600">({company.jobTitle})</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedCompany && (
        <div className="space-y-4 p-6 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-bold text-[#1B263B]">Lasă o recenzie pentru {selectedCompany.companyName}</h3>
          {reviewSubmitted ? (
            <div className="text-green-600 font-semibold">Recenzie trimisă cu succes!</div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label htmlFor="rating" className="block text-sm font-medium text-[#1B263B]">Rating <span className="text-red-500">*</span></label>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, index) => {
                    const currentRating = index + 1;
                    return (
                      <label key={index}>
                        <input
                          type="radio"
                          name="rating"
                          value={currentRating}
                          onClick={() => setRating(currentRating)}
                          className="hidden"
                        />
                        <FaStar
                          className="star cursor-pointer transition-colors"
                          size={30}
                          color={currentRating <= rating ? "#ffc107" : "#e4e5e9"}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-[#1B263B]">Comentariu <span className="text-red-500">*</span></label>
                <textarea
                  id="comment"
                  rows={4}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-800 bg-white"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
              {error && (
                <div className="text-red-500">{error}</div>
              )}
              <button
                type="submit"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${submittingReview ? 'bg-blue-400' : 'bg-[#0056a0] hover:bg-[#00468a]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0056a0]`}
                disabled={submittingReview}
              >
                {submittingReview ? 'Trimitere...' : 'Trimite Recenzie'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Optional: Display Existing Reviews */}
      {/* You would fetch and display these reviews here, perhaps below the form or on a separate tab/section */}
      {/* <div>
        <h3 className="text-xl font-bold text-[#1B263B] mt-6 mb-4">Recenzii Existente</h3>
        {loadingReviews ? (
           <div className="flex justify-center items-center h-32"><LoadingSpinner /></div>
        ) : companyReviews.length === 0 ? (
          <div className="text-gray-600">Nu există recenzii pentru această companie încă. Fii primul care lasă o recenzie!</div>
        ) : (
          <div className="space-y-4">
            {companyReviews.map(review => (
               <div key={review.id} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                 <div className="flex items-center mb-2">
                    <div className="flex items-center text-[#1B263B] mr-2">
                       {[...Array(5)].map((_, index) => (
                          <FaStar key={index} color={index < review.rating ? "#ffc107" : "#e4e5e9"} size={18} />
                       ))}
                    </div>
                    <div className="text-sm text-gray-600">de {review.studentName} pe {new Date(review.createdAt.toDate()).toLocaleDateString()}</div>
                 </div>
                 <p className="text-gray-800">{review.comment}</p>
               </div>
            ))}
          </div>
        )}
      </div> */}


    </div>
  );
};

export default CompanyReviews; 