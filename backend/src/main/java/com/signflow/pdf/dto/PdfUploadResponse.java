package com.signflow.pdf.dto;

public record PdfUploadResponse(
        String fileName,
        long fileSize,
        int pageCount,
        float pdfVersion,
        String title,
        String author,
        String producer,
        String creator,
        String sha256,
        String status
) {
}