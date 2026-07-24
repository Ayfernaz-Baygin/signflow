package com.signflow.signature.dto;

import java.util.List;

public record MultipleSignatureRequest(
        List<SignatureCoordinateRequest> signatures
) {
}