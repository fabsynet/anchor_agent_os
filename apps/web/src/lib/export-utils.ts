import Papa from 'papaparse';

/**
 * Export tabular data as a CSV file download.
 */
export async function exportToCsv(
  data: Record<string, unknown>[],
  filename: string,
): Promise<void> {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export tabular data as a PDF file download.
 * Uses dynamic imports to keep jsPDF out of the main bundle.
 */
export async function exportToPdf(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Generated date
  doc.setFontSize(10);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-CA')}`,
    14,
    28,
  );

  // Table
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 34,
    headStyles: { fillColor: [15, 23, 42] }, // slate-900
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
