package com.signflow.pdf.controller;

import com.signflow.pdf.dto.PdfUploadResponse;
import com.signflow.pdf.service.PdfService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/pdf")
public class PdfController {

    private final PdfService pdfService;

    public PdfController(PdfService pdfService) {
        this.pdfService = pdfService;
    }

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public PdfUploadResponse uploadPdf(
            @RequestPart("file") MultipartFile file
    ) {
        return pdfService.upload(file);
    }
}