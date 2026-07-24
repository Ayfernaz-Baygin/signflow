export interface ValidatedSignatureResponse {
  index: number;
  signerName: string | null;
  issuerName: string | null;
  serialNumber: string | null;

  signatureFormat: string | null;
  signatureLevel: string | null;
  digestAlgorithm: string | null;

  signingTime: string | null;
  certificateValidFrom: string | null;
  certificateValidUntil: string | null;

  signatureIntact: boolean;
  documentModifiedAfterSigning: boolean;
  trustedCertificateChain: boolean;

  indication: string | null;
  subIndication: string | null;
}

export interface SignatureValidationResponse {
  fileName: string;
  signatureCount: number;
  signed: boolean;
  documentValid: boolean;
  validationTime: string;
  signatures: ValidatedSignatureResponse[];
}