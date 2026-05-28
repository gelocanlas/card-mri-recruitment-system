import React, { useState } from "react";
import { 
  Building2, 
  Sparkles, 
  User, 
  HelpCircle, 
  FileText, 
  Briefcase, 
  Settings, 
  LogOut, 
  Maximize2, 
  Layers,
  Menu,
  X,
  Home,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";

interface HeaderProps {
  currentUser: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  textSize: "normal" | "large";
  setTextSize: (size: "normal" | "large") => void;
}

export default function Header({
  currentUser,
  activeTab,
  setActiveTab,
  onLogout,
  textSize,
  setTextSize
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md text-slate-100 border-b border-slate-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Subtle bottom shadow gradient to avoid sharp transition */}
      <div className="absolute left-0 right-0 top-full h-3 bg-gradient-to-b from-slate-950/25 to-transparent pointer-events-none backdrop-blur-[1px]" />
      
      {/* Main Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 grid grid-cols-3 items-center gap-4">
        {/* Brand logo (left) */}
        <div 
          onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }} 
          className="flex items-center cursor-pointer select-none group transition-all duration-300 hover:scale-[1.02] hover:opacity-95 justify-self-start"
          id="brand_logo_header"
        >
          <img 
            src="/card_mri.png" 
            className="h-9 w-9 lg:h-12 lg:w-12 mr-3 lg:mr-4 hover:scale-105 transition-transform duration-300 object-contain block shrink-0" 
            alt="CARD MRI Logo"
          />
          <div className="block text-left">
            <h1 className="text-lg lg:text-xl font-black tracking-tight text-slate-100 group-hover:text-emerald-400 transition duration-150 uppercase leading-tight antialiased">
              CARD MRI
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-xs lg:text-sm text-slate-300 font-sans font-bold tracking-wider leading-snug">
                Career Portal
              </span>
            </div>
          </div>
        </div>

        {/* Central Nav Menu (center) */}
        <nav className="hidden md:flex items-center justify-center gap-1">
          <button
            onClick={() => setActiveTab("home")}
            className={`px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
              activeTab === "home" 
                ? "bg-slate-100 text-slate-900 shadow-sm" 
                : "text-slate-300 hover:text-white"
            }`}
            id="nav_home"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
          
          <button
            onClick={() => setActiveTab("about")}
            className={`px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
              activeTab === "about" 
                ? "bg-slate-100 text-slate-900 shadow-sm" 
                : "text-slate-300 hover:text-white"
            }`}
            id="nav_about"
          >
            <Info className="w-3.5 h-3.5" />
            About
          </button>

          {currentUser && (
            <>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                  activeTab === "dashboard" 
                    ? "bg-slate-100 text-slate-900 shadow-sm" 
                    : "text-slate-300 hover:text-white"
                }`}
                id="nav_dashboard"
              >
                <Layers className="w-3.5 h-3.5" />
                {currentUser.role === "it_admin" ? "IT Admin Portal" : "Recruitment Board"}
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`px-3 py-1.5 rounded-lg text-[11px] md:text-xs font-semibold transition-all duration-205 flex items-center gap-1 ${
                  activeTab === "settings" 
                    ? "bg-slate-100 text-slate-900 shadow-sm" 
                    : "text-slate-300 hover:text-white"
                }`}
                id="nav_settings"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </button>
            </>
          )}
        </nav>

        {/* User Identity and Log Options (right) */}
        <div className="hidden md:flex items-center justify-end gap-3">
          {currentUser && (
            <>
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold text-slate-100 leading-tight">
                  {currentUser.fullName}
                </p>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    currentUser.role === 'it_admin' 
                      ? 'bg-red-950/45 text-red-300 border-red-900/60' 
                      : 'bg-emerald-950/45 text-emerald-300 border-emerald-900/60'
                  }`}>
                    {currentUser.role === 'it_admin' ? 'IT Admin' : 'Recruiter'}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-slate-300 hover:text-red-300 transition rounded-xl border border-slate-800 bg-slate-950 hover:bg-red-950/45 hover:border-red-900/60 text-xs font-semibold cursor-pointer flex items-center gap-1"
                title="Securely log out of recruitment system"
                id="btn_logout_header"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </>
          )}
        </div>

        {/* Hamburger Toggle (visible on mobile < md) */}
        <div className="flex md:hidden justify-self-end">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-300 hover:bg-slate-800/80 rounded-xl border border-slate-800 focus:outline-none cursor-pointer duration-150 shrink-0"
            aria-label="Toggle navigation menu"
            id="mobile_menu_toggle"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-emerald-400" /> : <Menu className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Drawer Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/60 z-40 md:hidden" 
            onClick={() => setMobileMenuOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Mobile/Tablet Drawer (visible ONLY when hamburger is open and < md) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="md:hidden border-t border-slate-800 bg-slate-900 z-50 absolute left-0 right-0 top-full w-full font-sans shadow-inner text-slate-200 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              
              {/* Profile context block (Moved to the TOP of the drawer) */}
              {currentUser && (
                <div className="pb-3 border-b border-slate-800 flex flex-col gap-2 bg-slate-950 p-3.5 rounded-xl font-sans text-left">
                  <div className="space-y-2 text-left animate-in fade-in duration-200">
                    <div>
                      <p className="text-sm font-black text-slate-100 leading-tight">
                        {currentUser.fullName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono italic mt-0.5">{currentUser.email}</p>
                      <div className="mt-1 flex gap-1 items-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          currentUser.role === 'it_admin' 
                            ? 'bg-red-950/45 text-red-300 border-red-900/60' 
                            : 'bg-emerald-950/45 text-emerald-300 border-emerald-900/60'
                        }`}>
                          {currentUser.role === 'it_admin' ? 'IT Admin' : 'Recruiter'}
                        </span>
                        {currentUser.title && (
                          <span className="text-xs font-mono font-bold text-slate-400">· {currentUser.title}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                      className="w-full min-h-[44px] px-3 bg-red-950/45 text-red-300 hover:bg-red-900/60 transition rounded-xl border border-red-900/60 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Secure Logout
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Drawer navigation list: Categorized and highly readable */}
              <div className="space-y-4 text-left">
                <div>
                  <h4 className="text-[10px] font-mono font-bold tracking-widest text-[#9C9590] uppercase px-3 mb-2">Public Navigation</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab("home"); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition min-h-[44px] ${
                        activeTab === "home" ? "bg-slate-800 text-white border border-slate-700/60" : "text-slate-300 hover:bg-slate-800/50"
                      }`}
                    >
                      <Home className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Browse Career Opportunities
                    </button>
                    <button
                      onClick={() => { setActiveTab("about"); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition min-h-[44px] ${
                        activeTab === "about" ? "bg-slate-800 text-white border border-slate-700/60" : "text-slate-300 hover:bg-slate-800/50"
                      }`}
                    >
                      <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      About Institution & Branches
                    </button>
                  </div>
                </div>

                {currentUser && (
                  <div>
                    <h4 className="text-[10px] font-mono font-bold tracking-widest text-[#9C9590] uppercase px-3 mb-2">Staff Operations Board</h4>
                    <div className="space-y-1">
                      <button
                        onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition min-h-[44px] ${
                          activeTab === "dashboard" ? "bg-slate-800 text-white border border-slate-700/60" : "text-slate-300 hover:bg-slate-800/50"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {currentUser.role === "it_admin" ? "IT System Admin Board" : "Applicants & Recruitment Board"}
                      </button>
                      <button
                        onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
                        className={`w-full text-left px-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition min-h-[44px] ${
                          activeTab === "settings" ? "bg-slate-800 text-white border border-slate-700/60" : "text-slate-300 hover:bg-slate-800/50"
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        Portal Preferences & Editors
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
