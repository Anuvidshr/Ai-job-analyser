const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set in .env file');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fallback analysis when API quota is exceeded
function generateMockAnalysis(resumeText, jobDescription) {
  const resumeKeywords = resumeText.toLowerCase().split(/\s+/);
  const jobKeywords = jobDescription.toLowerCase().split(/\s+/);
  
  const matchingKeywords = jobKeywords.filter(k => 
    k.length > 4 && resumeKeywords.some(r => r.includes(k) || k.includes(r))
  );
  
  const matchScore = Math.min(100, Math.round((matchingKeywords.length / Math.max(1, jobKeywords.filter(k => k.length > 4).length)) * 100));
  
  let verdict = 'Poor Match';
  if (matchScore >= 75) verdict = 'Excellent Match';
  else if (matchScore >= 55) verdict = 'Good Match';
  else if (matchScore >= 40) verdict = 'Partial Match';

  return {
    matchScore,
    verdict,
    strengths: [
      'Resume is well-structured and professional',
      'Key technical skills are clearly listed',
      'Experience demonstrates relevant background',
      'Achievements are quantified where possible'
    ],
    gaps: [
      'Some job-specific keywords could be emphasized more',
      'Consider adding more industry-specific certifications',
      'Technical skills could be expanded',
      'Projects section could demonstrate more relevance'
    ],
    suggestions: [
      'Tailor keywords to match job description more closely',
      'Add 2-3 lines about achievements in this specific field',
      'Highlight relevant technical skills prominently',
      'Include metrics and results for past projects',
      'Mention similar tools or technologies you\'ve used'
    ],
    keywords: jobKeywords
      .filter(k => k.length > 4)
      .slice(0, 10)
      .map(k => (resumeKeywords.some(r => r.includes(k)) ? '✓ ' : '✗ ') + k)
  };
}

async function analyzeResume(resumeText, jobDescription) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in .env file.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert resume reviewer and career coach.

Analyze this resume against the job description and return ONLY a JSON object with:
- matchScore: number from 0 to 100
- verdict: one of "Excellent Match", "Good Match", "Partial Match", "Poor Match"
- strengths: array of 4-5 strings (what the resume does well for this job)
- gaps: array of 3-4 strings (what is missing or weak)
- suggestions: array of 4-5 strings (specific improvements to tailor resume)
- keywords: array of 8-10 important keywords from job description (mark if present in resume by adding ✓ prefix or ✗ prefix)

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON. No markdown, no extra text.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('❌ API Error:', err.message, err.status || '');
    
    if (err.message.includes('API key not valid')) {
      throw new Error('Invalid GEMINI_API_KEY. Please check your .env file.');
    }
    
    // Check for quota/rate limit errors (various formats)
    const errorMsg = err.message.toLowerCase() + (err.status || '').toString();
    if (
      errorMsg.includes('quota') || 
      errorMsg.includes('429') || 
      errorMsg.includes('resource_exhausted') ||
      errorMsg.includes('rate limit') ||
      errorMsg.includes('too many requests')
    ) {
      console.warn('⚠️  API quota/rate limit exceeded. Using fallback analysis...');
      return generateMockAnalysis(resumeText, jobDescription);
    }
    
    throw err;
  }
}

module.exports = { analyzeResume };