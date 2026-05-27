export async function runDatabaseSetup(
  supabaseUrl: string,
  serviceKey: string,
  logs: string[]
): Promise<{ success: boolean; results: Record<string, string> }> {
  const results: Record<string, string> = {};
  let overallSuccess = true;

  const runSQL = async (sql: string, label: string): Promise<boolean> => {
    const headers = {
      "Content-Type": "application/json",
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Prefer": "return=representation"
    };

    // Try exec_sql first
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/rpc/exec_sql`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ sql_query: sql })
        }
      );
      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        // Ignored
      }
      if (res.ok && (!data.error)) {
        logs.push(`✅ ${label}`);
        results[label] = "Success";
        return true;
      }
      // exec_sql returned error in body
      if (data?.success === false || data?.error) {
        logs.push(`⚠️ ${label}: SQL error - ${data.error || JSON.stringify(data)}`);
        results[label] = `SQL Error: ${data.error || JSON.stringify(data)}`;
        return false;
      }
    } catch (e1: any) {
      // exec_sql not available, try run_sql
    }

    // Fallback: try run_sql
    try {
      const res2 = await fetch(
        `${supabaseUrl}/rest/v1/rpc/run_sql`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ query: sql })
        }
      );
      let data2: any = {};
      try {
        data2 = await res2.json();
      } catch (e) {
        // Ignored
      }
      if (res2.ok && (!data2.error)) {
        logs.push(`✅ ${label} (via run_sql)`);
        results[label] = "Success (via run_sql)";
        return true;
      }
    } catch (e2: any) {
      logs.push(`❌ ${label}: Both RPCs failed`);
      results[label] = "Error: Both RPCs failed";
      return false;
    }

    logs.push(`❌ ${label}: Failed`);
    results[label] = "Failed";
    return false;
  };

  // ═════════════════════════════════════════════
  // BLOCK 1: CREATE ALL TABLES (IF NOT EXISTS)
  // ═════════════════════════════════════════════

  const sql1_1 = `
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
  `;
  if (!await runSQL(sql1_1, "Create u_s_e_r_s table")) overallSuccess = false;

  const sql1_2 = `
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
  `;
  if (!await runSQL(sql1_2, "Create j_o_b_s table")) overallSuccess = false;

  const sql1_3 = `
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
  `;
  if (!await runSQL(sql1_3, "Create a_p_p_l_i_c_a_n_t_s table")) overallSuccess = false;

  const sql1_4 = `
    CREATE TABLE IF NOT EXISTS public.screening_questions (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('select', 'boolean', 'text')),
      options JSONB DEFAULT '[]'::jsonb,
      required BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0
    );
  `;
  if (!await runSQL(sql1_4, "Create s_c_r_e_e_n_i_n_g__q_u_e_s_t_i_o_n_s table")) overallSuccess = false;

  const sql1_5 = `
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
  `;
  if (!await runSQL(sql1_5, "Create h_o_m_e_p_a_g_e__s_e_t_t_i_n_g_s table")) overallSuccess = false;

  const sql1_6 = `
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
  `;
  if (!await runSQL(sql1_6, "Create a_b_o_u_t__s_e_t_t_i_n_g_s table")) overallSuccess = false;

  const sql1_7 = `
    CREATE TABLE IF NOT EXISTS public.system_logs (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL,
      operation TEXT NOT NULL,
      details TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  if (!await runSQL(sql1_7, "Create s_y_s_t_e_m__l_o_g_s table")) overallSuccess = false;

  const sql1_8 = `
    CREATE TABLE IF NOT EXISTS public.system_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  if (!await runSQL(sql1_8, "Create s_y_s_t_e_m__s_e_t_t_i_n_g_s table")) overallSuccess = false;

  // ═════════════════════════════════════════════
  // BLOCK 2: ADD MISSING COLUMNS (ALTER TABLE)
  // ═════════════════════════════════════════════

  if (!await runSQL("ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS phone TEXT;", "ALTER applicants add phone")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS course_graduated TEXT DEFAULT NULL;", "ALTER applicants add course_graduated")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();", "ALTER applicants add created_at")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.applicants ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ DEFAULT NOW();", "ALTER applicants add applied_at")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS branches_count TEXT DEFAULT '200+';", "ALTER homepage_settings add branches_count")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS years_of_service TEXT DEFAULT '35+';", "ALTER homepage_settings add years_of_service")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS filipinos_empowered TEXT DEFAULT '5M+';", "ALTER homepage_settings add filipinos_empowered")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.homepage_settings ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT NULL;", "ALTER homepage_settings add hero_image_url")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.about_settings ADD COLUMN IF NOT EXISTS moral_compass_values JSONB DEFAULT '[]'::jsonb;", "ALTER about_settings add moral_compass_values")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.about_settings ADD COLUMN IF NOT EXISTS legacy_timeline JSONB DEFAULT '[]'::jsonb;", "ALTER about_settings add legacy_timeline")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.about_settings ADD COLUMN IF NOT EXISTS institution_branches JSONB DEFAULT '[]'::jsonb;", "ALTER about_settings add institution_branches")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.screening_questions ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;", "ALTER screening_questions add sort_order")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;", "ALTER jobs add updated_at")) overallSuccess = false;

  // ═════════════════════════════════════════════
  // BLOCK 3: ENABLE RLS ON ALL TABLES
  // ═════════════════════════════════════════════

  if (!await runSQL("ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;", "RLS users")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;", "RLS jobs")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;", "RLS applicants")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.screening_questions ENABLE ROW LEVEL SECURITY;", "RLS screening_questions")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;", "RLS homepage_settings")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.about_settings ENABLE ROW LEVEL SECURITY;", "RLS about_settings")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;", "RLS system_logs")) overallSuccess = false;
  if (!await runSQL("ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;", "RLS system_settings")) overallSuccess = false;

  // ═════════════════════════════════════════════
  // BLOCK 4: CREATE RLS POLICIES (DROP FIRST)
  // ═════════════════════════════════════════════

  const sql4_users = `
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.users;
      DROP POLICY IF EXISTS "anon_read" ON public.users;
      DROP POLICY IF EXISTS "anon_manage" ON public.users;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'cardmri_users_policy'
      ) THEN
        CREATE POLICY "cardmri_users_policy" ON public.users FOR ALL TO anon USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;
  if (!await runSQL(sql4_users, "RLS Policy users")) overallSuccess = false;

  const sql4_jobs = `
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.jobs;
      DROP POLICY IF EXISTS "anon_read_jobs" ON public.jobs;
      DROP POLICY IF EXISTS "anon_manage_jobs" ON public.jobs;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'cardmri_jobs_policy'
      ) THEN
        CREATE POLICY "cardmri_jobs_policy" ON public.jobs FOR ALL TO anon USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;
  if (!await runSQL(sql4_jobs, "RLS Policy jobs")) overallSuccess = false;

  const sql4_applicants = `
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.applicants;
      DROP POLICY IF EXISTS "anon_read_applicants" ON public.applicants;
      DROP POLICY IF EXISTS "anon_insert_applicants" ON public.applicants;
      DROP POLICY IF EXISTS "anon_update_applicants" ON public.applicants;
      DROP POLICY IF EXISTS "anon_delete_applicants" ON public.applicants;
      DROP POLICY IF EXISTS "Public Submissions Policy" ON public.applicants;
      DROP POLICY IF EXISTS "Anon Read Applicants" ON public.applicants;
      DROP POLICY IF EXISTS "Anon Update Applicants" ON public.applicants;
      DROP POLICY IF EXISTS "Anon Delete Applicants" ON public.applicants;
      
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applicants' AND policyname = 'cardmri_applicants_select') THEN
        CREATE POLICY "cardmri_applicants_select" ON public.applicants FOR SELECT TO anon USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applicants' AND policyname = 'cardmri_applicants_insert') THEN
        CREATE POLICY "cardmri_applicants_insert" ON public.applicants FOR INSERT TO anon WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applicants' AND policyname = 'cardmri_applicants_update') THEN
        CREATE POLICY "cardmri_applicants_update" ON public.applicants FOR UPDATE TO anon USING (true) WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'applicants' AND policyname = 'cardmri_applicants_delete') THEN
        CREATE POLICY "cardmri_applicants_delete" ON public.applicants FOR DELETE TO anon USING (true);
      END IF;
    END $$;
  `;
  if (!await runSQL(sql4_applicants, "RLS Policy applicants")) overallSuccess = false;

  const sql4_screening = `
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.screening_questions;
      DROP POLICY IF EXISTS "anon_all_screening" ON public.screening_questions;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'screening_questions' AND policyname = 'cardmri_screening_policy'
      ) THEN
        CREATE POLICY "cardmri_screening_policy" ON public.screening_questions FOR ALL TO anon USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;
  if (!await runSQL(sql4_screening, "RLS Policy screening")) overallSuccess = false;

  const sql4_homepage = `
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.homepage_settings;
      DROP POLICY IF EXISTS "anon_all_homepage" ON public.homepage_settings;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'homepage_settings' AND policyname = 'cardmri_homepage_policy'
      ) THEN
        CREATE POLICY "cardmri_homepage_policy" ON public.homepage_settings FOR ALL TO anon USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;
  if (!await runSQL(sql4_homepage, "RLS Policy homepage")) overallSuccess = false;

  const sql4_about = `
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.about_settings;
      DROP POLICY IF EXISTS "anon_all_about" ON public.about_settings;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'about_settings' AND policyname = 'cardmri_about_policy'
      ) THEN
        CREATE POLICY "cardmri_about_policy" ON public.about_settings FOR ALL TO anon USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;
  if (!await runSQL(sql4_about, "RLS Policy about")) overallSuccess = false;

  const sql4_logs = `
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "Allow Public Access" ON public.system_logs;
      DROP POLICY IF EXISTS "anon_all_logs" ON public.system_logs;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_logs' AND policyname = 'cardmri_logs_policy'
      ) THEN
        CREATE POLICY "cardmri_logs_policy" ON public.system_logs FOR ALL TO anon USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;
  if (!await runSQL(sql4_logs, "RLS Policy logs")) overallSuccess = false;

  const sql4_sys_settings = `
    DO $$ 
    BEGIN
      DROP POLICY IF EXISTS "anon_all_system_settings" ON public.system_settings;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'cardmri_system_settings_policy'
      ) THEN
        CREATE POLICY "cardmri_system_settings_policy" ON public.system_settings FOR ALL TO anon USING (true) WITH CHECK (true);
      END IF;
    END $$;
  `;
  if (!await runSQL(sql4_sys_settings, "RLS Policy system_settings")) overallSuccess = false;

  // ═════════════════════════════════════════════
  // BLOCK 5: SEED INITIAL DATA (UPSERT — SAFE)
  // ═════════════════════════════════════════════

  const sql5_1 = `
    INSERT INTO public.users 
      (id, email, "fullName", password, role, title, phone, "createdAt")
    VALUES (
      'user-michael-admin-001',
      'michealangelo.canlas@cardmri.com',
      'Michael Angelo Canlas',
      '$2a$12$K1R2TfWlQ2E.8P3u1hSDeOmI6qR9Xm5tU0k9eT3tY2e5e1mSu3G4q',
      'it_admin',
      'IT Administrator',
      '+63 918 100 2000',
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  `;
  if (!await runSQL(sql5_1, "Seed admin user Michael")) overallSuccess = false;

  const sql5_2 = `
    INSERT INTO public.users 
      (id, email, "fullName", password, role, title, phone, "createdAt")
    VALUES (
      'user-ailen-recruiter-001',
      'ailen.entero@cardmri.com',
      'Ailen Entero',
      '$2a$12$RkP2r3TeUqYpW1h8gP2vXOm7eT6aW4eLpS8yE3vS2r5e4mTeO3k2q',
      'recruiter',
      'Recruitment Officer',
      '+63 917 123 4567',
      NOW()
    ) ON CONFLICT (email) DO NOTHING;
  `;
  if (!await runSQL(sql5_2, "Seed recruiter user Ailen")) overallSuccess = false;

  const sql5_3 = `
    INSERT INTO public.homepage_settings 
      (id, badge_text, title, description, 
       emergency_contacts, branches_count, 
       years_of_service, filipinos_empowered)
    VALUES (
      1,
      'Empowering Countrysides via Intelligent Recruitment',
      'Build Your Career, Transform Filipino Lives',
      'Become part of the CARD Mutually Reinforcing Institutions legacy.',
      '[{"id":"1","label":"CARD MRI Central Office","value":"20 M. L. Quezon St., City of San Pablo, Laguna"},{"id":"2","label":"HRD Hotlines","value":"+63 (2) 584-3333 ext 403"},{"id":"3","label":"Email","value":"mri_recruitment@cardmri.com"}]'::jsonb,
      '200+', '35+', '5M+'
    ) ON CONFLICT (id) DO NOTHING;
  `;
  if (!await runSQL(sql5_3, "Seed homepage settings row")) overallSuccess = false;

  const sql5_4 = `
    INSERT INTO public.about_settings (id, mission_text, vision_text)
    VALUES (
      1,
      'To provide responsive banking and financial services to the marginalized sectors of society.',
      'A nation where rural families are empowered through accessible financial services.'
    ) ON CONFLICT (id) DO NOTHING;
  `;
  if (!await runSQL(sql5_4, "Seed about settings row")) overallSuccess = false;

  const sql5_5 = `
    INSERT INTO public.screening_questions 
      (id, text, type, options, required, is_active, sort_order)
    VALUES
      ('q-1', 'Where did you hear about this career opportunity?', 
       'select', 
       '["Social Media","School Job Fair","Employee Referral","Newspaper/Flyer","Walk-in"]'::jsonb, 
       true, true, 1),
      ('q-2', 'Are you willing to be assigned to any branch or field office matching CARD MRI priorities?', 
       'boolean', '[]'::jsonb, true, true, 2),
      ('q-3', 'Are you related to any active employee of CARD MRI entities up to the third degree of consanguinity or affinity?', 
       'boolean', '[]'::jsonb, true, true, 3),
      ('q-4', 'Do you have experience in field-based operations, collection, or community service work?', 
       'boolean', '[]'::jsonb, true, true, 4)
    ON CONFLICT (id) DO NOTHING;
  `;
  if (!await runSQL(sql5_5, "Seed screening questions")) overallSuccess = false;

  const sql5_6 = `
    INSERT INTO public.jobs 
      (id, title, department, institution, location, 
       description, requirements, type, is_active)
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
  `;
  if (!await runSQL(sql5_6, "Seed default job openings")) overallSuccess = false;

  const sql5_7 = `
    INSERT INTO public.system_settings (key, value, updated_at)
    VALUES 
      ('statuses_list', 
       '["New","Acknowledge","Passed Screening","Already Endorsed","Hired","Rejected","Rejected (With Relatives)"]'::jsonb,
       NOW()),
      ('institutions_list',
       '["CARD Bank","CARD SME Bank","CARD MBA","CARD MRI IT","CARD NGO","CARD Pioneer","CARD Leasing","CARD Livelihood","HR Department","Finance Center","IT Admin Unit","Branch Operations"]'::jsonb,
       NOW()),
      ('hr_incharges_list',
       '["Ms. Ailen Entero","Ms. Mary Jane Romero","Mr. Edmon Bazar","Ms. Sarah Balazo","Ms. Christine Ramos","Mr. Juan Dela Cruz","Ms. Maria Santos","Mr. Robert Lim"]'::jsonb,
       NOW())
    ON CONFLICT (key) DO NOTHING;
  `;
  if (!await runSQL(sql5_7, "Seed lookup registers system_settings")) overallSuccess = false;

  return { success: overallSuccess, results };
}
