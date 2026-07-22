package com.signflow.signature.model;

public record PdfSignatureCoordinates(
        int pageNumber,
        double x,
        double y,
        double width,
        double height,
        double pageWidth,
        double pageHeight
) {
}