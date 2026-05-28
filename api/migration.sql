-- Aiven PostgreSQL Migration for CARD MRI Recruitment System
-- Run this against your Aiven PostgreSQL database

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'recruiter',
  title TEXT DEFAULT 'Staff Officer',
  phone TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  institution TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  type TEXT DEFAULT 'Full-time',
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.applicants (
  id TEXT PRIMARY KEY,
  applicant_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_id TEXT,
  job_title TEXT,
  resume_file_name TEXT,
  resume_text TEXT,
  status TEXT DEFAULT 'New',
  age INTEGER,
  civil_status TEXT DEFAULT 'Single',
  address TEXT,
  education_level TEXT DEFAULT 'College Graduate',
  course_graduated TEXT DEFAULT NULL,
  screening_answers JSONB DEFAULT '[]'::jsonb,
  endorsed_to TEXT,
  hr_incharge TEXT,
  remarks TEXT,
  ai_summary JSONB DEFAULT '{}'::jsonb,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.screening_questions (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('select', 'boolean', 'text')),
  options JSONB DEFAULT '[]'::jsonb,
  required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.homepage_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  badge_text TEXT DEFAULT 'Empowering Countrysides via Intelligent Recruitment',
  title TEXT DEFAULT 'Build Your Career, Transform Filipino Lives',
  description TEXT,
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  branches_count TEXT DEFAULT '200+',
  years_of_service TEXT DEFAULT '35+',
  filipinos_empowered TEXT DEFAULT '5M+',
  hero_image_url TEXT DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.about_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  mission_text TEXT,
  vision_text TEXT,
  contact_address TEXT DEFAULT '20 M. L. Quezon St., City of San Pablo, Laguna',
  contact_phone TEXT DEFAULT '+63 (2) 584-3333 extension line 403',
  contact_email TEXT DEFAULT 'mri_recruitment@cardmri.com',
  moral_compass_values JSONB DEFAULT '[]'::jsonb,
  legacy_timeline JSONB DEFAULT '[]'::jsonb,
  institution_branches JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_logs (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  operation TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed admin user (password: AdminPassword123!)
INSERT INTO public.users (id, email, "fullName", password, role, title, phone, "createdAt")
VALUES (
  'user-1',
  'michealangelo.canlas@cardmri.com',
  'Admin',
  '$2a$12$9SBtmC4Q/JndJzLbxF6UsOp5heVkH0jMu3dzBtMTuFRGK8wKtykd2',
  'it_admin',
  'IT Administrator',
  '+63 918 100 2000',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Seed jobs
INSERT INTO public.jobs (id, title, department, institution, location, description, requirements, type, is_active)
VALUES
  ('job-bmf-001', 'Branch Microfinance Officer', 'Branch Operations',
   'CARD Bank, Inc.', 'San Pablo City, Laguna',
   'Responsible for loan evaluations, conducting interviews, client orientations, and facilitating field disbursements.',
   '["Graduate of any 4-year Bachelor''s Degree","Willing to travel and do field work","Strong communication skills","Values integrity and has a heart for poverty eradication"]'::jsonb,
   'Full-time', true),
  ('job-fin-001', 'Accountant / Finance Specialist', 'Finance Center',
   'CARD SME Bank, Inc.', 'Lucena City, Quezon',
   'Handles bank reconciliation, monitors cash flow, ensures local tax compliance.',
   '["BS Accountancy Graduate","At least 1-2 years experience in finance","Highly meticulous and accurate","Proficient in accounting software"]'::jsonb,
   'Full-time', true),
  ('job-it-001', 'IT Support & System Specialist', 'Information Technology Unit',
   'CARD MRI IT Mutual Benefit Association', 'Bay, Laguna',
   'Maintains network firewalls, handles hardware setups, supports digital apps.',
   '["BS Information Technology or Computer Science","Knowledge in Linux or network subnetting","Willing to offer tech support on field","Good communication and problem-solving skills"]'::jsonb,
   'Full-time', true),
  ('job-hr-001', 'Recruitment Coordinator & HR Generalist', 'Human Resource Development',
   'CARD Mutually Reinforcing Institutions', 'San Pablo City, Laguna',
   'Aids in resume sorting, manages applicant files, coordinates evaluations.',
   '["BS Psychology or Human Resource","Excellent organization abilities","Interest in digitized workflows","Outstanding communication skills"]'::jsonb,
   'Full-time', true)
ON CONFLICT (id) DO NOTHING;

-- Seed screening questions
INSERT INTO public.screening_questions (id, text, type, options, required, is_active, sort_order)
VALUES
  ('q-1', 'Where did you hear about this career opportunity?', 'select',
   '["Social Media","School Job Fair","Employee Referral","Newspaper/Flyer","Walk-in"]'::jsonb, true, true, 1),
  ('q-2', 'Are you willing to be assigned to any branch or field office matching CARD MRI priorities?', 'boolean',
   '[]'::jsonb, true, true, 2),
  ('q-3', 'Are you related to any active employee of CARD MRI entities up to the third degree of consanguinity or affinity?', 'boolean',
   '[]'::jsonb, true, true, 3),
  ('q-4', 'Do you have experience in field-based operations, collection, or community service work?', 'boolean',
   '[]'::jsonb, true, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed homepage settings
INSERT INTO public.homepage_settings (id, badge_text, title, description, emergency_contacts, branches_count, years_of_service, filipinos_empowered)
VALUES (1, 'Empowering Countrysides via Intelligent Recruitment', 'Build Your Career, Transform Filipino Lives',
  'Become part of the CARD Mutually Reinforcing Institutions legacy.',
  '[{"id":"1","label":"CARD MRI Central Office","value":"20 M. L. Quezon St., City of San Pablo, Laguna"},{"id":"2","label":"HRD Hotlines","value":"+63 (2) 584-3333 ext 403"},{"id":"3","label":"Digital Helpline Email","value":"mri_recruitment@cardmri.com"}]'::jsonb,
  '200+', '35+', '5M+')
ON CONFLICT (id) DO NOTHING;

-- Seed about settings
INSERT INTO public.about_settings (id, mission_text, vision_text, contact_address, contact_phone, contact_email)
VALUES (1,
  'To provide responsive banking and financial services to the marginalized sectors of society.',
  'A nation where rural families are empowered through accessible financial services.',
  '20 M. L. Quezon St., City of San Pablo, Laguna, Philippines',
  '+63 (2) 584-3333 extension line 403',
  'mri_recruitment@cardmri.com')
ON CONFLICT (id) DO NOTHING;

-- Seed system settings
INSERT INTO public.system_settings (key, value, updated_at)
VALUES
  ('statuses_list', '["New","Acknowledge","Passed Screening","Already Endorsed","Hired","Rejected","Rejected (With Relatives)"]'::jsonb, NOW()),
  ('institutions_list', '["CARD Bank","CARD SME Bank","CARD MBA","CARD MRI IT","CARD NGO","CARD Pioneer","CARD Leasing","CARD Livelihood","HR Department","Finance Center","IT Admin Unit","Branch Operations"]'::jsonb, NOW()),
  ('hr_incharges_list', '["Ms. Ailen Entero","Ms. Mary Jane Romero","Mr. Edmon Bazar","Ms. Sarah Balazo","Ms. Christine Ramos","Mr. Juan Dela Cruz","Ms. Maria Santos","Mr. Robert Lim"]'::jsonb, NOW())
ON CONFLICT (key) DO NOTHING;
