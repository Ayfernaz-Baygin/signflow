package com.signflow.signature.service;

import com.signflow.signature.dto.SignatureValidationResponse;
import com.signflow.signature.dto.ValidatedSignatureResponse;
import com.signflow.signature.mapper.ValidatedSignatureMapper;
import eu.europa.esig.dss.diagnostic.DiagnosticData;
import eu.europa.esig.dss.model.DSSDocument;
import eu.europa.esig.dss.model.InMemoryDocument;
import eu.europa.esig.dss.simplereport.SimpleReport;
import eu.europa.esig.dss.spi.validation.CommonCertificateVerifier;
import eu.europa.esig.dss.validation.SignedDocumentValidator;
import eu.europa.esig.dss.validation.reports.Reports;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class SignatureValidationService {

    private final ValidatedSignatureMapper validatedSignatureMapper;

    public SignatureValidationService(
            ValidatedSignatureMapper validatedSignatureMapper
    ) {
        this.validatedSignatureMapper =
                validatedSignatureMapper;
    }

    public SignatureValidationResponse validate(
            String fileName,
            byte[] pdfBytes
    ) {
        validatePdf(pdfBytes);

        try {

            String normalizedFileName =
                    normalizeFileName(fileName);

            DSSDocument document =
                    new InMemoryDocument(
                            pdfBytes,
                            normalizedFileName
                    );

            SignedDocumentValidator documentValidator =
                    SignedDocumentValidator.fromDocument(
                            document
                    );

            CommonCertificateVerifier certificateVerifier =
                    new CommonCertificateVerifier();

            documentValidator.setCertificateVerifier(
                    certificateVerifier
            );

            documentValidator.setIncludeSemantics(true);

            Reports reports =
                    documentValidator.validateDocument();

            SimpleReport simpleReport =
                    reports.getSimpleReport();

            DiagnosticData diagnosticData =
                    reports.getDiagnosticData();

            List<String> signatureIds =
                    simpleReport.getSignatureIdList();

            if (signatureIds == null) {
                signatureIds = List.of();
            }

            List<ValidatedSignatureResponse> signatures =
                    validatedSignatureMapper.mapAll(
                            simpleReport,
                            diagnosticData,
                            signatureIds
                    );

            boolean signed =
                    !signatureIds.isEmpty();

            boolean documentValid =
                    signed
                            && signatureIds.stream()
                            .allMatch(simpleReport::isValid);

            return new SignatureValidationResponse(
                    normalizedFileName,
                    signatureIds.size(),
                    signed,
                    documentValid,
                    Instant.now(),
                    signatures
            );

        } catch (IllegalArgumentException exception) {
            throw exception;

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "PDF elektronik imzaları doğrulanamadı.",
                    exception
            );
        }
    }

    private void validatePdf(byte[] pdfBytes) {

        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException(
                    "Doğrulanacak PDF boş olamaz."
            );
        }
    }

    private String normalizeFileName(
            String fileName
    ) {

        if (fileName == null || fileName.isBlank()) {
            return "document.pdf";
        }

        return fileName;
    }
}