// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { doc, getDoc, addDoc, collection } = require('firebase/firestore');
const { db } = require('./firebase');
const { Timestamp } = require('firebase/firestore');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini
console.log('Initializing GoogleGenerativeAI...');
// Verifică dacă cheia API este definită și afișează o parte din ea pentru verificare (NU afișa toată cheia în producție!)
console.log('process.env.GEMINI_API_KEY is defined:', !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log('API Key starts with:', process.env.GEMINI_API_KEY.substring(0, 5) + '...');
} else {
  console.error('ERROR: GEMINI_API_KEY is not defined in .env file!');
}

let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('GoogleGenerativeAI initialized successfully.');
  console.log('Type of genAI:', typeof genAI);

  console.log('Does genAI have listModels function?', typeof genAI.listModels === 'function');
  if (typeof genAI.listModels !== 'function') {
    console.error('WARNING: genAI.listModels is NOT a function. This might indicate an outdated library version or an issue with initialization.');
  }
} catch (initError) {
  console.error('ERROR: Failed to initialize GoogleGenerativeAI:', initError.message);

}

async function getJobDetails(jobId) {
  try {
    const jobDocRef = db.collection('announcements').doc(jobId);
    const jobDocSnap = await jobDocRef.get();

    if (jobDocSnap.exists) {
      const jobData = jobDocSnap.data();

      return {
        id: jobDocSnap.id,
        title: jobData.title,
        companyName: jobData.companyName,
        description: jobData.description,
        requirements: jobData.requirements,

        location: jobData.location,
        jobType: jobData.jobType,
        salary: jobData.salary,
        isRemote: jobData.isRemote
      };
    } else {
      console.warn(`Job document not found for ID: ${jobId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching job details:', error);
    throw error;
  }
}


async function generateInterviewQuestion(role, jobDetails = null, interviewType, questionsAsked = []) {

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  let prompt = '';
  if (jobDetails) {

    if (interviewType === 'technical') {
      prompt = `Generate ONE technical interview question for a ${jobDetails.title} position at ${jobDetails.companyName}. Focus specifically on technical knowledge, problem-solving, algorithms, data structures, or specific technologies mentioned in the job description and requirements below. Provide a question that requires a technical explanation or solution. Ensure this question has NOT been asked before in this interview. The previously asked questions are: ${questionsAsked.join('; ')}.
      Job Description: ${jobDetails.description}
      Requirements: ${jobDetails.requirements}
      
      Provide the question and all output in Romanian.
      Format the response as a JSON object with the following structure:
      {
        "question": "the question text in Romanian",
        "expectedKeywords": ["keywords", "in", "Romanian"],
        "difficulty": "beginner/intermediate/advanced in Romanian"
      }`;
    } else if (interviewType === 'hr') {
       prompt = `Generate ONE HR or behavioral interview question for a ${jobDetails.title} position at ${jobDetails.companyName}. Focus specifically on teamwork, handling challenges, communication skills, motivation, career goals, or situational scenarios relevant to the workplace. Avoid technical questions. Ensure this question has NOT been asked before in this interview. The previously asked questions are: ${questionsAsked.join('; ')}.
      Job Description: ${jobDetails.description}
      Requirements: ${jobDetails.requirements}
      
      Provide the question and all output in Romanian.
      Format the response as a JSON object with the following structure:
      {
        "question": "the question text in Romanian",
        "expectedKeywords": ["keywords", "in", "Romanian"],
        "difficulty": "easy/medium/hard in Romanian"
      }`;
    }
  } else if (role) {

     if (interviewType === 'technical') {
       prompt = `Generate ONE technical interview question for a ${role} position. Focus specifically on technical knowledge, problem-solving, algorithms, data structures, or specific technologies relevant to this role. Provide a question that requires a technical explanation or solution. Ensure this question has NOT been asked before in this interview. The previously asked questions are: ${questionsAsked.join('; ')}.
       Provide the question and all output in Romanian.
       Format the response as a JSON object with the following structure:
       {
         "question": "the question text in Romanian",
         "expectedKeywords": ["keywords", "in", "Romanian"],
         "difficulty": "beginner/intermediate/advanced in Romanian"
       }`;
     } else if (interviewType === 'hr') {
        prompt = `Generate ONE HR or behavioral interview question for a ${role} position. Focus specifically on teamwork, handling challenges, communication skills, motivation, career goals, or situational scenarios relevant to the workplace. Avoid technical questions. Ensure this question has NOT been asked before in this interview. The previously asked questions are: ${questionsAsked.join('; ')}.
        Provide the question and all output in Romanian.
        Format the response as a JSON object with the following structure:
        {
          "question": "the question text in Romanian",
          "expectedKeywords": ["keywords", "in", "Romanian"],
          "difficulty": "easy/medium/hard in Romanian"
        }`;
     }
  }

  if (!prompt) {
     prompt = `Generate ONE general interview question. Provide the question and all output in Romanian. Ensure this question has NOT been asked before in this interview. The previously asked questions are: ${questionsAsked.join('; ')}.
      Format the response as a JSON object with the following structure:
      {
        "question": "the question text in Romanian",
        "expectedKeywords": ["keywords", "in", "Romanian"],
        "difficulty": "easy/medium/hard in Romanian"
      }`;
      console.warn(`Could not determine interview type or role/job details. Using general fallback prompt for role: ${role}, jobId: ${jobDetails?.id}, interviewType: ${interviewType}`);
  }

  let text = ''; // Declare text variable outside try block
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    text = response.text(); // Assign text here

    // Attempt to extract JSON string between the first { and last }
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}');

    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
      // console.log('Extracted JSON string:', jsonString);
      const questionObject = JSON.parse(jsonString);

      // Return only the question object
      return questionObject;

    } else {
       console.error('Could not extract valid JSON string from text:', text);
       throw new Error('Invalid JSON response from API');
    }

  } catch (error) {
    console.error('Error generating question:', error);
     // Access text variable declared outside try block
    console.error('Raw response text:', text);
    throw error; // Re-throw the error after logging
  }
}

// Helper function to analyze answer
async function analyzeAnswer(question, answer, role) {
  // Use gemini-1.5-flash-latest
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `Analyze this interview answer for a ${role} position. Do not use personal pronouns like "tu". Start the feedback directly with the analysis.
  Question: ${question}
  Answer: ${answer}

  Provide the feedback in Romanian.
  Format the response in the following JSON format:
  {
    "strengths": ["list", "of", "strengths", "in", "Romanian"],
    "weaknesses": ["list", "of", "areas", "for", "improvement", "in", "Romanian"],
    "score": number between 0 and 100,
    "detailedFeedback": "detailed feedback text in Romanian",
    "suggestions": ["list", "of", "suggestions", "for", "improvement", "in", "Romanian"]
  }`;

  let text = ''; // Declare text variable outside try block
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    text = response.text(); // Assign text here

    // Attempt to extract JSON string between the first { and last }
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}');

    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
      // console.log('Extracted JSON string:', jsonString);
      return JSON.parse(jsonString);
    } else {
       console.error('Could not extract valid JSON string from text:', text);
       throw new Error('Invalid JSON response from API');
    }

  } catch (error) {
    console.error('Error analyzing answer:', error);
    console.error('Raw response text:', text);
    throw error; 
  }
}

// Helper function to generate final feedback
async function generateFinalFeedback(role, answers) {
  // Use gemini-1.5-flash-latest
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const prompt = `Generate final interview feedback for a ${role} position based on these answers. Do not use personal pronouns like "tu". Start the feedback directly with the analysis.

  Based on the provided questions and the candidate's answers, provide:
  1. An overall score for the interview out of 100.
  2. A list of things the candidate did well during the interview (strengths).
  3. A combined list of recommendations for the future, incorporating both specific areas for improvement based on the answers and general advice for future interviews.

  Ensure the points for strengths and future recommendations are clear and distinct.
  ${JSON.stringify(answers.map(a => ({ question: a.question, answer: a.answer })), null, 2)}

  Provide the feedback and all output in Romanian.
  Format the response in the following JSON format:
  {
    "overallScore": number between 0 and 100,
    "didWell": ["list", "of", "strengths", "in", "Romanian"],
    "futureRecommendations": ["combined", "list", "of", "improvements", "and", "recommendations", "in", "Romanian"]
  }`;

  let text = ''; // Declare text variable outside try block
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    text = response.text(); // Assign text here

    // Attempt to extract JSON string between the first { and last }
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}');

    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
      // console.log('Extracted JSON string:', jsonString);
      return JSON.parse(jsonString);
    } else {
       console.error('Could not extract valid JSON string from text:', text);
       throw new Error('Invalid JSON response from API');
    }

  } catch (error) {
    console.error('Error generating final feedback:', error);
    // Access text variable declared outside try block
    console.error('Raw response text:', text);
    throw error; // Re-throw the error after logging
  }
}

// Routes

// New endpoint to get job details by ID
app.get('/api/get-job-details/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobDetails = await getJobDetails(jobId);
    if (jobDetails) {
      res.json(jobDetails);
    } else {
      res.status(404).json({ error: 'Job details not found.' });
    }
  } catch (error) {
    console.error('Error in /api/get-job-details:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to get companies eligible for review for the logged-in student
app.get('/api/eligible-companies', async (req, res) => {
  try {
    // Assuming user is authenticated and user ID is available in req.user or similar
    // For now, let's simulate getting the user ID (you'll need to replace this with actual auth logic)
    const studentId = req.query.userId; // Example: get user ID from query parameter
    // const studentId = req.user.uid; // Example: get user ID from authenticated user object

    console.log('Received /api/eligible-companies request for userId:', studentId);

    if (!studentId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const userDocRef = doc(db, 'users', studentId);
    const userDocSnap = await getDoc(userDocRef);

    console.log('User document exists for userId', studentId, ':', userDocSnap.exists);

    if (!userDocSnap.exists) {
      console.warn('User data not found for userId:', studentId);
      return res.status(404).json({ error: 'User data not found.' });
    }

    const userData = userDocSnap.data();
    const experience = userData.experience || [];
    const now = new Date();

    const eligible = [];

    for (const exp of experience) {
      // Check if experience has an endDate and if it's a valid Timestamp and in the past
       if (exp.endDate && exp.endDate instanceof Timestamp && exp.endDate.toDate() < now) {
         // Assuming companyId is stored in the experience object
         if (exp.companyId) {
           try {
             const companyDocRef = doc(db, 'users', exp.companyId);
             const companyDocSnap = await getDoc(companyDocRef);
             if (companyDocSnap.exists && companyDocSnap.data().userType === 'company') { // Ensure it's a company
               const companyData = companyDocSnap.data();
               eligible.push({ id: exp.companyId, companyName: companyData.companyName || 'Unknown Company', jobTitle: exp.title || 'Past Role' });
             } else {
                console.warn(`Company document not found or is not a company for ID: ${exp.companyId}`);
             }
           } catch (companyFetchErr) {
             console.error('Error fetching company details for review eligibility:', companyFetchErr);
           }
         }
       }
    }

     // Filter out duplicates if a student had multiple past roles at the same company
     const uniqueEligible = Array.from(new Map(eligible.map(item => [item.id, item])).values());

    res.json(uniqueEligible);

  } catch (error) {
    console.error('Error in /api/eligible-companies:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate-question', async (req, res) => {
  try {
    const { role, jobId, interviewType, questionsAsked } = req.body;

    if (!role && !jobId) {
      return res.status(400).json({ error: 'Either role or jobId must be provided.' });
    }

    if (!interviewType) {
       return res.status(400).json({ error: 'Interview type must be provided (technical or hr).' });
    }

    let jobDetails = null;
    if (jobId) {
      jobDetails = await getJobDetails(jobId);
      if (!jobDetails) {
        return res.status(404).json({ error: 'Job details not found for provided jobId.' });
      }
       // If job details are available, use the role from jobDetails for question generation
       // This ensures consistency with job-specific interviews
       if (!role) { // Only use jobDetails role if no role was explicitly provided
           // Attempt to infer role from job title if not provided
           if (jobDetails.title) {
               // Simple attempt to extract a common role like 'Software Engineer' or 'Data Scientist'
               const lowerTitle = jobDetails.title.toLowerCase();
               if (lowerTitle.includes('software engineer')) jobDetails.role = 'Software Engineer';
               else if (lowerTitle.includes('data scientist')) jobDetails.role = 'Data Scientist';
               // Add other role inferences as needed
               else jobDetails.role = 'General'; // Default to General if role cannot be inferred
           } else {
              jobDetails.role = 'General'; // Default to General if no title
           }
       }
    }

    const question = await generateInterviewQuestion(role || jobDetails?.role, jobDetails, interviewType, questionsAsked);
    res.json(question);
  } catch (error) {
    console.error('Error in /api/generate-question:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-answer', async (req, res) => {
  try {
    const { question, answer, role } = req.body; // Currently only uses role
    // TODO: Potentially fetch job details here using jobId if needed for richer analysis
    const analysis = await analyzeAnswer(question, answer, role);
    res.json(analysis);
  } catch (error) {
    console.error('Error in /api/analyze-answer:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/final-feedback', async (req, res) => {
  try {
    const { role, answers } = req.body; // Currently only uses role and answers
    // TODO: Potentially fetch job details here using jobId if needed for richer final feedback
    const feedback = await generateFinalFeedback(role, answers);
    res.json(feedback);
  } catch (error) {
    console.error('Error in /api/final-feedback:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to submit a company review
app.post('/api/submit-review', async (req, res) => {
  try {
    // Assuming user is authenticated and user ID is available in req.user or similar
    // For now, let's simulate getting the user ID (you'll need to replace this with actual auth logic)
    const studentId = req.body.userId; // Example: get user ID from request body
    // const studentId = req.user.uid; // Example: get user ID from authenticated user object

    if (!studentId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    const { companyId, rating, comment } = req.body;

    if (!companyId || rating === undefined || !comment) {
      return res.status(400).json({ error: 'Company ID, rating, and comment are required.' });
    }

    // Basic validation for rating (1-5)
    if (rating < 1 || rating > 5) {
       return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Fetch student's name to store with the review
    const userDocRef = doc(db, 'users', studentId);
    const userDocSnap = await getDoc(userDocRef);
    const studentName = userDocSnap.exists ? `${userDocSnap.data().firstName || ''} ${userDocSnap.data().lastName || ''}`.trim() || 'Anonim' : 'Anonim';

    // Add the review to the 'companyReviews' collection
    await addDoc(collection(db, 'companyReviews'), {
      companyId: companyId,
      studentId: studentId,
      rating: rating,
      comment: comment,
      createdAt: Timestamp.now(),
      studentName: studentName,
    });

    res.status(201).json({ message: 'Review submitted successfully!' });

  } catch (error) {
    console.error('Error in /api/submit-review:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
