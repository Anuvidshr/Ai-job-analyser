const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not set in .env file');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Fallback analysis when API quota is exceeded
function generateMockAnalysis(resumeText, jobDescription) {
  const resumeWords = resumeText.toLowerCase();
  const jobWords = jobDescription.toLowerCase();
  
  // Extract skills from job description
  const jobSkills = jobDescription
    .split(/[,\n]/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 3 && s.length < 30);
  
  // Check which skills are mentioned in resume
  const matchedSkills = jobSkills.filter(skill => 
    resumeWords.includes(skill)
  ).slice(0, 5);
  
  const missingSkills = jobSkills.filter(skill => 
    !resumeWords.includes(skill)
  ).slice(0, 4);
  
  const matchPercentage = Math.round((matchedSkills.length / Math.max(1, jobSkills.length)) * 100);
  const matchScore = Math.min(100, 40 + matchPercentage);
  
  let verdict = 'Poor Match';
  if (matchScore >= 75) verdict = 'Excellent Match';
  else if (matchScore >= 55) verdict = 'Good Match';
  else if (matchScore >= 40) verdict = 'Partial Match';

  return {
    matchScore,
    verdict,
    matchBreakdown: {
      skillsMatch: `${matchPercentage}% of required skills present (${matchedSkills.length}/${jobSkills.length})`,
      experienceMatch: resumeWords.includes('experience') ? 'Experience is mentioned in resume' : 'Experience level not clearly detailed',
      educationMatch: resumeWords.includes('education') || resumeWords.includes('degree') ? 'Education/qualifications mentioned' : 'Education not clearly specified'
    },
    strengths: [
      matchedSkills.length > 0 ? `Resume includes ${matchedSkills.length} relevant skills: ${matchedSkills.slice(0, 2).join(', ')}` : 'Professional resume format',
      resumeWords.includes('project') || resumeWords.includes('achievement') ? 'Includes project examples and achievements' : 'Professional background described',
      resumeWords.includes('metric') || resumeWords.includes('result') ? 'Quantifies achievements with results' : 'Shows career progression',
      'Overall presentation is clear and organized'
    ],
    gaps: [
      missingSkills.length > 0 ? `Missing ${missingSkills.length} key skills: ${missingSkills.slice(0, 2).join(', ')}` : 'Could enhance skill descriptions',
      'Could add more specific job-related projects',
      'Could include more industry-specific certifications',
      'Could better highlight quantified achievements'
    ],
    suggestions: [
      missingSkills.length > 0 ? `Add skills: ${missingSkills.slice(0, 3).join(', ')}` : 'Enhance technical skills section',
      'Include 2-3 specific projects relevant to this role',
      'Add metrics and business impact to achievements',
      'Highlight similar technologies and tools used',
      'Tailor professional summary to this specific job'
    ],
    keywordAnalysis: {
      required: jobSkills.slice(0, 5),
      matched: matchedSkills,
      missing: missingSkills
    }
  };
}

async function analyzeResume(resumeText, jobDescription) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in .env file.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are an expert resume reviewer and career coach. Analyze this resume SPECIFICALLY against the job description.

IMPORTANT: Provide detailed, SPECIFIC analysis based on the actual content. Not generic responses.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "matchScore": number 0-100,
  "verdict": "Excellent Match" | "Good Match" | "Partial Match" | "Poor Match",
  "matchBreakdown": {
    "skillsMatch": "percentage and which skills match",
    "experienceMatch": "how experience aligns with job requirements",
    "educationMatch": "how education aligns with role"
  },
  "strengths": [
    "SPECIFIC strength 1 from actual resume content",
    "SPECIFIC strength 2 from actual resume content",
    "SPECIFIC strength 3 from actual resume content",
    "SPECIFIC strength 4 from actual resume content"
  ],
  "gaps": [
    "SPECIFIC gap 1: What's missing from resume for this job",
    "SPECIFIC gap 2: What's missing from resume for this job",
    "SPECIFIC gap 3: What's missing from resume for this job",
    "SPECIFIC gap 4: What's missing from resume for this job"
  ],
  "suggestions": [
    "SPECIFIC suggestion 1: Exact change to make resume better",
    "SPECIFIC suggestion 2: Exact change to make resume better",
    "SPECIFIC suggestion 3: Exact change to make resume better",
    "SPECIFIC suggestion 4: Exact change to make resume better",
    "SPECIFIC suggestion 5: Exact change to make resume better"
  ],
  "keywordAnalysis": {
    "required": ["job requirement 1", "job requirement 2", "job requirement 3"],
    "matched": ["skill from resume that matches", "another matched skill"],
    "missing": ["required skill not in resume", "another missing skill"]
  }
}

Be specific. Reference actual skills/experience from the resume. Not generic.`;

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