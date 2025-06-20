import OpenAI from "openai";
import { ResumeAnalysis, ResumeSuggestion, SkillGap, EmploymentGap, ResumeTemplate, SectionAnalysis, CompetitiveAnalysis } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface AIAnalysisResult {
  score: number;
  analysis: ResumeAnalysis;
  suggestions: ResumeSuggestion[];
  skillsGap: SkillGap[];
}

const INDUSTRY_KEYWORDS = {
  technology: [
    'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL', 'API',
    'Machine Learning', 'AI', 'Cloud Computing', 'DevOps', 'Agile', 'Scrum', 'Git', 'CI/CD',
    'Microservices', 'GraphQL', 'TypeScript', 'Vue.js', 'Angular', 'MongoDB', 'PostgreSQL',
    'Redis', 'Elasticsearch', 'TensorFlow', 'PyTorch', 'Blockchain', 'Cybersecurity', 'REST API',
    'Serverless', 'Terraform', 'Jenkins', 'Kafka', 'Spark', 'Hadoop', 'Data Science'
  ],
  healthcare: [
    'Patient Care', 'HIPAA', 'Electronic Health Records', 'Medical Terminology', 'Clinical Research',
    'Healthcare Administration', 'Medical Coding', 'ICD-10', 'CPT', 'Epic', 'Cerner', 'FHIR',
    'Telemedicine', 'Healthcare Quality', 'Regulatory Compliance', 'Medical Device', 'Pharmacology',
    'Nursing', 'Physical Therapy', 'Radiology', 'Laboratory', 'Healthcare Analytics', 'EMR',
    'Clinical Trials', 'FDA Regulations', 'Quality Assurance', 'Patient Safety'
  ],
  finance: [
    'Financial Analysis', 'Risk Management', 'Investment Banking', 'Portfolio Management', 'Trading',
    'Bloomberg Terminal', 'Financial Modeling', 'Excel', 'SQL', 'Python', 'R', 'GAAP', 'IFRS',
    'Compliance', 'Anti-Money Laundering', 'KYC', 'Credit Analysis', 'Derivatives', 'Fixed Income',
    'Equity Research', 'Valuation', 'Mergers & Acquisitions', 'Private Equity', 'Hedge Funds',
    'Basel III', 'Sarbanes-Oxley', 'Financial Planning', 'Treasury Management', 'Audit'
  ],
  marketing: [
    'Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing', 'Email Marketing',
    'Google Analytics', 'Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Marketing Automation',
    'CRM', 'Salesforce', 'HubSpot', 'A/B Testing', 'Conversion Optimization', 'Brand Management',
    'Market Research', 'Customer Segmentation', 'Lead Generation', 'Marketing Strategy',
    'Influencer Marketing', 'Affiliate Marketing', 'Growth Hacking', 'Customer Journey'
  ],
  education: [
    'Curriculum Development', 'Instructional Design', 'Learning Management Systems', 'Blackboard',
    'Canvas', 'Moodle', 'Educational Technology', 'Student Assessment', 'Differentiated Instruction',
    'Classroom Management', 'Special Education', 'ESL', 'Common Core', 'IEP', '504 Plans',
    'Professional Development', 'Data-Driven Instruction', 'Educational Research', 'Online Learning',
    'STEM Education', 'Blended Learning', 'Student Engagement', 'Learning Analytics'
  ],
  consulting: [
    'Strategy Consulting', 'Management Consulting', 'Business Analysis', 'Process Improvement',
    'Change Management', 'Project Management', 'Stakeholder Management', 'Data Analysis',
    'PowerPoint', 'Excel', 'Tableau', 'SQL', 'Problem Solving', 'Client Relations',
    'Industry Analysis', 'Competitive Analysis', 'Due Diligence', 'Operational Excellence',
    'Digital Transformation', 'Organizational Design', 'Performance Management'
  ],
  sales: [
    'Sales Strategy', 'Lead Generation', 'Prospecting', 'Cold Calling', 'CRM', 'Salesforce',
    'Account Management', 'Customer Relationship Management', 'Sales Forecasting', 'Territory Management',
    'B2B Sales', 'B2C Sales', 'Inside Sales', 'Outside Sales', 'Sales Enablement', 'Negotiation',
    'Closing Techniques', 'Pipeline Management', 'Sales Analytics', 'Customer Success',
    'Revenue Growth', 'Channel Sales', 'Enterprise Sales', 'Solution Selling'
  ],
  operations: [
    'Supply Chain Management', 'Logistics', 'Inventory Management', 'Process Optimization',
    'Lean Manufacturing', 'Six Sigma', 'Quality Control', 'Vendor Management', 'Cost Reduction',
    'ERP Systems', 'SAP', 'Oracle', 'Operations Research', 'Data Analysis', 'KPI Management',
    'Continuous Improvement', 'Project Management', 'Cross-functional Collaboration',
    'Warehouse Management', 'Distribution', 'Procurement', 'Production Planning'
  ],
  engineering: [
    'CAD', 'SolidWorks', 'AutoCAD', 'MATLAB', 'Simulation', 'Design for Manufacturing', 'DFM',
    'Product Development', 'Project Management', 'Quality Assurance', 'Testing', 'Prototyping',
    'Materials Science', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
    'Chemical Engineering', 'Environmental Engineering', 'Safety Engineering', 'Regulatory Compliance',
    'FEA', 'CFD', 'PLC Programming', 'Control Systems', 'Robotics', 'Automation'
  ],
  data_science: [
    'Machine Learning', 'Deep Learning', 'Statistical Analysis', 'Data Mining', 'Big Data',
    'Python', 'R', 'SQL', 'Tableau', 'Power BI', 'Hadoop', 'Spark', 'TensorFlow', 'PyTorch',
    'Scikit-learn', 'Pandas', 'NumPy', 'Data Visualization', 'Predictive Modeling', 'NLP',
    'Computer Vision', 'A/B Testing', 'Experimental Design', 'Business Intelligence',
    'ETL', 'Data Warehousing', 'Cloud Platforms', 'MLOps', 'Feature Engineering'
  ],
  legal: [
    'Legal Research', 'Contract Law', 'Litigation', 'Corporate Law', 'Intellectual Property',
    'Compliance', 'Regulatory Affairs', 'Due Diligence', 'Legal Writing', 'Negotiation',
    'Case Management', 'Discovery', 'Depositions', 'Trial Preparation', 'Appeals',
    'Employment Law', 'Real Estate Law', 'Family Law', 'Criminal Law', 'Immigration Law',
    'Securities Law', 'Tax Law', 'Environmental Law', 'Healthcare Law'
  ],
  human_resources: [
    'Talent Acquisition', 'Recruiting', 'HRIS', 'Workday', 'SuccessFactors', 'Performance Management',
    'Employee Relations', 'Compensation & Benefits', 'Training & Development', 'Diversity & Inclusion',
    'Employment Law', 'FMLA', 'FLSA', 'EEO', 'HR Analytics', 'Organizational Development',
    'Change Management', 'Succession Planning', 'Employee Engagement', 'Onboarding',
    'Payroll', 'Benefits Administration', 'Labor Relations', 'HR Strategy'
  ]
};


