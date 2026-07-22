package com.signflow.signature.dto;

import java.util.List;

public record MultiSignaturePreviewRequest(
        List<SignaturePrepareRequest> signatures
) {
}