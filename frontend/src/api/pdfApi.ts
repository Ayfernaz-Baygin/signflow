import axios from 'axios';
import type { PdfUploadResponse } from '../types/pdf';
import type {
  SignatureValidationResponse,
} from '../types/validation';

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

export interface SignaturePrepareResponse {
  status: string;
  signatureLevel: string;
  digestAlgorithm: string;

  pageNumber: number;

  renderedX: number;
  renderedY: number;
  renderedWidth: number;
  renderedHeight: number;
  renderedPageWidth: number;
  renderedPageHeight: number;

  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  pdfPageWidth: number;
  pdfPageHeight: number;
}

export interface PdfSigningCoordinates {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
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

export async function prepareSignature(
  request: SignaturePrepareRequest,
): Promise<SignaturePrepareResponse> {
  const response =
    await api.post<SignaturePrepareResponse>(
      '/signature/prepare',
      request,
    );

  return response.data;
}

export async function signPdf(
  file: File,
  coordinates: PdfSigningCoordinates,
): Promise<Blob> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await api.post<Blob>(
    '/signature/sign',
    formData,
    {
      params: {
        page: coordinates.page,
        x: coordinates.x,
        y: coordinates.y,
        width: coordinates.width,
        height: coordinates.height,
      },
      responseType: 'blob',
    },
  );

  return response.data;
}

export interface MultiSignaturePreviewRequest {
  signatures: SignaturePrepareRequest[];
}

export async function previewMultipleSignatures(
  request: MultiSignaturePreviewRequest,
): Promise<Blob> {
  const response = await api.post<Blob>(
    '/signature/preview-multiple',
    request,
    {
      responseType: 'blob',
    },
  );

  return response.data;
}

export async function signMultiplePdf(
  file: File,
  coordinates: PdfSigningCoordinates[],
): Promise<Blob> {
  if (coordinates.length === 0) {
    throw new Error(
      'En az bir imza koordinatı gereklidir.',
    );
  }

  const formData = new FormData();

  formData.append('file', file);

  const request = {
    signatures: coordinates,
  };

  formData.append(
    'request',
    new Blob(
      [JSON.stringify(request)],
      {
        type: 'application/json',
      },
    ),
  );

  const response = await api.post<Blob>(
    '/signature/sign-multiple',
    formData,
    {
      responseType: 'blob',
    },
  );

  return response.data;
}

export async function validatePdfSignatures(
  file: File,
): Promise<SignatureValidationResponse> {
  const formData = new FormData();

  formData.append('file', file);

  const response =
    await api.post<SignatureValidationResponse>(
      '/signature/validate',
      formData,
    );

  return response.data;
}