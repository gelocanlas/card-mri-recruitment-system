import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Layers, 
  User, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  FileText, 
  FileDown,
  PlusCircle, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Database,
  Users,
  Terminal,
  Edit,
  Save,
  Key,
  KeyRound,
  X,
  Mail,
  UserCheck
} from "lucide-react";
import { JobApplication, UserProfile, JobPosting } from "../types";
import { authFetch } from "../lib/api";
import { getSupabaseClient } from "../lib/supabase";
import { useToast } from "./ToastContext";
import ReportExporter from "./ReportExporter";

interface DashboardPageProps {
  currentUser: UserProfile | null;
  setActiveTab: (tab: string) => void;
  jobs: JobPosting[];
  onRefreshJobs: () => void;
  statusesList: string[];
  setStatusesList: React.Dispatch<React.SetStateAction<string[]>>;
  institutionsLookup: string[];
  setInstitutionsLookup: React.Dispatch<React.SetStateAction<string[]>>;
  hrInchargesLookup: string[];
  setHrInchargesLookup: React.Dispatch<React.SetStateAction<string[]>>;
}

interface SystemLog {
  id: string;
  timestamp: string;
  actor: string;
  operation: string;
  details: string;
}

export default function DashboardPage({
  currentUser,
  setActiveTab,
  jobs,
  onRefreshJobs,
  statusesList,
  setStatusesList,
  institutionsLookup,
  setInstitutionsLookup,
  hrInchargesLookup,
  setHrInchargesLookup
}: DashboardPageProps) {
  const { showToast, showConfirm } = useToast();

  // Navigation tabs for administrative staff
  // Recruiters have access to "dossiers", IT Admins have access to "dossiers", "users", and "logs".
  const [currentTab, setCurrentTab] = useState<"summary" | "dossiers" | "users" | "logs">("summary");

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // System logs and User provisioning states for IT Admins
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // HR Dossier evaluation drawer/inspector
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterEducation, setFilterEducation] = useState("All");

  // Inspector active dossier editing states
  const [inspectStatus, setInspectStatus] = useState<string>("");
  const [inspectEndorsedTo, setInspectEndorsedTo] = useState<string>("");
  const [inspectHrIncharge, setInspectHrIncharge] = useState<string>("");
  const [inspectRemarks, setInspectRemarks] = useState<string>("");
  const [inspectCommitLoading, setInspectCommitLoading] = useState(false);

  // Manual Entry Dialog controller
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manFullName, setManFullName] = useState("");
  const [manEmail, setManEmail] = useState("");
  const [manPhone, setManPhone] = useState("");
  const [manAge, setManAge] = useState("");
  const [manCivilStatus, setManCivilStatus] = useState("Single");
  const [manAddress, setManAddress] = useState("");
  const [manEducation, setManEducation] = useState("College Graduate");
  const [manCourseGraduated, setManCourseGraduated] = useState("");
  const [manResumeText, setManResumeText] = useState("");
  const [manJobId, setManJobId] = useState("");
  const [manRemarks, setManRemarks] = useState("");
  const [manEndorsedTo, setManEndorsedTo] = useState("");
  const [manHrIncharge, setManHrIncharge] = useState("");
  const [manStatus, setManStatus] = useState("New");
  const [manSubmitError, setManSubmitError] = useState("");
  const [manLoading, setManLoading] = useState(false);

  const INSTITUTIONS_LOOKUP = institutionsLookup;
  const HR_INCHARGES_LOOKUP = hrInchargesLookup;

  const [isSavingDossier, setIsSavingDossier] = useState(false);

  // Dossier modification states
  const [isEditingDossier, setIsEditingDossier] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editCivilStatus, setEditCivilStatus] = useState("Single");
  const [editEducationLevel, setEditEducationLevel] = useState("College Graduate");
  const [editCourseGraduated, setEditCourseGraduated] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editResumeText, setEditResumeText] = useState("");
  const [dossierSubTab, setDossierSubTab] = useState<"info" | "questions" | "vetting">("info");

  const startEditingDossier = () => {
    if (selectedApp) {
      setEditFullName(selectedApp.fullName || "");
      setEditEmail(selectedApp.email || "");
      setEditPhone(selectedApp.phone || "");
      setEditAge(selectedApp.age?.toString() || "");
      setEditCivilStatus(selectedApp.civilStatus || "Single");
      setEditEducationLevel(selectedApp.educationLevel || "College Graduate");
      setEditCourseGraduated(selectedApp.courseGraduated || selectedApp.course_graduated || "");
      setEditJobTitle(selectedApp.jobTitle || "");
      setEditResumeText(selectedApp.resumeText || "");
      setIsEditingDossier(true);
    }
  };

  const handleSaveDossierEdits = async () => {
    if (!selectedApp) return;
    const updated = {
      fullName: editFullName,
      email: editEmail,
      phone: editPhone,
      age: editAge ? parseInt(editAge) : null,
      civilStatus: editCivilStatus,
      educationLevel: editEducationLevel,
      courseGraduated: editCourseGraduated,
      courseImgUrl: null, // support older formats if needed
      jobTitle: editJobTitle,
      resumeText: editResumeText
    };

    setIsSavingDossier(true);
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
          const { error } = await supabase
            .from("applicants")
            .update({
              full_name: updated.fullName,
              email: updated.email,
              phone: updated.phone,
              age: updated.age,
              civil_status: updated.civilStatus,
              education_level: updated.educationLevel,
              course_graduated: updated.courseGraduated
            })
            .eq("id", selectedApp.id);

        if (error) {
          console.error("Database update failure:", error);
          throw new Error(error.message);
        }
      } else {
        const res = await authFetch(`/api/applications/${selectedApp.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        if (!res.ok) throw new Error("Failed to edit candidate dataset.");
      }

      const freshApps = await fetchApplications();
      if (freshApps) {
        const found = freshApps.find(a => a.id === selectedApp.id);
        if (found) {
          setSelectedApp(found);
        } else {
          setSelectedApp(prev => prev ? { ...prev, ...updated } as JobApplication : null);
        }
      } else {
        setSelectedApp(prev => prev ? { ...prev, ...updated } as JobApplication : null);
      }
      setIsEditingDossier(false);
      setShowUnsavedWarning(false);
      showToast("✅ Changes saved successfully.", "success");
    } catch (err: any) {
      console.error("Database update failure:", err);
      showToast("Error saving edits: " + err.message, "error");
    } finally {
      setIsSavingDossier(false);
    }
  };

  useEffect(() => {
    setIsEditingDossier(false);
    setShowUnsavedWarning(false);
  }, [selectedApp]);

  useEffect(() => {
    if (selectedApp) {
      setInspectStatus(selectedApp.status);
      setInspectEndorsedTo(selectedApp.endorsedTo || "");
      setInspectHrIncharge(selectedApp.hrIncharge || "");
      setInspectRemarks(selectedApp.remarks || "");
    }
  }, [selectedApp]);

  // User management modals/forms (restricted provisioning)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [provEmail, setProvEmail] = useState("");
  const [provFullName, setProvFullName] = useState("");
  const [provPhone, setProvPhone] = useState("");
  const [provPassword, setProvPassword] = useState("");
  const [provRole, setProvRole] = useState<"recruiter" | "it_admin">("recruiter");
  const [provTitle, setProvTitle] = useState("Staff Officer");
  const [provError, setProvError] = useState("");

  // Statistics counters
  const [totalApps, setTotalApps] = useState(0);
  const [pendingCount, setPendingCount] = useState(0); // Representing "On Process"
  const [hiredCount, setHiredCount] = useState(0);
  const [endorsedCount, setEndorsedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  // Client-side instant keyword, status, and education level multi-filter criteria
  const filteredApps = applications.filter(app => {
    // 1. Matches keyword query
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || (app.fullName || "").toLowerCase().includes(query);

    // 2. Matches status filter
    const matchesStatus = filterStatus === "All" || app.status === filterStatus;

    // 3. Matches education level filter
    const matchesEducation = filterEducation === "All" || (app.educationLevel || "").toLowerCase() === filterEducation.toLowerCase();

    return matchesQuery && matchesStatus && matchesEducation;
  });

  // Export to CSV helper
  const handleExportToCSV = () => {
    const headers = [
      "Applicant ID",
      "Full Name",
      "Email",
      "Contact Number",
      "Job Title / Vacancy",
      "Age",
      "Civil Status",
      "Education Level",
      "Address",
      "Current Status",
      "Endorsed To / Branch Office",
      "HR In-Charge",
      "Remarks / Evaluation Brief",
      "Applied Date",
      "Source Question (Where heard opportunity)",
      "Relocation Question (Assign to any branch)"
    ];

    const escapeCsvCell = (val: any) => {
      if (val === null || val === undefined) return "";
      const stringified = String(val);
      const escaped = stringified.replace(/"/g, '""');
      if (escaped.includes('"') || escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r')) {
        return `"${escaped}"`;
      }
      return escaped;
    };

    const rows = filteredApps.map(app => {
      const infoSource = app.screeningAnswers?.find((q: any) => q.questionId === 'info_source')?.answer || "";
      const assignAnywhere = app.screeningAnswers?.find((q: any) => q.questionId === 'assign_anywhere')?.answer || "";
      
      return [
        app.id,
        app.fullName,
        app.email,
        app.phone,
        app.jobTitle,
        app.age,
        app.civilStatus,
        app.educationLevel,
        app.address,
        app.status,
        app.endorsedTo,
        app.hrIncharge,
        app.remarks,
        app.applied_at ? new Date(app.applied_at).toLocaleString() : "",
        infoSource,
        assignAnywhere
      ];
    });

    const csvContent = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map(row => row.map(escapeCsvCell).join(","))
    ].join("\n");

    try {
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `card-mri-applicants-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`📂 Exported ${filteredApps.length} applicants to CSV.`, "success");
    } catch (err: any) {
      console.error("CSV Export fail:", err);
      showToast("Could not complete CSV Export: " + err.message, "error");
    }
  };

  // Fetch job application lists
  const fetchApplications = async (): Promise<JobApplication[]> => {
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      let allMapped: JobApplication[] = [];

      if (supabase) {
        const { data, error } = await supabase
          .from("applicants")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          allMapped = data.map((item: any) => ({
            id: item.id,
            applicant_id: item.applicant_id || "public-guest-generic",
            fullName: item.full_name,
            email: item.email,
            phone: item.phone || "",
            job_id: item.job_id || "manual-generic",
            jobTitle: item.job_id
              ? (jobs.find((j: any) => j.id === item.job_id)?.title || item.job_title || "General Vacancy")
              : (item.job_title || "General Vacancy"),
            resumeFileName: item.resume_file_name || "Profile_Screening_Form.pdf",
            resumeText: item.resume_text || `Applicant: ${item.full_name}. Reg: ${new Date(item.created_at).toLocaleString()}.`,
            status: item.status,
            age: item.age,
            civilStatus: item.civil_status,
            address: item.address,
            educationLevel: item.education_level,
            courseGraduated: item.course_graduated || "",
            endorsedTo: item.endorsed_to || "",
            hrIncharge: item.hr_incharge || "",
            remarks: item.remarks || "",
            applied_at: item.applied_at || item.created_at,
            screeningAnswers: Array.isArray(item.screening_answers)
              ? item.screening_answers
              : typeof item.screening_answers === "string"
                ? JSON.parse(item.screening_answers)
                : [],
            ai_summary: {
              summary: item.remarks || "No evaluation remarks recorded.",
              skills: ["Database Verified"],
              education: item.education_level || "College Graduate",
              match_score: 95
            }
          }));
        }
      }

      // Supplement with memory-only applications from the API
      try {
        const res2 = await fetch("/api/api-only-applications", {
          headers: { Authorization: `Bearer ${localStorage.getItem("card_mri_token")}` }
        });
        if (res2.ok) {
          const memoryApps = await res2.json();
          const existingIds = new Set(allMapped.map(a => a.id));
          for (const mem of memoryApps) {
            if (!existingIds.has(mem.id)) {
              allMapped.push({
                id: mem.id,
                applicant_id: "public-guest-generic",
                fullName: mem.full_name || "Unknown",
                email: mem.email || "",
                phone: mem.phone || "",
                job_id: mem.job_id || "manual-generic",
                jobTitle: mem.job_title || "General Vacancy",
                resumeFileName: mem.resume_file_name || "Profile_Screening_Form.pdf",
                resumeText: mem.resume_text || "",
                status: mem.status || "New",
                age: mem.age,
                civilStatus: mem.civil_status || "Single",
                address: mem.address || "",
                educationLevel: mem.education_level || "College Graduate",
                courseGraduated: mem.course_graduated || "",
                endorsedTo: mem.endorsed_to || "",
                hrIncharge: mem.hr_incharge || "",
                remarks: mem.remarks || "",
                applied_at: mem.applied_at || mem.created_at,
                screeningAnswers: Array.isArray(mem.screening_answers) ? mem.screening_answers : [],
                ai_summary: {
                  summary: mem.remarks || "No evaluation remarks recorded.",
                  skills: ["Database Verified"],
                  education: mem.education_level || "College Graduate",
                  match_score: 95
                }
              });
              existingIds.add(mem.id);
            }
          }
        }
      } catch {}

      if (allMapped.length > 0) {
        setApplications(allMapped);
        setTotalApps(allMapped.length);
        const onProcessStatuses = ['New', 'Acknowledge', 'Passed Screening', 'Pending', 'Screening', 'Interview', 'Technical Assessment'];
        setPendingCount(allMapped.filter((a: any) => onProcessStatuses.includes(a.status)).length);
        setHiredCount(allMapped.filter((a: any) => a.status === 'Hired').length);
        setEndorsedCount(allMapped.filter((a: any) => a.status === 'Already Endorsed' || a.endorsedTo).length);
        setRejectedCount(allMapped.filter((a: any) => a.status === 'Rejected' || a.status === 'Rejected (With Relatives)').length);
        return allMapped;
      }

      // Fallback to API if Supabase + memory supplement both returned nothing
      const res = await authFetch("/api/applications");
      if (!res.ok) throw new Error("Could not load candidate evaluation queues.");
      const apiData = await res.json();
      setApplications(apiData);
      setTotalApps(apiData.length);
      const onProcessStatuses = ['New', 'Acknowledge', 'Passed Screening', 'Pending', 'Screening', 'Interview', 'Technical Assessment'];
      setPendingCount(apiData.filter((a: any) => onProcessStatuses.includes(a.status)).length);
      setHiredCount(apiData.filter((a: any) => a.status === 'Hired').length);
      setEndorsedCount(apiData.filter((a: any) => a.status === 'Already Endorsed' || a.endorsedTo).length);
      setRejectedCount(apiData.filter((a: any) => a.status === 'Rejected' || a.status === 'Rejected (With Relatives)').length);
      return apiData;
    } catch (err: any) {
      console.error(err.message || err);
      setError(err.message || "Failed to load applications.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered users (IT Admin only override)
  const fetchUserAccounts = async () => {
    if (currentUser?.role !== "it_admin") return;
    setLoadingUsers(true);
    try {
      const res = await authFetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUserAccounts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch chronological audit trails (IT Admin only override)
  const fetchSystemLogs = async () => {
    if (currentUser?.role !== "it_admin") return;
    setLoadingLogs(true);
    try {
      const res = await authFetch("/api/system-logs");
      if (res.ok) {
        const data = await res.json();
        setSystemLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchApplications();
      if (currentUser.role === "it_admin") {
        fetchUserAccounts();
        fetchSystemLogs();
      }

      const interval = setInterval(() => {
        fetchApplications();
        if (currentUser.role === "it_admin") {
          fetchUserAccounts();
          fetchSystemLogs();
        }
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // Handler: Change applicant pipeline status stage (with dynamic system logs tracking)
  const handleStatusChange = async (appId: string, nextStatus: string, endorsedTo?: string, hrIncharge?: string, remarks?: string) => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const updateData: any = {
          status: nextStatus
        };
        if (endorsedTo !== undefined) updateData.endorsed_to = endorsedTo;
        if (hrIncharge !== undefined) updateData.hr_incharge = hrIncharge;
        if (remarks !== undefined) updateData.remarks = remarks;

        const { error } = await supabase
          .from("applicants")
          .update(updateData)
          .eq("id", appId);

        if (error) throw new Error(error.message);
      } else {
        const res = await authFetch(`/api/applications/${appId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            status: nextStatus,
            endorsedTo,
            hrIncharge,
            remarks,
            actorName: currentUser?.fullName || "Staff Officer"
          }),
        });
        if (!res.ok) throw new Error("Failed to transition candidate status.");
      }
      
      const freshApps = await fetchApplications();

      // Update active selected inspector application copy
      if (freshApps) {
        const found = freshApps.find(a => a.id === appId);
        if (found && selectedApp?.id === appId) {
          setSelectedApp(found);
        }
      }

      // Reload system logs to trace audit trails instantly
      if (currentUser?.role === "it_admin") {
        await fetchSystemLogs();
      }
      showToast("✅ Candidate recruitment status changed inside ledger.", "success");
    } catch (err: any) {
      console.error("Database update failure:", err);
      showToast("Pipeline Change Error: " + err.message, "error");
    }
  };

  // Handler: Terminate applicant record database insertion (Staff cleanup)
  const handleDeleteApp = async (appId: string) => {
    showConfirm(
      {
        title: "Irreversible Action Warning",
        message: "CRITICAL WARNING: Dismantling candidate records is irreversible. Are you sure you wish to delete this application permanently?",
        confirmLabel: "Dismantle",
        cancelLabel: "Cancel",
        type: "danger"
      },
      async () => {
        try {
          const supabase = getSupabaseClient();
          if (supabase) {
            const { error } = await supabase
              .from("applicants")
              .delete()
              .eq("id", appId);

            if (error) throw new Error(error.message);
          } else {
            const res = await authFetch(`/api/applications/${appId}`, { 
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ actorName: currentUser?.fullName || "HR Specialist" })
            });
            if (!res.ok) throw new Error("Failed server-side ledger termination.");
          }
          
          await fetchApplications();
          if (selectedApp?.id === appId) {
            setSelectedApp(null);
          }

          if (currentUser?.role === "it_admin") {
            await fetchSystemLogs();
          }
          showToast("✅ Candidate record dismantled successfully.", "success");
        } catch (err: any) {
          showToast("Error: " + err.message, "error");
        }
      }
    );
  };

  // Handler: Register a manual walkthrough / offline candidate directly
  const handleManualEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManSubmitError("");
    setManLoading(true);

    if (!manFullName || !manEmail || !manPhone || !manAge || !manAddress || !manJobId || !manCourseGraduated) {
      setManSubmitError("Verification failed: Please complete all required properties (including Course/Degree).");
      setManLoading(false);
      return;
    }

    const selectedJob = jobs.find(j => j.id === manJobId);
    const payload = {
      applicant_id: "public-guest-generic",
      full_name: manFullName.trim(),
      fullName: manFullName.trim(),
      email: manEmail.trim(),
      phone: manPhone.trim(),
      age: parseInt(manAge) || 21,
      civil_status: manCivilStatus,
      civilStatus: manCivilStatus,
      address: manAddress.trim(),
      education_level: manEducation,
      educationLevel: manEducation,
      course_graduated: manCourseGraduated.trim(),
      courseGraduated: manCourseGraduated.trim(),
      job_id: manJobId,
      jobId: manJobId,
      job_title: selectedJob ? selectedJob.title : "Direct Entry Position",
      jobTitle: selectedJob ? selectedJob.title : "Direct Entry Position",
      resume_file_name: "Walkin_Candidate_Ledger.pdf",
      resumeFileName: "Walkin_Candidate_Ledger.pdf",
      resume_text: manResumeText.trim() || `Walk-in candidate directly register ledger. Assigned Representative: ${manHrIncharge || "Ms. Ailen Entero"}.`,
      resumeText: manResumeText.trim() || `Walk-in candidate directly register ledger. Assigned Representative: ${manHrIncharge || "Ms. Ailen Entero"}.`,
      status: manStatus,
      screening_answers: [],
      screeningAnswers: [],
      endorsed_to: manEndorsedTo || "",
      endorsedTo: manEndorsedTo || "",
      hr_incharge: manHrIncharge || "",
      hrIncharge: manHrIncharge || "",
      remarks: manRemarks.trim() || "",
      ai_summary: {
        summary: manRemarks.trim() || "Walk-in registration compiled by HR Generalist.",
        skills: ["Walk-in Vetting", "Direct Entry"],
        education: manEducation,
        match_score: 100
      },
      actorName: currentUser?.fullName || "HR Specialist"
    };

    try {
      const res = await authFetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "System rejected registrant file.");
      }

      // Success
      await fetchApplications();
      if (currentUser?.role === "it_admin") {
        await fetchSystemLogs();
      }
      showToast("✅ Offline walk-in candidate registered in register ledger.", "success");

      // Reset
      setManFullName("");
      setManEmail("");
      setManPhone("");
      setManAge("");
      setManCivilStatus("Single");
      setManAddress("");
      setManEducation("College Graduate");
      setManCourseGraduated("");
      setManResumeText("");
      setManJobId("");
      setManRemarks("");
      setManEndorsedTo("");
      setManHrIncharge("");
      setManStatus("New");

      setIsManualEntryOpen(false);
    } catch (err: any) {
      setManSubmitError(err.message);
      // Explicit Try-Catch error handler block for database structural errors
      showToast("Critical Database Rejection: " + err.message, "error");
    } finally {
      setManLoading(false);
    }
  };

  // Handler: Manage Provisioned Recruiter/IT Admin accounts (IT Admin exclusive override)
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvError("");

    if (!provEmail || !provFullName || !provPhone || (!editingUser && !provPassword)) {
      setProvError("Validation error: Fill out all required fields.");
      return;
    }

    try {
      const payload = {
        email: provEmail.trim(),
        fullName: provFullName.trim(),
        phone: provPhone.trim(),
        role: provRole,
        title: provTitle,
        password: provPassword || undefined,
        actorName: currentUser?.fullName || "IT Administrator"
      };

      let res;
      if (editingUser) {
        // PUT update credentials
        res = await authFetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // POST provision new user
        res = await authFetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "System rejected operation.");
      }

      await fetchUserAccounts();
      await fetchSystemLogs();
      setIsUserModalOpen(false);
      resetProvForm();
    } catch (err: any) {
      setProvError(err.message);
    }
  };

  // Handler: Remove full staffing account (IT Admin override check)
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === "michealangelo.canlas@cardmri.com") {
      showToast("Security boundary: The IT Founder account can never be deleted from the system.", "error");
      return;
    }

    showConfirm(
      {
        title: "Terminate Credential Ledger",
        message: `Warning: Terminating credential ledger? Are you sure you wish to delete ${userEmail} permanent credential record from CARD MRI system?`,
        confirmLabel: "Terminate",
        cancelLabel: "Cancel",
        type: "danger"
      },
      async () => {
        try {
          const res = await authFetch(`/api/users/${userId}?actorName=${encodeURIComponent(currentUser?.fullName || "IT Admin")}`, {
            method: "DELETE"
          });
          if (res.ok) {
            await fetchUserAccounts();
            await fetchSystemLogs();
            showToast(`✅ Staff account ${userEmail} terminated successfully.`, "success");
          } else {
            showToast("Server rejected account termination.", "error");
          }
        } catch (err: any) {
          console.error(err);
          showToast("Error deleting user: " + err.message, "error");
        }
      }
    );
  };

  const openEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setProvEmail(u.email);
    setProvFullName(u.fullName);
    setProvPhone(u.phone);
    setProvRole(u.role);
    setProvTitle(u.title || "Staff Officer");
    setProvPassword("");
    setIsUserModalOpen(true);
  };

  const openCreateUser = () => {
    setEditingUser(null);
    resetProvForm();
    setIsUserModalOpen(true);
  };

  const resetProvForm = () => {
    setProvEmail("");
    setProvFullName("");
    setProvPhone("");
    setProvPassword("");
    setProvRole("recruiter");
    setProvTitle("Staff Recruiter");
    setProvError("");
  };

  // Render variables
  const isItAdmin = currentUser?.role === "it_admin";

  const getDashboardGreeting = () => {
    const hour = new Date().getHours();
    const name = currentUser?.fullName?.split(" ")[0] || "there";
    if (hour >= 5 && hour < 12) 
      return `Good morning, ${name}! ☀️`;
    if (hour >= 12 && hour < 17) 
      return `Good afternoon, ${name}! 👋`;
    if (hour >= 17 && hour < 21) 
      return `Good evening, ${name}! 🌆`;
    return `Welcome back, ${name}! 🌿`;
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 space-y-8 pb-12 text-left">
      
      {/* Dashboard General Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[rgba(26,23,20,0.08)] pb-5">
        <div className="text-left space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-[#1A1714] tracking-tight">
            {getDashboardGreeting()}
          </h1>
          <p className="text-sm text-[#6B6560]">
            Here's your recruitment overview for today.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
            <span className="text-xs text-[#9C9590] font-semibold uppercase tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="text-[#9C9590] text-xs">|</span>
            <span className="text-xs text-[#9C9590] font-mono">
              🛡️ Session: <strong className="text-emerald-700 font-bold">{currentUser?.fullName}</strong> ({currentUser?.title || "Recruiter"})
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              fetchApplications();
              if (isItAdmin) {
                fetchUserAccounts();
                fetchSystemLogs();
              }
            }}
            className="py-2 px-4 shadow-sm text-xs border border-[rgba(26,23,20,0.14)] hover:bg-[#F0EDE6] text-[#1A1714] font-semibold rounded-[12px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Synchronize Database
          </button>

          {currentTab === "dossiers" && (
            <>
              <button
                onClick={() => setIsManualEntryOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-[12px] px-4 py-2 text-xs transition flex items-center gap-1.5 cursor-pointer shadow-[0_2px_8px_-2px_rgba(5,150,105,0.4)]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Manual Entry
              </button>
              <button
                onClick={() => setIsReportOpen(true)}
                className="bg-slate-900 hover:bg-black text-white font-bold rounded-[12px] px-4 py-2 text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                Generate Report
              </button>
            </>
          )}
          
          {isItAdmin && currentTab === "users" && (
            <button
              onClick={openCreateUser}
              className="p-2 py-1.5 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Provision Account
            </button>
          )}
        </div>
      </div>

      {/* Admin exclusive Sub-navigation Tab bar */}
      <div className="flex border-b border-slate-200 gap-1 text-xs select-none font-sans antialiased text-slate-800 overflow-x-auto flex-nowrap pb-1 scrollbar-hidden">
        <button
          onClick={() => setCurrentTab("summary")}
          className={`relative px-4.5 py-3 font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            currentTab === "summary"
              ? "text-emerald-950 font-black bg-slate-50"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
          }`}
          id="btn-subtab-summary"
        >
          📊 Overview Dashboard
          {currentTab === "summary" && (
            <motion.div 
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        <button
          onClick={() => setCurrentTab("dossiers")}
          className={`relative px-4.5 py-3 font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
            currentTab === "dossiers"
              ? "text-emerald-950 font-black bg-slate-50"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
          }`}
          id="btn-subtab-ledger"
        >
          👥 Candidate Vetting Ledger ({applications.length})
          {currentTab === "dossiers" && (
            <motion.div 
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>

        {isItAdmin && (
          <>
            <button
              onClick={() => setCurrentTab("users")}
              className={`relative px-4.5 py-3 font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                currentTab === "users"
                  ? "text-emerald-950 font-black bg-slate-50"
                  : "text-slate-500 hover:text-slate-850 hover:bg-slate-50/50"
              }`}
              id="btn-subtab-users"
            >
              ⚙️ User Directory Provisioning ({userAccounts.length})
              {currentTab === "users" && (
                <motion.div 
                  layoutId="activeSubTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setCurrentTab("logs")}
              className={`relative px-4.5 py-3 font-bold uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                currentTab === "logs"
                  ? "text-emerald-950 font-black bg-slate-50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
              }`}
              id="btn-subtab-logs"
            >
              📑 Audit Trails Operations ({systemLogs.length})
              {currentTab === "logs" && (
                <motion.div 
                  layoutId="activeSubTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </>
        )}
      </div>

      {/* TAB OUTLET CONTENT AREA */}
      {currentTab === "summary" && (
        <div className="mt-6 space-y-6 font-sans antialiased text-slate-800 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-emerald-800 to-slate-900 rounded-2xl mx-0 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-md border border-emerald-900/10">
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold uppercase bg-emerald-700/50 border border-emerald-500/20 px-2.5 py-0.5 rounded-full tracking-wider">
                Recruitment Metrics Center
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Vetting & General Pipeline Analytics</h2>
              <p className="text-xs text-slate-300 max-w-xl font-normal leading-relaxed">
                Welcome to the CARD MRI Recruitment Board. This overview monitors live operational metrics, including screening volumes, endorsement status, and staffing assignments. Generates official reports for division auditing.
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={() => setIsManualEntryOpen(true)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Manual Entry Vetting
              </button>
              <button
                onClick={() => setIsReportOpen(true)}
                className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                Generate Report
              </button>
            </div>
          </div>

          {/* STANDALONE SCORECARD METRICS PANEL */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left space-y-2 shadow-xs transition hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Applicants</p>
              <div className="text-xl font-extrabold text-slate-800">{totalApps} Cohort</div>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">Active Recruitment Pool</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left space-y-2 shadow-xs transition hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Pending (On Process)</p>
              <div className="text-xl font-extrabold text-amber-600">{pendingCount} Active</div>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">Vetting Status Queue</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left space-y-2 shadow-xs transition hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Endorsed</p>
              <div className="text-xl font-extrabold text-indigo-700">{endorsedCount} Placed</div>
              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">Assigned to Entities</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left space-y-2 shadow-xs transition hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Hired</p>
              <div className="text-xl font-extrabold text-emerald-700">{hiredCount} Staff</div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">Onboarded & Sealed</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left space-y-2 shadow-xs transition hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <X className="w-5 h-5 text-rose-600" />
              </div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Rejected Pool</p>
              <div className="text-xl font-extrabold text-rose-700">{rejectedCount} Filed</div>
              <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-medium mt-1 inline-block">Disqualified / Audited</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 text-left space-y-3">
              <h3 className="text-sm font-extrabold text-slate-800">Active Status Pipelines Segment</h3>
              <p className="text-xs text-slate-500 font-sans">Breakdown of the current candidate pool segments status.</p>
              <div className="space-y-3">
                {statusesList.map(st => {
                  const count = applications.filter(a => a.status === st).length;
                  const pct = totalApps ? Math.round((count / totalApps) * 100) : 0;
                  return (
                    <div key={st} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{st}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-3xl text-left text-white flex flex-col justify-between border border-slate-800">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm font-sans text-white">Download Official Vetting Auditing Report</h4>
                <p className="text-xs text-slate-200 font-semibold font-sans leading-relaxed antialiased">
                  Generate, preview, and print formal recruitment registers as PDF. Compiles breakdown metrics, representative workload statuses, and top placement entities safely matching security requirements.
                </p>
              </div>
              <button
                onClick={() => setIsReportOpen(true)}
                className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition text-center self-start font-sans"
              >
                Launch Live Report Builder ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {currentTab === "dossiers" && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-200 font-sans antialiased text-slate-800">
          
          {/* Compounded filtering control panel */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search applicant by name..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl outline-none transition text-slate-800 font-sans font-semibold"
                />
              </div>

              {/* Status Select Filter dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono select-none">Status</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl font-bold font-sans text-slate-700 outline-none hover:bg-slate-100/75 focus:bg-white cursor-pointer transition-all"
                >
                  <option value="All">All Statuses</option>
                  {statusesList.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Education Level dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono select-none">Education</label>
                <select
                  value={filterEducation}
                  onChange={e => setFilterEducation(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl font-bold font-sans text-slate-700 outline-none hover:bg-slate-100/75 focus:bg-white cursor-pointer transition-all"
                >
                  <option value="All">All Education levels</option>
                  <option value="High School Graduate">High School Graduate</option>
                  <option value="College Graduate">College Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                  <option value="Vocational Course">Vocational Course</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                onClick={handleExportToCSV}
                className="text-[10px] text-emerald-800 hover:text-emerald-900 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/60 font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 antialiased shadow-sm"
                title="Export currently filtered list to Excel-compatible CSV"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                Export CSV ({filteredApps.length})
              </button>

              {((filterStatus !== "All") || (filterEducation !== "All") || searchQuery) && (
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("All");
                    setFilterEducation("All");
                  }}
                  className="text-[10px] text-slate-600 hover:text-slate-900 border border-slate-200 font-bold bg-white hover:bg-slate-50 px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 antialiased"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  Reset Filters
                </button>
              )}

              {((filterStatus !== "All" ? 1 : 0) + (filterEducation !== "All" ? 1 : 0)) > 0 && (
                <span className="px-2.5 py-1.5 text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl font-mono font-bold uppercase shrink-0">
                  {((filterStatus !== "All" ? 1 : 0) + (filterEducation !== "All" ? 1 : 0))} active
                </span>
              )}
            </div>
          </div>
          
          {/* Ledger view with 100% horizontal width layout */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-405 font-medium animate-pulse">
              Synchronizing active candidate files...
            </div>
          ) : (
            <div className="w-full space-y-3">
              {/* Desktop and Tablet Ledger (hidden on mobile < md) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 bg-white text-xs">
                  <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b tracking-wider font-semibold animate-none">
                    <tr>
                      <th className="px-4 py-3 text-left w-10">#</th>
                      <th className="px-4 py-3 text-left">Full Name</th>
                      <th className="px-4 py-3 text-left">Age</th>
                      <th className="px-4 py-3 text-left">Civil Status</th>
                      <th className="px-4 py-3 text-left">Address</th>
                      <th className="px-4 py-3 text-left">Education Level</th>
                      <th className="px-4 py-3 text-left">Contact Number</th>
                      <th className="px-4 py-3 text-left max-w-[180px]">Email</th>
                      <th className="px-4 py-3 text-left">Date Applied</th>
                      <th className="px-4 py-3 text-left">Current Status</th>
                      <th className="px-4 py-3 text-right w-[180px] min-w-[180px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredApps.map((app, index) => (
                      <tr 
                        key={app.id} 
                        className={`transition hover:bg-slate-50/70 border-b border-transparent ${
                          selectedApp?.id === app.id ? "bg-emerald-50/30 text-slate-900 border-l-4 border-l-emerald-600" : "text-slate-700"
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-400 font-mono font-bold text-[10px] w-10">{index + 1}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{app.fullName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{app.age || app.age === 0 ? app.age : "N/A"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{app.civilStatus || "Single"}</td>
                        <td className="px-4 py-3 truncate max-w-[130px]" title={app.address}>{app.address || "N/A"}</td>
                        <td className="px-4 py-3 truncate max-w-[120px]" title={app.educationLevel}>{app.educationLevel || "N/A"}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-sans">{app.phone}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-sans max-w-[180px] truncate" title={app.email}>{app.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 font-sans">
                          {app.applied_at || app.appliedAt
                            ? new Date(app.applied_at || app.appliedAt!).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                            : "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
<span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeStyles(app.status)}`} aria-label={`Status: ${app.status}`}>
                          {statusIcon[app.status] || ''} {app.status}
                        </span>
                        </td>
                        <td className="px-4 py-3 text-right w-[180px] min-w-[180px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="px-2.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold rounded-lg transition cursor-pointer"
                            >
                              View
                            </button>
                            <select 
                              value={app.status || "New"} 
                              onChange={e => handleStatusChange(app.id, e.target.value)}
                              className="text-[10px] py-0.5 bg-slate-50 border border-slate-200 hover:bg-white rounded px-1.5 font-bold outline-none cursor-pointer text-slate-700 font-sans animate-none"
                            >
                              {statusesList.map(st => (
                                <option key={st} value={st}>{st}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleDeleteApp(app.id)}
                              className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Vertical Card List View (visible on < md) */}
              <div className="block md:hidden space-y-3.5">
                {filteredApps.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                    className={`p-4 bg-white border rounded-2xl flex flex-col gap-3 shadow-xs text-left transition-all duration-200 ${
                      selectedApp?.id === app.id ? "border-emerald-600 bg-emerald-50/10" : "border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono font-black text-slate-450 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-150">
                          #{index + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 leading-snug">{app.fullName}</h4>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            Age: {app.age || app.age === 0 ? app.age : "N/A"} · {app.civilStatus || "Single"}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeStyles(app.status)}`} aria-label={`Status: ${app.status}`}>
                        {statusIcon[app.status] || ''} {app.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-normal">
                      <p className="truncate"><strong className="text-slate-700 font-extrabold font-mono uppercase text-[9px] tracking-wider block">Education:</strong> {app.educationLevel || "N/A"}</p>
                      <p className="truncate"><strong className="text-slate-700 font-extrabold font-mono uppercase text-[9px] tracking-wider block">Email:</strong> {app.email}</p>
                      <p className="truncate"><strong className="text-slate-700 font-extrabold font-mono uppercase text-[9px] tracking-wider block">Address:</strong> {app.address || "N/A"}</p>
                      <p className="truncate">
                        <strong className="text-slate-700 font-extrabold font-mono uppercase text-[9px] tracking-wider block">Date Applied:</strong>
                        {app.applied_at || app.appliedAt
                          ? new Date(app.applied_at || app.appliedAt!).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                          : "N/A"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 justify-between">
                      <select 
                        value={app.status || "New"} 
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        className="text-xs py-1 bg-slate-50 border border-slate-200 rounded-xl px-2 font-bold outline-none cursor-pointer text-slate-700 flex-1 h-11"
                      >
                        {statusesList.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-4 py-1 text-xs bg-slate-900 border border-slate-800 text-white font-bold rounded-xl hover:bg-black transition cursor-pointer h-11 shrink-0 flex items-center justify-center gap-1 min-w-[70px] active:scale-95 duration-150"
                      >
                        View
                      </button>

                      <button
                        onClick={() => handleDeleteApp(app.id)}
                        className="p-2 border border-slate-200 hover:border-slate-350 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer h-11 w-11 flex items-center justify-center shrink-0 active:scale-95 duration-150"
                        title="Deletepermanently"
                      >
                        <Trash2 className="w-4 h-4 text-slate-550 hover:text-rose-600" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
                {filteredApps.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    {searchQuery ? "No matching records found." : "Empty Ledger. No application entries detected."}
                  </div>
                )}
              </div>
            )}

          {/* Dialog Overlay Modal for Selected Candidate Dossier */}
          {selectedApp && (
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4 z-50 animate-in fade-in duration-200"
              onClick={() => {
                if (isEditingDossier) {
                  setShowUnsavedWarning(true);
                  showToast("⚠️ You have unsaved changes. Please save or cancel before closing.", "error");
                } else {
                  setSelectedApp(null);
                  setShowUnsavedWarning(false);
                }
              }}
            >
              <div 
                className="bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 p-5 md:p-6 shadow-2xl text-xs max-w-2xl w-full h-[95vh] md:h-[88vh] max-h-[95vh] flex flex-col text-left relative animate-in slide-in-from-bottom md:zoom-in-95 duration-200 overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                {/* STICKY HEADER CONTAINER block */}
                <div className="sticky top-0 bg-white z-20 border-b border-slate-150 pb-3 flex justify-between items-center -mx-5 -mt-5 p-5 md:-mx-6 md:-mt-6 md:p-6 select-none shrink-0 border-slate-100">
                  <div className="min-w-0 pr-12">
                    <span className="text-[9px] font-mono tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase border border-emerald-100 font-extrabold">
                      Applicant Dossier Vetting
                    </span>
                    <h3 className="font-sans font-black text-slate-900 uppercase text-sm leading-tight mt-1 truncate max-w-[280px] sm:max-w-xs">{selectedApp.fullName}</h3>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5 truncate">{selectedApp.email} | {selectedApp.phone}</p>
                  </div>
                  
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {!isEditingDossier && (
                      <button
                        onClick={startEditingDossier}
                        className="px-3 py-1.5 h-10 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250/60 text-emerald-800 text-[10px] font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-emerald-700" />
                        Modify
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (isEditingDossier) {
                          setShowUnsavedWarning(true);
                          showToast("⚠️ You have unsaved changes. Please save or cancel before closing.", "error");
                        } else {
                          setSelectedApp(null);
                          setShowUnsavedWarning(false);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-500 hover:text-white transition duration-150 z-20 cursor-pointer w-10 h-10 flex items-center justify-center border border-slate-205/55 shadow-xs"
                      title="Close modal"
                    >
                      <X className="w-4 h-4 text-slate-650" />
                    </button>
                  </div>
                </div>

                {showUnsavedWarning && (
                  <div className="bg-rose-50 text-rose-800 border-l-4 border-rose-500 p-3.5 rounded-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 font-sans antialiased shrink-0 mt-3">
                    <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <div>
                      <p className="font-extrabold text-[11px] uppercase tracking-wider">Unsaved Changes Detected</p>
                      <p className="text-xs text-rose-700/90 mt-0.5 font-medium">You have unsaved changes. Please save your edits or select cancel before closing this dossier drawer.</p>
                    </div>
                  </div>
                )}

                <div className="flex-grow overflow-y-auto pr-1 py-4 space-y-4">
                  {isEditingDossier ? (
                    <div className="space-y-4 animate-in fade-in duration-200 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="block text-[8.5px] text-slate-400 uppercase font-sans font-bold leading-normal">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={editFullName}
                            onChange={e => setEditFullName(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-sans text-xs text-slate-800"
                          />
                        </div>
                        {/* Applying Post Title */}
                        <div className="space-y-1">
                          <label className="block text-[8.5px] text-slate-400 uppercase font-sans font-bold leading-normal">Applying Post Title</label>
                          <input
                            type="text"
                            value={editJobTitle}
                            onChange={e => setEditJobTitle(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-sans text-xs text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="space-y-1">
                          <label className="block text-[8.5px] text-slate-400 uppercase font-sans font-bold leading-normal">Email Address</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={e => setEditEmail(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs text-slate-800"
                          />
                        </div>
                        {/* Phone */}
                        <div className="space-y-1">
                          <label className="block text-[8.5px] text-slate-400 uppercase font-sans font-bold leading-normal">Contact Number</label>
                          <input
                            type="text"
                            value={editPhone}
                            onChange={e => setEditPhone(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {/* Age */}
                        <div>
                          <label className="block text-[8px] text-slate-400 uppercase font-bold leading-none mb-1">Age</label>
                          <input
                            type="number"
                            value={editAge}
                            onChange={e => setEditAge(e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-sans"
                          />
                        </div>
                        {/* Civil Status */}
                        <div>
                          <label className="block text-[8px] text-slate-400 uppercase font-bold leading-none mb-1">Civil Status</label>
                          <select
                            value={editCivilStatus}
                            onChange={e => setEditCivilStatus(e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-sans cursor-pointer"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>
                        {/* Education Level */}
                        <div>
                          <label className="block text-[8px] text-slate-400 uppercase font-bold leading-none mb-1">Education Level</label>
                          <select
                            value={editEducationLevel}
                            onChange={e => setEditEducationLevel(e.target.value)}
                            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-sans cursor-pointer"
                          >
                            <option value="High School Graduate">High School Graduate</option>
                            <option value="College Graduate">College Graduate</option>
                            <option value="Post Graduate (Master/PhD)">Post Graduate (Master/PhD)</option>
                            <option value="Vocational Course">Vocational Course</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="block text-[8.5px] text-slate-400 uppercase font-sans font-bold leading-normal">Course / Degree Graduated *</label>
                        <input
                          type="text"
                          required
                          value={editCourseGraduated}
                          onChange={e => setEditCourseGraduated(e.target.value)}
                          placeholder="e.g. BS in Information Technology"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-sans text-xs text-slate-800"
                        />
                      </div>

                      {/* Resume full parsing text area */}
                      <div className="space-y-1 text-left">
                        <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider block">Resume Plain Text Extraction</span>
                        <textarea
                          value={editResumeText}
                          onChange={e => setEditResumeText(e.target.value)}
                          rows={4}
                          className="w-full p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px]/1.4 text-slate-600 font-sans max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text"
                        />
                      </div>

                      {/* Actions Row */}
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          disabled={isSavingDossier}
                          onClick={() => {
                            setIsEditingDossier(false);
                            setShowUnsavedWarning(false);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSavingDossier}
                          onClick={handleSaveDossierEdits}
                          className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingDossier ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          {isSavingDossier ? "Saving Entries..." : "Save Dossier Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="block text-[8.5px] text-slate-400 uppercase font-sans font-bold leading-normal">Applying Post Title</span>
                          <p className="text-xs font-extrabold text-slate-800 leading-tight">{selectedApp.jobTitle || "General Vacancy"}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="block text-[8.5px] text-slate-400 uppercase font-sans font-bold leading-normal">Registered Date</span>
                          <span className="text-[9.5px] text-slate-400 font-sans block">{new Date(selectedApp.applied_at).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Candidate metadata info metrics bar */}
                      <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-bold leading-none">Age</span>
                          <span className="text-xs font-bold text-slate-800 mt-1 block">{selectedApp.age || "N/A"} years old</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-bold leading-none">Civil Status</span>
                          <span className="text-xs font-bold text-slate-800 mt-1 block">{selectedApp.civilStatus || "Single"}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-bold leading-none">Education Level</span>
                          <span className="text-xs font-bold text-slate-800 truncate mt-1 block" title={selectedApp.educationLevel}>{selectedApp.educationLevel || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-bold leading-none">Contact Number</span>
                          <span className="text-xs font-bold text-slate-800 mt-1 block font-sans">{selectedApp.phone || "N/A"}</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider block">Course / Degree Graduated</span>
                        <p className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                          {selectedApp.courseGraduated || selectedApp.course_graduated || "N/A"}
                        </p>
                      </div>

                      {/* Resume full parsing text area */}
                      <div className="space-y-1 text-left">
                        <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider block">Resume Plain Text Extraction</span>
                        <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[10px]/1.4 text-slate-600 font-sans max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                          {selectedApp.resumeText}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View Screening Results in speed reading format */}
                  {selectedApp.screeningAnswers && selectedApp.screeningAnswers.length > 0 && (
                    <div className="space-y-2 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-left">
                      <div className="flex justify-between items-center pb-1.5 border-b border-emerald-100">
                        <span className="text-[9.5px] font-black uppercase text-emerald-800 tracking-wider">Screening Answers Checklist</span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-950 px-1 py-0.2 rounded font-sans font-bold">Speed-Read</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 text-[10px]">
                        {selectedApp.screeningAnswers.map((ans, i) => (
                          <div key={ans.questionId} className="flex gap-2 items-center text-slate-800 bg-white px-2.5 py-1.5 rounded-xl border border-slate-150 shadow-2xs">
                            <span className="w-4.5 h-4.5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[9px] shrink-0 border">
                              {i + 1}
                            </span>
                            <span className="text-slate-500 text-[9px] truncate max-w-[280px] font-semibold">{ans.questionText || "Q:"}</span>
                            <span className="font-extrabold uppercase text-[10.5px] text-slate-950 ml-auto shrink-0">{ans.answer}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vetting Assignment Form Panel */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-150 text-left">
                      <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Recruitment Decisions Box</span>
                      <span className="text-[8px] bg-slate-100 text-slate-500 border px-1.5 py-0.2 rounded font-semibold">Pipeline Vetting</span>
                    </div>

                    <div className="space-y-2.5 text-left text-[11px]">
                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black text-slate-400 uppercase">Dossier Status</label>
                        <select
                          value={inspectStatus}
                          onChange={e => setInspectStatus(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-sans text-xs text-slate-850"
                        >
                          {statusesList.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black text-slate-400 uppercase">Endorse To (Institution/Unit)</label>
                        <select
                          value={inspectEndorsedTo}
                          onChange={e => setInspectEndorsedTo(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850"
                        >
                          <option value="">-- Specify Institution --</option>
                          {INSTITUTIONS_LOOKUP.map(inst => (
                            <option key={inst} value={inst}>{inst}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black text-slate-400 uppercase">Assigned HR In-Charge</label>
                        <select
                          value={inspectHrIncharge}
                          onChange={e => setInspectHrIncharge(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850"
                        >
                          <option value="">-- Assign Coordinator --</option>
                          {HR_INCHARGES_LOOKUP.map(person => (
                            <option key={person} value={person}>{person}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8.5px] font-black text-slate-400 uppercase">Decision Remarks / Audit Comments</label>
                        <textarea
                          value={inspectRemarks}
                          onChange={e => setInspectRemarks(e.target.value)}
                          placeholder="Write formal onboarding notes, relative background traces, or other findings here..."
                          rows={3}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-850 font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* STICKY FOOTER CONTAINER */}
                <div className="sticky bottom-0 bg-slate-50 border-t border-slate-150 p-4 -mx-5 -mb-5 md:-mx-6 md:-mb-6 rounded-b-3xl flex justify-end gap-2.5 z-20 shrink-0">
                  {isEditingDossier ? (
                    <div className="flex gap-2 w-full justify-end">
                      <button
                        type="button"
                        disabled={isSavingDossier}
                        onClick={() => {
                          setIsEditingDossier(false);
                          setShowUnsavedWarning(false);
                        }}
                        className="px-4.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-705 text-slate-700 text-xs font-black rounded-xl cursor-pointer min-h-[44px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingDossier}
                        onClick={handleSaveDossierEdits}
                        className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] shadow-sm ml-0"
                      >
                        {isSavingDossier ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Save className="w-4 h-4 text-white" />
                        )}
                        {isSavingDossier ? "Storing..." : "Save Dossier Changes"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block font-bold">CLEARANCE LEVEL: SECURE Recruiter Access</span>
                      <div className="flex gap-2 ml-auto w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(null);
                          }}
                          className="flex-1 sm:flex-initial px-4.5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl cursor-pointer shadow-xs min-h-[44px]"
                        >
                          Dismiss Dossier
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setInspectCommitLoading(true);
                            await handleStatusChange(selectedApp.id, inspectStatus, inspectEndorsedTo, inspectHrIncharge, inspectRemarks);
                            setInspectCommitLoading(false);
                          }}
                          disabled={inspectCommitLoading}
                          className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          {inspectCommitLoading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4 text-emerald-450" />}
                          {inspectCommitLoading ? "Storing Decision..." : "Commit Evaluation"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {isItAdmin && currentTab === "users" && (
        <div className="mt-6 space-y-6 text-left animate-in fade-in duration-200">
          <div className="border-b pb-2">
            <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono flex items-center gap-1">
              <Users className="w-4 h-4 text-slate-400" /> Registered User Accounts
            </h2>
            <p className="text-xs text-slate-450 text-slate-500 mt-1">Privileged user directory. Only IT Administrators have security override access to provision or dismantle accounts.</p>
          </div>

          {loadingUsers ? (
            <div className="text-xs font-mono text-slate-405 text-center animate-pulse py-8">Retrieving user accounts database...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userAccounts.map(u => (
                <div key={u.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:border-emerald-650 transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-mono tracking-widest border font-black uppercase ${
                        u.role === 'it_admin' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-250'
                      }`}>
                        {u.role === 'it_admin' ? 'IT ADMIN' : 'RECRUITER'}
                      </span>
                      <span className="text-[8.5px] text-slate-400 font-mono tracking-tighter">ID: {u.id.substring(0, 8)}</span>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{u.fullName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                      <p className="text-[9.5px] text-zinc-550 italic font-medium">{u.title || "Staff Representative"}</p>
                    </div>

                    <div className="text-[9.5px] text-zinc-500 font-mono pt-1">
                      Phone Number: <strong className="text-slate-700">{u.phone}</strong>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-end gap-1.5">
                    <button 
                      onClick={() => openEditUser(u)} 
                      className="px-2.5 py-1 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3 h-3 text-slate-655 text-slate-600" /> Modify
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id, u.email)} 
                      className="px-2.5 py-1 text-[10px] bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md text-rose-700 font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" /> Expel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {isItAdmin && currentTab === "logs" && (
        <div className="mt-6 space-y-6 text-left animate-in fade-in duration-200">
          <div className="border-b pb-2 flex justify-between items-center">
            <div>
              <h2 className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono flex items-center gap-1">
                <Terminal className="w-4 h-4 text-slate-400" /> Historic System Operation Logs
              </h2>
              <p className="text-xs text-slate-500 mt-1">Real-time chronologically sorted administrative and auditing database entries. Root audit trail tracking.</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-105 bg-slate-200 text-zinc-700 rounded-full font-mono">
              ENTRIES: {systemLogs.length}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="min-w-full divide-y divide-slate-100 bg-white text-xs text-left">
              <thead className="bg-slate-50 font-mono text-[9px] text-slate-500 uppercase border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-450">Timestamp</th>
                  <th className="px-4 py-3 font-semibold text-slate-450">Session Actor</th>
                  <th className="px-4 py-3 font-semibold text-slate-450">Manual Operation Code</th>
                  <th className="px-4 py-3 font-semibold text-slate-450">Activity Logs Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10.5px] tracking-tight">
                {systemLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{log.actor}</td>
                    <td className="px-4 py-2.5 text-emerald-700 font-black tracking-normal uppercase">{log.operation}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-600 whitespace-pre-wrap">{log.details}</td>
                  </tr>
                ))}
                {systemLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-zinc-400">No events logged yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restricted User Provisioning Dialog Modal (IT Admin exclusive) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-end md:items-center justify-center md:p-4 z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleUserSubmit}
            className="bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 shadow-2xl relative text-left w-full h-[95vh] md:h-auto md:max-h-[85vh] max-w-md flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-200 overflow-hidden"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white z-20 border-b border-slate-150 pb-3 flex justify-between items-center p-5 select-none shrink-0 border-slate-100">
              <div className="min-w-0 pr-12 text-left">
                <span className="text-[9px] font-mono tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase border border-emerald-100 font-extrabold">
                  IT Admin Cleared
                </span>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight font-display mt-1 leading-tight">
                  {editingUser ? `Overwrite Account` : "Provision Administrative Account"}
                </h3>
                <p className="text-[9.5px] text-zinc-400 font-sans mt-0.5">Configure operational security credentials and direct role access clearances.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-100 hover:bg-rose-105 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition duration-150 z-20 cursor-pointer w-10 h-10 flex items-center justify-center border border-slate-205/55 shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-grow overflow-y-auto p-5 md:p-6 space-y-4 text-xs font-sans">
              {provError && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs flex gap-2 shrink-0 animate-in fade-in duration-200 text-left">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{provError}</span>
                </div>
              )}

              <div className="space-y-1 text-left">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operational Access Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvRole("recruiter")}
                    className={`py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                      provRole === "recruiter"
                        ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-4 h-4 text-emerald-650" />
                    Recruiter Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvRole("it_admin")}
                    className={`py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                      provRole === "it_admin"
                        ? "bg-red-50 border-red-650 border-red-600 text-red-900"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                    IT Administrator
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Legal Name</label>
                <input 
                  type="text" 
                  value={provFullName} 
                  onChange={e => setProvFullName(e.target.value)} 
                  placeholder="e.g. Ms. Ailen Entero" 
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email address (@cardmri.com)</label>
                  <input 
                    type="email" 
                    value={provEmail} 
                    onChange={e => setProvEmail(e.target.value)} 
                    placeholder="name@cardmri.com" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Office Title</label>
                  <input 
                    type="text" 
                    value={provTitle} 
                    onChange={e => setProvTitle(e.target.value)} 
                    placeholder="e.g. Lead Coordinator" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                  <input 
                    type="text" 
                    value={provPhone} 
                    onChange={e => setProvPhone(e.target.value)} 
                    placeholder="+63 9..." 
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-850 font-medium font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {editingUser ? "Reset Password? (Optional)" : "Administrative password *"}
                  </label>
                  <input 
                    type="password" 
                    value={provPassword} 
                    onChange={e => setProvPassword(e.target.value)} 
                    placeholder={editingUser ? "Leave blank to ignore" : "Enter minimum 6 characters"} 
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono text-slate-850 text-xs"
                    required={!editingUser}
                  />
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-slate-100/80 border-t border-slate-200/60 p-4 shrink-0 flex justify-end gap-2.5 z-20">
              <button 
                type="button" 
                onClick={() => setIsUserModalOpen(false)}
                className="px-4.5 py-2.5 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl cursor-pointer font-black text-xs shadow-xs min-h-[44px]"
              >
                Close
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 text-white bg-slate-900 hover:bg-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 font-black text-xs shadow-md min-h-[44px]"
              >
                <Save className="w-4 h-4 text-emerald-450" />
                {editingUser ? "Apply Override" : "Register Access Port"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Entry Form Modal Dialog */}
      {isManualEntryOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4 z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleManualEntrySubmit}
            className="bg-white rounded-t-3xl md:rounded-3xl border border-slate-200 shadow-2xl relative text-left w-full h-[95vh] md:h-auto md:max-h-[85vh] max-w-2xl flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-200 overflow-hidden"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white z-20 border-b border-slate-150 pb-3 flex justify-between items-center p-5 select-none shrink-0 border-slate-100">
              <div className="min-w-0 pr-12 text-left">
                <span className="text-[9px] font-mono tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase border border-emerald-100 font-extrabold">
                  HR Direct Entry
                </span>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight font-display mt-1 leading-tight">
                  Manual Candidate Dossier Registration
                </h3>
                <p className="text-[9.5px] text-zinc-400 font-sans mt-0.5">Directly ledger an offline walk-in or phone-vetted applicant skipping screening tests.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsManualEntryOpen(false)}
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-100 hover:bg-rose-105 hover:bg-rose-100 text-slate-500 hover:text-rose-700 transition duration-150 z-20 cursor-pointer w-10 h-10 flex items-center justify-center border border-slate-205/55 shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-grow overflow-y-auto p-5 md:p-6 space-y-4 text-xs font-sans">
              {manSubmitError && (
                <div className="p-3 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl text-xs flex gap-2 shrink-0 animate-in fade-in duration-200 text-left">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{manSubmitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Applicant Full Name *</label>
                  <input 
                    type="text" 
                    value={manFullName} 
                    onChange={e => setManFullName(e.target.value)} 
                    placeholder="e.g. Christine Marie Ramos" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                  <input 
                    type="email" 
                    value={manEmail} 
                    onChange={e => setManEmail(e.target.value)} 
                    placeholder="name@gmail.com" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Number *</label>
                  <input 
                    type="text" 
                    value={manPhone} 
                    onChange={e => setManPhone(e.target.value)} 
                    placeholder="+63 9..." 
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Age (Years) *</label>
                  <input 
                    type="number" 
                    value={manAge} 
                    onChange={e => setManAge(e.target.value)} 
                    placeholder="e.g. 25" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    required
                    min={18}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Civil Status</label>
                  <select 
                    value={manCivilStatus} 
                    onChange={e => setManCivilStatus(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Separated">Separated</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1 font-sans text-left">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Residential Address *</label>
                  <input 
                    type="text" 
                    value={manAddress} 
                    onChange={e => setManAddress(e.target.value)} 
                    placeholder="Home address coordinates" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Highest Educational Background</label>
                  <select 
                    value={manEducation} 
                    onChange={e => setManEducation(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="College Graduate">College Graduate</option>
                    <option value="College Undergrad">College Underundergrad</option>
                    <option value="Senior High School">Senior High School</option>
                    <option value="Masters Degree">Masters Degree</option>
                    <option value="Doctorate Degree">Doctorate Degree</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course / Degree Graduated *</label>
                <input 
                  type="text" 
                  required
                  value={manCourseGraduated}
                  onChange={e => setManCourseGraduated(e.target.value)}
                  placeholder="e.g. BS in Business Administration major in Financial Management"
                  className="w-full p-2 border border-slate-200 rounded-lg text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-3 border-slate-100">
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Applying Vacancy Slot *</label>
                  <select 
                    value={manJobId} 
                    onChange={e => setManJobId(e.target.value)} 
                    className="w-full p-2 bg-white border border-slate-200 lg:p-2 border-slate-200 rounded-lg text-slate-800 text-xs font-semibold"
                    required
                  >
                    <option value="">-- Choose Job Opening --</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title} [{j.institution}]</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Initial Dossier Status</label>
                  <select 
                    value={manStatus} 
                    onChange={e => setManStatus(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold"
                  >
                    {statusesList.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Endorse To (Institution/Unit)</label>
                  <select 
                    value={manEndorsedTo} 
                    onChange={e => setManEndorsedTo(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                  >
                    <option value="">-- Optional Placement --</option>
                    {INSTITUTIONS_LOOKUP.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Personnel/HR In-Charge</label>
                  <select 
                    value={manHrIncharge} 
                    onChange={e => setManHrIncharge(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                  >
                    <option value="">-- Assign Representative --</option>
                    {HR_INCHARGES_LOOKUP.map(person => (
                      <option key={person} value={person}>{person}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recruitment Remarks / Relative Traces</label>
                <textarea 
                  value={manRemarks} 
                  onChange={e => setManRemarks(e.target.value)} 
                  placeholder="Relative declarations trace notes, background review scores, interview ratings..." 
                  className="w-full p-2 border border-slate-200 rounded-xl text-slate-800"
                  rows={3}
                />
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-slate-100/80 border-t border-slate-200/60 p-4 shrink-0 flex justify-end gap-2.5 z-20">
              <button 
                type="button" 
                onClick={() => setIsManualEntryOpen(false)}
                className="px-4.5 py-2.5 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl cursor-pointer font-black text-xs shadow-xs min-h-[44px]"
              >
                Dismiss Form
              </button>
              <button 
                type="submit" 
                disabled={manLoading}
                className="px-5 py-2.5 text-white bg-slate-900 hover:bg-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 font-black text-xs shadow-md min-h-[44px]"
              >
                <Save className="w-4 h-4 text-emerald-450 animate-pulse" />
                {manLoading ? "Registering..." : "Ledger Entry Check-In"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Generate Report Presentation Modal Dialog */}
      <ReportExporter
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        totalApps={totalApps}
        hiredCount={hiredCount}
        endorsedCount={endorsedCount}
        rejectedCount={rejectedCount}
        applications={applications}
        institutionsLookup={INSTITUTIONS_LOOKUP}
        hrInchargesLookup={HR_INCHARGES_LOOKUP}
      />

    </div>
  );
}

function getStatusBadgeStyles(status: string) {
  switch (status) {
    case 'New':
      return 'bg-sky-50 text-sky-700 border border-sky-300';
    case 'Acknowledge':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'Passed Screening':
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    case 'Already Endorsed':
      return 'bg-purple-50 text-purple-700 border border-purple-200';
    case 'Hired':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'Rejected':
      return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'Rejected (With Relatives)':
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
}

const statusIcon: Record<string, string> = {
  'New': '\u{1F4CB}',
  'Acknowledge': '\u{1F4E8}',
  'Passed Screening': '\u{1F50D}',
  'Already Endorsed': '\u{1F4E6}',
  'Hired': '\u{2705}',
  'Rejected': '\u{274C}',
  'Rejected (With Relatives)': '\u{26D4}'
};
