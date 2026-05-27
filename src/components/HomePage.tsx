import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Building, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  Lock, 
  Phone, 
  Mail, 
  X, 
  Check, 
  Globe, 
  Search, 
  SlidersHorizontal,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  Paperclip,
  ExternalLink,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, JobPosting } from "../types";
import { authFetch } from "../lib/api";
import { getSupabaseClient } from "../lib/supabase";
import { useToast } from "./ToastContext";
import ApplicantViewer from "./ApplicantViewer";

interface HomePageProps {
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  jobs: JobPosting[];
  onRefreshJobs: () => void | Promise<void>;
}

interface HomepageSettings {
  badgeText: string;
  title: string;
  description: string;
  emergencyContacts: Array<{ id: string; label: string; value: string }>;
  branchesCount?: string;
  yearsOfService?: string;
  filipinosEmpowered?: string;
  heroImageUrl?: string;
}

export default function HomePage({ setActiveTab, currentUser, jobs, onRefreshJobs }: HomePageProps) {
  // Toast notifications hooks
  const { showToast, showConfirm } = useToast();

  // Homepage editable CMS states
  const [settings, setSettings] = useState<HomepageSettings>(() => {
    const saved = localStorage.getItem("card_mri_homepage_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse cached home settings:", e);
      }
    }
    return {
      badgeText: "Empowering Countrysides via Intelligent Recruitment",
      title: "Build Your Career, Transform Filipina Lives",
      description: "Become part of the CARD Mutually Reinforcing Institutions (CARD MRI) legacy. We bring responsive banking, micro-insurance, and community developmental services to millions of landless rural families.",
      emergencyContacts: [
        { id: "1", label: "CARD MRI Central Office", value: "20 M. L. Quezon St., City of San Pablo, Laguna, Philippines" },
        { id: "2", label: "HRD Hotlines", value: "Contact: +63 (2) 584-3333 extension line 403" },
        { id: "3", label: "Digital Helpline Email", value: "mri_recruitment@cardmri.com" }
      ],
      branchesCount: "200+",
      yearsOfService: "35+",
      filipinosEmpowered: "5M+",
      heroImageUrl: ""
    };
  });

  // Listen for global settings changes
  useEffect(() => {
    const handleSettingsChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };
    window.addEventListener("card_mri_settings_changed", handleSettingsChanged);
    return () => window.removeEventListener("card_mri_settings_changed", handleSettingsChanged);
  }, []);

  // Job opening states
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedInst, setSelectedInst] = useState("All");

  // Job creation / edit modal state (Staff CRUD on jobs)
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);

  // Take a glimpse states
  const [selectedGlimpseJob, setSelectedGlimpseJob] = useState<JobPosting | null>(null);
  const [currentSlidePage, setCurrentSlidePage] = useState(0);

  // Dynamic Screening states
  const [isScreeningOpen, setIsScreeningOpen] = useState(false);
  const [screeningStep, setScreeningStep] = useState(1); // 1: Basic, 2: Qs, 3: Success
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Applicant basic info states
  const [screenFullName, setScreenFullName] = useState("");
  const [screenAge, setScreenAge] = useState("");
  const [screenCivilStatus, setScreenCivilStatus] = useState("Single");
  const [screenAddress, setScreenAddress] = useState("");
  const [screenEducationLevel, setScreenEducationLevel] = useState("College Graduate");
  const [screenContactNumber, setScreenContactNumber] = useState("");
  const [screenEmail, setScreenEmail] = useState("");
  const [screenCourseGraduated, setScreenCourseGraduated] = useState("");

  // Answers mapping: { [questionId: string]: string }
  const [screenAnswers, setScreenAnswers] = useState<{ [qId: string]: string }>({});

  const [screeningSubmitLoading, setScreeningSubmitLoading] = useState(false);
  const [screeningSubmitError, setScreeningSubmitError] = useState("");

  const fetchScreeningQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/screening-questions");
      if (res.ok) {
        const data = await res.json();
        const activeQs = data.filter((q: any) => q.isActive);
        setQuestions(activeQs);
        
        // Initialize default answers (Fix 8: Do not default answer)
        const initialAnswers: { [qId: string]: string } = {};
        activeQs.forEach((q: any) => {
          initialAnswers[q.id] = "";
        });
        setScreenAnswers(initialAnswers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (isScreeningOpen) {
      fetchScreeningQuestions();
    }
  }, [isScreeningOpen]);

  // Create our slides structure dynamically based on the selected job!
  const getGlimpseSlides = (job: JobPosting) => {
    const isAccountOfficer = job.title.toLowerCase().includes("account officer") || job.title.toLowerCase().includes("microfinance officer");

    if (isAccountOfficer) {
      return [
        {
          title: "Account Officer",
          subtitle: "A Mission-Driven Career in Microfinance Empowerment",
          type: "cover",
          bullets: []
        },
        {
          title: "The Core Mission",
          subtitle: "Empowering Rural Communities",
          type: "text-with-image",
          desc: "The primary objective is to train and organize landless rural women into viable groups. You are the catalyst for change, helping members manage projects in accordance with policies that build sustainable livelihoods.",
          imageUrl: "https://www.gca-foundation.org/wp-content/uploads/2026/03/img-2111-1030x764.jpg"
        },
        {
          title: "Field Operations: The Frontline",
          type: "three-cards",
          cards: [
            {
              title: "Means Testing",
              desc: "Conduct housing index assessments and means testing for new clients to ensure we reach those who need it most.",
              icon: "home"
            },
            {
              title: "CGT Training",
              desc: "Execute Continuous Group Training (CGT) ensuring high-quality orientation for barangays and centers.",
              icon: "users"
            },
            {
              title: "Center Meetings",
              desc: "Conduct weekly meetings to supervise development and monitor the progress of organized groups.",
              icon: "calendar"
            }
          ]
        },
        {
          title: "Operational Discipline",
          subtitle: "Performance in the Vanguard",
          type: "discipline",
          desc: "Success in the field is measured by portfolio quality. As an Account Officer, you monitor daily collectibles with a focus on:",
          bullets: [
            "Repayment Rate Optimization: Maintaining strict credit guidelines across active borrower rosters.",
            "Portfolio-at-Risk (PAR) Management: Mitigating defaults and supporting micro-finance recovery pipelines.",
            "Project Inventory & Credit Investigation: Ensuring valid community deployment data streams."
          ],
          imageUrl: "https://images.squarespace-cdn.com/content/v1/595aef2b2994ca8947835301/1527617338494-ERKCSLBMUWCQ2N452OG3/FCC_Header_ProgramsServices.png?format=1500w"
        },
        {
          title: "Financial & Administrative Tasks",
          type: "tasks",
          items: [
            { label: "Loan Disbursement", desc: "Prepare necessary Promissory Notes for handled members." },
            { label: "Regulatory Compliance", desc: "Comply with findings from Internal Auditing and BSP examinations." },
            { label: "Documentation", desc: "Maintain an organized, complete filing system for easy data access." },
            { label: "Reporting", desc: "Prepare accurate and timely operational reports for branch management." }
          ]
        },
        {
          title: "A Role of High Impact",
          type: "metrics",
          desc: "\"Providing technical assistance to center members in decision-making and problem-solving to achieve collective viability.\"",
          metrics: [
            { label: "Weekly", value: "STAFF MEETINGS" },
            { label: "Quality", value: "MEMBERSHIP FOCUS" },
            { label: "Field", value: "MOTIVATIONAL VISITS" }
          ]
        },
        {
          title: "Building Relationships",
          subtitle: "Strategic Partnerships",
          type: "text-with-image",
          desc: "Establish and maintain good business relationships with staff, clients, potential members, and partner agencies. You are the face of CARD MRI in the communities we serve.",
          imageUrl: "https://media.icij.org/uploads/2023/06/Trafficking-Inc-Predatory-lending-PHP.jpg"
        },
        {
          title: "Core Competencies Required",
          type: "table",
          rows: [
            { category: "Leadership", req: "Group organization & member mentoring" },
            { category: "Analysis", req: "Means testing & credit investigation" },
            { category: "Ethics", req: "Religiously complying with systems & auditing" },
            { category: "Resilience", req: "Motivational visits & community integration" }
          ]
        },
        {
          title: "Are you ready to lead?",
          subtitle: "Join us in our mission of poverty eradication through professional excellence and social empowerment.",
          type: "ready",
          actionText: "Proceed to Screening"
        }
      ];
    } else {
      // Fallback slides dynamically mapped to any other job posting!
      return [
        {
          title: job.title,
          subtitle: `A Pivotal Development Career in ${job.department}`,
          type: "cover",
          bullets: []
        },
        {
          title: "Core Responsibility Summary",
          subtitle: `${job.institution} · ${job.department}`,
          type: "text-with-image",
          desc: job.description,
          imageUrl: "https://thesavvysparrow.com/wp-content/uploads/2024/09/organize-home-office-paperwork.jpg"
        },
        {
          title: "Role Filing Requirements",
          type: "tasks",
          items: (Array.isArray(job.requirements) 
            ? job.requirements 
            : typeof (job.requirements as any) === "string"
              ? (job.requirements as any).split(",").map((r: any) => r.trim()).filter(Boolean)
              : []).map(r => ({ label: "Requirement", desc: r }))
        },
        {
          title: "Location and Logistics",
          type: "text-with-image",
          desc: `This slot is actively operating in ${job.location}. Candidates must satisfy background screenings including regional NBI clearance protocols.`,
          imageUrl: "https://thesavvysparrow.com/wp-content/uploads/2024/09/organize-home-office-paperwork.jpg"
        },
        {
          title: "Are you ready to lead?",
          subtitle: `Join us in our mission of developmental banking and community empowerment as a ${job.title}.`,
          type: "ready",
          actionText: "Proceed to Screening"
        }
      ];
    }
  };

  const handleScreeningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScreeningSubmitLoading(true);
    setScreeningSubmitError("");

    // Package the answers in ScreeningAnswer[]
    const answersPayload = Object.keys(screenAnswers).map(qId => {
      const q = questions.find(item => item.id === qId);
      return {
        questionId: qId,
        questionText: q ? q.text : qId,
        answer: screenAnswers[qId]
      };
    });

    // Validate required questions (Fix 8)
    const missingRequired = questions.filter(q => q.required && (!screenAnswers[q.id] || String(screenAnswers[q.id]).trim() === ""));
    if (missingRequired.length > 0) {
      showToast(`Please answer all required screening questions.`, "error");
      setScreeningSubmitLoading(false);
      return;
    }

    // Extract dynamic answers for specific requested database columns
    const infoSourceAns = answersPayload.find(a => 
      a.questionText.toLowerCase().includes("hear") || 
      a.questionText.toLowerCase().includes("source") || 
      a.questionId === "q-1"
    )?.answer || null;

    const assignAnywhereAns = answersPayload.find(a => 
      a.questionText.toLowerCase().includes("willing") || 
      a.questionText.toLowerCase().includes("assign") || 
      a.questionId === "q-2"
    )?.answer || null;

    const supabasePayload = {
      full_name: screenFullName.trim(),
      age: parseInt(screenAge, 10) || 18,
      civil_status: screenCivilStatus,
      address: screenAddress.trim(),
      education_level: screenEducationLevel,
      phone: screenContactNumber.trim(),
      email: screenEmail.trim(),
      course_graduated: screenCourseGraduated.trim(),
      screening_answers: answersPayload,
      status: "New",
      remarks: "Self-registered screening questionnaire successfully."
    };

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('applicants').insert([ supabasePayload ]);
        if (error) {
          console.error("Supabase Submission Error:", error.message);
          showToast("Database Error: " + error.message, "error");
          throw new Error(error.message);
        }
      } else {
        // Fallback payload matching old structure
        const payload = {
          fullName: screenFullName,
          email: screenEmail,
          phone: screenContactNumber,
          job_id: selectedGlimpseJob?.id,
          jobTitle: selectedGlimpseJob?.title,
          age: parseInt(screenAge, 10) || 18,
          civilStatus: screenCivilStatus,
          address: screenAddress,
          educationLevel: screenEducationLevel,
          courseGraduated: screenCourseGraduated.trim(),
          course_graduated: screenCourseGraduated.trim(),
          screeningAnswers: answersPayload,
          remarks: "Self-registered screening questionnaire successfully.",
          status: "New"
        };
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to submit screening details due to duplicate entry.");
        }
      }

      setScreeningStep(3); // Success Step!
    } catch (err: any) {
      setScreeningSubmitError(err.message);
    } finally {
      setScreeningSubmitLoading(false);
    }
  };
  
  // Job Form states
  const [jobTitle, setJobTitle] = useState("");
  const [jobDept, setJobDept] = useState("");
  const [jobInst, setJobInst] = useState("");
  const [jobLoc, setJobLoc] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobType, setJobType] = useState("Full-Time");
  const [jobReqs, setJobReqs] = useState("");
  const [jobError, setJobError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch Homepage text settings and Job openings
  const loadData = async () => {
    try {
      // 1. Fetch settings
      const settingsRes = await fetch("/api/homepage-settings");
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        // Handle nested settings returned from API correctly
        const rawSettings = data.settings || data;
        
        const apiSettings = {
          badgeText: rawSettings.badgeText || rawSettings.badge_text || settings.badgeText,
          title: rawSettings.title || settings.title,
          description: rawSettings.description || settings.description,
          emergencyContacts: rawSettings.emergencyContacts || rawSettings.emergency_contacts || settings.emergencyContacts,
          branchesCount: rawSettings.branchesCount || rawSettings.branches_count || settings.branchesCount,
          yearsOfService: rawSettings.yearsOfService || rawSettings.years_of_service || settings.yearsOfService,
          filipinosEmpowered: rawSettings.filipinosEmpowered || rawSettings.filipinos_empowered || settings.filipinosEmpowered,
          heroImageUrl: rawSettings.heroImageUrl || rawSettings.hero_image_url || settings.heroImageUrl || ""
        };

        setSettings(apiSettings);
        localStorage.setItem("card_mri_homepage_settings", JSON.stringify(apiSettings));
      }
    } catch (e) {
      console.error("Error loading home catalog settings", e);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handler: Submit Job Opening Form (Create/Edit)
  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobError("");
    if (!jobTitle || !jobDept || !jobInst || !jobLoc || !jobDesc || !jobReqs) {
      setJobError("Fill out all required parameters.");
      return;
    }

    setSaveLoading(true);
    const splitReqs = jobReqs.split(",").map(r => r.trim()).filter(r => r.length > 0);

    const payload = {
      title: jobTitle,
      department: jobDept,
      institution: jobInst,
      location: jobLoc,
      description: jobDesc,
      requirements: splitReqs,
      type: jobType,
      imageUrl: "https://images.unsplash.com/photo-1542744173-8e013737a92a?w=120"
    };

    try {
      let response;
      if (editingJob) {
        // Edit existing job opening
        response = await authFetch(`/api/jobs/${editingJob.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            actorName: currentUser?.fullName || "HR Specialist"
          })
        });
      } else {
        // Post new job opening
        response = await authFetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Submission rejected.");
      }

      await onRefreshJobs();
      setIsJobModalOpen(false);
      setEditingJob(null);
      resetJobForm();
    } catch (err: any) {
      setJobError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handler: Delete Job Opening
  const handleJobDelete = (jobId: string) => {
    showConfirm(
      "Verify: Are you sure you wish to dismantle this job opening?",
      async () => {
        try {
          const response = await authFetch(`/api/jobs/${jobId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ actorName: currentUser?.fullName || "HR Specialist" })
          });
          if (response.ok) {
            await onRefreshJobs();
            showToast("✅ Changes saved successfully.", "success");
          } else {
            showToast("Failed to delete the job opening.", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Network failure. Failed to delete job.", "error");
        }
      }
    );
  };

  const openEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setJobTitle(job.title);
    setJobDept(job.department);
    setJobInst(job.institution);
    setJobLoc(job.location);
    setJobDesc(job.description);
    setJobType(job.type);
    setJobReqs((Array.isArray(job.requirements) 
      ? job.requirements 
      : typeof (job.requirements as any) === "string"
        ? (job.requirements as any).split(",").map((r: any) => r.trim()).filter(Boolean)
        : []).join(", "));
    setIsJobModalOpen(true);
  };

  const openCreateJob = () => {
    setEditingJob(null);
    resetJobForm();
    setIsJobModalOpen(true);
  };

  const resetJobForm = () => {
    setJobTitle("");
    setJobDept("");
    setJobInst("");
    setJobLoc("");
    setJobDesc("");
    setJobType("Full-Time");
    setJobReqs("");
    setJobError("");
  };

  // Get unique lists for dropdown filters
  const uniqueDepts = ["All", ...Array.from(new Set(jobs.map(j => j.department)))];
  const uniqueInsts = ["All", ...Array.from(new Set(jobs.map(j => j.institution)))];

  // Filter logic
  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          j.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "All" || j.department === selectedDept;
    const matchesInst = selectedInst === "All" || j.institution === selectedInst;
    return matchesSearch && matchesDept && matchesInst;
  });

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) 
      return "Good morning! Your next opportunity awaits.";
    if (hour >= 12 && hour < 17) 
      return "Good afternoon! Discover careers that matter.";
    if (hour >= 17 && hour < 21) 
      return "Good evening! Browse meaningful opportunities.";
    return "Looking for a career that transforms lives?";
  };

  return (
    <div className="space-y-12 pb-16 font-sans">
      
      {/* Premium Hero Section */}
      <section 
        className="relative overflow-hidden w-full rounded-none lg:max-w-[1400px] lg:mx-auto lg:rounded-[28px] text-white border-y lg:border border-slate-800 shadow-xl"
        style={{
          backgroundImage: settings.heroImageUrl ? `url(${settings.heroImageUrl})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#0F4C35"
        }}
      >
        {/* Fallback forest overlay if no image uploaded */}
        {!settings.heroImageUrl && (
          <div 
            className="absolute inset-0 -z-10"
            style={{
              background: "linear-gradient(135deg, #0F4C35 0%, #1B6B47 30%, #0D7B5A 60%, #064E35 100%)"
            }}
          />
        )}
        
        {/* Dark film lens gradient overlay to enforce high contrast WCAG standards */}
        <div 
          className="absolute inset-0 z-0 bg-gradient-to-b from-black/55 via-black/45 to-black/75 pointer-events-none"
        />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-14 md:py-20 text-center space-y-6">
          <div className="flex flex-col items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold">
              <span>✨</span>
              {getTimeGreeting()}
            </span>
            {settings.badgeText && (
              <span className="inline-flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-wider font-mono">
                {settings.badgeText}
              </span>
            )}
          </div>
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase font-display max-w-3xl mx-auto text-white">
            {(settings.title || "Build Your Career, Transform Filipina Lives").split("\n").map((line, idx) => (
              <span key={idx} className="block">
                {idx === 1 ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-250">
                    {line}
                  </span>
                ) : line}
              </span>
            ))}
          </h1>
          <p className="text-white/85 text-sm max-w-2xl mx-auto leading-relaxed font-medium antialiased">
            {settings.description}
          </p>
 
          <div className="flex flex-col items-center pt-4 px-4 sm:px-0 gap-2.5">
            <p className="text-white/80 text-xs font-semibold tracking-wide antialiased">
              Explore open career milestones below
            </p>
            <button
              onClick={() => {
                const target = document.getElementById("vacancies-catalog-anchor");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="text-white hover:text-emerald-300 transition-colors duration-300 cursor-pointer flex flex-col items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl p-1"
              aria-label="Scroll to open positions"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 font-mono">View vacancies</span>
              <div className="w-8 h-8 rounded-full border border-white/20 bg-white/5 flex items-center justify-center hover:bg-white/10 transition duration-200">
                <ChevronRight className="w-4 h-4 rotate-90 text-amber-400 animate-bounce" />
              </div>
            </button>
          </div>
        </div>
 
        {/* Dynamic Metric Strip */}
        <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-md grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/10 py-5 text-center">
          <div className="py-4 sm:py-2">
            <div className="text-xl md:text-2xl font-black text-white font-display">{jobs.length} Active</div>
            <div className="text-xs text-white/60 uppercase font-mono tracking-widest mt-1.5 font-bold antialiased">Job Openings</div>
          </div>
          <div className="py-4 sm:py-2">
            <div className="text-xl md:text-2xl font-black text-white font-display">{settings.branchesCount || "200+"}</div>
            <div className="text-xs text-white/60 uppercase font-mono tracking-widest mt-1.5 font-bold antialiased">Branches Nationwide</div>
          </div>
          <div className="py-4 sm:py-2">
            <div className="text-xl md:text-2xl font-black text-white font-display">{settings.yearsOfService || "35+"}</div>
            <div className="text-xs text-white/60 uppercase font-mono tracking-widest mt-1.5 font-bold antialiased">Years of Service</div>
          </div>
          <div className="py-4 sm:py-2">
            <div className="text-xl md:text-2xl font-black text-white font-display">{settings.filipinosEmpowered || "5M+"}</div>
            <div className="text-xs text-white/60 uppercase font-mono tracking-widest mt-1.5 font-bold antialiased">Filipinos Empowered</div>
          </div>
        </div>
      </section>

      {/* Combined Job Catalog Section */}
      <section id="vacancies-catalog-anchor" className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-left">
        <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Live Vacancies
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 font-display uppercase tracking-tight">Job Catalog</h2>
            <p className="text-slate-500 text-xs">Public viewers, students, and applicants can browse institutional openings and direct evaluate credentials.</p>
          </div>
          
          {/* Quick Counter */}
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-xs font-mono font-bold text-slate-600 block px-2 leading-none">
              LIVE SLOTS: <strong className="text-emerald-700">{filteredJobs.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Toolbar Workspace */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-5px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Keyword search filter */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search matching job descriptions, titles, or locations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-700 font-medium transition duration-200 text-slate-800"
              />
            </div>

            {/* Department Dropdown Filter */}
            <div className="w-full md:w-56 relative">
              <SlidersHorizontal className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl outline-none transition appearance-none cursor-pointer font-semibold text-slate-700"
              >
                {uniqueDepts.map(d => (
                  <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>
                ))}
              </select>
            </div>

            {/* Institution Dropdown Filter */}
            <div className="w-full md:w-56 relative">
              <Building className="absolute left-3.5 top-3 w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedInst}
                onChange={e => setSelectedInst(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl outline-none transition appearance-none cursor-pointer font-semibold text-slate-700"
              >
                {uniqueInsts.map(inst => (
                  <option key={inst} value={inst}>{inst === "All" ? "All Entities" : inst}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Jobs results showcase */}
        {loadingJobs ? (
          <div className="text-center py-10 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-650 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-450 font-mono">Loading CARD MRI active catalog database registries...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No postings matches search credentials.</p>
            <p className="text-xs text-slate-400">Try adjusting your department, keywords, or entity selector parameters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredJobs.map((job, index) => {
              const safeRequirements: string[] = Array.isArray(job.requirements) 
                ? job.requirements 
                : typeof (job.requirements as any) === "string"
                  ? (job.requirements as any).split(",").map((r: any) => r.trim()).filter(Boolean)
                  : [];
              return (
                <motion.div 
                  key={job.id}
                  initial={{ opacity: 0, scale: 0.97, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.45), ease: "easeOut" }}
                  className="p-5 bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] shadow-[0_2px_16px_-4px_rgba(26,23,20,0.08),0_1px_4px_-1px_rgba(26,23,20,0.04)] hover:shadow-[0_8px_32px_-8px_rgba(26,23,20,0.12),0_2px_8px_-2px_rgba(26,23,20,0.06)] hover:-translate-y-1 group transition-all duration-300 flex flex-col justify-between text-left"
                >
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between items-start">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-black uppercase font-mono select-none">
                        {job.type}
                      </span>
                      <span className="text-xs text-[#6B6560] flex items-center gap-1 font-semibold font-mono">
                        <MapPin className="w-3 h-3 text-emerald-600" /> {job.location}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-[#1A1714] uppercase font-display group-hover:text-emerald-700 transition duration-200">
                        {job.title}
                      </h3>
                      <p className="text-xs text-[#6B6560] font-bold uppercase tracking-wider font-mono">
                        {job.institution} · {job.department}
                      </p>
                    </div>

                    <p className="text-xs text-[#6B6560] leading-relaxed font-sans line-clamp-3 select-text">
                      {job.description}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <span className="block text-xs font-black uppercase tracking-widest text-[#9C9590] antialiased font-mono">Filing Requirements</span>
                      <div className="flex flex-wrap gap-1">
                        {safeRequirements.slice(0, 3).map((r, i) => (
                           <span key={i} className="text-[11px] px-2 py-0.5 bg-[#F0EDE6] text-[#6B6560] rounded-full font-medium border border-[rgba(26,23,20,0.06)]">
                            {r}
                          </span>
                        ))}
                        {safeRequirements.length > 3 && (
                          <span className="text-xs px-1 font-bold text-[#9C9590] font-mono">+{safeRequirements.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>

                <div className="border-t border-[rgba(26,23,20,0.08)] pt-4 mt-4 flex gap-2">
                  
                  {/* Public Apply Now gateway redirector */}
                  <button 
                    onClick={() => {
                      setSelectedGlimpseJob(job);
                      setCurrentSlidePage(0);
                    }}
                    className="flex-1 min-h-[44px] bg-[#1a1714] hover:bg-[#2d2822] text-white font-extrabold rounded-[12px] px-4 py-2 text-xs transition-all duration-150 tracking-wider uppercase flex items-center justify-center cursor-pointer font-display shadow-sm active:scale-95 border border-[#1a1714]"
                    id={`btn_glimpse_job_${job.id}`}
                  >
                    Take a Glimpse
                  </button>

                  {/* Staff CRUD shortcuts */}
                  {currentUser && (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => openEditJob(job)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg cursor-pointer transition-all leading-none"
                        title="Edit Job Credentials"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-700" />
                      </button>
                      <button 
                        onClick={() => handleJobDelete(job.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg cursor-pointer transition-all leading-none"
                        title="Dismantle opening"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </button>
                    </div>
                  )}

                </div>
              </motion.div>
            )})}
          </div>
        )}
      </section>

      {/* Distinctive All Portfolios Showcase Grid */}
      <section className="w-full bg-[#F0EDE6] py-10 px-4 sm:px-8 lg:px-12 rounded-[28px] max-w-[1400px] mx-auto space-y-6 text-left border border-[rgba(26,23,20,0.06)] shadow-sm">
        <div className="border-b border-[rgba(26,23,20,0.12)] pb-3">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
            All Portfolios
          </span>
          <h2 className="text-lg font-black text-[#1A1714] font-display uppercase tracking-tight mt-1.5">Administrative & Regional Branches</h2>
          <p className="text-[#6B6560] text-xs">Our interconnected Mutually Reinforcing Entities providing countryside community support.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] shadow-[0_2px_12px_rgba(26,23,20,0.04)] text-left space-y-2 hover:border-emerald-600 hover:-translate-y-0.5 transition duration-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">A</div>
            <h4 className="text-xs font-bold text-[#1A1714] uppercase leading-tight font-display">CARD Bank Microfinance</h4>
            <p className="text-xs text-[#6B6560] leading-normal">Responsive rural banking portfolio serving landless rural ladies and farmers nationwide.</p>
          </div>
          <div className="p-5 bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] shadow-[0_2px_12px_rgba(26,23,20,0.04)] text-left space-y-2 hover:border-emerald-600 hover:-translate-y-0.5 transition duration-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-teal-800 flex items-center justify-center font-bold text-xs">B</div>
            <h4 className="text-xs font-bold text-[#1A1714] uppercase leading-tight font-display">SME Development</h4>
            <p className="text-xs text-[#6B6560] leading-normal">Intervention capital loans and structural coaching designed to scale small rural enterprises.</p>
          </div>
          <div className="p-5 bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] shadow-[0_2px_12px_rgba(26,23,20,0.04)] text-left space-y-2 hover:border-emerald-600 hover:-translate-y-0.5 transition duration-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">C</div>
            <h4 className="text-xs font-bold text-[#1A1714] uppercase leading-tight font-display">Mutual Insurance (MBA)</h4>
            <p className="text-xs text-[#6B6560] leading-normal">Premium micro-assurance packages bringing relief security structures to marginalized countrysides.</p>
          </div>
          <div className="p-5 bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] shadow-[0_2px_12px_rgba(26,23,20,0.04)] text-left space-y-2 hover:border-emerald-600 hover:-translate-y-0.5 transition duration-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#047857] flex items-center justify-center font-bold text-xs">D</div>
            <h4 className="text-xs font-bold text-[#1A1714] uppercase leading-tight font-display">IT Support Operations</h4>
            <p className="text-xs text-[#6B6560] leading-normal">Providing technical backing, systems diagnostics, and microfinance telemetry connections.</p>
          </div>
        </div>

        {/* Repositioned secure employee access gateway link */}
        {!currentUser && (
          <div className="pt-2 text-center">
            <div className="inline-flex flex-col items-center gap-1.5 p-5 bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] shadow-[0_2px_12px_rgba(26,23,20,0.04)] mx-auto">
              <div className="flex items-center gap-1.5 text-xs text-[#1A1714] font-bold">
                <Lock className="w-3.5 h-3.5 text-[#6B6560]" />
                <span>Are you a registered Staff Recruiter or IT Admin?</span>
              </div>
              <button 
                onClick={() => setActiveTab("login")}
                className="px-6 py-2.5 text-xs font-sans font-black uppercase text-white bg-emerald-700 hover:bg-emerald-800 rounded-[12px] cursor-pointer transition shadow-[0_2px_8px_-2px_rgba(5,150,105,0.4)] hover:shadow-[0_4px_16px_-4px_rgba(5,150,105,0.5)] active:scale-95 duration-100"
                id="employee_access_gateway"
              >
                CMRI Employee Access
              </button>
              <span className="text-[10px] text-[#9C9590] font-mono">Protected by strict Supabase JWT & Row-Level Authorization Rules</span>
            </div>
          </div>
        )}
      </section>

      {/* Unified Homepage Footer / Emergency Contacts Panel */}
      <footer className="w-full bg-slate-50 border-t border-slate-200/80 pt-8 mt-12 py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center md:text-left">
          
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-700 block" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">CARD MRI Institutional Portal</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              We operate under a mission-driven developmental mandate. Our digital platforms help streamline recruiting assessments while preserving absolute integrity.
            </p>
            <p className="text-xs text-slate-400 font-mono">© 2026 CARD Mutually Reinforcing Institutions. All Rights Registered.</p>
          </div>

          {/* Combined Emergency Contacts & Channels footer workspace (Enhancement 7 & 10) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 font-display text-center md:text-left">Emergency Incident Contacts & Channels</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {settings.emergencyContacts && settings.emergencyContacts.map(contact => (
                <div key={contact.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 text-center md:text-left">
                  <span className="text-xs font-black text-slate-400 uppercase block select-none leading-none mb-0.5">{contact.label}</span>
                  <span className="text-xs text-slate-700 font-semibold leading-relaxed block font-sans select-all">{contact.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </footer>

      {/* Interactive CREATE/EDIT job slot modal panel */}
      {isJobModalOpen && (
        <div className="fixed inset-0 md:p-4 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in">
          <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg p-6 shadow-2xl relative overflow-y-auto text-left rounded-t-3xl md:rounded-3xl border-t border-slate-200 md:border border-slate-200">
            <button 
              onClick={() => setIsJobModalOpen(false)}
              className="absolute right-2 top-2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider font-display mb-4">
              {editingJob ? `Modify Vacant: ${editingJob.title}` : "Initialize New Vacancy Slot"}
            </h3>

            {jobError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{jobError}</span>
              </div>
            )}

            <form onSubmit={handleJobSubmit} className="space-y-4 text-xs font-sans">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Job Title</label>
                  <input 
                    type="text" 
                    value={jobTitle} 
                    onChange={e => setJobTitle(e.target.value)} 
                    placeholder="e.g. Branch Associate" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Job Location</label>
                  <input 
                    type="text" 
                    value={jobLoc} 
                    onChange={e => setJobLoc(e.target.value)} 
                    placeholder="e.g. San Pablo City, Laguna" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Division/Department</label>
                  <input 
                    type="text" 
                    value={jobDept} 
                    onChange={e => setJobDept(e.target.value)} 
                    placeholder="e.g. Microfinance" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Core Entity</label>
                  <input 
                    type="text" 
                    value={jobInst} 
                    onChange={e => setJobInst(e.target.value)} 
                    placeholder="e.g. CARD Bank" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Time Type</label>
                  <select 
                    value={jobType} 
                    onChange={e => setJobType(e.target.value)} 
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Job Description Outline</label>
                <textarea 
                  value={jobDesc} 
                  onChange={e => setJobDesc(e.target.value)} 
                  rows={4}
                  placeholder="Outline key operational duties..." 
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant Requirements (Comma separated list)</label>
                <input 
                  type="text" 
                  value={jobReqs} 
                  onChange={e => setJobReqs(e.target.value)} 
                  placeholder="e.g. BS Social Work, Drivers License, Willing to travel" 
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setIsJobModalOpen(false)}
                  className="min-h-[44px] px-5 py-2 text-xs font-bold text-slate-655 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  disabled={saveLoading}
                  className="min-h-[44px] px-6 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saveLoading ? "Saving Posting..." : "Commit Vacancy"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Take a Glimpse Presentation Slider Modal Component */}
      {selectedGlimpseJob && (
        <ApplicantViewer 
          selectedGlimpseJob={selectedGlimpseJob}
          onClose={() => setSelectedGlimpseJob(null)}
          onProceedToScreening={() => {
            setIsScreeningOpen(true);
            setScreeningStep(1);
            setScreenFullName("");
            setScreenAge("");
            setScreenCivilStatus("Single");
            setScreenAddress("");
            setScreenEducationLevel("College Graduate");
            setScreenContactNumber("");
            setScreenEmail("");
            setScreenCourseGraduated("");
            setScreenAnswers({});
            setScreeningSubmitError("");
          }}
        />
      )}

      {/* DYNAMIC SCREENING PHASE (Applicant Multistep Form Modal Component - Requirement 2) */}
      {isScreeningOpen && selectedGlimpseJob && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4 z-50 animate-in fade-in duration-205">
          <div className="bg-white rounded-t-3xl md:rounded-3xl border-t md:border border-slate-200/80 w-full h-full md:h-auto md:max-h-[92vh] max-w-2xl p-6 shadow-2xl relative overflow-y-auto text-left flex flex-col gap-4">
            
            {/* Header with Title and Closing Trigger */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-mono tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase font-bold">
                  Applicant Selection Phase
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight font-display pt-1">
                  Automated Screening Form
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Applying for: <strong>{selectedGlimpseJob.title}</strong> at {selectedGlimpseJob.institution}
                </p>
              </div>
              <button 
                onClick={() => setIsScreeningOpen(false)}
                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer shrink-0 border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators Bar */}
            <div className="flex items-center gap-2 text-xs font-mono font-black uppercase text-center py-1">
              <span className={`flex-1 py-1 rounded bg-slate-50 border ${screeningStep === 1 ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "text-slate-400 border-transparent"}`}>
                1. Basic Info
              </span>
              <span className="text-slate-300">➔</span>
              <span className={`flex-1 py-1 rounded bg-slate-50 border ${screeningStep === 2 ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "text-slate-400 border-transparent"}`}>
                2. Screening Questions
              </span>
              <span className="text-slate-300">➔</span>
              <span className={`flex-1 py-1 rounded bg-slate-50 border ${screeningStep === 3 ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "text-slate-400 border-transparent"}`}>
                3. Final Status
              </span>
            </div>

            {/* Submission Error Banner */}
            {screeningSubmitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-bounce">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold uppercase tracking-tight">Vetting Guard Exception</p>
                  <p>{screeningSubmitError}</p>
                </div>
              </div>
            )}

            {/* FORM MULTI-STEP LOGIC */}
            <form onSubmit={handleScreeningSubmit} className="space-y-4">
              
              {/* STEP 1: Basic Information Input */}
              {screeningStep === 1 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase font-mono">Full Name *</label>
                      <input 
                        type="text" 
                        required
                        value={screenFullName}
                        onChange={(e) => setScreenFullName(e.target.value)}
                        placeholder="e.g. Jane Maria Cruz"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase font-mono">Age *</label>
                      <input 
                        type="number" 
                        required
                        min="18"
                        max="65"
                        value={screenAge}
                        onChange={(e) => setScreenAge(e.target.value)}
                        placeholder="e.g. 23"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl text-slate-850 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase font-mono">Civil Status *</label>
                      <select
                        value={screenCivilStatus}
                        onChange={(e) => setScreenCivilStatus(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-505 text-slate-500 uppercase font-mono">Education Level *</label>
                      <select
                        value={screenEducationLevel}
                        onChange={(e) => setScreenEducationLevel(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="Elementary">Elementary Graduate</option>
                        <option value="High School">High School Graduate</option>
                        <option value="Vocational">Vocational Certification</option>
                        <option value="College Graduate">College Graduate</option>
                        <option value="Postgraduate">Postgraduate degree</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-black text-slate-500 uppercase font-mono">Complete Mailing Address *</label>
                    <input 
                      type="text" 
                      required
                      value={screenAddress}
                      onChange={(e) => setScreenAddress(e.target.value)}
                      placeholder="e.g. Brgy. IV, M. Paulino St, San Pablo City, Laguna"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase font-mono">Contact Number *</label>
                      <input 
                        type="text" 
                        required
                        value={screenContactNumber}
                        onChange={(e) => setScreenContactNumber(e.target.value)}
                        placeholder="e.g. +63 944 123 4567"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase font-mono">Email Address *</label>
                      <input 
                        type="email" 
                        required
                        value={screenEmail}
                        onChange={(e) => setScreenEmail(e.target.value)}
                        placeholder="e.g. jane.cruz@gmail.com"
                        className="w-full text-xs p-2.5 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-black text-slate-500 uppercase font-mono">Course / Degree Graduated *</label>
                    <input 
                      type="text" 
                      required
                      value={screenCourseGraduated}
                      onChange={(e) => setScreenCourseGraduated(e.target.value)}
                      placeholder="e.g. BS in Business Administration major in Financial Management"
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    />
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={!screenFullName || !screenAge || !screenAddress || !screenContactNumber || !screenEmail || !screenCourseGraduated}
                      onClick={() => setScreeningStep(2)}
                      className="min-h-[44px] px-5 py-3 text-xs font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-black rounded-xl duration-150 disabled:opacity-40"
                    >
                      Next Step (Questions) ▶
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Custom Multi-choice Screening Questions */}
              {screeningStep === 2 && (
                <div className="space-y-4">
                  {loadingQuestions ? (
                    <div className="text-center py-6 text-xs text-slate-400 animate-pulse font-mono">
                      Retrieving live recruitment parameters...
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[48vh] overflow-y-auto pr-1">
                      {questions.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-3">No active screening questions in this branch sector.</p>
                      ) : (
                        questions.map((q, idx) => (
                          <div key={q.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-800 space-y-2 text-left">
                            <span className="font-mono text-xs text-emerald-800 font-bold block">QUESTION {idx + 1}</span>
                            <p className="font-bold text-slate-900 text-xs leading-relaxed">{q.text}</p>
                            
                            {/* Radio, select or text input based on dynamic question type */}
                            {q.type === 'boolean' && (
                              <div className="flex flex-wrap gap-4 pt-1">
                                {["Yes", "No"].map(val => (
                                  <label key={val} className="flex items-center gap-1.5 font-semibold cursor-pointer text-slate-755">
                                    <input 
                                      type="radio" 
                                      name={`quest_${q.id}`}
                                      value={val}
                                      checked={screenAnswers[q.id] === val}
                                      onChange={(e) => setScreenAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                      className="text-emerald-700 focus:ring-emerald-700 w-4 h-4 cursor-pointer"
                                    />
                                    {val}
                                  </label>
                                ))}
                                <label className="flex items-center gap-1.5 font-semibold cursor-pointer text-slate-400">
                                  <input 
                                    type="radio" 
                                    name={`quest_${q.id}`}
                                    value=""
                                    checked={screenAnswers[q.id] === "" || screenAnswers[q.id] === undefined}
                                    onChange={() => setScreenAnswers(prev => ({ ...prev, [q.id]: "" }))}
                                    className="text-slate-400 focus:ring-slate-300 w-4 h-4 cursor-pointer"
                                  />
                                  Not yet answered
                                </label>
                              </div>
                            )}

                            {q.type === 'select' && (
                              <select
                                value={screenAnswers[q.id] || ""}
                                onChange={(e) => setScreenAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-lg font-medium outline-none"
                              >
                                <option value="" disabled>-- Please select an option --</option>
                                {q.options?.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {q.type === 'text' && (
                              <input 
                                type="text"
                                required={q.required}
                                value={screenAnswers[q.id] || ""}
                                onChange={(e) => setScreenAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Write your brief honest answer here..."
                                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-xl"
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setScreeningStep(1)}
                      className="min-h-[44px] px-5 py-3 text-xs font-black uppercase text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl duration-150"
                    >
                      ◀ Back
                    </button>
                    <button
                      type="submit"
                      disabled={screeningSubmitLoading}
                      className="min-h-[44px] px-5 py-3 text-xs font-black uppercase tracking-wider text-white bg-emerald-800 hover:bg-emerald-950 rounded-xl duration-150 flex items-center gap-2"
                    >
                      {screeningSubmitLoading ? "Analyzing Screening..." : "Submit File Vetting 🚀"}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Success Acknowledgement Block */}
              {screeningStep === 3 && (
                <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm animate-bounce">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 text-center">
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">Vetting Application Logged!</h2>
                    <p className="text-xs text-zinc-650 text-zinc-900 leading-normal max-w-sm mx-auto">
                      Thank you for applying. Your primary answers were evaluated and saved under the Secure Recruitment Ledger in state <strong>New</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl max-w-sm mx-auto text-xs text-emerald-900 leading-snug">
                    Our Recruitment Vetting Officers (staff team of <strong>Ms. Ailen Entero</strong>) are scheduled to review your screening scorecard and dispatch invitations shortly.
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsScreeningOpen(false);
                        setSelectedGlimpseJob(null);
                      }}
                      className="min-h-[44px] px-6 py-3 font-bold tracking-wider text-xs uppercase bg-slate-900 hover:bg-black text-white rounded-xl cursor-pointer duration-150"
                    >
                      Close and Complete
                    </button>
                  </div>
                </div>
              )}

            </form>

          </div>
        </div>
      )}

    </div>
  );
}