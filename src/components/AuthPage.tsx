import React, { useState } from "react";
import { 
  Lock, 
  Mail, 
  ShieldAlert, 
  ArrowRight,
  Eye,
  EyeOff,
  Building,
  AlertCircle,
  KeyRound,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../types";

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  setActiveTab: (tab: string) => void;
}

export default function AuthPage({ onLoginSuccess, setActiveTab }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password flow
  const [forgotStep, setForgotStep] = useState<"idle" | "email" | "done" | "reset">("idle");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginEmail.trim()) {
      setLoginError("Email address is strictly required.");
      return;
    }
    if (!emailRegex.test(loginEmail.trim())) {
      setLoginError("Security boundary: Email structure is invalid.");
      return;
    }
    if (!loginPassword) {
      setLoginError("Password is required to authenticate system access.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        const snippet = textResponse.length > 60 ? textResponse.substring(0, 60) + "..." : textResponse;
        throw new Error(`Server returned non-JSON response (${response.status}): ${snippet || "Empty body"}`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failure. Access Denied.");
      }
      onLoginSuccess(data.user);
      setActiveTab("dashboard");
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async () => {
    setForgotError("");
    setForgotMsg("");
    if (!forgotEmail.trim()) { setForgotError("Enter your email address."); return; }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForgotStep("done");
      setForgotMsg("If that email exists, a 6-digit code has been sent.");
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    setForgotError("");
    setForgotMsg("");
    if (!resetCode || resetCode.length !== 6) { setForgotError("Enter the 6-digit code sent to your email."); return; }
    if (!newPassword || newPassword.length < 6) { setForgotError("New password must be at least 6 characters."); return; }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), code: resetCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForgotStep("idle");
      setForgotEmail("");
      setResetCode("");
      setNewPassword("");
      setLoginEmail(forgotEmail.trim());
      setLoginError("Password reset successful. Log in with your new password.");
    } catch (err: any) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const cancelForgot = () => {
    setForgotStep("idle");
    setForgotEmail("");
    setResetCode("");
    setNewPassword("");
    setForgotError("");
    setForgotMsg("");
  };

  return (
    <div className="max-w-md mx-auto my-12 p-3 font-sans text-left relative">
      <div className="mb-6">
        <button
          onClick={() => setActiveTab("home")}
          className="text-xs font-bold text-slate-500 hover:text-emerald-700 hover:underline duration-150 flex items-center gap-1.5 cursor-pointer"
        >
          ← Back to Home
        </button>
      </div>

      <div className="bg-[#FDFCFA] rounded-[28px] border border-[rgba(26,23,20,0.08)] shadow-[0_8px_32px_-8px_rgba(26,23,20,0.12),0_2px_8px_-2px_rgba(26,23,20,0.06)] overflow-hidden">
        <div className="p-7 space-y-5">
          
          <div className="flex justify-center pt-2">
            <img src="/card_mri.png" className="h-14 w-auto object-contain" alt="CARD MRI Logo" />
          </div>

          {forgotStep === "idle" ? (
            <>
              <div className="text-center space-y-2">
                <h2 className="text-lg font-black text-[#1A1714] tracking-tight flex items-center justify-center gap-2 uppercase font-display">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  CMRI Employee Access
                </h2>
                <p className="text-[#6B6560] text-xs leading-relaxed max-w-xs mx-auto">
                  Strict Administrative Gateway. Authorized Recruiters and IT Administrators only.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-normal antialiased">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="font-semibold block">
                  This portal is for CARD MRI HR Staff only. <span className="block mt-0.5 text-[#6B6560] font-medium">Job applicants — please browse the Job Catalog on the Home page.</span>
                </p>
              </div>
              
              <AnimatePresence mode="wait">
                {loginError && (
                  <motion.div 
                    className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{loginError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-extrabold text-[#6B6560] uppercase tracking-wider">
                    Authorized Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-[rgba(26,23,20,0.14)] rounded-[12px] outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-700 text-[#1A1714] font-medium transition duration-200"
                      placeholder="e.g. employee@cardmri.com"
                      id="input_login_email"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-extrabold text-[#6B6560] uppercase tracking-wider">
                      Secure Access Code
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer font-display"
                    >
                      {showPassword ? (<><EyeOff className="w-3.5 h-3.5" /> Hide</>) : (<><Eye className="w-3.5 h-3.5" /> Show</>)}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-[rgba(26,23,20,0.14)] rounded-[12px] outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-700 text-[#1A1714] font-medium transition duration-200"
                      placeholder="Password or token"
                      id="input_login_password"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase rounded-[12px] transition-all duration-150 shadow-[0_2px_8px_-2px_rgba(5,150,105,0.4)] hover:shadow-[0_4px_16px_-4px_rgba(5,150,105,0.5)] flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-[0.98] font-display"
                    id="btn_submit_login"
                  >
                    {loading ? "Authenticating security..." : "Verify & Enter Ledger"}
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setForgotStep("email"); setForgotEmail(loginEmail); }}
                    className="w-full text-[10px] text-slate-500 hover:text-emerald-700 font-bold cursor-pointer text-center"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelForgot}
                className="text-xs font-bold text-slate-500 hover:text-emerald-700 duration-150 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
              </button>

              <div className="text-center space-y-2">
                <h2 className="text-lg font-black text-[#1A1714] tracking-tight flex items-center justify-center gap-2 uppercase font-display">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  Reset Password
                </h2>
              </div>

              <AnimatePresence mode="wait">
                {forgotError && (
                  <motion.div 
                    className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{forgotError}</span>
                  </motion.div>
                )}
                {forgotMsg && (
                  <motion.div 
                    className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <span>{forgotMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {forgotStep === "email" && (
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-extrabold text-[#6B6560] uppercase tracking-wider">
                      Your Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-[rgba(26,23,20,0.14)] rounded-[12px] outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-700 text-[#1A1714] font-medium transition duration-200"
                        placeholder="e.g. employee@cardmri.com"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={handleForgotRequest}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase rounded-[12px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Code"}
                    <Mail className="w-4 h-4 text-emerald-400" />
                  </button>
                </div>
              )}

              {forgotStep === "done" && (
                <div className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-extrabold text-[#6B6560] uppercase tracking-wider">
                      Reset Code (from email)
                    </label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full text-center text-lg tracking-[0.5em] font-bold pl-4 pr-4 py-3 bg-white border border-[rgba(26,23,20,0.14)] rounded-[12px] outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-700 text-[#1A1714] transition duration-200"
                      placeholder="000000"
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-extrabold text-[#6B6560] uppercase tracking-wider">
                        New Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {showNewPassword ? (<><EyeOff className="w-3.5 h-3.5" /> Hide</>) : (<><Eye className="w-3.5 h-3.5" /> Show</>)}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-[rgba(26,23,20,0.14)] rounded-[12px] outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-700 text-[#1A1714] font-medium transition duration-200"
                        placeholder="At least 6 characters"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={handleResetSubmit}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase rounded-[12px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={handleForgotRequest}
                    disabled={forgotLoading}
                    className="w-full text-[10px] text-slate-500 hover:text-emerald-700 font-bold cursor-pointer text-center"
                  >
                    Resend code
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