export async function analyzeResume(text: string, industry: keyof typeof INDUSTRY_KEYWORDS): Promise<AIAnalysisResult> {
  const keywords = INDUSTRY_KEYWORDS[industry] || INDUSTRY_KEYWORDS['technology']; // fallback to tech

  const prompt = `
You are a professional resume reviewer. Return ONLY valid JSON in this format:
{
  "score": number (0-100),
  "analysis": string,
  "suggestions": string[],
  "skillsGap": string[]
}
Do not include any explanation, headers, or markdown.

Evaluate the resume below and generate a comprehensive review using the context of the '${industry}' industry:

Resume:
${text}

Focus on these keywords: ${keywords.join(', ')}
  `.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    response_format: "json",
    messages: [
      {
        role: "system",
        content: prompt
      }
    ]
  });

  const result = completion.choices[0]?.message?.content;

  try {
    const parsed = JSON.parse(result || '{}');

    if (typeof parsed.score !== "number" || isNaN(parsed.score)) {
      parsed.score = 0;
    }

    return parsed as AIAnalysisResult;
  } catch (e) {
    console.error("Failed to parse AI response:", result);
    return {
      score: 0,
      analysis: { summary: "AI response was invalid." },
      suggestions: [],
      skillsGap: []
    };
  }
}
