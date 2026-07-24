package com.signflow.signature.dto;

import java.time.Instant;

public record ValidatedSignatureResponse(
        int index,
        String signerName,
        String issuerName,
        String serialNumber,
        String signatureFormat,
        String signatureLevel,
        String digestAlgorithm,
        Instant signingTime,
        Instant certificateValidFrom,
        Instant certificateValidUntil,
        boolean signatureIntact,
        boolean documentModifiedAfterSigning,
        boolean trustedCertificateChain,
        String indication,
        String subIndication
) {
}