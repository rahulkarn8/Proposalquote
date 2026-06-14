declare module 'svg-to-pdfkit' {
  import PDFDocument from 'pdfkit';
  function SVGtoPDF(
    doc: PDFDocument,
    svg: string,
    x: number,
    y: number,
    options?: { width?: number; height?: number; preserveAspectRatio?: string }
  ): void;
  export = SVGtoPDF;
}
