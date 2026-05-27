import React, { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  Eye, 
  Type, 
  Bell, 
  Lock, 
  SlidersHorizontal, 
  CheckCircle, 
  Sparkles, 
  ShieldAlert, 
  UserCheck, 
  RefreshCw, 
  Calendar,
  Layers,
  Phone,
  Mail,
  Smartphone,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  HelpCircle,
  BookOpen,
  Briefcase,
  Heart
} from "lucide-react";
import { UserProfile } from "../types";
import { authFetch } from "../lib/api";
import { useToast } from "./ToastContext";

interface SettingsPageProps {
  currentUser: UserProfile | null;
  textSize: "normal" | "large";
  setTextSize: (size: "normal" | "large") => void;
  statusesList: string[];
  setStatusesList: React.Dispatch<React.SetStateAction<string[]>>;
  institutionsList: string[];
  setInstitutionsList: React.Dispatch<React.SetStateAction<string[]>>;
  hrInchargesList: string[];
  setHrInchargesList: React.Dispatch<React.SetStateAction<string[]>>;
  onRefreshJobs?: () => void;
}

// Map key-values to style properties
const fontFamilyMap: Record<string, string> = {
  Inter: '"Inter", sans-serif',
  Roboto: '"Roboto", sans-serif',
  Poppins: '"Poppins", sans-serif',
  Georgia: 'Georgia, serif',
  "JetBrains Mono": '"JetBrains Mono", monospace'
};

const fontSizeMap: Record<string, string> = {
  small: "12px",
  medium: "14px",
  large: "16px",
  xlarge: "18px"
};

const fontWeightMap: Record<string, string> = {
  Light: "300",
  Regular: "400",
  Medium: "505",
  Bold: "700"
};

