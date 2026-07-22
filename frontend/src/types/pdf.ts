export type PdfUploadResponse = {
  fileName: string;
  fileSize: number;
  pageCount: number;
  pdfVersion: number;
  title: string | null;
  author: string | null;
  producer: string | null;
  creator: string | null;
  sha256: string;
  status: string;
};