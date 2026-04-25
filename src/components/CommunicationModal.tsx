import { X, MessageCircle, FileText } from 'lucide-react';
import type { Case } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatHearingDate } from '../utils/dateFormat';

interface CommunicationModalProps {
  caseData: Case;
  onClose: () => void;
}

export function CommunicationModal({ caseData, onClose }: CommunicationModalProps) {
  const pendingFees = caseData.totalFees - caseData.feesPaid;
  const hasPendingFees = pendingFees > 0;

  const getWhatsAppLink = (message: string) => {
    const rawNumber = caseData.clientPhone?.replace(/[^0-9]/g, '') || '';
    const phone = rawNumber.length >= 10 ? rawNumber : '';
    const encodedMessage = encodeURIComponent(message);
    return phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
  };

  const handleHearingReminder = () => {
    const nameStr = caseData.clientName ? `Dear ${caseData.clientName},\n\n` : '';
    const message = `${nameStr}This is a reminder that your case "${caseData.title}" (${caseData.caseNumber}) is listed for hearing on ${formatHearingDate(caseData.nextHearingDate)} at ${caseData.court}.\n\nPlease be present or contact us if you have any questions.\n\nRegards,\nVakilDesk`;
    window.open(getWhatsAppLink(message), '_blank', 'noopener,noreferrer');
  };

  const handleFeeReminder = () => {
    if (!hasPendingFees) return;
    const nameStr = caseData.clientName ? `Dear ${caseData.clientName},\n\n` : '';
    const message = `${nameStr}This is to bring to your attention that an amount of ₹${pendingFees.toLocaleString('en-IN')} is pending for your case "${caseData.title}".\n\nPlease arrange for the settlement of these dues at your earliest convenience.\n\nTotal Fees: ₹${caseData.totalFees.toLocaleString('en-IN')}\nPaid: ₹${caseData.feesPaid.toLocaleString('en-IN')}\nPending: ₹${pendingFees.toLocaleString('en-IN')}\n\nRegards,\nVakilDesk`;
    window.open(getWhatsAppLink(message), '_blank', 'noopener,noreferrer');
  };

  const downloadInvoice = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175); // Blue 800
    doc.text('INVOICE / RECEIPT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 35, 196, 35);

    // Client Details
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Bill To:', 14, 45);
    doc.setFontSize(10);
    doc.text(`Client Name: ${caseData.clientName || 'N/A'}`, 14, 52);
    doc.text(`Phone: ${caseData.clientPhone || 'N/A'}`, 14, 58);

    // Case Details
    doc.setFontSize(12);
    doc.text('Case Details:', 120, 45);
    doc.setFontSize(10);
    doc.text(`Title: ${caseData.title}`, 120, 52);
    doc.text(`Case No: ${caseData.caseNumber}`, 120, 58);
    doc.text(`Court: ${caseData.court}`, 120, 64);

    // Financial Table
    autoTable(doc, {
      startY: 80,
      head: [['Description', 'Amount']],
      body: [
        ['Total Legal Fees', `Rs. ${caseData.totalFees.toLocaleString('en-IN')}`],
        ['Amount Paid', `Rs. ${caseData.feesPaid.toLocaleString('en-IN')}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { top: 10 },
    });

    // Summary Box
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    if (hasPendingFees) {
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`Balance Due: Rs. ${pendingFees.toLocaleString('en-IN')}`, 140, finalY + 15);
    } else {
      doc.setTextColor(22, 163, 74); // Green
      doc.text(`Status: FULLY PAID`, 140, finalY + 15);
    }

    // Save PDF
    doc.save(`Invoice_${caseData.caseNumber.replace(/\s/g, '_')}.pdf`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg glass-panel relative p-8 shadow-2xl shadow-blue-900/20 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>

        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <MessageCircle className="text-emerald-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Client Communication</h2>
            <p className="text-slate-400">Case: {caseData.title}</p>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {(!caseData.clientName || !caseData.clientPhone) && (
            <div className="p-3 mb-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-sm">
              <span className="font-semibold text-amber-400">Note:</span> Client name/phone is missing. WhatsApp messages will not be completely pre-filled with numbers.
            </div>
          )}

          {/* Hearing Reminder */}
          <div className="p-5 border border-slate-700/50 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-200 mb-1">Hearing Reminder</h3>
                <p className="text-sm text-slate-400">Send an automated reminder for the next listing date.</p>
              </div>
              <button
                onClick={handleHearingReminder}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/20 transition-all text-sm font-medium cursor-pointer shrink-0"
              >
                <MessageCircle size={16} />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Fee Reminder */}
          <div className={`p-5 border ${hasPendingFees ? 'border-amber-700/50' : 'border-slate-700/50'} rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-200">Financials</h3>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Due Amount</span>
                <p className={`font-bold ${hasPendingFees ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₹{pendingFees.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={handleFeeReminder}
                disabled={!hasPendingFees}
                className="flex-1 flex justify-center items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/20 disabled:shadow-none transition-all text-sm font-medium disabled:cursor-not-allowed cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>Remind Due</span>
              </button>
              
              <button
                onClick={downloadInvoice}
                className="flex-1 flex justify-center items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-blue-500/20 transition-all text-sm font-medium cursor-pointer"
              >
                <FileText size={16} />
                <span>Invoice PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
