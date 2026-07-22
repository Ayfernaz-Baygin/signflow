package com.signflow.signature.dto;

public record SignaturePrepareRequest(
        int pageNumber,
        double x,
        double y,
        double width,
        double height,
        double renderedPageWidth,
        double renderedPageHeight
) {
}