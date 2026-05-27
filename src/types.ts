export type UserRole = 'it_admin' | 'recruiter';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  title?: string;
  phone?: string;
  createdAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  institution: string; // CARD Bank, CARD SME Bank, CARD MBA, Card Pioneer, etc.
  location: string;
  description: string;
  requirements: string[]; // List of strings for requirements
  type: string; // Full-time, Part-time, Contract, etc.
  isActive: boolean;
  createdAt: string;
  imageUrl?: string;
}

export type ApplicationStatus = 'New' | 'Acknowledge' | 'Passed Screening' | 'Already Endorsed' | 'Hired' | 'Rejected' | 'Rejected (With Relatives)';

export interface AISummary {
  summary: string;
  skills: string[];
  education: string;
  match_score: number;
  recommendations?: string[];
}

export interface ScreeningQuestion {
  id: string;
  text: string;
  type: 'text' | 'select' | 'boolean';
  options?: string[];
  required: boolean;
  isActive: boolean;
}

export interface ScreeningAnswer {
  questionId: string;
  questionText: string;
  answer: string;
}

export interface JobApplication {
  id: string;
  applicant_id: string;
  fullName: string;
  email: string;
  phone: string;
  job_id: string;
  jobTitle: string;
  resumeFileName: string;
  resumeText: string;
  status: ApplicationStatus;
  ai_summary?: AISummary;
  applied_at?: string;
  appliedAt?: string;
  // New columns for recruiter tracking
  age?: number;
  civilStatus?: string;
  address?: string;
  educationLevel?: string;
  courseGraduated?: string;
  screeningAnswers?: ScreeningAnswer[];
  endorsedTo?: string; // Institution lookup
  hrIncharge?: string; // HR Incharge name
  remarks?: string;
}

export interface HelpMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}
