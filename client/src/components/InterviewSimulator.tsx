import React, { useState, useEffect, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FaMicrophone, FaStopCircle, FaRedo, FaVolumeUp, FaPlayCircle } from 'react-icons/fa'; // Import FaPlayCircle icon
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import LoadingSpinner from '../components/LoadingSpinner'; // Import LoadingSpinner
import { Typography, Box } from '@mui/material'; // Import Typography and Box from MUI

const commonQuestions = [
  { role: 'Software Engineer', questions: [
    "Describe a time you used a specific data structure or algorithm to solve a problem.",
    "Explain the concept of RESTful APIs.",
    "How do you approach debugging?",
    "Talk about a project where you had to work with legacy code.",
    "What is your experience with [a specific technology, e.g., React, Python]?",
    "How do you handle code reviews?",
    "Explain your testing strategy."
  ]},
  { role: 'Data Scientist', questions: [
    "Explain the difference between supervised and unsupervised learning.",
    "How do you handle missing data in a dataset?",
    "Describe a time you used statistical analysis to support a recommendation.",
    "What are some common challenges in building machine learning models?",
    "Explain the concept of overfitting and how to prevent it.",
    "How do you evaluate model performance?",
    "Describe your experience with data preprocessing."
  ]},
  { role: 'Marketing Specialist', questions: [
    "Describe a successful marketing campaign you worked on.",
    "How do you measure the effectiveness of a marketing campaign?",
    "What is your experience with [a specific marketing channel, e.g., social media, email marketing]?",
    "How do you stay updated on the latest marketing trends?",
    "Describe a time you had to adapt your marketing strategy based on results.",
    "How do you analyze market trends?",
    "What tools do you use for marketing analytics?"
  ]},
  { role: 'General', questions: [
    "Tell me about yourself.",
    "Why are you the best candidate for this position?",
    "What are your salary expectations?",
    "How do you handle conflict in the workplace?",
    "Do you have any questions for me?",
    "What are your career goals?",
    "How do you handle stress and pressure?"
  ]}
];

const QUESTIONS_PER_INTERVIEW = 5; // Number of questions per interview
const TIME_PER_QUESTION = 10 * 60; // 10 minutes in seconds

type InterviewState = 'idle' | 'roleSelect' | 'loadingQuestion' | 'askingQuestion' | 'waitingForAnswer' | 'loadingFeedback' | 'showingFeedback' | 'interviewEnded' | 'readyForFinalFeedback';

const API_BASE_URL = 'http://localhost:3001/api';

interface QuestionResponse {
  question: string;
  expectedKeywords: string[];
  difficulty: string;
}

interface AnswerAnalysis {
  strengths: string[];
  weaknesses: string[];
  score: number;
  detailedFeedback: string;
  suggestions: string[];
}

interface FinalFeedback {
  overallScore: number;
  didWell: string[];
  futureRecommendations: string[];
}

// Define the props for the component
interface InterviewSimulatorProps {
  selectedJobId: string | null; // Accept the selected job ID
}

// Add job details interface
interface JobDetails {
  id: string;
  title: string;
  companyName: string;
  description: string;
  requirements: string;
  // Add other job details needed for question generation
}

