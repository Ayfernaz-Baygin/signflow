package com.signflow.signature.dto;

public record SignaturePrepareResponse(
        String status,
        String signatureLevel,
        String digestAlgorithm,

        int pageNumber,

        double renderedX,
        double renderedY,
        double renderedWidth,
        double renderedHeight,
        double renderedPageWidth,
        double renderedPageHeight,

        double pdfX,
        double pdfY,
        double pdfWidth,
        double pdfHeight,
        double pdfPageWidth,
        double pdfPageHeight
) {
}