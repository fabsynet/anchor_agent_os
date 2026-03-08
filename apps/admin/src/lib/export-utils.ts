/**
 * Export utilities for CSV and PDF generation.
 * Uses dynamic imports to avoid bundling heavy libraries upfront.
 */

export async function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
): Promise<void> {
  const Papa = (await import('papaparse')).default;
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export async function exportToPDF(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, 14, 20);

  // Timestamp
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 34,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // blue-600
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249], // slate-100
    },
  });

  doc.save(`${filename}.pdf`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