const InterviewSimulator: React.FC<InterviewSimulatorProps> = ({ selectedJobId }) => { // Destructure selectedJobId from props
  const [interviewState, setInterviewState] = useState<InterviewState>(selectedJobId ? 'roleSelect' : 'roleSelect'); // Start in roleSelect state
  const [selectedRole, setSelectedRole] = useState(''); // Keep for fallback or manual selection
  const [selectedInterviewType, setSelectedInterviewType] = useState<'technical' | 'hr' | ''>(''); // New state for interview type
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null); // New state for job details
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [allAnswers, setAllAnswers] = useState<Array<{ question: string; answer: string; analysis: AnswerAnalysis }>>([]);
  const [finalFeedback, setFinalFeedback] = useState<FinalFeedback | null>(null);

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // Ref for the textarea to manage cursor position (still needed for manual edits)
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Ref to keep track of the transcript from the previous render
  const previousTranscriptRef = useRef<string>('');

  // Timer logic
  useEffect(() => {
    if (interviewState === 'askingQuestion' || interviewState === 'waitingForAnswer' || interviewState === 'loadingFeedback' || interviewState === 'showingFeedback') {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            setInterviewState('interviewEnded');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [interviewState]);

  // Effect to fetch job details when selectedJobId changes
  useEffect(() => {
    if (selectedJobId) {
      setInterviewState('loadingQuestion'); // Indicate loading while fetching job details temporarily
      const fetchJobDetails = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/get-job-details/${selectedJobId}`);
          if (!response.ok) {
            const errorBody = await response.text();
            console.error('Failed to fetch job details. Response status:', response.status, 'Body:', errorBody);
            throw new Error(`Failed to fetch job details: ${response.status} ${response.statusText}`);
          }
          const data: JobDetails = await response.json();
          setJobDetails(data);
          // After fetching job details, move to roleSelect state to show type selection
          setInterviewState('roleSelect');
          // Do NOT automatically start the interview or set question number here.
          // The user will click "Începe Interviul" after selecting the type.

        } catch (error) {
          console.error('Error fetching job details:', error);
          // Handle error, maybe show a message and go back to role select or a specific error state
          alert('Failed to load job details for the interview.');
          setInterviewState('roleSelect'); // Go back to role select on error
          setJobDetails(null);
          setSelectedRole(''); // Clear role if we go back
          setSelectedInterviewType(''); // Clear selected type if no job
        }
      };
      fetchJobDetails();
    } else {
      // If selectedJobId is null, ensure we are in roleSelect state and clear job details
      setInterviewState('roleSelect');
      setJobDetails(null);
      setSelectedRole('');
      setSelectedInterviewType(''); // Clear selected type if no job
    }
  }, [selectedJobId]); // Rerun this effect when selectedJobId changes

  // Update answer state with transcript in real-time while listening
  useEffect(() => {
    if (listening) {
      // Calculate the new part of the transcript
      const newTranscriptSegment = transcript.substring(previousTranscriptRef.current.length);

      // Append the new segment to the existing answer
      setUserAnswer(prevAnswer => prevAnswer + newTranscriptSegment);

      // Update the previous transcript ref
      previousTranscriptRef.current = transcript;
    } else {
      // When listening stops, reset the previous transcript ref for the next segment
      previousTranscriptRef.current = '';
    }
  }, [transcript, listening, setUserAnswer]); // Include setUserAnswer as a dependency as recommended by React hook rules

  if (!browserSupportsSpeechRecognition) {
    return <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto text-red-600 text-base">Browserul nu suportă recunoașterea vocală. Te rugăm să folosești Chrome.</div>;
  }

  const handleStartInterview = () => {
    // Only start if an interview type is selected
    if (selectedInterviewType) {
      setCurrentQuestionNumber(1);
       setAllAnswers([]); // Clear previous answers on new interview
       setQuestionsAsked([]); // Clear asked questions for a new interview
       // If a job is selected, use its details. Otherwise, use the manually selected role.
      handleGetQuestion(selectedJobId ? jobDetails || undefined : selectedRole ? undefined : undefined); // Pass jobDetails if job selected, or undefined to use selectedRole
    } else {
      alert('Please select an interview type.');
    }
  };

  const handleGetQuestion = async (jobDetailsOverride?: JobDetails) => { // Accept optional jobDetails override
    if (currentQuestionNumber > QUESTIONS_PER_INTERVIEW) {
      // Before ending interview, trigger final feedback request
       setInterviewState('loadingFeedback'); // Use loadingFeedback state temporarily
      handleGetFinalFeedback(); // Request final feedback
      return; // Stop here, state will transition to interviewEnded after feedback
    }

    setInterviewState('loadingQuestion');
    setCurrentQuestion('');
    setUserAnswer('');
    setAiFeedback('');
    resetTranscript();
    setTimeLeft(TIME_PER_QUESTION);

    try {
      // Use jobDetails if available, otherwise fallback to selectedRole
      const payload: any = jobDetailsOverride || jobDetails
        ? { jobId: (jobDetailsOverride || jobDetails)?.id } // Send jobId if jobDetails exist
        : { role: selectedRole }; // Send role if no jobDetails

      // Add the selected interview type to the payload
      payload.interviewType = selectedInterviewType;

      // Add the list of questions already asked to the payload
      payload.questionsAsked = questionsAsked;

      const response = await fetch(`${API_BASE_URL}/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Attempt to read error body
        const errorBody = await response.text();
         console.error('Failed to generate question. Response status:', response.status, 'Body:', errorBody);
        throw new Error(`Failed to generate question: ${response.status} ${response.statusText}`);
      }

      const data: QuestionResponse = await response.json();
      setCurrentQuestion(data.question);
      // Store the question data WITHOUT audioBase64
      setAllAnswers(prev => [...prev, { question: data.question, answer: '', analysis: {} as AnswerAnalysis }]);
       // Add question text to questionsAsked list
       setQuestionsAsked(prev => [...prev, data.question]);
      setInterviewState('waitingForAnswer'); // Directly move to waitingForAnswer as no audio is played

    } catch (error) {
      console.error('Error fetching question:', error);
      // Fallback to static questions if API fails
      const roleQuestions = commonQuestions.find(q => q.role === selectedRole)?.questions || commonQuestions.find(q => q.role === 'General')!.questions;
       // Filter out questions already asked (using text comparison)
      const availableQuestions = roleQuestions.filter(q => !questionsAsked.includes(q));

      let fetchedQuestionText = '';
      if (availableQuestions.length > 0) {
         const randomIndex = Math.floor(Math.random() * availableQuestions.length);
         fetchedQuestionText = availableQuestions[randomIndex];
          setQuestionsAsked(prev => [...prev, fetchedQuestionText]); // Add to asked questions
      } else if (roleQuestions.length > 0) {
          // If all role-specific questions asked, maybe repeat or go to general if not already
         const randomIndex = Math.floor(Math.random() * roleQuestions.length);
         fetchedQuestionText = roleQuestions[randomIndex];
          setQuestionsAsked(prev => [...prev, fetchedQuestionText]); // Add to asked questions
      } else {
        fetchedQuestionText = "No more questions available for this role.";
      }
       setCurrentQuestion(fetchedQuestionText); // Set only the text for fallback
      setInterviewState('waitingForAnswer'); // User will read the question
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      alert('Please provide an answer before submitting.');
      return;
    }
    setInterviewState('loadingFeedback');
    setAiFeedback('');
    SpeechRecognition.stopListening();

    try {
      const response = await fetch(`${API_BASE_URL}/analyze-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentQuestion,
          answer: userAnswer,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
         const errorBody = await response.text();
         console.error('Failed to analyze answer. Response status:', response.status, 'Body:', errorBody);
        throw new Error(`Failed to analyze answer: ${response.status} ${response.statusText}`);
      }

      const analysis: AnswerAnalysis = await response.json();
      setAiFeedback(analysis.detailedFeedback);
      // Update the stored answer with the analysis
       setAllAnswers(prev => prev.map(item =>
           item.question === currentQuestion ? { ...item, answer: userAnswer, analysis } : item
       ));
      // Check if this was the last question
      if (currentQuestionNumber === QUESTIONS_PER_INTERVIEW) {
        setInterviewState('readyForFinalFeedback'); // Go to state where user can end interview
      } else {
        setInterviewState('showingFeedback'); // Go to state to show feedback and next question button
        // The next question will be fetched when the "Next Question" button is clicked.
      }

    } catch (error) {
      console.error('Error fetching answer analysis:', error);
      // Fallback to simple feedback if API fails
      let generatedFeedback = "Thank you for your response.";
      if (userAnswer.trim().length > 50) {
        generatedFeedback += " You provided a detailed answer.";
      } else if (userAnswer.trim().length > 10) {
        generatedFeedback += " Your answer is concise.";
      } else {
        generatedFeedback += " Please try to elaborate more in your response.";
      }
      setAiFeedback(generatedFeedback + " (Feedback from fallback)");
      // Still store the answer, but with empty analysis due to API error
       setAllAnswers(prev => prev.map(item =>
           item.question === currentQuestion ? { ...item, answer: userAnswer, analysis: {} as AnswerAnalysis } : item
       ));
      // Check if this was the last question, even on error
      if (currentQuestionNumber === QUESTIONS_PER_INTERVIEW) {
        setInterviewState('readyForFinalFeedback'); // Go to state where user can end interview
      } else {
        setInterviewState('showingFeedback'); // Go to state to show feedback
         // Increment question number even on feedback error to allow progression
         setCurrentQuestionNumber(prev => prev + 1);
      }
      setFinalFeedback({ // Still set to empty object on error to prevent rendering issues
        overallScore: 0,
        didWell: [],
        futureRecommendations: [],
      });
    }
  };

   // Call this when the interview timer runs out or all questions are answered
  const handleGetFinalFeedback = async () => {
     setInterviewState('loadingFeedback'); // Indicate loading
     setFinalFeedback(null); // Clear previous feedback

    try {
      const response = await fetch(`${API_BASE_URL}/final-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send only necessary data for final feedback
        body: JSON.stringify({
          role: selectedRole,
           // Send simplified answers array: question text and answer text
          answers: allAnswers.map(item => ({ question: item.question, answer: item.answer })),
        }),
      });

      if (!response.ok) {
         const errorBody = await response.text();
         console.error('Failed to get final feedback. Response status:', response.status, 'Body:', errorBody);
        throw new Error(`Failed to get final feedback: ${response.status} ${response.statusText}`);
      }

      const feedback: FinalFeedback = await response.json();
      setFinalFeedback(feedback);
      setInterviewState('interviewEnded'); // Transition to interview ended state

    } catch (error) {
      console.error('Error fetching final feedback:', error);
      setFinalFeedback({
        overallScore: 0,
        didWell: [],
        futureRecommendations: [],
      });
       setInterviewState('interviewEnded'); // Transition to interview ended state even on error
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionNumber < QUESTIONS_PER_INTERVIEW) {
      setCurrentQuestionNumber(prev => prev + 1); // Increment question number
      setUserAnswer(''); // Clear previous answer
      setAiFeedback(''); // Clear previous feedback
      resetTranscript(); // Reset speech recognition transcript
      setTimeLeft(TIME_PER_QUESTION); // Reset timer for the new question
      setInterviewState('loadingQuestion'); // Transition to loading state
      handleGetQuestion(jobDetails || undefined); // Fetch the next question, pass jobDetails if available
    } else {
      // If all questions are asked, trigger final feedback
      handleGetFinalFeedback();
    }
  };

  const handleRepeatQuestion = () => {
    // Removed the functionality for repeating the question
    // This function is no longer needed as the button is removed
  };

  const handleStartListening = () => {
     if (interviewState === 'waitingForAnswer' || interviewState === 'showingFeedback') {
       // Keep existing text, don't clear on start
       resetTranscript(); // Clear the transcript from the previous segment internally
       previousTranscriptRef.current = ''; // Also clear our tracking ref
       SpeechRecognition.startListening({ continuous: true, language: 'ro-RO' });
     } else if (interviewState === 'askingQuestion') {
        alert('Please wait for the question to finish.');
     } else {
       alert('Please get a question first!');
     }
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();

    // The useEffect will handle appending the transcript as it comes in.
    // When listening stops, we just need to ensure the previousTranscriptRef is cleared
    // for the next listening session, which is handled in the useEffect's else block.
    // We might want to do a final append here as well to make sure the very last bit is captured,
    // but the useEffect should largely cover it with continuous listening.
    // Let's remove the manual append logic here to avoid duplication.

    // Optional: Reset the internal transcript after stopping, handled by resetTranscript()
    // which is called on startListening.

  };

  const handleReset = () => {
    SpeechRecognition.stopListening(); // Stop listening
    resetTranscript();
    setCurrentQuestion('');
    setUserAnswer('');
    setAiFeedback('');
    setQuestionsAsked([]); // Clear asked questions on reset
    setAllAnswers([]); // Clear all recorded answers and analyses
    setFinalFeedback(null); // Clear final feedback
    setTimeLeft(TIME_PER_QUESTION); // Reset timer
    setCurrentQuestionNumber(0); // Reset question counter
    setInterviewState('roleSelect'); // Go back to role selection
    setSelectedRole('');
    setJobDetails(null); // Clear job details on reset
    // Do not reset selectedJobId here, as it's controlled by the parent (Dashboard)
  };

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

   const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
     exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto space-y-4 overflow-hidden">
      <h2 className="text-xl font-bold text-[#1B263B] mb-4">Simulator Interviu</h2>

      {/* Display job title if jobDetails are loaded */}
      {jobDetails && interviewState !== 'interviewEnded' && interviewState !== 'roleSelect' && (
         <motion.div key="job-title" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="text-center mb-4">
           <h3 className="text-xl font-bold text-[#1B263B]">Interviu pentru postul: {jobDetails.title} ({jobDetails.companyName})</h3>
         </motion.div>
      )}

      {/* Loading Indicator */}
      {(interviewState === 'loadingQuestion' || interviewState === 'loadingFeedback') && (
        <motion.div key="loading" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex flex-col items-center justify-center py-8 space-y-4">
          <LoadingSpinner />
          <p className="text-gray-700 text-lg">
            {interviewState === 'loadingQuestion' ? 'Generare întrebare...' : 'Analiză răspuns și feedback...'}
          </p>
        </motion.div>
      )}

      {interviewState === 'roleSelect' && ( // Show role/type selection regardless of jobDetails presence
        <motion.div key="role-select" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-4">
          {/* Display job title if jobDetails are loaded */}
          {jobDetails && (
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-[#1B263B]">Pregătire interviu pentru postul: {jobDetails.title} ({jobDetails.companyName})</h3>
            </div>
          )}

          {/* Show Role selection only if no jobDetails */}
          {!jobDetails && (
            <>
              <p className="text-base font-semibold text-gray-800">Selectează un Rol:</p>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] bg-white text-gray-900 text-sm"
              >
                <option value="">-- Selectează Rolul --</option>
                {commonQuestions.map(roleData => (
                  <option key={roleData.role} value={roleData.role}>{roleData.role}</option>
                ))}
              </select>
            </>
          )}
          
          {/* Interview Type Selection */}
          <p className="text-base font-semibold text-gray-800">Selectează Tipul Interviului:</p>
          <select
            value={selectedInterviewType}
            onChange={(e) => setSelectedInterviewType(e.target.value as 'technical' | 'hr' | '')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] bg-white text-gray-900 text-sm"
          >
            <option value="">-- Selectează Tipul --</option>
            <option value="technical">Tehnic</option>
            <option value="hr">HR / Comportamental</option>
          </select>
          
          <motion.button
            onClick={handleStartInterview}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            disabled={!selectedInterviewType} // Only disabled if interview type is not selected
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPlayCircle className="inline-block mr-1"/> Începe Interviul
           </motion.button>
        </motion.div>
      )}

      {interviewState !== 'roleSelect' && interviewState !== 'interviewEnded' && (
        <div className="flex justify-between items-center text-base font-bold text-gray-700 mb-4">
          <div>Întrebarea {currentQuestionNumber} din {QUESTIONS_PER_INTERVIEW}</div>
          <div>Timp Rămas: {formatTime(timeLeft)}</div>
        </div>
      )}

      {(interviewState === 'loadingQuestion' || interviewState === 'askingQuestion' || interviewState === 'waitingForAnswer' || interviewState === 'loadingFeedback' || interviewState === 'showingFeedback') && (
         <AnimatePresence mode="wait">{/* Use AnimatePresence for question animation */}
           {currentQuestion && (
             <motion.div
               key="question-section"
               variants={containerVariants}
               initial="hidden"
               animate="visible"
               exit="exit"
               className="space-y-2"
             >
               <motion.p variants={itemVariants} className="text-base font-semibold text-gray-800">Întrebare:</motion.p>
               <motion.div variants={itemVariants} className="p-4 bg-gray-100 rounded-md">
                 <p className="text-gray-700 text-base whitespace-pre-wrap">{currentQuestion}</p>
                  {(interviewState === 'waitingForAnswer' || interviewState === 'showingFeedback') && null}
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
      )}

      {(interviewState === 'waitingForAnswer' || interviewState === 'loadingFeedback' || interviewState === 'showingFeedback') && (
         <motion.div key="answer-input" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="space-y-2 mt-4">
          <motion.label variants={itemVariants} htmlFor="userAnswer" className="block text-base font-semibold text-gray-800">Răspunsul Tău:</motion.label>
          <motion.textarea
            variants={itemVariants}
            id="userAnswer"
            ref={answerTextareaRef} // Assign the ref here
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            rows={6}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#0056a0] focus:border-[#0056a0] text-gray-900 text-base"
            placeholder="Înregistrează sau scrie răspunsul tău aici..."
            disabled={listening} // Disable typing while listening to avoid conflicts
          ></motion.textarea>
          {listening && <p className="text-gray-600 text-sm mt-1">Ascultare...</p>}
         </motion.div>
      )}

      {(interviewState === 'waitingForAnswer' || interviewState === 'loadingFeedback' || interviewState === 'showingFeedback') && (
        <motion.div key="buttons-section" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex items-center space-x-4 mt-4">
          {!listening ? (
            <motion.button
              onClick={handleStartListening}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              disabled={interviewState !== 'waitingForAnswer' && interviewState !== 'showingFeedback'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaMicrophone />
              <span>Începe Vorbirea</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={handleStopListening}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2 text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaStopCircle />
              <span>Oprește Vorbirea</span>
            </motion.button>
          )}

           <motion.button
            onClick={handleSubmitAnswer}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            disabled={!userAnswer.trim() || interviewState === 'loadingFeedback'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {interviewState === 'loadingFeedback' ? 'Se Obține Feedback...' : 'Trimite Răspunsul'}
          </motion.button>

          <motion.button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-400 text-gray-800 rounded-md hover:bg-gray-500 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
             disabled={interviewState === 'loadingFeedback'}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
          >
             <FaRedo />
            <span>Resetează</span>
          </motion.button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* Group feedback and next question button in a single motion.div when showing feedback */}
        {(interviewState === 'showingFeedback') && (
          <motion.div
            key="feedback-section"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4"
          >
            {/* Render feedback if available */}
            {aiFeedback && typeof aiFeedback === 'string' && (
               <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-[#1B263B] mb-2">Feedback:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{aiFeedback}</p>
              </div>
            )}
            {/* "Next Question" button - appears after feedback is shown */}
            {currentQuestionNumber < QUESTIONS_PER_INTERVIEW && (
               <motion.div key="next-button" variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="flex justify-center mt-4">
                 <motion.button
                   onClick={handleNextQuestion}
                   className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-semibold"
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                 >
                   Următoarea Întrebare
                 </motion.button>
               </motion.div>
            )}
          </motion.div>
        )}
        {interviewState === 'interviewEnded' && (
          <div className="text-center text-xl font-bold text-[#1B263B] mt-8">
            <p>Interviu Terminat!</p>
            {!finalFeedback && currentQuestionNumber > 1 && (
              <motion.div
                key="get-feedback-button"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-4"
              >
                <motion.button
                  onClick={handleGetFinalFeedback}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Obține Feedback Final
                </motion.button>
              </motion.div>
            )}
            {finalFeedback && typeof finalFeedback === 'object' && 'overallScore' in finalFeedback && (
              <motion.div
                key="final-feedback-section"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="mt-8 space-y-4"
              >
                <Typography variant="h5" gutterBottom>Feedback Final</Typography>

                {/* Overall Score */}
                <Box>
                  <Typography variant="h6">Scor General:</Typography>
                  <Typography variant="body1">{finalFeedback.overallScore}/100</Typography>
                </Box>

                {/* Did Well */}
                <Box>
                  <Typography variant="h6">Ce a făcut bine candidatul:</Typography>
                  <ul style={{ listStyleType: 'disc', marginLeft: '20px', textAlign: 'left' }}>
                    {finalFeedback.didWell.map((item, index) => (
                      <li key={index}><Typography variant="body1">{item}</Typography></li>
                    ))}
                  </ul>
                </Box>

                {/* Future Recommendations */}
                <Box>
                  <Typography variant="h6">Recomandări pentru Viitor:</Typography>
                  <ul style={{ listStyleType: 'disc', marginLeft: '20px', textAlign: 'left' }}>
                    {finalFeedback.futureRecommendations.map((item, index) => (
                      <li key={index}><Typography variant="body1">{item}</Typography></li>
                    ))}
                  </ul>
                </Box>
              </motion.div>
            )}
          </div>
        )}
        {/* "End Interview" button - appears after the last question's feedback */}
        {interviewState === 'readyForFinalFeedback' && (
           <motion.div key="end-interview-button" variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="flex justify-center mt-4">
             <motion.button
               onClick={handleGetFinalFeedback} // This button triggers final feedback
               className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-lg font-semibold"
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
             >
               Termină Interviul
             </motion.button>
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default InterviewSimulator; 