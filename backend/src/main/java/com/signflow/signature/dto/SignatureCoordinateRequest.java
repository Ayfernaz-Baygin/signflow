package com.signflow.signature.dto;

public record SignatureCoordinateRequest(
        int page,
        float x,
        float y,
        float width,
        float height
) {
}