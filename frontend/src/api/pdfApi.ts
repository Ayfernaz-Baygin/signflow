import axios from 'axios';
import type { PdfUploadResponse } from '../types/pdf';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

export interface SignaturePrepareRequest {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  renderedPageWidth: number;
  renderedPageHeight: number;
}

export interface MultiSignaturePreviewRequest {
  signatures: SignaturePrepareRequest[];
}

export async function uploadPdf(
  file: File,
): Promise<PdfUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<PdfUploadResponse>(
    '/pdf/upload',
    formData,
  );

  return response.data;
}

export async function previewMultipleSignatures(
  request: MultiSignaturePreviewRequest,
): Promise<Blob> {
  const response = await api.post(
    '/signature/preview-multiple',
    request,
    {
      responseType: 'blob',
    },
  );

  return response.data;
}