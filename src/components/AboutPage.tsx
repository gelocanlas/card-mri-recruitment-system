import React, { useState, useEffect } from "react";
import { 
  Building, 
  HelpCircle, 
  Users, 
  Heart, 
  Award, 
  FileCheck, 
  MapPin, 
  ChevronRight,
  BookOpen,
  Sparkles,
  ShieldAlert
} from "lucide-react";
import { motion } from "motion/react";

interface AboutSettings {
  missionText: string;
  visionText: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  moralCompassValues?: { title: string; desc: string }[];
  legacyTimeline?: { year: string; title: string; desc: string }[];
  institutionBranches?: { badge: string; name: string; desc: string }[];
}

export default function AboutPage() {
  const [aboutInfo, setAboutInfo] = useState<AboutSettings>({
    missionText: "Established on December 10, 1986, CARD MRI began as a vision to create a banking institution operated and owned by landless, socioeconomically marginalized rural women in the Philippines. Driven by the philosophy of credit as a human right, it has blossomed into 23 mutually reinforcing institutions catering to millions of clients nationwide.\n\nThis digital hiring dashboard is specifically built to streamline personnel acquisition. It eliminates manual pipeline tracking, allowing micro-loans managers and executives to identify prime field candidates without procedural bottlenecks.",
    visionText: "Empowering landless citizens through mutually reinforcing efforts in micro-finance, technology development, and social enterprise.",
    contactAddress: "20 M. L. Quezon St., City of San Pablo, Laguna, Philippines",
    contactPhone: "+63 (2) 584-3333 extension line 403",
    contactEmail: "mri_recruitment@cardmri.com"
  });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch("/api/about-settings");
        if (res.ok) {
          const data = await res.json();
          setAboutInfo({
            missionText: data.missionText || aboutInfo.missionText,
            visionText: data.visionText || aboutInfo.visionText,
            contactAddress: data.contactAddress || aboutInfo.contactAddress,
            contactPhone: data.contactPhone || aboutInfo.contactPhone,
            contactEmail: data.contactEmail || aboutInfo.contactEmail,
            moralCompassValues: data.moralCompassValues || undefined,
            legacyTimeline: data.legacyTimeline || undefined,
            institutionBranches: data.institutionBranches || undefined
          });
        }
      } catch (err) {
        console.error("About info configuration fetch failure:", err);
      }
    };
    fetchInfo();
  }, []);

  const defaultValues = [
    {
      title: "Poverty Eradication",
      desc: "Providing holistic microdevelopment opportunities to microfinance clients to elevate their households out of poverty systematically.",
      icon: Heart,
      color: "text-rose-600 bg-rose-50 border-rose-100"
    },
    {
      title: "Stewardship & Integrity",
      desc: "Fostering absolute honesty and pristine handling of micro-loans, mutual funds, and candidate data security parameters.",
      icon: FileCheck,
      color: "text-emerald-700 bg-emerald-50 border-emerald-100"
    },
    {
      title: "Family Spirit & Competence",
      desc: "Nurturing professional capabilities and continuous growth through active encouragement and cooperative teamwork.",
      icon: Users,
      color: "text-blue-600 bg-blue-50 border-blue-105"
    }
  ];

  const valuesToRender = (aboutInfo.moralCompassValues && aboutInfo.moralCompassValues.length > 0)
    ? aboutInfo.moralCompassValues.map((v, i) => {
        const defaultMatch = defaultValues[i] || { icon: Heart, color: "text-rose-600 bg-rose-50 border-rose-100" };
        return {
          title: v.title,
          desc: v.desc,
          icon: defaultMatch.icon,
          color: defaultMatch.color
        };
      })
    : defaultValues;

  const defaultBranches = [
    { badge: "B", name: "CARD Bank, Inc.", desc: "A Microfinance-oriented Rural Bank" },
    { badge: "M", name: "CARD Mutual Benefit Association (CARD MBA)", desc: "Micro-insurance and security guarantees" },
    { badge: "S", name: "CARD SME Bank, Inc.", desc: "Thrift Bank for Small Medium Enterprises" },
    { badge: "H", name: "CARD Mutual Caring Health Services", desc: "CARD Medical Center" },
    { badge: "P", name: "CARD Pioneer Microinsurance Inc.", desc: "CPMI" },
    { badge: "I", name: "CARD MRI IT Mutual Benefit Association", desc: "Systems & Infrastructure Hub" }
  ];

  const branchesToRender = (aboutInfo.institutionBranches && aboutInfo.institutionBranches.length > 0)
    ? aboutInfo.institutionBranches
    : defaultBranches;

  const defaultMilestones = [
    {
      year: "1986",
      title: "CARD NGO Founded",
      desc: "Founded in San Pablo, Laguna, focusing on social development and establishing credit as a human right for socioeconomic upliftment."
    },
    {
      year: "1997",
      title: "CARD Bank Established",
      desc: "Established as a microfinance rural bank, providing marginalized women with proper savings and credit cooperatives."
    },
    {
      year: "2000",
      title: "CARD MBA Founded",
      desc: "Introduced the Mutual Benefit Association, extending essential micro-insurance, security guarantees, and retirement assets."
    },
    {
      year: "2008",
      title: "CARD MRI formally Established",
      desc: "Unified 7 cooperating institutions as the CARD Mutually Reinforcing Institutions (CARD MRI) for amplified community service."
    },
    {
      year: "2024",
      title: "Over 5 Million Families Empowered",
      desc: "Reached a major developmental milestone, actively empowering more than 5 million Filipino families nationwide with comprehensive social programs."
    }
  ];

  const milestonesToRender = (aboutInfo.legacyTimeline && aboutInfo.legacyTimeline.length > 0)
    ? aboutInfo.legacyTimeline
    : defaultMilestones;

  // Animation presets
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10 pb-16 font-sans select-none"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Refined Page Header */}
      <motion.div className="border-b border-slate-200/85 pb-4 text-left" variants={itemVariants}>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-700" />
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
            About CARD MRI & Our Mission
          </h1>
        </div>
        <p className="text-slate-500 text-xs mt-1 max-w-xl">
          {aboutInfo.visionText}
        </p>
      </motion.div>

      {/* Corporate profile bento split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        {/* Core Profile */}
        <div className="lg:col-span-2 space-y-6">
          <motion.section 
            className="bg-[#FDFCFA] rounded-[20px] border border-[rgba(26,23,20,0.08)] p-6 space-y-4 shadow-[0_2px_12px_rgba(26,23,20,0.04)]"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Corporate Background
              </h2>
            </div>
            <div className="text-xs text-slate-600 space-y-3.5 leading-relaxed whitespace-pre-line">
              {aboutInfo.missionText}
            </div>
          </motion.section>

          {/* Social Guidelines & Rules */}
          <motion.section 
            className="bg-slate-950 rounded-2xl p-6 text-white space-y-4 shadow-lg relative overflow-hidden"
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-950 to-slate-950 -z-0 pointer-events-none" />
            <div className="relative z-10 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-emerald-400">
                Operational Recruitment Guidelines
              </h2>
            </div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-[10.5px] font-display text-emerald-300 antialiased">1. Private Role Clearance</span>
                <p className="text-slate-200 text-[10.5px]/1.4 antialiased font-semibold">
                  Applicants are authorized to review only their self-submitted applications. Actions are isolated securely using row clearance.
                </p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-[10.5px] font-display text-emerald-300 antialiased">2. Managed PDF Compliance</span>
                <p className="text-slate-200 text-[10.5px]/1.4 antialiased font-semibold">
                  To protect server nodes, only clean PDF extensions are processed. Plaintext parsing runs securely via remote sandbox.
                </p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-[10.5px] font-display text-emerald-300 antialiased">3. Non-Repudiation Audit Log</span>
                <p className="text-slate-200 text-[10.5px]/1.4 antialiased font-semibold">
                  Stage transitions trigger state-stamped logs, allowing assessors to review historic application shifts with total transparency.
                </p>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1">
                <span className="font-bold text-[10.5px] font-display text-emerald-300 antialiased">4. Human-In-The-Loop AI</span>
                <p className="text-slate-200 text-[10.5px]/1.4 antialiased font-semibold">
                  Google Gemini guides recommendations based on merit. Final hiring clearances are subject to assessment by HR personnel.
                </p>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Side Column: Entities & Guide Alert */}
        <div className="space-y-6">
          <motion.section 
            className="bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] p-6 space-y-4 shadow-[0_2px_12px_rgba(26,23,20,0.04)]"
            variants={itemVariants}
          >
            <h3 className="text-xs font-bold text-[#1A1714] uppercase tracking-wider font-display border-b border-slate-100 pb-2.5">
              Participating Entities
            </h3>
            <ul className="space-y-3 text-[11px] font-medium text-[#6B6560] break-words">
              {branchesToRender.map((inst, index) => (
                <li key={inst.name} className="flex gap-2 items-start border-b border-slate-50 pb-2.5 last:border-0 last:pb-0 min-w-0">
                  <span className="text-emerald-700 font-bold font-mono shrink-0">
                    {inst.badge ? inst.badge : `0${index + 1}`}.
                  </span>
                  <span className="leading-relaxed break-words">
                    <strong className="text-[#1A1714]">{inst.name}</strong> — {inst.desc}
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* Dynamic Contact Box */}
          <motion.section 
            className="bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] p-6 space-y-4 shadow-[0_2px_12px_rgba(26,23,20,0.04)]"
            variants={itemVariants}
          >
            <h3 className="text-xs font-bold text-[#1A1714] uppercase tracking-wider font-display border-b border-slate-100 pb-2.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              Contact Information
            </h3>
            <div className="text-xs text-slate-600 space-y-3 leading-normal">
              <div>
                <span className="block text-[10px] uppercase font-mono tracking-wider font-black text-slate-400">Address</span>
                <span className="text-slate-800 font-semibold text-xs">{aboutInfo.contactAddress}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-mono tracking-wider font-black text-slate-400">Phone Hotline</span>
                <span className="text-slate-800 font-bold font-mono text-xs">{aboutInfo.contactPhone}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-mono tracking-wider font-black text-slate-400">General Recruitment Email</span>
                <span className="text-emerald-700 font-bold font-mono text-xs">
                  <a href={`mailto:${aboutInfo.contactEmail}`} className="hover:underline select-text">
                    {aboutInfo.contactEmail}
                  </a>
                </span>
              </div>
            </div>
          </motion.section>

          <motion.section 
            className="bg-gradient-to-tr from-emerald-800 to-teal-700 text-white rounded-2xl p-5 space-y-2.5 shadow-md relative overflow-hidden"
            variants={itemVariants}
          >
            <Sparkles className="absolute right-3 top-3 w-12 h-12 text-white/5 pointer-events-none" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-display">
              Have Technical Queries?
            </h4>
            <p className="text-[11px] text-emerald-100 leading-relaxed font-sans">
              Our IT Mutual Benefit systems managers are available to verify API issues or account parameters. Lodge a digital support ticket on the Support page.
            </p>
          </motion.section>
        </div>
      </div>

      {/* Corporate Values */}
      <motion.section className="space-y-6" variants={itemVariants}>
        <h2 className="text-center text-xs font-extrabold text-slate-900 uppercase tracking-widest font-display">
          Our Mutually Reinforcing Moral Compass
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {valuesToRender.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div 
                key={`${v.title}-${i}`} 
                className="bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] hover:border-emerald-600 rounded-[20px] p-6 shadow-[0_2px_12px_rgba(26,23,20,0.04)] space-y-3 transition-all hover:-translate-y-0.5 duration-200"
                whileHover={{ y: -3 }}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${v.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight font-display">{v.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{v.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Visual CARD MRI History Timeline Section */}
      <motion.section className="space-y-8 pt-8 border-t border-slate-200" variants={itemVariants}>
        <div className="text-center space-y-1.5 md:mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-emerald-800 font-mono">
            Our Legacy
          </h2>
          <h3 className="text-lg md:text-xl font-black uppercase text-slate-900 tracking-tight font-display text-center">
            Our Journey Through the Years
          </h3>
          <p className="text-slate-500 text-xs max-w-md mx-auto text-center">
            Review the major structural milestones since our inception that helped lift millions of families out of country poverty.
          </p>
        </div>

        {/* Timeline body wrapper */}
        <div className="relative before:absolute before:left-2 md:before:left-1/2 before:top-0 before:bottom-0 before:w-[1px] before:bg-slate-200 pl-6 md:pl-0 space-y-6 md:space-y-10 max-w-4xl mx-auto">
          {milestonesToRender.map((milestone, i) => {
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={`${milestone.year}-${i}`}
                variants={{
                  hidden: { opacity: 0, x: isLeft ? -16 : 16 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut" } }
                }}
                className={`relative md:flex md:justify-between items-center w-full font-sans ${
                  isLeft ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                {/* Visual node on timeline line */}
                <div className="absolute left-2 md:left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-emerald-600 border-2 border-white rounded-full z-10 shadow-sm" />

                {/* Left side Card */}
                <div className="w-full md:w-[46%] bg-[#FDFCFA] border border-[rgba(26,23,20,0.08)] rounded-[20px] p-5 hover:border-emerald-600 shadow-[0_2px_12px_rgba(26,23,20,0.04)] transition-all text-left">
                  <span className="text-xs font-black text-emerald-700 font-mono tracking-wide block mb-1">
                    {milestone.year}
                  </span>
                  <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider mb-1 font-display">
                    {milestone.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal font-sans">
                    {milestone.desc}
                  </p>
                </div>

                {/* Empty spot space divider for desktop alignment */}
                <div className="hidden md:block w-[46%]" />
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}
