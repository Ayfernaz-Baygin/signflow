package com.signflow.signature.mapper;

import com.signflow.signature.dto.ValidatedSignatureResponse;
import eu.europa.esig.dss.diagnostic.CertificateWrapper;
import eu.europa.esig.dss.diagnostic.DiagnosticData;
import eu.europa.esig.dss.diagnostic.SignatureWrapper;
import eu.europa.esig.dss.diagnostic.jaxb.XmlDigestMatcher;
import eu.europa.esig.dss.simplereport.SimpleReport;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Component
public class ValidatedSignatureMapper {

    public List<ValidatedSignatureResponse> mapAll(
            SimpleReport simpleReport,
            DiagnosticData diagnosticData,
            List<String> signatureIds
    ) {
        List<ValidatedSignatureResponse> responses =
                new ArrayList<>();

        for (int index = 0;
             index < signatureIds.size();
             index++) {

            String signatureId = signatureIds.get(index);

            ValidatedSignatureResponse response =
                    map(
                            index + 1,
                            signatureId,
                            simpleReport,
                            diagnosticData
                    );

            responses.add(response);
        }

        return responses;
    }

    private ValidatedSignatureResponse map(
            int index,
            String signatureId,
            SimpleReport simpleReport,
            DiagnosticData diagnosticData
    ) {
        SignatureWrapper signature =
                diagnosticData.getSignatureById(signatureId);

        CertificateWrapper certificate =
                signature == null
                        ? null
                        : signature.getSigningCertificate();

        String signatureFormat =
                valueAsString(
                        simpleReport.getSignatureFormat(signatureId)
                );

        String indication =
                valueAsString(
                        simpleReport.getIndication(signatureId)
                );

        String subIndication =
                valueAsString(
                        simpleReport.getSubIndication(signatureId)
                );

        return new ValidatedSignatureResponse(
                index,

                resolveSignerName(
                        simpleReport,
                        signature,
                        certificate,
                        signatureId
                ),

                certificate == null
                        ? null
                        : certificate.getCertificateIssuerDN(),

                certificate == null
                        ? null
                        : certificate.getSerialNumber(),

                signatureFormat,

                extractSignatureLevel(signatureFormat),

                resolveDigestAlgorithm(signature),

                toInstant(
                        simpleReport.getSigningTime(signatureId)
                ),

                certificate == null
                        ? null
                        : toInstant(certificate.getNotBefore()),

                certificate == null
                        ? null
                        : toInstant(certificate.getNotAfter()),

                isSignatureIntact(signature),

                signature != null
                        && signature.arePdfModificationsDetected(),

                certificate != null
                        && certificate.isTrusted(),

                indication,

                subIndication
        );
    }

    private String resolveSignerName(
            SimpleReport simpleReport,
            SignatureWrapper signature,
            CertificateWrapper certificate,
            String signatureId
    ) {
        String signedBy =
                simpleReport.getSignedBy(signatureId);

        if (signedBy != null && !signedBy.isBlank()) {
            return signedBy;
        }

        if (signature != null) {
            String signerName =
                    signature.getSignerName();

            if (signerName != null
                    && !signerName.isBlank()) {
                return signerName;
            }
        }

        if (certificate != null) {
            String certificateName =
                    certificate.getReadableCertificateName();

            if (certificateName != null
                    && !certificateName.isBlank()) {
                return certificateName;
            }
        }

        return null;
    }

    private String resolveDigestAlgorithm(
            SignatureWrapper signature
    ) {
        if (signature == null) {
            return null;
        }

        XmlDigestMatcher messageDigest =
                signature.getMessageDigest();

        if (messageDigest == null
                || messageDigest.getDigestMethod() == null) {
            return null;
        }

        return messageDigest
                .getDigestMethod()
                .toString();
    }

    private boolean isSignatureIntact(
            SignatureWrapper signature
    ) {
        if (signature == null) {
            return false;
        }

        XmlDigestMatcher messageDigest =
                signature.getMessageDigest();

        boolean digestIntact =
                messageDigest != null
                        && messageDigest.isDataFound()
                        && messageDigest.isDataIntact();

        boolean byteRangeValid =
                signature.isSignatureByteRangeValid();

        boolean dictionaryConsistent =
                signature.isPdfSignatureDictionaryConsistent();

        boolean baselineTechnicallyValid =
                signature.isBLevelTechnicallyValid();

        return digestIntact
                && byteRangeValid
                && dictionaryConsistent
                && baselineTechnicallyValid;
    }

    private Instant toInstant(Date date) {
        if (date == null) {
            return null;
        }

        return date.toInstant();
    }

    private String valueAsString(Object value) {
        if (value == null) {
            return null;
        }

        return value.toString();
    }

    private String extractSignatureLevel(
            String signatureFormat
    ) {
        if (signatureFormat == null
                || signatureFormat.isBlank()) {
            return null;
        }

        String normalizedFormat =
                signatureFormat.toUpperCase();

        if (normalizedFormat.contains("LTA")) {
            return "LTA";
        }

        if (normalizedFormat.contains("LT")) {
            return "LT";
        }

        if (normalizedFormat.contains("BASELINE_T")
                || normalizedFormat.endsWith("-T")) {
            return "T";
        }

        if (normalizedFormat.contains("BASELINE_B")
                || normalizedFormat.endsWith("-B")) {
            return "B";
        }

        return signatureFormat;
    }
}