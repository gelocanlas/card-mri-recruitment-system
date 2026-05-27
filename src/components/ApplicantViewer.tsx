import React, { useState } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Award, 
  Home as HomeIcon, 
  Users, 
  Calendar,
  CheckCircle2, 
  HelpCircle,
  FileText
} from "lucide-react";
import { JobPosting } from "../types";

interface ApplicantViewerProps {
  selectedGlimpseJob: JobPosting;
  onClose: () => void;
  onProceedToScreening: () => void;
}

export default function ApplicantViewer({
  selectedGlimpseJob,
  onClose,
  onProceedToScreening
}: ApplicantViewerProps) {
  const [currentSlidePage, setCurrentSlidePage] = useState(0);

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
              : []
          ).map((reqStr: string, index: number) => ({
            label: `Requirement ${index + 1}`,
            desc: reqStr
          }))
        },
        {
          title: "Are you ready to join us?",
          subtitle: "Engage your professional expertise to help us drive nationwide community banking.",
          type: "ready",
          actionText: "Proceed to Screening"
        }
      ];
    }
  };

  const slides = getGlimpseSlides(selectedGlimpseJob);
  const slide = slides[currentSlidePage] as any;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-end md:items-center justify-center md:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-t md:border border-slate-850/90 w-full h-full md:h-[82vh] max-w-4xl p-0 shadow-2xl rounded-t-3xl md:rounded-3xl overflow-hidden relative text-white flex flex-col md:flex-row max-h-screen md:max-h-[82vh]">
        
        {/* Requirement 7: Sharp standard close button strictly positioned in top-right corner containing clear "X" icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/90 hover:bg-rose-600 text-slate-100 hover:text-white transition duration-200 z-50 cursor-pointer border border-slate-700 shadow-md flex items-center justify-center w-10 h-10"
          title="Exit Viewer"
          id="btn-applicant-viewer-close"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Left Hand Card: Navigation & Progress Track */}
        <div className="w-full md:w-1/4 bg-slate-950/40 p-4 sm:p-5 border-b md:border-b-0 md:border-r border-slate-850 flex flex-col justify-between shrink-0">
          <div className="flex justify-between items-center md:items-start md:flex-col gap-3">
            <div className="space-y-1 block text-left">
              <span className="text-[10px] font-mono tracking-widest text-amber-500 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full uppercase font-bold">
                Job Preview
              </span>
              <h3 className="text-xs sm:text-sm font-black tracking-tight uppercase leading-snug pt-1 truncate max-w-[150px] sm:max-w-none text-white">
                {selectedGlimpseJob.title}
              </h3>
              <p className="text-xs text-zinc-400 font-mono hidden sm:block font-semibold">
                {selectedGlimpseJob.institution}
              </p>
            </div>

            {/* Vertical Progress Indicators of Slider Pages */}
            <div className="space-y-1.5 pt-4 text-left hidden md:block w-full">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlidePage(idx)}
                  className={`w-full text-left text-[11px] font-black py-1.5 px-2.5 rounded-lg transition duration-150 flex items-center gap-2 ${
                    currentSlidePage === idx 
                      ? "bg-emerald-800 text-white shadow-md border border-emerald-600/40" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-slate-800/30"
                  }`}
                >
                  <span className={`font-mono text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    currentSlidePage === idx ? "bg-white text-emerald-900 font-extrabold" : "bg-slate-805 bg-slate-800 text-slate-300"
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slide Counter Footer */}
          <div className="hidden md:flex pt-4 justify-between items-center text-xs text-zinc-400 font-mono border-t border-slate-850">
            <span className="font-bold uppercase tracking-wider text-[10px]">Page {currentSlidePage + 1} of {slides.length}</span>
          </div>
        </div>

        {/* Right Hand Card: Presentation Stage */}
        <div className="flex-1 p-6 md:p-10 flex flex-col justify-between overflow-y-auto bg-slate-900">
          
          {/* Main content body inside Slide */}
          <div className="flex-1 flex flex-col justify-center py-4 text-left">
            {(() => {
              if (!slide) return null;

              switch (slide.type) {
                case "cover":
                  return (
                    <div className="space-y-4 text-center">
                      <h1 className="text-2xl md:text-3xl font-black text-white uppercase font-display tracking-tight leading-normal pt-4">
                        {slide.title}
                      </h1>
                      <p className="text-xs md:text-sm text-zinc-300 font-sans tracking-wide max-w-lg mx-auto leading-relaxed">
                        {slide.subtitle}
                      </p>
                      <div className="w-16 h-1 bg-amber-400 mx-auto rounded-full my-6"></div>
                      <p className="text-[10px] text-emerald-400 uppercase font-mono tracking-widest font-extrabold">
                        CARD MRI CAREER ROADMAP PRESENTATION
                      </p>
                    </div>
                  );

                case "text-with-image":
                  return (
                    <div className="space-y-4 md:space-y-6">
                      <div className="space-y-1.5 text-left">
                        <span className="text-xs text-emerald-400 uppercase font-mono tracking-widest font-bold">{slide.subtitle}</span>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase font-display tracking-tight break-words">{slide.title}</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                        <p className="text-xs text-slate-200 leading-relaxed font-sans font-semibold antialiased text-left break-words overflow-wrap-anywhere whitespace-normal min-w-0">
                          {slide.desc}
                        </p>
                        {slide.imageUrl && (
                          <img 
                            src={slide.imageUrl} 
                            alt={slide.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-36 object-cover rounded-xl border border-slate-800 shadow p-1 bg-slate-950/60"
                          />
                        )}
                      </div>
                    </div>
                  );

                case "three-cards":
                  return (
                    <div className="space-y-4 md:space-y-6 text-left">
                      <h2 className="text-xl md:text-2xl font-black text-white uppercase font-display tracking-tight break-words">{slide.title}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {slide.cards?.map((card: any, i: number) => {
                          const IconComp = card.icon === "home" ? HomeIcon : card.icon === "users" ? Users : Calendar;
                          return (
                            <div key={i} className="bg-slate-955 bg-slate-950/30 border border-slate-800 rounded-xl p-4 text-left space-y-2 min-w-0">
                              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
                                <IconComp className="w-4 h-4 text-emerald-400" />
                                <h3 className="text-xs font-black text-amber-500 tracking-wider uppercase font-mono truncate">{card.title}</h3>
                              </div>
                              <p className="text-[11px] text-slate-205 text-slate-350 font-semibold leading-relaxed antialiased break-words whitespace-normal overflow-wrap-anywhere">{card.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );

                case "discipline":
                  return (
                    <div className="space-y-4 md:space-y-6 text-left">
                      <div className="space-y-1 text-left">
                        <span className="text-xs text-emerald-400 uppercase font-mono tracking-widest font-bold">{slide.subtitle}</span>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase font-display tracking-tight break-words">{slide.title}</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                        <div className="space-y-3 min-w-0">
                           <p className="text-zinc-300 font-semibold antialiased text-xs break-words">{slide.desc}</p>
                          <div className="space-y-2 text-xs text-slate-200 font-semibold antialiased">
                            {slide.bullets?.map((bull: string, i: number) => (
                              <div key={i} className="flex gap-2 items-start bg-slate-850/40 border border-slate-805 border-slate-800/60 p-3 px-4 rounded-xl">
                                <span className="text-emerald-400 font-bold shrink-0">✔</span>
                                <span className="text-[11px] break-words whitespace-normal overflow-wrap-anywhere">{bull}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {slide.imageUrl && (
                          <img 
                            src={slide.imageUrl} 
                            alt={slide.title} 
                            referrerPolicy="no-referrer"
                            className="w-full h-44 object-cover rounded-xl border border-slate-800 shadow"
                          />
                        )}
                      </div>
                    </div>
                  );

                case "tasks":
                  return (
                    <div className="space-y-4 text-left">
                      <h2 className="text-xl md:text-2xl font-black text-white uppercase font-display tracking-tight">{slide.title}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1.5 overflow-y-auto max-h-[38vh] pr-1">
                        {slide.items?.map((item: any, i: number) => (
                          <div key={i} className="bg-slate-955 bg-slate-950/40 border border-slate-800 p-3 rounded-xl flex items-start gap-2.5 min-w-0">
                            <span className="text-emerald-400 text-xs font-black shrink-0 font-mono mt-0.5">0{i+1}.</span>
                            <div className="text-left space-y-0.5 flex-1 min-w-0">
                              <span className="block text-xs font-black text-zinc-100 uppercase tracking-wide break-words whitespace-normal overflow-wrap-anywhere">{item.label}</span>
                              <p className="text-[11px] text-slate-350 font-medium leading-normal break-words whitespace-normal overflow-wrap-anywhere">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case "metrics":
                  return (
                    <div className="space-y-6 text-left">
                      <h2 className="text-xl md:text-2xl font-black text-white uppercase font-display tracking-tight">{slide.title}</h2>
                      <p className="text-xs text-slate-200 italic font-medium leading-relaxed max-w-2xl bg-slate-950/40 border-l-4 border-l-amber-400 p-4 rounded-r-xl break-words whitespace-normal overflow-wrap-anywhere">
                        {slide.desc}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        {slide.metrics?.map((m: any, idx: number) => (
                          <div key={idx} className="bg-slate-955 bg-slate-950/40 border border-dashed border-slate-800 p-4 rounded-xl min-w-0">
                            <span className="text-lg md:text-xl font-black text-amber-500 tracking-tight font-display break-words block">{m.value}</span>
                            <span className="block text-[10px] uppercase font-mono font-bold text-zinc-400 mt-1 truncate">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case "table":
                  return (
                    <div className="space-y-4 text-left">
                      <h2 className="text-xl md:text-2xl font-black text-white uppercase font-display tracking-tight mb-2">{slide.title}</h2>
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                        <table className="min-w-full divide-y divide-slate-800 text-left">
                          <thead className="bg-slate-955 bg-slate-950/60 text-xs font-mono text-zinc-400">
                            <tr>
                              <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Category Element</th>
                              <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Required Capability</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50 text-[11px] font-semibold text-slate-200">
                            {slide.rows?.map((row: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-850/40">
                                <td className="px-4 py-2 text-amber-500 uppercase font-mono text-xs">{row.category}</td>
                                <td className="px-4 py-2">{row.req}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );

                case "ready":
                  return (
                    <div className="space-y-6 text-center max-w-xl mx-auto py-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto border border-emerald-500/25 animate-pulse">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase font-display tracking-tight">{slide.title}</h2>
                        <p className="text-xs md:text-sm text-zinc-300 leading-relaxed font-semibold">
                          {slide.subtitle}
                        </p>
                      </div>
                      <button
                        id="btn-glimpse-proceed-screening"
                        onClick={onProceedToScreening}
                        className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-extrabold uppercase rounded-xl cursor-pointer shadow-lg tracking-wider border border-emerald-600 transition flex items-center gap-2 mx-auto text-xs min-h-[44px]"
                      >
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                        {slide.actionText}
                      </button>
                    </div>
                  );

                default:
                  return null;
              }
            })()}
          </div>

          {/* Bottom Slide Controller Bars */}
          <div className="pt-4 border-t border-slate-850/70 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => setCurrentSlidePage(prev => Math.max(0, prev - 1))}
              disabled={currentSlidePage === 0}
              className={`px-4 py-2 hover:bg-slate-800 active:scale-95 border rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[44px] ${
                currentSlidePage === 0 
                  ? "opacity-30 border-slate-800 text-zinc-600 cursor-not-allowed" 
                  : "border-slate-700 text-zinc-300"
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {/* Pagination Bullet Indicators */}
            <div className="flex gap-1.5 items-center justify-center">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlidePage(idx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlidePage === idx ? "w-6 bg-emerald-500" : "w-2 bg-slate-800 hover:bg-slate-700"
                  }`}
                  title={`Go to slide ${idx+1}`}
                />
              ))}
            </div>

            {currentSlidePage < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlidePage(prev => Math.min(slides.length - 1, prev + 1))}
                className="px-4 py-2 hover:bg-slate-800 active:scale-95 text-white border border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onProceedToScreening}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-md min-h-[44px]"
              >
                Apply Now <Sparkles className="w-3.5 h-3.5 text-white" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
