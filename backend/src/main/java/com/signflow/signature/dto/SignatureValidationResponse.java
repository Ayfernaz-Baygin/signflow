package com.signflow.signature.dto;

import java.time.Instant;
import java.util.List;

public record SignatureValidationResponse(
        String fileName,
        int signatureCount,
        boolean signed,
        boolean documentValid,
        Instant validationTime,
        List<ValidatedSignatureResponse> signatures
) {
}