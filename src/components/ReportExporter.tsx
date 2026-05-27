import React from "react";
import { X, FileText } from "lucide-react";
import { JobApplication } from "../types";

interface ReportExporterProps {
  isOpen: boolean;
  onClose: () => void;
  totalApps: number;
  hiredCount: number;
  endorsedCount: number;
  rejectedCount: number;
  applications: JobApplication[];
  institutionsLookup: string[];
  hrInchargesLookup: string[];
}

export default function ReportExporter({
  isOpen,
  onClose,
  totalApps,
  hiredCount,
  endorsedCount,
  rejectedCount,
  applications,
  institutionsLookup,
  hrInchargesLookup
}: ReportExporterProps) {
  const handlePrint = () => {
    // Hidden printing iframe extraction
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const content = document.querySelector(".report-pdf-modal")?.innerHTML || "";
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CARD MRI Recruitment Systems Audit Report</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 25px;
              padding: 0;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .border-b-4 { border-bottom: 4px solid #065f46; }
            .pb-4 { padding-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .flex { display: flex; }
            .flex-col { flex-direction: column; }
            .justify-between { justify-content: space-between; }
            .items-end { align-items: flex-end; }
            .text-right { text-align: right; }
            .grid { display: grid; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
            .gap-6 { gap: 1.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            .text-xs { font-size: 11px; }
            .text-sm { font-size: 13px; }
            .font-mono { font-family: 'JetBrains Mono', monospace; }
            .font-black { font-weight: 900; }
            .font-extrabold { font-weight: 800; }
            .uppercase { text-transform: uppercase; }
            .text-emerald-800 { color: #065f46; }
            .text-slate-900 { color: #0f172a; }
            .text-slate-500 { color: #64748b; }
            .text-slate-800 { color: #1e293b; }
            .border { border: 1px solid #e2e8f0; }
            .border-slate-300 { border-color: #cbd5e1; }
            .px-2.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .bg-slate-50 { background-color: #f8fafc; }
            .rounded { border-radius: 0.25rem; }
            .block { display: block; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-0.5 { margin-top: 0.125rem; }
            .tracking-tight { letter-spacing: -0.025em; }
            .tracking-widest { letter-spacing: 0.1em; }
            
            @media (min-width: 768px) {
              .md\\:flex-row { flex-direction: row; }
              .md\\:justify-between { justify-content: space-between; }
              .md\\:items-end { align-items: flex-end; }
              .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }

            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 8px 10px; border-bottom: 1px solid #edf2f7; text-align: left; }
            th { background-color: #f7fafc; font-size: 9px; color: #4a5568; font-weight: bold; text-transform: uppercase; }
            .bg-slate-50 { background-color: #f8fafc; }
            .rounded-xl { border-radius: 0.5rem; }
            .p-3 { padding: 12px; }
            .bg-white { background-color: #ffffff; }
            .divide-y > * + * { border-top: 1px solid #edf2f7; }
            .divide-slate-100 > * + * { border-top: 1px solid #f7fafc; }
            .break-words { overflow-wrap: break-word; }
            .text-emerald-700 { color: #047857; }
            .text-indigo-700 { color: #4338ca; }
            .text-rose-800 { color: #991b1b; }
            .text-slate-950 { color: #020617; }
            
            .print\\:hidden, #close_report_modal_btn, #print_pdf_report_btn, #close_report_secondary_btn {
              display: none !important;
            }
            .max-h-\\[150px\\] { max-height: none !important; overflow: visible !important; }
            .overflow-y-auto { overflow: visible !important; }

            .mb-6 { margin-bottom: 1.5rem; }
            .mt-8 { margin-top: 2rem; }
            .pt-6 { padding-top: 1.5rem; }
            .border-t { border-top: 1px solid #e2e8f0; }
            
            .flex-grow { flex-grow: 1; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .border-b { border-bottom: 1px solid #edf2f7; }
            .pb-1 { padding-bottom: 0.25rem; }
            .mb-1 { margin-bottom: 0.25rem; }
            .mr-auto { margin-right: auto; }
            .pr-2 { padding-right: 0.5rem; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 350);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-pdf-backdrop fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end md:items-center justify-center md:p-4 z-50 animate-in fade-in duration-200">
      <div className="report-pdf-modal bg-white rounded-t-3xl md:rounded-3xl border border-slate-300 w-full max-w-4xl p-5 md:p-8 shadow-2xl relative text-left h-[95vh] md:h-auto md:max-h-[92vh] overflow-y-auto print:p-0 select-text flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer print:hidden min-w-[44px] min-h-[44px] flex items-center justify-center z-20"
          id="close_report_modal_btn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Official Report Header Banner */}
        <div className="border-b-4 border-emerald-800 pb-4 mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-emerald-800 uppercase font-black leading-tight block">
              CARD Mutually Reinforcing Institutions
            </span>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight font-display mt-1">
              HR Recruitment Systems Audit Report
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Report Compilation: {new Date().toLocaleDateString()} · MS. AILEN ENTERO · SECURE DATA LINK
            </p>
          </div>
          <div className="text-right text-[10px] font-mono shrink-0">
            <span className="block border border-slate-300 px-2.5 py-1 bg-slate-50 text-slate-800 font-extrabold uppercase rounded">
              STATUS CORES: VALIDATED
            </span>
          </div>
        </div>

        {/* Unambiguous Grid/Flex layout with explicit auto-wrap and safe bounding boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-800">
          
          {/* Left Column: Metrics & Funnel Pipeline */}
          <div className="space-y-4 pr-1">
            <h3 className="text-[10px] font-extrabold uppercase text-slate-700 font-mono tracking-widest border-b pb-1.5">
              Recruitment Funnel Pipeline Dashboard
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-205 rounded-xl block leading-snug">
                <span className="text-[8.5px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Total Registrations</span>
                <span className="text-base font-black text-slate-900 block mt-1">{totalApps} applicants</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-205 rounded-xl block leading-snug">
                <span className="text-[8.5px] font-mono text-slate-505 uppercase font-bold tracking-wider block">Sealed/Contract Hired</span>
                <span className="text-base font-black text-emerald-700 block mt-1">{hiredCount} staff</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-205 rounded-xl block leading-snug">
                <span className="text-[8.5px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Endorsed to Institutions</span>
                <span className="text-base font-black text-indigo-700 block mt-1">{endorsedCount} assigned</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-205 rounded-xl block leading-snug">
                <span className="text-[8.5px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Audited/Rejected</span>
                <span className="text-base font-black text-rose-800 block mt-1">{rejectedCount} filings</span>
              </div>
            </div>

            {/* Status Breakdown Table with Clean spacing & auto-wrap table cells */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[9.5px] font-extrabold uppercase text-slate-650 font-mono block">
                Queue Pipeline Segment Distribution
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-[10px] bg-white">
                <table className="min-w-full divide-y bg-white text-left table-fixed">
                  <colgroup>
                    <col className="w-2/3" />
                    <col className="w-1/3" />
                  </colgroup>
                  <thead className="bg-slate-50 font-mono text-[8px] text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 font-bold uppercase truncate">Recruitment State Status</th>
                      <th className="px-3 py-2 font-bold uppercase text-right truncate">Headcounts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {["New", "Acknowledge", "Passed Screening", "Already Endorsed", "Hired", "Rejected", "Rejected (With Relatives)"].map(st => {
                      const count = applications.filter(a => a.status === st).length;
                      return (
                        <tr key={st} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2 break-words leading-relaxed">{st}</td>
                          <td className="px-3 py-2 text-right font-black text-slate-950 leading-relaxed font-mono whitespace-nowrap">{count} candidates</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Placements & Workloads */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-extrabold uppercase text-slate-700 font-mono tracking-widest border-b pb-1.5">
              Division Placements & Staff Workloads
            </h3>
            
            {/* Institution Placement Metrics with unambiguous wrapping */}
            <div className="space-y-1.5">
              <span className="text-[9.5px] font-extrabold uppercase text-slate-650 font-mono block">
                Top Placement Endorsed Institutions
              </span>
              <div className="p-3 bg-slate-50 border border-slate-205 rounded-xl font-mono text-[9.5px]/1.5 max-h-[150px] overflow-y-auto block space-y-1 scrollbar-thin">
                {institutionsLookup.map(inst => {
                  const count = applications.filter(a => a.endorsedTo === inst).length;
                  if (count === 0) return null;
                  return (
                    <div key={inst} className="flex justify-between items-start border-b border-slate-200/55 pb-1 mb-1 leading-normal">
                      <span className="break-words text-slate-700 pr-2 mr-auto">{inst}</span>
                      <strong className="text-slate-950 font-extrabold font-mono shrink-0 text-right">{count} staff</strong>
                    </div>
                  );
                })}
                {applications.filter(a => a.endorsedTo).length === 0 && (
                  <div className="text-slate-450 font-bold text-center py-4 text-[10px]">
                    No placements or endorsements logged yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recruiter work status allocations */}
            <div className="space-y-1.5">
              <span className="text-[9.5px] font-extrabold uppercase text-slate-650 font-mono block">
                Representative In-Charge Allocations
              </span>
              <div className="p-3 bg-slate-50 border border-slate-205 rounded-xl font-mono text-[9.5px]/1.5 max-h-[150px] overflow-y-auto block space-y-1 scrollbar-thin">
                {hrInchargesLookup.map(person => {
                  const count = applications.filter(a => a.hrIncharge === person).length;
                  if (count === 0) return null;
                  return (
                    <div key={person} className="flex justify-between items-start border-b border-slate-200/55 pb-1 mb-1 leading-normal">
                      <span className="break-words text-slate-700 pr-2 mr-auto">{person}</span>
                      <strong className="text-slate-950 font-extrabold font-mono shrink-0 text-right">{count} assigned</strong>
                    </div>
                  );
                })}
                {applications.filter(a => a.hrIncharge).length === 0 && (
                  <div className="text-slate-450 font-bold text-center py-4 text-[10px]">
                    No staffing assignments recorded.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Official Footer Affirmation Signature */}
        <div className="border-t border-slate-200 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-[9.5px] font-mono text-slate-550 leading-relaxed">
          <div className="max-w-md">
            <span className="block font-black text-slate-800 text-[10px] uppercase">
              CARD RECRUITMENT SECURITY DATABASE ACCESS REGISTER
            </span>
            <p className="mt-0.5">
              This document serves as an authentic certified candidate stream. Restrict dissemination under strict CARD MRI corporate governance protocols.
            </p>
          </div>
          <div className="text-right shrink-0 print:hidden flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-4.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 duration-150 text-xs tracking-tight"
              id="print_pdf_report_btn"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              Print PDF
            </button>
            <button
              onClick={onClose}
              className="px-4.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 font-bold uppercase rounded-xl cursor-pointer text-xs"
              id="close_report_secondary_btn"
            >
              Close Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
