import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Admin panel color scheme
const ADMIN_COLORS = {
  primary: '#2563EB',
  background: '#F8FAFC',
  text: '#1E293B',
  border: '#E2E8F0',
  headerBg: '#EFF6FF',
  headerText: '#1E40AF',
} as const;

export interface PDFTableColumn {
  header: string;
  dataKey: string;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  columns: PDFTableColumn[];
  data: Record<string, any>[];
  fileName?: string;
}

export function exportToPDF(options: PDFExportOptions) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header section with admin panel colors
  doc.setFillColor(ADMIN_COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, 14, 25);

  // Subtitle
  if (options.subtitle) {
    doc.setTextColor(ADMIN_COLORS.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(options.subtitle, 14, 48);
  }

  // Date
  doc.setFontSize(8);
  doc.setTextColor(ADMIN_COLORS.text);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 48, { align: 'right' });

  // Table
  autoTable(doc, {
    startY: options.subtitle ? 55 : 50,
    head: [options.columns.map(col => col.header)],
    body: options.data.map(row => 
      options.columns.map(col => row[col.dataKey] || '')
    ),
    styles: {
      fontSize: 9,
      cellPadding: 8,
      lineColor: ADMIN_COLORS.border,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: ADMIN_COLORS.headerBg,
      textColor: ADMIN_COLORS.headerText,
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: ADMIN_COLORS.background,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
    margin: { top: 10, left: 14, right: 14, bottom: 20 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = options.fileName || `${options.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(fileName);
}
