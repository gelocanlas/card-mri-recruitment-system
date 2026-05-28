import React, { useState, useEffect, useCallback, Component, ReactNode } from "react";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import AboutPage from "./components/AboutPage";
import AuthPage from "./components/AuthPage";
import DashboardPage from "./components/DashboardPage";
import SettingsPage from "./components/SettingsPage";
import { JobPosting, UserProfile } from "./types";
import { authFetch } from "./lib/api";
import { Building2, House, Info, Briefcase, Lock, LayoutDashboard, Settings, LogOut, WifiOff, Clock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-8">
          <div className="max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-red-200 text-left space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-black uppercase">Application Error</h2>
            </div>
            <p className="text-sm text-slate-600 font-mono break-all">{this.state.error.message}</p>
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer font-bold">Stack Trace</summary>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] text-slate-400 max-h-60 overflow-y-auto">{this.state.error.stack}</pre>
            </details>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer">
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Navigation Router state initialized using the current pathname mapping
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/^\//, "");
      const validTabs = ["home", "about", "dashboard", "settings", "login"];
      return validTabs.includes(path) ? path : "home";
    }
    return "home";
  });

  // Localized Tab transition effect loading status (Requirement 4)
  const [isTabLoading, setIsTabLoading] = useState(false);
  
  // Custom router state transition that pushes layout status to HTML5 History API
  const setActiveTab = useCallback((tab: string) => {
    setIsTabLoading(true);
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const expectedPath = tab === "home" ? "/" : `/${tab}`;
      if (window.location.pathname !== expectedPath) {
        window.history.pushState({ page: tab }, "", expectedPath);
      }
    }
    // Artificial compile lag to show beautiful user perception dashboard loading spinner
    setTimeout(() => {
      setIsTabLoading(false);
    }, 450);
  }, []);

  // Listen to popstate event (browser back/forward actions) to maintain state consistency
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\//, "");
      const validTabs = ["home", "about", "dashboard", "settings", "login"];
      const targetTab = validTabs.includes(path) ? path : "home";
      setIsTabLoading(true);
      setActiveTabState(targetTab);
      setTimeout(() => setIsTabLoading(false), 450);
    };

    window.addEventListener("popstate", handlePopState);

    // Initial check to guarantee alignment on initial page request
    const initialPath = window.location.pathname.replace(/^\//, "");
    const validTabs = ["home", "about", "dashboard", "settings", "login"];
    const verifiedTab = validTabs.includes(initialPath) ? initialPath : "home";
    setIsTabLoading(true);
    setActiveTabState(verifiedTab);
    setTimeout(() => setIsTabLoading(false), 450);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  
  // Security Authentication session state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("card_mri_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Jobs state matching API backend
  const [jobs, setJobs] = useState<JobPosting[]>([]);

  // HCI Accessibility Preferences
  const [textSize, setTextSize] = useState<"normal" | "large">("normal");

  // Shared Settings Dropdown State managers
  const [statusesList, setStatusesList] = useState<string[]>(() => {
    const saved = localStorage.getItem("card_mri_statuses_list");
    return saved ? JSON.parse(saved) : [
      "New", "Acknowledge", "Passed Screening", "Already Endorsed", "Hired", "Rejected", "Rejected (With Relatives)"
    ];
  });

  const [institutionsLookup, setInstitutionsLookup] = useState<string[]>(() => {
    const saved = localStorage.getItem("card_mri_institutions_list");
    return saved ? JSON.parse(saved) : [
      "Legal", "HR", "EA", "Audit", "O&A", "SDRM", "Research", "CSR", "Treasury",
      "CARD Bank", "CMDI", "CMIT", "BDS", "FDS", "Rizal Bank", "CARD MRI Astro",
      "CaMIA", "CLFC", "MG", "Publications", "Publishing", "Media", "ME", "QA",
      "Support", "Security", "MIS", "General", "Compliance", "Finance", 
      "CARD SME Bank", "CARD Pioneer", "CARD Mutual Benefit", "CMRI Legal",
      "CARD Livelihood", "CARD Leasing", "IT Admin Unit", "Branch Operations"
    ];
  });

  const [hrInchargesLookup, setHrInchargesLookup] = useState<string[]>(() => {
    const saved = localStorage.getItem("card_mri_hr_incharges_list");
    return saved ? JSON.parse(saved) : [
      "Ms. Ailen Entero", "Ms. Mary Jane Romero", "Mr. Edmon Bazar", "Ms. Sarah Balazo",
      "Ms. Christine Ramos", "Mr. Juan Dela Cruz", "Ms. Maria Santos", "Mr. Robert Lim",
      "Ms. Joyce Rivera", "Ms. Gladys Corpuz", "Mr. Michael Aquino", "Ms. Karen Mendez",
      "Mr. David Reyes", "Ms. Patricia Castro", "Mr. Anthony Diaz", "Ms. Helen Torres",
      "Ms. Fatima Gomez", "Mr. Ronald Ramos", "Ms. Abigail Flores", "Mr. Christian Perez",
      "Ms. Rowena Alcantara", "Ms. Jocelyn Bautista"
    ];
  });

  // Top-level Global Update functions
  const handleSaveProfile = useCallback((updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    localStorage.setItem("card_mri_user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("card_mri_user_changed"));
  }, []);

  const updateHomepageSettings = useCallback((newSettings: any) => {
    localStorage.setItem("card_mri_homepage_settings", JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent("card_mri_settings_changed", { detail: newSettings }));
  }, []);

  // Expose mutation event handlers to global namespace to integrate with panels
  useEffect(() => {
    (window as any).handleSaveProfile = handleSaveProfile;
    (window as any).updateHomepageSettings = updateHomepageSettings;
    return () => {
      delete (window as any).handleSaveProfile;
      delete (window as any).updateHomepageSettings;
    };
  }, [handleSaveProfile, updateHomepageSettings]);

  // Fetch active vacancies on launch with catch guard (Requirement 1 - WebSocket disconnect protection)
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(Array.isArray(data) ? data.filter(Boolean) : []);
      }
    } catch (e) {
      console.warn("Connection failed reading CARD MRI vacancies db - rendering gracefully with cached state.", e);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  useEffect(() => {
    const handleUserChanged = () => {
      const saved = localStorage.getItem("card_mri_user");
      setCurrentUser(saved ? JSON.parse(saved) : null);
    };
    window.addEventListener("card_mri_user_changed", handleUserChanged);
    return () => window.removeEventListener("card_mri_user_changed", handleUserChanged);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener("auth_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth_unauthorized", handleUnauthorized);
  }, []);

  const [sessionExpiring, setSessionExpiring] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("card_mri_token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp * 1000;
      const check = () => {
        const remaining = exp - Date.now();
        if (remaining > 0 && remaining < 5 * 60 * 1000) {
          setSessionExpiring(true);
        } else if (remaining <= 0) {
          setSessionExpiring(false);
          handleLogout();
        } else {
          setSessionExpiring(false);
        }
      };
      check();
      const interval = setInterval(check, 30000);
      return () => clearInterval(interval);
    } catch { /* ignore invalid tokens */ }
  }, [currentUser]);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const go = () => setIsOffline(false);
    const goAway = () => setIsOffline(true);
    window.addEventListener("online", go);
    window.addEventListener("offline", goAway);
    return () => {
      window.removeEventListener("online", go);
      window.removeEventListener("offline", goAway);
    };
  }, []);

  useEffect(() => {
    const loadDropdownSettings = async () => {
      try {
        const [sRes, iRes, hRes] = await Promise.all([
          fetch("/api/system-settings/statuses_list"),
          fetch("/api/system-settings/institutions_list"),
          fetch("/api/system-settings/hr_incharges_list")
        ]);
        if (sRes.ok) {
          const d = await sRes.json();
          if (Array.isArray(d.value) && d.value.length > 0) {
            setStatusesList(d.value);
            localStorage.setItem("card_mri_statuses_list", 
              JSON.stringify(d.value));
          }
        }
        if (iRes.ok) {
          const d = await iRes.json();
          if (Array.isArray(d.value) && d.value.length > 0) {
            setInstitutionsLookup(d.value);
            localStorage.setItem("card_mri_institutions_list", 
              JSON.stringify(d.value));
          }
        }
        if (hRes.ok) {
          const d = await hRes.json();
          if (Array.isArray(d.value) && d.value.length > 0) {
            setHrInchargesLookup(d.value);
            localStorage.setItem("card_mri_hr_incharges_list", 
              JSON.stringify(d.value));
          }
        }
      } catch (e) {
        console.warn("Could not load dropdown settings from API", e);
      }
    };
    loadDropdownSettings();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem("card_mri_user", JSON.stringify(user));
    if (user && user.token) {
      localStorage.setItem("card_mri_token", user.token);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("card_mri_user");
    localStorage.removeItem("card_mri_token");
    setActiveTab("home");
  };

  const handleGoToJobs = () => {
    setActiveTab("home");
    setTimeout(() => {
      const el = document.getElementById("vacancies-catalog-anchor");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 550);
  };

  return (
    <ErrorBoundary>
    <div className={`min-h-screen w-full bg-[#F7F5F0] text-[#1A1714] flex flex-col justify-between transition-all duration-200 overflow-x-hidden select-none ${
      textSize === "large" ? "text-lg font-medium" : "text-sm"
    }`}>
      {/* Dynamic Security & Accessibility Navigation Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
        }}
        onLogout={handleLogout}
        textSize={textSize}
        setTextSize={setTextSize}
      />

      {isOffline && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-amber-600 text-white text-center py-1.5 px-4 text-[11px] font-bold flex items-center justify-center gap-2" role="alert">
          <WifiOff className="w-3.5 h-3.5" />
          You are offline — changes may not be saved
        </div>
      )}
      {sessionExpiring && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-rose-600 text-white text-center py-1.5 px-4 text-[11px] font-bold flex items-center justify-center gap-2" role="alert">
          <Clock className="w-3.5 h-3.5" />
          Your session will expire in 5 minutes — save your work
        </div>
      )}
      {/* Main Container - Added pt-24 matching fixed header offset */}
      <main id="main-content" className="flex-1 w-full px-0 pt-24 pb-20 lg:pb-8 overflow-x-hidden">
        <AnimatePresence mode="wait">
          {isTabLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-28 px-4 min-h-[50vh]"
            >
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-emerald-100 border-t-emerald-700"></div>
                <img src="/card_mri.png" className="absolute h-7 w-auto object-contain animate-pulse" alt="" />
              </div>
              <p className="mt-5 text-xs font-mono font-black tracking-widest text-emerald-800 uppercase">
                Loading...
              </p>
              <p className="text-[10px] text-slate-400 font-sans mt-1">
                CARD MRI Careers Portal
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {activeTab === "home" && (
                <HomePage 
                  setActiveTab={setActiveTab} 
                  currentUser={currentUser}
                  jobs={jobs}
                  onRefreshJobs={fetchJobs}
                />
              )}

              {activeTab === "about" && (
                <AboutPage />
              )}

              {activeTab === "dashboard" && (
                <DashboardPage 
                  currentUser={currentUser} 
                  setActiveTab={setActiveTab} 
                  jobs={jobs}
                  onRefreshJobs={fetchJobs}
                  statusesList={statusesList}
                  setStatusesList={setStatusesList}
                  institutionsLookup={institutionsLookup}
                  setInstitutionsLookup={setInstitutionsLookup}
                  hrInchargesLookup={hrInchargesLookup}
                  setHrInchargesLookup={setHrInchargesLookup}
                />
              )}

              {activeTab === "settings" && (
                <SettingsPage 
                  currentUser={currentUser} 
                  textSize={textSize} 
                  setTextSize={setTextSize} 
                  statusesList={statusesList}
                  setStatusesList={setStatusesList}
                  institutionsList={institutionsLookup}
                  setInstitutionsList={setInstitutionsLookup}
                  hrInchargesList={hrInchargesLookup}
                  setHrInchargesList={setHrInchargesLookup}
                  onRefreshJobs={fetchJobs}
                />
              )}

              {activeTab === "login" && (
                <AuthPage onLoginSuccess={handleLoginSuccess} setActiveTab={setActiveTab} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Mobile Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#FDFCFA]/95 backdrop-blur-md border-t border-[rgba(26,23,20,0.08)] pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
          {!currentUser ? (
            <>
              <button
                onClick={() => setActiveTab("home")}
                className={`flex flex-col items-center justify-center flex-grow py-1.5 transition-colors cursor-pointer ${
                  activeTab === "home" ? "text-emerald-700 font-bold" : "text-[#9C9590]"
                }`}
              >
                {activeTab === "home" && <div className="w-1 h-1 rounded-full bg-emerald-600 mb-0.5" />}
                <House className="w-5 h-5 animate-in zoom-in-95 duration-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">Home</span>
              </button>

              <button
                onClick={() => setActiveTab("about")}
                className={`flex flex-col items-center justify-center flex-grow py-1.5 transition-colors cursor-pointer ${
                  activeTab === "about" ? "text-emerald-700 font-bold" : "text-[#9C9590]"
                }`}
              >
                {activeTab === "about" && <div className="w-1 h-1 rounded-full bg-emerald-600 mb-0.5" />}
                <Info className="w-5 h-5 animate-in zoom-in-95 duration-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">About</span>
              </button>

              <button
                onClick={handleGoToJobs}
                className="flex flex-col items-center justify-center flex-grow py-1.5 transition-colors text-[#9C9590] cursor-pointer"
              >
                <Briefcase className="w-5 h-5 animate-in zoom-in-95 duration-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">Jobs</span>
              </button>

              <button
                onClick={() => setActiveTab("login")}
                className={`flex flex-col items-center justify-center flex-grow py-1.5 transition-colors cursor-pointer ${
                  activeTab === "login" ? "text-emerald-700 font-bold" : "text-[#9C9590]"
                }`}
              >
                {activeTab === "login" && <div className="w-1 h-1 rounded-full bg-emerald-600 mb-0.5" />}
                <Lock className="w-5 h-5 animate-in zoom-in-95 duration-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">Login</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab("home")}
                className={`flex flex-col items-center justify-center flex-grow py-1.5 transition-colors cursor-pointer ${
                  activeTab === "home" ? "text-emerald-700 font-bold" : "text-[#9C9590]"
                }`}
              >
                {activeTab === "home" && <div className="w-1 h-1 rounded-full bg-emerald-600 mb-0.5" />}
                <House className="w-5 h-5 animate-in zoom-in-95 duration-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">Home</span>
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex flex-col items-center justify-center flex-grow py-1.5 transition-colors cursor-pointer ${
                  activeTab === "dashboard" ? "text-emerald-700 font-bold" : "text-[#9C9590]"
                }`}
              >
                {activeTab === "dashboard" && <div className="w-1 h-1 rounded-full bg-emerald-600 mb-0.5" />}
                <LayoutDashboard className="w-5 h-5 animate-in zoom-in-95 duration-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex flex-col items-center justify-center flex-grow py-1.5 transition-colors cursor-pointer ${
                  activeTab === "settings" ? "text-emerald-700 font-bold" : "text-[#9C9590]"
                }`}
              >
                {activeTab === "settings" && <div className="w-1 h-1 rounded-full bg-emerald-600 mb-0.5" />}
                <Settings className="w-5 h-5 animate-in zoom-in-95 duration-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">Settings</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center flex-grow py-1.5 transition-colors text-[#9C9590] cursor-pointer"
              >
                <LogOut className="w-5 h-5 animate-in zoom-in-95 duration-200" />
                <span className="text-[10px] font-semibold uppercase tracking-wide mt-0.5">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Accessible Footer with Metadata Indicators */}
      <footer className="bg-slate-900 text-white border-t border-slate-850 py-8 text-xs font-sans">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Identity details */}
          <div className="text-center md:text-left space-y-1">
            <div className="flex justify-center md:justify-start items-center gap-1.5 font-bold">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>CARD MRI Mutually Reinforcing Institutions</span>
            </div>
            <p className="text-zinc-400 text-[11px] font-sans">
              Branch staffing automation, micro-loans coordination, and security ledger transparency.
            </p>
          </div>

          {/* Quick legal guidelines */}
          <div className="flex flex-wrap justify-center gap-4 text-[11px] text-zinc-400 font-mono">
            <span>© 2026 CARD Mutually Reinforcing Institutions</span>
            <span className="text-zinc-700">|</span>
            <span>Committed to building careers that transform Filipino lives.</span>
          </div>

        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