// Global helper to apply CSS variables and inject global styles referencing those variables
export function applyGlobalTypography(config: any) {
  if (!config) return;
  
  const root = document.documentElement;
  const family = fontFamilyMap[config.fontFamily] || '"Inter", sans-serif';
  const size = fontSizeMap[config.fontSize] || "14px";
  const weight = fontWeightMap[config.fontWeight] || "400";
  const lineHeight = config.lineHeight || 1.5;
  const letterSpacing = (config.letterSpacing || 0) + "em";
  const headingTransform = config.headingStyle === "uppercase" ? "uppercase" : "none";
  let headingColorRule = '';
  if (config.headingStyle === "bold-accent") {
    headingColorRule = 'color: #047857 !important; font-weight: 700 !important;';
  }

  // Define custom variables on the root document element style
  root.style.setProperty('--custom-font-sans', family);
  root.style.setProperty('--custom-font-display', family);
  root.style.setProperty('--custom-font-size', size);
  root.style.setProperty('--custom-font-weight', weight);
  root.style.setProperty('--custom-line-height', lineHeight.toString());
  root.style.setProperty('--custom-letter-spacing', letterSpacing);
  root.style.setProperty('--custom-heading-transform', headingTransform);

  // Dynamic Google Font Injection
  if (config.fontFamily === "Roboto" && !document.getElementById("google-font-roboto")) {
    const link = document.createElement("link");
    link.id = "google-font-roboto";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap";
    document.head.appendChild(link);
  } else if (config.fontFamily === "Poppins" && !document.getElementById("google-font-poppins")) {
    const link = document.createElement("link");
    link.id = "google-font-poppins";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;700&display=swap";
    document.head.appendChild(link);
  }

  // Apply a style tag overrides referencing the CSS root variables globally
  let styleTag = document.getElementById("global-typography-style") as HTMLStyleElement;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "global-typography-style";
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    body {
      font-family: var(--custom-font-sans) !important;
      font-size: var(--custom-font-size) !important;
      font-weight: var(--custom-font-weight) !important;
      line-height: var(--custom-line-height) !important;
      letter-spacing: var(--custom-letter-spacing) !important;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--custom-font-display) !important;
      text-transform: var(--custom-heading-transform) !important;
      ${headingColorRule}
    }
    .font-sans {
      font-family: var(--custom-font-sans) !important;
    }
  `;
}

// Initial restoration to prevent visual layout shifts when App first parses
if (typeof window !== "undefined") {
  const savedConfig = localStorage.getItem("card_mri_typography");
  if (savedConfig) {
    try {
      applyGlobalTypography(JSON.parse(savedConfig));
    } catch (e) {
      console.error(e);
    }
  }
}

export default function SettingsPage({
  currentUser,
  textSize,
  setTextSize,
  statusesList,
  setStatusesList,
  institutionsList,
  setInstitutionsList,
  hrInchargesList,
  setHrInchargesList,
  onRefreshJobs
}: SettingsPageProps) {
  const { showToast } = useToast();
  // Navigation active tab category
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("card_mri_settings_active_category");
    if (saved) {
      localStorage.removeItem("card_mri_settings_active_category");
      return saved;
    }
    return "account";
  });

  // Status notifications mapping for save states
  const [saveStatus, setSaveStatus] = useState<Record<string, string | null>>({});

  // ==========================================
  // HOME CONTENT CONFIGURATION STATES
  // ==========================================
  const [homeBadgeText, setHomeBadgeText] = useState("");
  const [homeTitle, setHomeTitle] = useState("");
  const [homeDescription, setHomeDescription] = useState("");
  const [homeBranchesCount, setHomeBranchesCount] = useState("");
  const [homeYearsOfService, setHomeYearsOfService] = useState("");
  const [homeFilipinosEmpowered, setHomeFilipinosEmpowered] = useState("");
  const [homeHeroImageUrl, setHomeHeroImageUrl] = useState("");
  const [homeEmergencyContacts, setHomeEmergencyContacts] = useState<Array<{ id: string; label: string; value: string }>>([]);
  const [isSavingHome, setIsSavingHome] = useState(false);

  // Fetch Homepage Content Settings
  const fetchHomeSettings = async () => {
    try {
      const res = await fetch("/api/homepage-settings");
      if (res.ok) {
        const data = await res.json();
        const rawSettings = data.settings || data;
        setHomeBadgeText(rawSettings.badgeText || rawSettings.badge_text || "");
        setHomeTitle(rawSettings.title || "");
        setHomeDescription(rawSettings.description || "");
        setHomeBranchesCount(rawSettings.branchesCount || rawSettings.branches_count || "");
        setHomeYearsOfService(rawSettings.yearsOfService || rawSettings.years_of_service || "");
        setHomeFilipinosEmpowered(rawSettings.filipinosEmpowered || rawSettings.filipinos_empowered || "");
        setHomeHeroImageUrl(rawSettings.heroImageUrl || rawSettings.hero_image_url || "");
        setHomeEmergencyContacts(rawSettings.emergencyContacts || rawSettings.emergency_contacts || []);
      }
    } catch (e) {
      console.error("Home page settings load failure:", e);
    }
  };

  const handleSaveHomeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingHome(true);
    try {
      const payload = {
        badgeText: homeBadgeText,
        title: homeTitle,
        description: homeDescription,
        branchesCount: homeBranchesCount,
        yearsOfService: homeYearsOfService,
        filipinosEmpowered: homeFilipinosEmpowered,
        heroImageUrl: homeHeroImageUrl,
        emergencyContacts: homeEmergencyContacts
      };
      
      const response = await authFetch("/api/homepage-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        localStorage.setItem("card_mri_homepage_settings", JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent("card_mri_settings_changed", { detail: payload }));
        triggerSuccessAlert("home_content", "✅ Homepage contents synced successfully in database!");
      } else {
        triggerSuccessAlert("home_content", "Failed to update home content.");
      }
    } catch (err) {
      console.error("Save Home Settings error:", err);
      triggerSuccessAlert("home_content", "Network error updating home page.");
    } finally {
      setIsSavingHome(false);
    }
  };

  const updateContactField = (index: number, field: "label" | "value", text: string) => {
    setHomeEmergencyContacts(prev => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = { id: (index + 1).toString(), label: "", value: "" };
      }
      updated[index] = { ...updated[index], [field]: text };
      return updated;
    });
  };

  const handleAddContact = () => {
    setHomeEmergencyContacts(prev => [
      ...prev,
      { id: (prev.length + 1).toString(), label: "New Channel Info", value: "" }
    ]);
  };

  const handleDeleteContact = (index: number) => {
    setHomeEmergencyContacts(prev => prev.filter((_, i) => i !== index));
  };

  // ==========================================
  // ABOUT CONTENT CONFIGURATION STATES
  // ==========================================
  const [aboutMission, setAboutMission] = useState("");
  const [aboutVision, setAboutVision] = useState("");
  const [aboutAddress, setAboutAddress] = useState("");
  const [aboutPhone, setAboutPhone] = useState("");
  const [aboutEmail, setAboutEmail] = useState("");
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  // Dynamic About Layout sub-arrays
  const [moralCompassValues, setMoralCompassValues] = useState<Array<{ title: string; desc: string }>>([]);
  const [legacyTimeline, setLegacyTimeline] = useState<Array<{ year: string; title: string; desc: string }>>([]);
  const [institutionBranches, setInstitutionBranches] = useState<Array<{ badge: string; name: string; desc: string }>>([]);

  // JOB POSTINGS STATE REGISTERS
  const [jobsManaged, setJobsManaged] = useState<any[]>([]);
  const [loadingJobsManaged, setLoadingJobsManaged] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  
  // Job Postings Form States
  const [mJobTitle, setMJobTitle] = useState("");
  const [mJobInstitution, setMJobInstitution] = useState("");
  const [mJobLocation, setMJobLocation] = useState("");
  const [mJobSector, setMJobSector] = useState("Operations");
  const [mJobRequirements, setMJobRequirements] = useState<string[]>([""]);
  const [mJobType, setMJobType] = useState("Full-time");
  const [mJobActive, setMJobActive] = useState(true);
  const [mJobDescription, setMJobDescription] = useState("");

  const resetJobForm = () => {
    setEditingJobId(null);
    setMJobTitle("");
    setMJobInstitution("");
    setMJobLocation("");
    setMJobSector("Operations");
    setMJobRequirements([""]);
    setMJobType("Full-time");
    setMJobActive(true);
    setMJobDescription("");
  };

  // ==========================================
  // SCREENING QUESTIONS CONFIGURATION STATES
  // ==========================================
  const [screeningQuestions, setScreeningQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("yes_no");
  const [qOptions, setQOptions] = useState("");
  const [qRequired, setQRequired] = useState(true);
  const [qIsActive, setQIsActive] = useState(true);

  // Fetch Screening Questions
  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/screening-questions");
      if (res.ok) {
        const data = await res.json();
        setScreeningQuestions(data);
      }
    } catch (e) {
      console.error("Screening questions fetch failed:", e);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch About Page Settings
  const fetchAboutSettings = async () => {
    try {
      const res = await fetch("/api/about-settings");
      if (res.ok) {
        const data = await res.json();
        setAboutMission(data.missionText || "");
        setAboutVision(data.visionText || "");
        setAboutAddress(data.contactAddress || "");
        setAboutPhone(data.contactPhone || "");
        setAboutEmail(data.contactEmail || "");
        setMoralCompassValues(data.moralCompassValues || []);
        setLegacyTimeline(data.legacyTimeline || []);
        setInstitutionBranches(data.institutionBranches || []);
      }
    } catch (e) {
      console.error("About page settings load failure:", e);
    }
  };

  const fetchJobsManaged = async () => {
    setLoadingJobsManaged(true);
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobsManaged(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Manage jobs fetch failed:", e);
    } finally {
      setLoadingJobsManaged(false);
    }
  };

  useEffect(() => {
    if (activeTab === "screening") {
      fetchQuestions();
    } else if (activeTab === "about_content" || activeTab === "about_editor") {
      fetchAboutSettings();
    } else if (activeTab === "home_content") {
      fetchHomeSettings();
    } else if (activeTab === "job_postings") {
      fetchJobsManaged();
    }
  }, [activeTab]);

  const handleSaveAboutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAbout(true);
    try {
      const response = await authFetch("/api/about-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionText: aboutMission,
          visionText: aboutVision,
          contactAddress: aboutAddress,
          contactPhone: aboutPhone,
          contactEmail: aboutEmail
        })
      });
      if (response.ok) {
        triggerSuccessAlert("about_content", "✅ About page content synced successfully.");
      } else {
        triggerSuccessAlert("about_content", "Failed to update About content.");
      }
    } catch (err) {
      console.error("Save About Settings error:", err);
      triggerSuccessAlert("about_content", "Network error updating About page.");
    } finally {
      setIsSavingAbout(false);
    }
  };

  const [isSavingAboutSections, setIsSavingAboutSections] = useState(false);
  const handleSaveAboutSections = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAboutSections(true);
    try {
      const response = await authFetch("/api/about-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionText: aboutMission,
          visionText: aboutVision,
          contactAddress: aboutAddress,
          contactPhone: aboutPhone,
          contactEmail: aboutEmail,
          moralCompassValues,
          legacyTimeline,
          institutionBranches
        })
      });
      if (response.ok) {
        triggerSuccessAlert("about_editor", "✅ About page layout arrays saved successfully.");
      } else {
        triggerSuccessAlert("about_editor", "Failed to update About page layouts.");
      }
    } catch (err) {
      console.error("Save About sections error:", err);
      triggerSuccessAlert("about_editor", "Network error updating About sections.");
    } finally {
      setIsSavingAboutSections(false);
    }
  };

  // CRUD Screening Questions Handlers
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const payload = {
      text: qText.trim(),
      type: qType,
      options: qOptions.split(",").map(o => o.trim()).filter(Boolean),
      required: qRequired,
      isActive: qIsActive
    };

    try {
      if (editingQuestionId) {
        const response = await authFetch(`/api/screening-questions/${editingQuestionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          triggerSuccessAlert("screening", "✅ Screening question updated!");
          resetQuestionForm();
          fetchQuestions();
        }
      } else {
        const response = await authFetch("/api/screening-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          triggerSuccessAlert("screening", "✅ New screening question added!");
          resetQuestionForm();
          fetchQuestions();
        }
      }
    } catch (err) {
      console.error("Save question error:", err);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this screening question?")) return;
    try {
      const response = await authFetch(`/api/screening-questions/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        triggerSuccessAlert("screening", "🗑️ Question removed successfully.");
        fetchQuestions();
      }
    } catch (err) {
      console.error("Delete question error:", err);
    }
  };

  const handleToggleActiveQuestion = async (q: any) => {
    try {
      const response = await authFetch(`/api/screening-questions/${q.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: q.text,
          type: q.type,
          options: q.options,
          required: q.required,
          isActive: !q.isActive
        })
      });
      if (response.ok) {
        triggerSuccessAlert("screening", `Status updated: ${!q.isActive ? "Active" : "Inactive"}`);
        fetchQuestions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQText("");
    setQType("yes_no");
    setQOptions("");
    setQRequired(true);
    setQIsActive(true);
  };

  // Trigger inline save notification helper
  const triggerSuccessAlert = (sectionId: string, customText = "Changes saved securely!") => {
    setSaveStatus(prev => ({ ...prev, [sectionId]: customText }));
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, [sectionId]: null }));
    }, 3000);
  };

  // ==========================================
  // PROFILE STATE VARIABLES
  // ==========================================
  const [profileName, setProfileName] = useState(currentUser?.fullName || "");
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || "");
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Sync internal state when currentUser changes globally
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.fullName || "");
      setProfileEmail(currentUser.email || "");
      setProfilePhone(currentUser.phone || "");
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const response = await authFetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileName,
          email: profileEmail,
          phone: profilePhone,
          actorName: currentUser.fullName
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Save to localStorage & notify parent App.tsx
        localStorage.setItem("card_mri_user", JSON.stringify(data.user));
        if ((window as any).handleSaveProfile) {
          (window as any).handleSaveProfile(data.user);
        } else {
          window.dispatchEvent(new Event("card_mri_user_changed"));
        }
        triggerSuccessAlert("account", "✅ Saved profile changes successfully in Supabase!");
      } else {
        const data = await response.json();
        triggerSuccessAlert("account", `Server error: ${data.error || "Save failed"}`);
      }
    } catch (err: any) {
      console.error("Profile save error:", err);
      triggerSuccessAlert("account", "Failed to update profile via backend API.");
    }
  };

  // ==========================================
  // APPEARANCE VARIABLES
  // ==========================================
  const [contrastTheme, setContrastTheme] = useState(() => {
    return localStorage.getItem("card_mri_contrast") || "Standard";
  });
  const [localeLang, setLocaleLang] = useState(() => {
    return localStorage.getItem("card_mri_lang") || "EN";
  });

  const handleSaveAppearance = () => {
    localStorage.setItem("card_mri_contrast", contrastTheme);
    localStorage.setItem("card_mri_lang", localeLang);
    triggerSuccessAlert("appearance", "Visual parameters stored successfully.");
  };

  // ==========================================
  // TEXT STYLE GLOBAL TYPOGRAPHY VARIABLES
  // ==========================================
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState("medium");
  const [fontWeight, setFontWeight] = useState("Regular");
  const [lineHeight, setLineHeight] = useState(1.5);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [headingStyle, setHeadingStyle] = useState("normal");

  // Load typography configuration on render mount
  useEffect(() => {
    const savedConfig = localStorage.getItem("card_mri_typography");
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setFontFamily(config.fontFamily || "Inter");
        setFontSize(config.fontSize || "medium");
        setFontWeight(config.fontWeight || "Regular");
        setLineHeight(config.lineHeight || 1.5);
        setLetterSpacing(config.letterSpacing || 0);
        setHeadingStyle(config.headingStyle || "normal");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveTextStyle = () => {
    const configData = {
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      headingStyle
    };
    localStorage.setItem("card_mri_typography", JSON.stringify(configData));
    applyGlobalTypography(configData);
    triggerSuccessAlert("text_style", "Typography variables broadcasted globally across the document!");
  };

  // ==========================================
  // NOTIFICATIONS VARIABLES
  // ==========================================
  const [notifyEmail, setNotifyEmail] = useState(() => {
    const saved = localStorage.getItem("card_mri_notify_email");
    return saved === null ? true : saved === "true";
  });
  const [notifyPipeline, setNotifyPipeline] = useState(() => {
    const saved = localStorage.getItem("card_mri_notify_pipeline");
    return saved === null ? true : saved === "true";
  });
  const [alertFrequency, setAlertFrequency] = useState(() => {
    return localStorage.getItem("card_mri_alert_frequency") || "Immediate";
  });

  const handleSaveNotifications = () => {
    localStorage.setItem("card_mri_notify_email", notifyEmail.toString());
    localStorage.setItem("card_mri_notify_pipeline", notifyPipeline.toString());
    localStorage.setItem("card_mri_alert_frequency", alertFrequency);
    triggerSuccessAlert("notifications", "Notification alerts preferences compiled!");
  };

  // ==========================================
  // SECURITY & ACCESS VARIABLES
  // ==========================================
  const mockSessionId = "SESSION_TOKEN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const mockIP = "192.168.100.82";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Generic Recruiter Console Client";

  const handleSaveSecurity = () => {
    triggerSuccessAlert("security", "Security tokens rotated. Clearance ledger audit verified!");
  };

  // ==========================================
  // SYSTEM PREFERENCES VARIABLES
  // ==========================================
  const [dateFormat, setDateFormat] = useState(() => {
    return localStorage.getItem("card_mri_date_format") || "MM/DD/YYYY";
  });
  const [defaultHrIncharge, setDefaultHrIncharge] = useState(() => {
    return localStorage.getItem("card_mri_default_hr") || "Ms. Ailen Entero";
  });
  const [defaultStatus, setDefaultStatus] = useState(() => {
    return localStorage.getItem("card_mri_default_status") || "New";
  });

  const handleSaveSystem = () => {
    localStorage.setItem("card_mri_date_format", dateFormat);
    localStorage.setItem("card_mri_default_hr", defaultHrIncharge);
    localStorage.setItem("card_mri_default_status", defaultStatus);
    triggerSuccessAlert("system", "Default parameters saved within system preferences!");
  };

  // ==========================================
  // DROPDOWN MANAGERS VARIABLES
  // ==========================================
  const [newStatus, setNewStatus] = useState("");
  const [newInstitution, setNewInstitution] = useState("");
  const [newHrIncharge, setNewHrIncharge] = useState("");

  const [editingStatusIdx, setEditingStatusIdx] = useState<number | null>(null);
  const [editingStatusValue, setEditingStatusValue] = useState("");

  const [editingInstitutionIdx, setEditingInstitutionIdx] = useState<number | null>(null);
  const [editingInstitutionValue, setEditingInstitutionValue] = useState("");

  const [editingHrInchargeIdx, setEditingHrInchargeIdx] = useState<number | null>(null);
  const [editingHrInchargeValue, setEditingHrInchargeValue] = useState("");

  const handleAddStatus = async () => {
    if (!newStatus.trim()) return;
    if (statusesList.includes(newStatus.trim())) {
      showToast("Status already exists.", "error");
      return;
    }
    const updated = [...statusesList, newStatus.trim()];
    setStatusesList(updated);
    localStorage.setItem("card_mri_statuses_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/statuses_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync statuses to Supabase:", e);
    }
    setNewStatus("");
    triggerSuccessAlert("dropdown_managers", "New status option added!");
  };

  const handleEditStatus = async (index: number) => {
    if (!editingStatusValue.trim()) return;
    const updated = [...statusesList];
    updated[index] = editingStatusValue.trim();
    setStatusesList(updated);
    localStorage.setItem("card_mri_statuses_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/statuses_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync statuses to Supabase:", e);
    }
    setEditingStatusIdx(null);
    setEditingStatusValue("");
    triggerSuccessAlert("dropdown_managers", "Status value modified!");
  };

  const handleDeleteStatus = async (index: number) => {
    const updated = statusesList.filter((_, i) => i !== index);
    setStatusesList(updated);
    localStorage.setItem("card_mri_statuses_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/statuses_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync statuses to Supabase:", e);
    }
    triggerSuccessAlert("dropdown_managers", "Status option removed!");
  };

  const handleAddInstitution = async () => {
    if (!newInstitution.trim()) return;
    if (institutionsList.includes(newInstitution.trim())) {
      showToast("Institution already exists.", "error");
      return;
    }
    const updated = [...institutionsList, newInstitution.trim()];
    setInstitutionsList(updated);
    localStorage.setItem("card_mri_institutions_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/institutions_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync institutions to Supabase:", e);
    }
    setNewInstitution("");
    triggerSuccessAlert("dropdown_managers", "New placement target added!");
  };

  const handleEditInstitution = async (index: number) => {
    if (!editingInstitutionValue.trim()) return;
    const updated = [...institutionsList];
    updated[index] = editingInstitutionValue.trim();
    setInstitutionsList(updated);
    localStorage.setItem("card_mri_institutions_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/institutions_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync institutions to Supabase:", e);
    }
    setEditingInstitutionIdx(null);
    setEditingInstitutionValue("");
    triggerSuccessAlert("dropdown_managers", "Placement target modified!");
  };

  const handleDeleteInstitution = async (index: number) => {
    const updated = institutionsList.filter((_, i) => i !== index);
    setInstitutionsList(updated);
    localStorage.setItem("card_mri_institutions_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/institutions_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync institutions to Supabase:", e);
    }
    triggerSuccessAlert("dropdown_managers", "Placement target removed!");
  };

  const handleAddHrIncharge = async () => {
    if (!newHrIncharge.trim()) return;
    if (hrInchargesList.includes(newHrIncharge.trim())) {
      showToast("Operator name already exists.", "error");
      return;
    }
    const updated = [...hrInchargesList, newHrIncharge.trim()];
    setHrInchargesList(updated);
    localStorage.setItem("card_mri_hr_incharges_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/hr_incharges_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync HR incharges to Supabase:", e);
    }
    setNewHrIncharge("");
    triggerSuccessAlert("dropdown_managers", "New Personnel operator added!");
  };

  const handleEditHrIncharge = async (index: number) => {
    if (!editingHrInchargeValue.trim()) return;
    const updated = [...hrInchargesList];
    updated[index] = editingHrInchargeValue.trim();
    setHrInchargesList(updated);
    localStorage.setItem("card_mri_hr_incharges_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/hr_incharges_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync HR incharges to Supabase:", e);
    }
    setEditingHrInchargeIdx(null);
    setEditingHrInchargeValue("");
    triggerSuccessAlert("dropdown_managers", "Personnel operator modified!");
  };

  const handleDeleteHrIncharge = async (index: number) => {
    const updated = hrInchargesList.filter((_, i) => i !== index);
    setHrInchargesList(updated);
    localStorage.setItem("card_mri_hr_incharges_list", JSON.stringify(updated));
    try {
      await authFetch("/api/system-settings/hr_incharges_list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: updated })
      });
    } catch (e) {
      console.warn("Failed to sync HR incharges to Supabase:", e);
    }
    triggerSuccessAlert("dropdown_managers", "Personnel operator removed!");
  };

  // Category Configuration
  const sidebarCategories = [
    { id: "account", label: "Account & Profile", icon: User, desc: "Personal parameters & legal signatures" },
    ...(currentUser?.role === "it_admin" ? [
      { id: "job_postings", label: "Job Postings", icon: Briefcase, desc: "Manage vacancy titles, requirements & sectors" },
      { id: "about_editor", label: "About Page Sections", icon: BookOpen, desc: "Moral compass, milestones, entities list" }
    ] : []),
    { id: "home_content", label: "Homepage Content", icon: Settings, desc: "CMS badges, titles, descriptions, metrics & incidents" },
    { id: "about_content", label: "About Page Content", icon: BookOpen, desc: "Mission, vision, corporate contact info" },
    { id: "screening", label: "Screening Questions", icon: HelpCircle, desc: "Candidate qualifying questionnaire builder" },
    { id: "appearance", label: "Appearance Theme", icon: Eye, desc: "Sizing ratios, contrast modes, translations" },
    { id: "text_style", label: "Dynamic Typography", icon: Type, desc: "Fonts, sizes, line heights, letter properties" },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell, desc: "Dispatch email logs, cellular targets" },
    { id: "security", label: "Security & Access", icon: Lock, desc: "Recruiter roles, sessions, active clearance audit" },
    { id: "system", label: "System Preferences", icon: SlidersHorizontal, desc: "Onboarding status conventions, HR coordinators" },
    { id: "dropdown_managers", label: "Dropdown Options Manager", icon: Layers, desc: "Status, institutions, & HR Operators list editor" }
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6 pb-12 animate-in fade-in duration-300 font-sans antialiased text-slate-800 text-xs">
      
      {/* Settings Title Header section */}
      <div className="border-b border-slate-200 pb-3 text-left">
        <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
          <Settings className="w-5 h-5 text-emerald-700 font-sans animate-spin-slow" />
          Settings & Portal Configuration Console
        </h1>
        <p className="text-slate-500 text-[11px] mt-0.5">
          Convene administrative preferences, customize advanced CSS text variable parameters, and audit recruitment clearance coordinates.
        </p>
      </div>

      {/* Main Structural Settings Container layout (Collapsible Sidebar Navigation on Mobile) */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* SIDEBAR NAVIGATION: Vertical on desktop, scrollable row layout on mobile */}
        <div className="flex flex-nowrap lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0 lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 scrollbar-none whitespace-nowrap lg:pr-4 text-left">
          {sidebarCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 lg:gap-3 px-4 py-2 lg:py-2.5 rounded-full lg:rounded-xl transition duration-150 text-left outline-none shrink-0 min-h-[40px] lg:min-h-0 ${
                  isActive 
                    ? "bg-emerald-700 text-white lg:bg-slate-900 lg:text-white shadow-sm lg:ring-1 lg:ring-slate-850" 
                    : "bg-slate-100 text-slate-600 lg:bg-transparent lg:text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className={`p-1 rounded-full lg:rounded-lg ${isActive ? "bg-emerald-600 text-white lg:bg-emerald-800" : "bg-white/40 text-slate-500 lg:bg-slate-100"}`}>
                  <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                </div>
                <div className="hidden lg:block text-left whitespace-nowrap">
                  <span className="block font-bold text-xs leading-none">{cat.label}</span>
                  <span className={`block text-[8.5px] font-medium mt-0.5 ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                    {cat.desc}
                  </span>
                </div>
                <span className="lg:hidden font-bold text-xs">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE PANEL CONTENT WRAPPER */}
        <div className="flex-1 min-w-0 bg-white rounded-3xl border border-slate-200 p-6 min-h-[480px] flex flex-col justify-between shadow-xs">
          
          <div className="space-y-6">
            
            {/* ==========================================
                ACCOUNT & PROFILE PANEL
                ========================================== */}
            {activeTab === "account" && (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Account & Profile</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Configure your primary credential tags, electronic coordination parameters, and active authentication keys.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Legal Full Name *</label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={e => setProfileName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl outline-none transition text-slate-800 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">E-Mail Address</label>
                    <input
                      type="email"
                      required
                      value={profileEmail}
                      onChange={e => setProfileEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl outline-none transition text-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Mobile Coordinate Configuration</label>
                    <input
                      type="text"
                      value={profilePhone}
                      placeholder="e.g. 0917-XXX-XXXX"
                      onChange={e => setProfilePhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl outline-none transition text-slate-800 font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Clearance Group Assignment</label>
                    <span className="block p-2.5 bg-emerald-50 text-emerald-800 border-emerald-150 rounded-xl text-center font-bold uppercase tracking-wider border text-[10.5px]">
                      {currentUser?.role === "it_admin" ? "IT Systems Administrator" : "Assigned Recruiter Portfolio"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-slate-650 font-bold">
                    <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Rotate Key Authorization Profile (Password)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">Rotate your active database access key. Re-authenticates within Vercel & Supabase.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Current Access Code</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full p-2 bg-slate-50 focus:bg-white border rounded-lg outline-none text-slate-800 transition font-sans text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">New Access Code</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-2 bg-slate-50 focus:bg-white border rounded-lg outline-none text-slate-800 transition font-sans text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Confirm Access Code</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full p-2 bg-slate-50 focus:bg-white border rounded-lg outline-none text-slate-800 transition font-sans text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                  >
                    Save Profile Changes
                  </button>

                  {saveStatus["account"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                      <span>{saveStatus["account"]}</span>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* ==========================================
                ABOUT CONTENT PANEL
                ========================================== */}
            {activeTab === "about_content" && (
              <form onSubmit={handleSaveAboutSettings} className="space-y-4 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">About Page Content Customizer</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Rewrite mission, vision statement paragraphs, and update office address / coordinates hotlines dynamically.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Mission Statement & Corporate Profile Text</label>
                    <textarea
                      rows={6}
                      value={aboutMission}
                      onChange={e => setAboutMission(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200 rounded-xl outline-none font-medium leading-relaxed"
                      placeholder="CARD MRI origin story..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Vision Statement / Badge Ribbon Paragraph</label>
                    <textarea
                      rows={2}
                      value={aboutVision}
                      onChange={e => setAboutVision(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200 rounded-xl outline-none font-medium leading-relaxed"
                      placeholder="Empowering rural communities..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Office Address Coordinates</label>
                      <input
                        type="text"
                        value={aboutAddress}
                        onChange={e => setAboutAddress(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-700"
                        placeholder="20 M. L. Quezon..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Phone Hotline Channels</label>
                      <input
                        type="text"
                        value={aboutPhone}
                        onChange={e => setAboutPhone(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 font-mono"
                        placeholder="+63 (2) ..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Recruitment Support Email</label>
                      <input
                        type="email"
                        value={aboutEmail}
                        onChange={e => setAboutEmail(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 hover:bg-slate-100/30 focus:bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 font-mono"
                        placeholder="recruitment@cardmri.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingAbout}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ml-0 font-sans"
                  >
                    {isSavingAbout ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Save className="w-3.5 h-3.5 text-white" />}
                    Save Corporate Profile
                  </button>

                  {saveStatus["about_content"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                      <span>{saveStatus["about_content"]}</span>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* ==========================================
                JOB POSTINGS MANAGER PANEL (IT ADMIN ONLY)
                ========================================== */}
            {activeTab === "job_postings" && currentUser?.role === "it_admin" && (
              <div className="space-y-6 animate-in fade-in duration-205 text-left">
                <div className="border-b border-slate-100 pb-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Job Postings Vacancies Manager</h3>
                    <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                      Create new job listings, configure requirements, placement locations, sectors and toggle active/archive status.
                    </p>
                  </div>
                  {editingJobId && (
                    <button
                      type="button"
                      onClick={resetJobForm}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <X className="w-3 h-3" /> Cancel Editing
                    </button>
                  )}
                </div>

                {/* Create/Edit Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!mJobTitle.trim() || !mJobInstitution.trim() || !mJobLocation.trim()) {
                      showToast("Title, Institution, and Placement Branch Location are required.", "error");
                      return;
                    }
                    try {
                      const payload = {
                        title: mJobTitle.trim(),
                        department: mJobSector, // department maps to Sector
                        institution: mJobInstitution,
                        location: mJobLocation.trim(),
                        description: mJobDescription.trim(),
                        requirements: mJobRequirements.filter(r => r.trim() !== ""),
                        type: mJobType,
                        isActive: mJobActive
                      };

                      const url = editingJobId ? `/api/jobs/${editingJobId}` : "/api/jobs";
                      const method = editingJobId ? "PUT" : "POST";

                      const res = await authFetch(url, {
                        method,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                      });

                      if (res.ok) {
                        showToast(editingJobId ? "Job listing updated successfully!" : "New job listing published successfully!", "success");
                        resetJobForm();
                        fetchJobsManaged();
                        onRefreshJobs?.();
                      } else {
                        const errData = await res.json().catch(() => ({}));
                        showToast(errData.error || "Failed to commit job vacancy.", "error");
                      }
                    } catch (error) {
                      console.error(error);
                      showToast("Network failure committing job vacancy.", "error");
                    }
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4"
                >
                  <h4 className="text-xs font-black text-emerald-800 uppercase flex items-center gap-1 border-b border-slate-150 pb-2">
                    <Plus className="w-4 h-4 text-emerald-700" />
                    {editingJobId ? "Modify Existing Vacancy Parameters" : "Publish New Active Vacancy Listing"}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Job Title / Vacancy Name</label>
                      <input
                        type="text"
                        value={mJobTitle}
                        onChange={e => setMJobTitle(e.target.value)}
                        placeholder="e.g. Senior Branch Teller"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 font-sans"
                        required
                      />
                    </div>

                    {/* Institution */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Agency / Institution</label>
                      <select
                        value={mJobInstitution}
                        onChange={e => setMJobInstitution(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none font-sans"
                        required
                      >
                        <option value="">Select Target Institution</option>
                        {institutionsList.map((inst, i) => (
                          <option key={i} value={inst}>{inst}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Placement Branch / Location</label>
                      <input
                        type="text"
                        value={mJobLocation}
                        onChange={e => setMJobLocation(e.target.value)}
                        placeholder="e.g. San Pablo City Head Office"
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 font-sans"
                        required
                      />
                    </div>

                    {/* Sector / Department */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Job Sector / Group</label>
                      <select
                        value={mJobSector}
                        onChange={e => setMJobSector(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none font-sans"
                      >
                        <option value="Executive">Executive</option>
                        <option value="Technical">Technical (IT/Systems)</option>
                        <option value="Operations">Operations (Field Office / Credit / Microfinance)</option>
                        <option value="Support">Support (Finance, Accounting, Admin)</option>
                      </select>
                    </div>

                    {/* Job Type */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Employment Nature Scheme</label>
                      <select
                        value={mJobType}
                        onChange={e => setMJobType(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none font-sans"
                      >
                        <option value="Full-time">Full-time Regular Position</option>
                        <option value="Part-time">Part-time Placement</option>
                        <option value="Contract">Fixed-term Contract</option>
                        <option value="Internship">Developmental Internship</option>
                      </select>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5 justify-between">
                      <div>
                        <span className="block font-black text-slate-800 text-[10px] uppercase">Vacancy Active Status</span>
                        <span className="block text-[8.5px] text-slate-400">Controls visibility on applicant job boards</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={mJobActive}
                        onChange={e => setMJobActive(e.target.checked)}
                        className="w-4.5 h-4.5 accent-emerald-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Description / Screening Guidelines */}
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Screening guidelines / Description Summary</label>
                    <textarea
                      rows={2}
                      value={mJobDescription}
                      onChange={e => setMJobDescription(e.target.value)}
                      placeholder="Brief screening protocols or summary description parameters for HR validation..."
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-medium leading-relaxed font-sans"
                    />
                  </div>

                  {/* Requirements dynamic bullet points */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider">Candidate Qualifying Requirements</label>
                      <button
                        type="button"
                        onClick={() => setMJobRequirements(prev => [...prev, ""])}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-150 rounded-lg text-[9px] font-bold transition flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add bullet requirement
                      </button>
                    </div>

                    <div className="space-y-2">
                      {mJobRequirements.map((reqStr, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={reqStr}
                            onChange={e => {
                              const updated = [...mJobRequirements];
                              updated[index] = e.target.value;
                              setMJobRequirements(updated);
                            }}
                            placeholder={`Requirement bullet #${index + 1} (e.g. Bachelor's Degree in Accountancy)`}
                            className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg outline-none font-medium text-slate-700 font-sans"
                          />
                          {mJobRequirements.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setMJobRequirements(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="p-2 text-rose-600 hover:bg-rose-50 hover:text-rose-900 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm font-sans"
                    >
                      <Save className="w-3.5 h-3.5 text-white" />
                      {editingJobId ? "Save Vacancy Edits" : "Publish Vacancy Listing"}
                    </button>
                  </div>
                </form>

                {/* Job postings lists */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    Currently Registered Openings ({jobsManaged.length})
                  </h4>

                  {loadingJobsManaged ? (
                    <div className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
                      Fetching Vacancy Records...
                    </div>
                  ) : jobsManaged.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium">
                      No registered vacancy records found in database tables.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {jobsManaged.map((job) => (
                        <div key={job.id} className="bg-white border border-slate-200 hover:border-emerald-700/40 rounded-2xl p-4 flex flex-col justify-between shadow-xs transition duration-150">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h5 className="font-black text-slate-900 text-xs truncate leading-tight select-all">{job.title}</h5>
                                <span className="text-[9.5px] font-bold text-slate-400 mt-0.5 block">{job.institution} • {job.location}</span>
                              </div>
                              <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full ${
                                job.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                              }`}>
                                {job.isActive ? "ACTIVE" : "ARCHIVED"}
                              </span>
                            </div>

                            <div className="mt-2.5 text-[10px] text-slate-550 line-clamp-2">
                              {job.description || "No customized guidelines summary specified."}
                            </div>

                            {job.requirements && job.requirements.length > 0 && (
                              <div className="mt-2.5">
                                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Candidate Standard:</span>
                                <ul className="list-disc pl-3 text-[9px] text-slate-500 mt-1 space-y-0.5">
                                  {job.requirements.slice(0, 2).map((r, i) => (
                                    <li key={i} className="truncate">{r}</li>
                                  ))}
                                  {job.requirements.length > 2 && (
                                    <li className="list-none text-[8px] italic text-slate-400">+{job.requirements.length - 2} more...</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>

                          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex justify-between items-center gap-2">
                            <span className="text-[8.5px] font-mono text-slate-400 select-all">{job.id}</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingJobId(job.id);
                                  setMJobTitle(job.title);
                                  setMJobInstitution(job.institution);
                                  setMJobLocation(job.location);
                                  setMJobSector(job.department || "Operations");
                                  setMJobRequirements(job.requirements && job.requirements.length ? job.requirements : [""]);
                                  setMJobType(job.type || "Full-time");
                                  setMJobActive(!!job.isActive);
                                  setMJobDescription(job.description || "");
                                  window.scrollTo({ top: 300, behavior: "smooth" });
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 rounded-lg text-[9px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                              >
                                <Edit className="w-3 h-3" /> Edit Profile
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`Are you absolutely sure you want to PERMANENTLY REMOVE the vacancy listing for "${job.title}"?`)) return;
                                  try {
                                    const res = await authFetch(`/api/jobs/${job.id}`, {
                                      method: "DELETE"
                                    });
                                    if (res.ok) {
                                      showToast("Job opening pruned cleanly.", "success");
                                      fetchJobsManaged();
                                      onRefreshJobs?.();
                                    } else {
                                      showToast("Failed to prune vacancy listing.", "error");
                                    }
                                  } catch (e) {
                                    showToast("Network failure pruning vacancy.", "error");
                                  }
                                }}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-lg text-[9px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Prune Listing
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==========================================
                ABOUT PAGE SECTIONS EDITOR PANEL (IT ADMIN ONLY)
                ========================================== */}
            {activeTab === "about_editor" && currentUser?.role === "it_admin" && (
              <form onSubmit={handleSaveAboutSections} className="space-y-6 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">About Page Layout & Sections Editor</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Revise corporate moral compass coordinates, milestones history logs, and participating institutions/entities list.
                  </p>
                </div>

                {/* Section 1: Moral Compass Values List */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 border-b border-slate-150 pb-2">
                    <Heart className="w-4 h-4 text-rose-605 animate-pulse" />
                    Moral Compass Core Values
                  </h4>

                  <div className="space-y-3">
                    {moralCompassValues.map((val, idx) => (
                      <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-3 space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setMoralCompassValues(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute right-3 top-3 text-slate-400 hover:text-rose-750 transition"
                          title="Delete core value"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1 md:col-span-1">
                            <label className="block text-[8.5px] font-black text-slate-400 uppercase">Core Value Title</label>
                            <input
                              type="text"
                              value={val.title}
                              onChange={e => {
                                const copy = [...moralCompassValues];
                                copy[idx].title = e.target.value;
                                setMoralCompassValues(copy);
                              }}
                              className="w-full text-xs p-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none font-bold"
                              required
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-[8.5px] font-black text-slate-400 uppercase">Description paragraph</label>
                            <textarea
                              rows={1}
                              value={val.desc}
                              onChange={e => {
                                const copy = [...moralCompassValues];
                                copy[idx].desc = e.target.value;
                                setMoralCompassValues(copy);
                              }}
                              className="w-full text-xs p-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none font-medium leading-normal"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setMoralCompassValues(prev => [...prev, { title: "New Moral Value", desc: "Description text parameters..." }]);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-150 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Core Value
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 2: Milestones Legacy Timeline */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 border-b border-slate-150 pb-2">
                    <Calendar className="w-4 h-4 text-slate-550" />
                    Our Legacy Milestones History
                  </h4>

                  <div className="space-y-3">
                    {legacyTimeline.map((mile, idx) => (
                      <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-3 space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setLegacyTimeline(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute right-3 top-3 text-slate-405 hover:text-rose-750 transition"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="space-y-1 md:col-span-1">
                            <label className="block text-[8.5px] font-black text-slate-400 uppercase">Year</label>
                            <input
                              type="text"
                              value={mile.year}
                              onChange={e => {
                                const copy = [...legacyTimeline];
                                copy[idx].year = e.target.value;
                                setLegacyTimeline(copy);
                              }}
                              className="w-full text-xs p-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none font-bold font-mono text-center"
                              required
                            />
                          </div>
                          <div className="space-y-1 md:col-span-1">
                            <label className="block text-[8.5px] font-black text-slate-450 uppercase">Milestone Title</label>
                            <input
                              type="text"
                              value={mile.title}
                              onChange={e => {
                                const copy = [...legacyTimeline];
                                copy[idx].title = e.target.value;
                                setLegacyTimeline(copy);
                              }}
                              className="w-full text-xs p-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none font-bold"
                              required
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-[8.5px] font-black text-slate-400 uppercase">Short description</label>
                            <textarea
                              rows={1}
                              value={mile.desc}
                              onChange={e => {
                                const copy = [...legacyTimeline];
                                copy[idx].desc = e.target.value;
                                setLegacyTimeline(copy);
                              }}
                              className="w-full text-xs p-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none font-medium leading-normal"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setLegacyTimeline(prev => [...prev, { year: "2026", title: "New Milestone", desc: "Short description text..." }]);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-150 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Milestone
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 3: Participating Entities / Branches */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5 border-b border-slate-150 pb-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Participating Entities & Mutual Outlets
                  </h4>

                  <div className="space-y-3">
                    {institutionBranches.map((branch, idx) => (
                      <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-3 space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setInstitutionBranches(prev => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute right-3 top-3 text-slate-400 hover:text-rose-750 transition"
                          title="Delete entity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="space-y-1 md:col-span-1">
                            <label className="block text-[8.5px] font-black text-slate-400 uppercase font-sans">Badge Character / Icon Accent</label>
                            <input
                              type="text"
                              value={branch.badge}
                              onChange={e => {
                                const copy = [...institutionBranches];
                                copy[idx].badge = e.target.value;
                                setInstitutionBranches(copy);
                              }}
                              className="w-full text-xs p-2 bg-slate-50/50 border border-slate-202 rounded-lg outline-none font-black text-center font-mono"
                              placeholder="e.g. B or M"
                              maxLength={1}
                              required
                            />
                          </div>
                          <div className="space-y-1 md:col-span-1">
                            <label className="block text-[8.5px] font-black text-slate-400 uppercase">Institutional Name</label>
                            <input
                              type="text"
                              value={branch.name}
                              onChange={e => {
                                const copy = [...institutionBranches];
                                copy[idx].name = e.target.value;
                                setInstitutionBranches(copy);
                              }}
                              className="w-full text-xs p-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none font-bold"
                              required
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <label className="block text-[8.5px] font-black text-slate-400 uppercase">Sub-description subtitle</label>
                            <input
                              type="text"
                              value={branch.desc}
                              onChange={e => {
                                const copy = [...institutionBranches];
                                copy[idx].desc = e.target.value;
                                setInstitutionBranches(copy);
                              }}
                              className="w-full text-xs p-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none font-medium leading-normal"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setInstitutionBranches(prev => [...prev, { badge: "C", name: "New cooperating entity", desc: "Brief nature of microfinance..." }]);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-150 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Cooperating Entity
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingAboutSections}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-950 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ml-0 font-sans"
                  >
                    {isSavingAboutSections ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Save className="w-3.5 h-3.5 text-white" />}
                    Save Sections Layout Configuration
                  </button>

                  {saveStatus["about_editor"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 select-all animate-bounce" />
                      <span>{saveStatus["about_editor"]}</span>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* ==========================================
                HOMEPAGE CONTENT PANEL (CMS)
                ========================================== */}
            {activeTab === "home_content" && (
              <form onSubmit={handleSaveHomeSettings} className="space-y-4 animate-in fade-in duration-200 text-left animate-in fade-in zoom-in-95 duration-200">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Homepage Content Customizer</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Configure the main website title, decorative ribbon, performance stats counters, and local emergency hotlines.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Ribbon Badge Text</label>
                      <input
                        type="text"
                        value={homeBadgeText}
                        onChange={e => setHomeBadgeText(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl outline-none font-semibold text-slate-700 focus:bg-white"
                        placeholder="e.g. Empowering Countrysides via Intelligent Recruitment"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Main Banner Title</label>
                      <input
                        type="text"
                        value={homeTitle}
                        onChange={e => setHomeTitle(e.target.value)}
                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl outline-none font-semibold text-slate-700 focus:bg-white"
                        placeholder="e.g. CARD MRI Careers"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Homepage Description Paragraph</label>
                    <textarea
                      rows={4}
                      value={homeDescription}
                      onChange={e => setHomeDescription(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-205 rounded-xl outline-none font-medium leading-relaxed focus:bg-white"
                      placeholder="Give a compelling pitch about the company..."
                      required
                    />
                  </div>

                  <div className="space-y-2 border border-[rgba(26,23,20,0.08)] bg-[#F0EDE6]/50 p-4 rounded-[20px]">
                    <h4 className="text-[10px] font-black uppercase text-slate-850 tracking-wider flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-emerald-700" />
                      Cinematic Background Hero Image (Enhancement 1)
                    </h4>
                    
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-[#6B6560] uppercase tracking-wider">
                        Hero Background Image URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={homeHeroImageUrl}
                          onChange={e => setHomeHeroImageUrl(e.target.value)}
                          className="flex-1 text-xs p-2.5 bg-white border border-[rgba(26,23,20,0.12)] rounded-[12px] outline-none font-medium text-[#1A1714] focus:bg-white"
                          placeholder="e.g. https://images.unsplash.com/photo-1486406146926-c627a92ad1ab (leave empty for default Forest Green gradient)"
                        />
                        {homeHeroImageUrl && (
                          <button
                            type="button"
                            onClick={() => setHomeHeroImageUrl("")}
                            className="px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-[12px] text-xs font-bold transition cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B6560] mt-1 font-sans">
                        Provide a raw visual image link (e.g. from Unsplash, Imgur, or your custom asset server). If kept blank, a premium forest-green gradient fallback will render.
                      </p>
                    </div>

                    {homeHeroImageUrl && (
                      <div className="pt-2">
                        <span className="block text-[9px] font-bold text-[#6B6560] uppercase mb-1">Live Image Preview</span>
                        <div className="relative overflow-hidden w-full h-32 rounded-[12px] border border-[rgba(26,23,20,0.1)] bg-slate-100 flex items-center justify-center">
                          <img 
                            src={homeHeroImageUrl} 
                            alt="Background Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Impact & Scaling Statistics Section</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">Active Branches</label>
                        <input
                          type="text"
                          value={homeBranchesCount}
                          onChange={e => setHomeBranchesCount(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none font-semibold focus:border-slate-350"
                          placeholder="e.g. 200+"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">Years of Service</label>
                        <input
                          type="text"
                          value={homeYearsOfService}
                          onChange={e => setHomeYearsOfService(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none font-semibold focus:border-slate-350"
                          placeholder="e.g. 35+"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">Filipinos Empowered</label>
                        <input
                          type="text"
                          value={homeFilipinosEmpowered}
                          onChange={e => setHomeFilipinosEmpowered(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none font-semibold focus:border-slate-350"
                          placeholder="e.g. 5M+"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Emergency Local Contacts / Channels</h4>
                      <button
                        type="button"
                        onClick={handleAddContact}
                        className="px-2.5 py-1 bg-slate-205 hover:bg-slate-300 rounded-lg text-[9.5px] font-bold text-slate-700 cursor-pointer"
                      >
                        + Add Channel
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto">
                      {homeEmergencyContacts.map((contact, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-2 border border-slate-200 rounded-xl">
                          <input
                            type="text"
                            value={contact.label || ""}
                            onChange={e => updateContactField(idx, "label", e.target.value)}
                            placeholder="e.g. Batangas Main Desk"
                            className="text-xs p-1.5 bg-slate-50 border rounded-lg w-1/3 outline-none font-bold text-slate-700"
                            required
                          />
                          <input
                            type="text"
                            value={contact.value || ""}
                            onChange={e => updateContactField(idx, "value", e.target.value)}
                            placeholder="e.g. (043) 756-1044"
                            className="text-xs p-1.5 bg-slate-50 border rounded-lg w-1/2 outline-none font-mono"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(idx)}
                            className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                      {homeEmergencyContacts.length === 0 && (
                        <p className="text-slate-500 italic text-[10px] text-center py-2">No contact channels defined yet. Add one above.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSavingHome}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ml-0 font-sans"
                  >
                    {isSavingHome ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" /> : <Save className="w-3.5 h-3.5 text-white" />}
                    Save Homepage Settings
                  </button>

                  {saveStatus["home_content"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveStatus["home_content"]}</span>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* ==========================================
                SCREENING QUESTIONS PANEL
                ========================================== */}
            {activeTab === "screening" && (
              <div className="space-y-6 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5 flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase">Screening Questionnaire Builder</h3>
                    <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                      Program the computerized questions that candidates answer during slide deck clearance process.
                    </p>
                  </div>
                  {editingQuestionId && (
                    <button
                      onClick={resetQuestionForm}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl cursor-pointer font-sans"
                    >
                      Clear Editor (Create New)
                    </button>
                  )}
                </div>

                {/* Form to Create/Edit Question */}
                <form onSubmit={handleSaveQuestion} className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-4 font-sans text-xs">
                  <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                    {editingQuestionId ? "🛠️ Edit Screening Question" : "➕ Create New Screening Question"}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Question Wording *</label>
                      <input
                        type="text"
                        required
                        value={qText}
                        onChange={e => setQText(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-emerald-700 rounded-xl outline-none"
                        placeholder="e.g. Do you have immediate family members working in CARD MRI?"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Response Input Type</label>
                      <select
                        value={qType}
                        onChange={e => {
                          setQType(e.target.value);
                          if (e.target.value !== "select") {
                            setQOptions("");
                          }
                        }}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer"
                      >
                        <option value="yes_no">Yes / No Switch</option>
                        <option value="text">Freetext Paragraph Input</option>
                        <option value="select">Dropdown Custom Selection</option>
                      </select>
                    </div>
                  </div>

                  {qType === "select" && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-150">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Dropdown Answer Options (Comma separated) *</label>
                      <input
                        type="text"
                        required={qType === "select"}
                        value={qOptions}
                        onChange={e => setQOptions(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-emerald-700 rounded-xl outline-none font-mono"
                        placeholder="e.g. San Pablo Laguna, Rizal, Manila, Quezon City"
                      />
                    </div>
                  )}

                  <div className="flex gap-6 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer group text-xs text-slate-650 font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={qRequired}
                        onChange={e => setQRequired(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-600/30 cursor-pointer"
                      />
                      <span>Mandatory Requirement (Required answer)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer group text-xs text-slate-650 font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={qIsActive}
                        onChange={e => setQIsActive(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-600/30 cursor-pointer"
                      />
                      <span>Active Question (Enabled / Visible to applicants)</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      {editingQuestionId ? "Update Question Parameters" : "Publish Question to Bank"}
                    </button>
                    {editingQuestionId && (
                      <button
                        type="button"
                        onClick={resetQuestionForm}
                        className="px-4 py-2 bg-slate-150 hover:bg-slate-205 text-slate-650 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>

                {/* List of custom screening questions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase">Active Question Bank Checklist</h4>
                  
                  {loadingQuestions ? (
                    <div className="p-8 text-center text-slate-400 font-mono text-xs">Loading CARD MRI question checklist...</div>
                  ) : screeningQuestions.length === 0 ? (
                    <div className="p-8 border border-dashed rounded-2xl text-center text-slate-450 text-xs">
                      No questions inside active bank registries.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white shadow-xs">
                      {screeningQuestions.map((q, idx) => (
                        <div key={q.id} className="p-4 hover:bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                          <div className="space-y-1.5 flex-1 select-text">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 font-mono">0{idx + 1}.</span>
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase font-mono border rounded ${
                                q.isActive 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
                                  : "bg-slate-100 text-slate-450 border-slate-200"
                              }`}>
                                {q.isActive ? "Active Onboarding" : "Disabled"}
                              </span>
                              <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase font-mono bg-blue-50 text-blue-900 border border-blue-100 rounded">
                                Type: {q.type}
                              </span>
                              {q.required && (
                                <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase font-mono text-rose-700 bg-rose-50 border border-rose-100 rounded">
                                  Required *
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-black leading-relaxed text-slate-800">
                              {q.text}
                            </p>
                            {q.options && q.options.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {q.options.map((opt: string, oIdx: number) => (
                                  <span key={oIdx} className="text-[9.5px] font-bold font-mono px-1.5 py-0.5 bg-slate-50 rounded border text-slate-600">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => handleToggleActiveQuestion(q)}
                              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border cursor-pointer transition ${
                                q.isActive 
                                  ? "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800" 
                                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800 font-bold"
                              }`}
                            >
                              {q.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingQuestionId(q.id);
                                setQText(q.text);
                                setQType(q.type);
                                setQOptions(q.options ? q.options.join(", ") : "");
                                setQRequired(q.required);
                                setQIsActive(q.isActive);
                              }}
                              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 cursor-pointer transition"
                              title="Edit Question Wording"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-705" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-700 cursor-pointer transition animate-in fade-in"
                              title="Delete Question permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {saveStatus["screening"] && (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center gap-2 text-emerald-950 font-bold animate-in slide-in-from-bottom-2 duration-200">
                    <CheckCircle className="w-4 h-4 text-emerald-650" />
                    <span>{saveStatus["screening"]}</span>
                  </div>
                )}
              </div>
            )}

            {/* ==========================================
                APPEARANCE PANEL
                ========================================== */}
            {activeTab === "appearance" && (
              <div className="space-y-4 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Appearance Settings</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Modulate standard portal visual settings to assist field operations accessibility.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Sizing switch adapter */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-150 gap-3">
                    <div>
                      <span className="font-sans font-black text-slate-900 block text-[11px] uppercase tracking-wider">Accessibility Oversized Fonts</span>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Overrides standard UI font variables with thick larger scales.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTextSize(textSize === "normal" ? "large" : "normal")}
                      className={`px-3 py-1.5 font-bold uppercase text-[9px] rounded-lg transition tracking-wider ${
                        textSize === "large" 
                          ? "bg-rose-100 text-rose-700 hover:bg-rose-200" 
                          : "bg-slate-900 text-white hover:bg-slate-850"
                      }`}
                    >
                      {textSize === "large" ? "DEACTIVATE EXTREME SIZE" : "ACTIVATE"}
                    </button>
                  </div>

                  {/* Contrast selection */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-150 gap-3">
                    <div>
                      <span className="font-sans font-black text-slate-900 block text-[11px] uppercase tracking-wider">Contrast Layout Adaptations</span>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Augments gray text panels into pure absolute high-contrast overlays.</p>
                    </div>
                    <select
                      value={contrastTheme}
                      onChange={(e) => setContrastTheme(e.target.value)}
                      className="p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-850"
                    >
                      <option value="Standard">Standard Neutral</option>
                      <option value="Extreme Light">Extreme Light (High Contrast)</option>
                    </select>
                  </div>

                  {/* Localization Dialect options */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-150 gap-3">
                    <div>
                      <span className="font-sans font-black text-slate-900 block text-[11px] uppercase tracking-wider">Administrative Subtitle Localization</span>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Converts structural tags into Philippine dialect subtitling parameters.</p>
                    </div>
                    <select
                      value={localeLang}
                      onChange={(e) => setLocaleLang(e.target.value)}
                      className="p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-850"
                    >
                      <option value="EN">English (EN Standard)</option>
                      <option value="TL">Tagalog / Filipino dialect (TL)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveAppearance}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                  >
                    Save Appearance Changes
                  </button>

                  {saveStatus["appearance"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveStatus["appearance"]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==========================================
                TEXT STYLE PANEL (THE NEW TYPOGRAPHY DECK)
                ========================================== */}
            {activeTab === "text_style" && (
              <div className="space-y-4 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <span className="bg-emerald-100 px-2 py-0.5 rounded text-[8px] text-emerald-950 font-bold uppercase inline-block mb-1 tracking-wider">Dynamic Layout Control</span>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Text Style Settings</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Modulate globally propagated typography configurations directly mapping onto active document stylesheets and root CSS custom properties.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Left sub-column: Typography controller sliders/selections */}
                  <div className="space-y-4">
                    
                    {/* Font Selector */}
                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Font Family Selection</label>
                      <select
                        value={fontFamily}
                        onChange={e => setFontFamily(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl font-bold text-xs text-slate-850"
                      >
                        <option value="Inter">Inter (Sleek Modern Neutral)</option>
                        <option value="Roboto">Roboto (Neo-Classic Tech)</option>
                        <option value="Poppins">Poppins (Polished Geometric Display)</option>
                        <option value="Georgia">Georgia (Serene Formal Serif)</option>
                        <option value="JetBrains Mono">JetBrains Mono (Symmetrical Engineering)</option>
                      </select>
                    </div>

                    {/* Base Font Sizer Slider */}
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Base Font Sizing</label>
                        <span className="text-[10px] bg-slate-100 font-mono font-bold px-1.5 py-0.2 rounded uppercase text-slate-700">{fontSize}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["small", "medium", "large", "xlarge"].map(sz => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setFontSize(sz)}
                            className={`py-1.5 rounded-lg text-[9.5px] uppercase font-bold tracking-wider transition ${
                              fontSize === sz 
                                ? "bg-slate-900 text-white" 
                                : "bg-slate-50 hover:bg-slate-100 border text-slate-650"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Weight Options */}
                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Default Content Weight</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["Light", "Regular", "Medium", "Bold"].map(wt => (
                          <button
                            key={wt}
                            type="button"
                            onClick={() => setFontWeight(wt)}
                            className={`py-1.5 rounded-lg text-[9.5px] uppercase font-bold tracking-wider transition ${
                              fontWeight === wt 
                                ? "bg-slate-900 text-white" 
                                : "bg-slate-50 hover:bg-slate-100 border text-slate-650"
                            }`}
                          >
                            {wt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Line height slider */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <span>Line Height Spacing</span>
                        <span className="font-mono text-emerald-800 font-extrabold">{lineHeight}</span>
                      </div>
                      <input
                        type="range"
                        min="1.2"
                        max="2.0"
                        step="0.1"
                        value={lineHeight}
                        onChange={e => setLineHeight(parseFloat(e.target.value))}
                        className="w-full accent-emerald-800"
                      />
                    </div>

                    {/* Letter Spacing slider */}
                    <div className="space-y-1.5 text-left">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <span>Letter Tracking Spacing</span>
                        <span className="font-mono text-emerald-800 font-extrabold">{letterSpacing}em</span>
                      </div>
                      <input
                        type="range"
                        min="-0.04"
                        max="0.15"
                        step="0.01"
                        value={letterSpacing}
                        onChange={e => setLetterSpacing(parseFloat(e.target.value))}
                        className="w-full accent-emerald-800"
                      />
                    </div>

                    {/* Header Style custom selections */}
                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Header Layout Form</label>
                      <select
                        value={headingStyle}
                        onChange={e => setHeadingStyle(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl font-bold text-xs text-slate-850"
                      >
                        <option value="normal">Standard Normal Capitalization</option>
                        <option value="uppercase">Uppercase Capital Bold Tags</option>
                        <option value="bold-accent">Bold Accent Teal Signature Colors</option>
                      </select>
                    </div>

                  </div>

                  {/* Right sub-column: Dynamic real-time preview board */}
                  <div className="flex flex-col justify-between space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-3xl">
                    <div className="text-left">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5 mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-mono flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 font-sans" /> Sandbox Live Render Box
                        </span>
                        <span className="text-[8px] bg-emerald-100 text-teal-950 font-bold px-1.5 py-0.2 rounded">Real-time Node</span>
                      </div>

                      {/* Render node applying localized style state strictly */}
                      <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-inner min-h-[220px] select-none">
                        
                        {/* Interactive dynamic preview code using inline maps React overrides */}
                        <div style={{
                          fontFamily: fontFamilyMap[fontFamily] || '"Inter", sans-serif',
                          fontWeight: fontWeightMap[fontWeight] || '400',
                          lineHeight: lineHeight,
                          letterSpacing: `${letterSpacing}em`
                        }} className="space-y-3 text-left">
                          
                          <h4 
                            style={{
                              textTransform: headingStyle === "uppercase" ? "uppercase" : "none",
                              color: headingStyle === "bold-accent" ? "#047857" : '#0f172a',
                              fontWeight: headingStyle === "bold-accent" ? 800 : 700
                            }}
                            className="text-sm font-extrabold uppercase leading-none tracking-normal"
                          >
                            CARD Mutually Reinforcing Institutions
                          </h4>

                          <p style={{
                            fontSize: fontSizeMap[fontSize] || "13px"
                          }} className="text-slate-600">
                            Empowering microfinance staff across CARD Bank outlets. Direct walkthrough registries automatically trigger multi-agency Postgres Row-Level Security checks.
                          </p>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-sans text-slate-400">
                            <span className="font-bold">Authorizing Code: SB-401</span>
                            <span className="font-mono uppercase">{fontFamily} Font</span>
                          </div>

                        </div>

                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-[10px] text-justify leading-relaxed text-indigo-900 font-sans font-medium">
                      <strong>Global Propagation:</strong> Clicking "Save and Dispatch Style Stylesheet" will synchronize variables permanently to browser localStorage, preserving selections across all navigation modules!
                    </div>

                  </div>

                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveTextStyle}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                  >
                    Save & Dispatch Stylesheet Variables
                  </button>

                  {saveStatus["text_style"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveStatus["text_style"]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==========================================
                NOTIFICATIONS PANEL
                ========================================== */}
            {activeTab === "notifications" && (
              <div className="space-y-4 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Notifications & Dispatch Alerts</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Configure electronic notifications, status reminders, and staff audit reports.
                  </p>
                </div>

                <div className="space-y-3">
                  
                  {/* Switch 1: E-Mail logs dispatch */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-150">
                    <div>
                      <span className="block font-black text-slate-900 text-[11px] uppercase tracking-wider">E-Mail Tracking Notices</span>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5 font-sans">Dispatch transactional emails on dossier transition shifts.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={() => setNotifyEmail(!notifyEmail)}
                      className="w-4.5 h-4.5 accent-emerald-800 rounded cursor-pointer"
                    />
                  </div>

                  {/* Switch 2: Internal pipeline telemetry status logs */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-150">
                    <div>
                      <span className="block font-black text-slate-900 text-[11px] uppercase tracking-wider">Internal Broadcast telemetry</span>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5 font-sans">Post pipeline events immediately on administrative staff message hubs.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyPipeline}
                      onChange={() => setNotifyPipeline(!notifyPipeline)}
                      className="w-4.5 h-4.5 accent-emerald-800 rounded cursor-pointer"
                    />
                  </div>

                  {/* Dropdown: Dispatch Frequency */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-150 gap-3">
                    <div>
                      <span className="block font-black text-slate-900 text-[11px] uppercase tracking-wider">Alert Summary Periodicity</span>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5 font-sans">Throttle alerts frequency to avoid regional notification overhead.</p>
                    </div>
                    <select
                      value={alertFrequency}
                      onChange={(e) => setAlertFrequency(e.target.value)}
                      className="p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-850"
                    >
                      <option value="Immediate">Immediate Real-time Triggers</option>
                      <option value="Daily">Daily Audited Summary Digest</option>
                      <option value="Disabled">Mute Telemetry Logs</option>
                    </select>
                  </div>

                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                  >
                    Save Notification Changes
                  </button>

                  {saveStatus["notifications"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveStatus["notifications"]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==========================================
                SECURITY & CLEARANCE ACCESS PANEL
                ========================================== */}
            {activeTab === "security" && (
              <div className="space-y-4 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Security & Clearance Authorization</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Audit active database context, JWT token parameters, and secure clearance metadata.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Token Info parameters */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black text-slate-400 uppercase font-mono">Active Authorization Certificate</span>
                    
                    <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-850 space-y-2">
                      <div className="flex justify-between items-center text-[8.5px] border-b border-white/10 pb-1.5 font-mono">
                        <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" /> SECURE ROOT VERIFICATION
                        </span>
                        <span className="text-slate-400">STATE: LOCKED</span>
                      </div>

                      <div className="space-y-2 text-[10px] font-sans">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400 font-bold font-mono">Account Signature:</span>
                          <span className="col-span-2 text-slate-200 select-all font-bold uppercase">{currentUser?.fullName || "Public Recruiter"}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400 font-bold font-mono">Simulated IP:</span>
                          <span className="col-span-2 text-slate-200 font-mono select-all font-semibold">{mockIP}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400 font-bold font-mono">Session Signature:</span>
                          <span className="col-span-2 text-emerald-300 select-all overflow-hidden text-ellipsis whitespace-nowrap font-mono">{mockSessionId}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-400 font-bold font-mono font-sans">Group Clearance:</span>
                          <span className="col-span-2 text-slate-200 font-bold uppercase">
                            {currentUser?.role === "it_admin" ? "Level 3 Root Systems Admin" : "Level 1 Recruiter Portfolio"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Browser Context info */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black text-slate-400 uppercase font-mono">Active Coordination Agent Signature</span>
                    <div className="p-3bg-slate-50 border border-slate-150 rounded-2xl space-y-1 bg-slate-50 p-3 min-h-[105px]">
                      <span className="block text-[9px] font-black text-slate-500 uppercase font-mono">Agent Environment</span>
                      <p className="text-[10px]/1.4 text-slate-500 font-mono break-all font-semibold">
                        {userAgent}
                      </p>
                    </div>
                  </div>

                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-150 text-[10px] text-justify leading-relaxed text-amber-900 flex gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Postgres Row-Level Security Warning:</strong> Active security filters prevent staff from editing or selecting records belonging to unassociated branch domains. Clearance verification log is recorded on operations consoles.
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveSecurity}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    Rotate Session Tokens & Clear Cache
                  </button>

                  {saveStatus["security"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 animate-bounce" />
                      <span>{saveStatus["security"]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==========================================
                SYSTEM PREFERENCES PANEL
                ========================================== */}
            {activeTab === "system" && (
              <div className="space-y-4 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">System Parameters & Default Behaviors</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Modulate standard pipeline values, initial onboarding states, and local calendar conventions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Calendar Metric selection */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-450 shrink-0" /> Date Parameter Metric Formatting
                    </label>
                    <select
                      value={dateFormat}
                      onChange={e => setDateFormat(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl font-bold text-xs text-slate-850"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY (USA Gregorian)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (PH Regional Outlets)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601 Crypt Standard)</option>
                    </select>
                  </div>

                  {/* Fallback HR incharge assignment */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-450 shrink-0" /> Default HR Portfolio Assignment Coordinator
                    </label>
                    <select
                      value={defaultHrIncharge}
                      onChange={e => setDefaultHrIncharge(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl font-bold text-xs text-slate-850"
                    >
                      <option value="Ms. Ailen Entero">Ms. Ailen Entero (Executive Staff Specialist)</option>
                      <option value="Ms. Karen Lopez">Ms. Karen Lopez (Senior Recruitment Coordinator)</option>
                      <option value="Mr. Joey Gabriel">Mr. Joey Gabriel (Field Officer Placement Manager)</option>
                      <option value="Ms. Mary Grace">Ms. Mary Grace (Institutional Integration Head)</option>
                    </select>
                  </div>

                  {/* Default onboarding stage */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-450 shrink-0" /> Initial Walk-In Application Stage Phase
                    </label>
                    <select
                      value={defaultStatus}
                      onChange={e => setDefaultStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl font-bold text-xs text-slate-850"
                    >
                      <option value="New">New (Pending Registry Screening)</option>
                      <option value="Acknowledge">Acknowledge (Notification Sent)</option>
                      <option value="Passed Screening">Passed Screening (Awaiting Unit Interview)</option>
                    </select>
                  </div>

                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveSystem}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 hover:border-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-sans"
                  >
                    Save System preferences
                  </button>

                  {saveStatus["system"] && (
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold ml-2 animate-in fade-in duration-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{saveStatus["system"]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==========================================
                DROPDOWN SELECTION MANAGER PANEL
                ========================================== */}
            {activeTab === "dropdown_managers" && (
              <div className="space-y-6 animate-in fade-in duration-200 text-left">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Dropdown Options & Lookup Fields Controller</h3>
                  <p className="text-slate-500 text-[10px] leading-relaxed mt-0.5">
                    Dynamically curate, revise, and purge the selection matrices feeding critical recruiter pipeline forms and placement options.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  
                  {/* CARD 1: PIPELINE STATUS LIST */}
                  <div className="bg-white rounded-2xl border border-slate-205 p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase">Application Flow Statuses</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {statusesList.length} Options
                      </span>
                    </div>

                    {/* New Status Input fields */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add Status (e.g. Panel Interview)"
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddStatus(); }}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans placeholder-slate-400 focus:outline-slate-300"
                      />
                      <button
                        type="button"
                        onClick={handleAddStatus}
                        className="px-2.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition flex items-center justify-center cursor-pointer"
                        title="Add Status"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Lists Scroll Area */}
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {statusesList.map((st, idx) => (
                        <div key={idx} className="flex gap-2 items-center justify-between p-2 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-150 text-xs">
                          {editingStatusIdx === idx ? (
                            <div className="flex-1 flex gap-1.5 items-center">
                              <input
                                type="text"
                                value={editingStatusValue}
                                onChange={e => setEditingStatusValue(e.target.value)}
                                className="flex-1 p-1 bg-white border border-slate-205 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleEditStatus(idx)}
                                className="p-1 text-emerald-700 hover:text-emerald-950 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStatusIdx(null)}
                                className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-bold text-slate-800 truncate select-text">{st}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStatusIdx(idx);
                                    setEditingStatusValue(st);
                                  }}
                                  className="p-1 text-slate-400 hover:text-emerald-800 transition cursor-pointer"
                                  title="Edit value"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStatus(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-750 transition cursor-pointer"
                                  title="Delete option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CARD 2: PLACEMENT INSTITUTIONS */}
                  <div className="bg-white rounded-2xl border border-slate-205 p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase">Endorsement Placements</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {institutionsList.length} Targets
                      </span>
                    </div>

                    {/* New Placement Target Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add Placement (e.g. CARD Bank Lipa)"
                        value={newInstitution}
                        onChange={e => setNewInstitution(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddInstitution(); }}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans placeholder-slate-400 focus:outline-slate-300"
                      />
                      <button
                        type="button"
                        onClick={handleAddInstitution}
                        className="px-2.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition flex items-center justify-center cursor-pointer"
                        title="Add Placement"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scroll space listing */}
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {institutionsList.map((inst, idx) => (
                        <div key={idx} className="flex gap-2 items-center justify-between p-2 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-150 text-xs">
                          {editingInstitutionIdx === idx ? (
                            <div className="flex-1 flex gap-1.5 items-center">
                              <input
                                type="text"
                                value={editingInstitutionValue}
                                onChange={e => setEditingInstitutionValue(e.target.value)}
                                className="flex-1 p-1 bg-white border border-slate-205 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleEditInstitution(idx)}
                                className="p-1 text-emerald-700 hover:text-emerald-950 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingInstitutionIdx(null)}
                                className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-bold text-slate-800 truncate select-text">{inst}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingInstitutionIdx(idx);
                                    setEditingInstitutionValue(inst);
                                  }}
                                  className="p-1 text-slate-400 hover:text-emerald-800 transition cursor-pointer"
                                  title="Edit value"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInstitution(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-750 transition cursor-pointer"
                                  title="Delete option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CARD 3: HR OPERATORS LIST */}
                  <div className="bg-white rounded-2xl border border-slate-205 p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase">HR Account Operators</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {hrInchargesList.length} Operators
                      </span>
                    </div>

                    {/* New Operator name Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add Recruiter (e.g. Mr. Jose Rizal)"
                        value={newHrIncharge}
                        onChange={e => setNewHrIncharge(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddHrIncharge(); }}
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans placeholder-slate-400 focus:outline-slate-300"
                      />
                      <button
                        type="button"
                        onClick={handleAddHrIncharge}
                        className="px-2.5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl transition flex items-center justify-center cursor-pointer"
                        title="Add Operator"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scroll space list */}
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {hrInchargesList.map((person, idx) => (
                        <div key={idx} className="flex gap-2 items-center justify-between p-2 rounded-xl bg-slate-50/50 hover:bg-slate-50 border border-slate-150 text-xs">
                          {editingHrInchargeIdx === idx ? (
                            <div className="flex-1 flex gap-1.5 items-center">
                              <input
                                type="text"
                                value={editingHrInchargeValue}
                                onChange={e => setEditingHrInchargeValue(e.target.value)}
                                className="flex-1 p-1 bg-white border border-slate-205 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleEditHrIncharge(idx)}
                                className="p-1 text-emerald-700 hover:text-emerald-950 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingHrInchargeIdx(null)}
                                className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="font-bold text-slate-800 truncate select-text">{person}</span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingHrInchargeIdx(idx);
                                    setEditingHrInchargeValue(person);
                                  }}
                                  className="p-1 text-slate-400 hover:text-emerald-800 transition cursor-pointer"
                                  title="Edit value"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHrIncharge(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-750 transition cursor-pointer"
                                  title="Delete option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Persistent CARD MRI branding label inside panel */}
          <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-400 font-medium">
            <span>MUTUALLY REINFORCING INSTITUTIONS SECURE PREFERENCES SYSTEM</span>
            <span className="font-mono text-[9px]">v2.6.0-VERCEL-PROD</span>
          </div>

        </div>

      </div>

    </div>
  );
}
