package com.signflow.certificate.dto;

public record CertificateInfoResponse(
        String subject,
        String issuer,
        String algorithm
) {
}