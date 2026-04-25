import type { Case } from '../types';

export function exportCasesToCSV(cases: Case[], filename = 'vakildesk_cases.csv') {
  const headers = [
    'Title',
    'Case Number',
    'Court',
    'Status',
    'Next Hearing Date',
    'Client Name',
    'Client Phone',
    'Total Fees (₹)',
    'Fees Paid (₹)',
    'Pending (₹)',
  ];

  const escapeCell = (value: string | number | undefined) => {
    const str = String(value ?? '');
    // Wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = cases.map(c => [
    escapeCell(c.title),
    escapeCell(c.caseNumber),
    escapeCell(c.court),
    escapeCell(c.status),
    escapeCell(c.nextHearingDate),
    escapeCell(c.clientName),
    escapeCell(c.clientPhone),
    escapeCell(c.totalFees),
    escapeCell(c.feesPaid),
    escapeCell(Math.max(0, c.totalFees - c.feesPaid)),
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
