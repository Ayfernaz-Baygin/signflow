package com.signflow.signature.controller;

import com.signflow.signature.service.PdfSigningService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/signature")
public class PdfSigningController {

    private final PdfSigningService pdfSigningService;

    public PdfSigningController(
            PdfSigningService pdfSigningService
    ) {
        this.pdfSigningService = pdfSigningService;
    }

    @PostMapping(
            value = "/sign",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> signPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("page") int page,
            @RequestParam("x") float x,
            @RequestParam("y") float y,
            @RequestParam("width") float width,
            @RequestParam("height") float height
    ) throws Exception {

        if (file.isEmpty()) {
            throw new IllegalArgumentException(
                    "İmzalanacak PDF dosyası boş olamaz."
            );
        }

        if (!MediaType.APPLICATION_PDF_VALUE.equals(
                file.getContentType()
        )) {
            throw new IllegalArgumentException(
                    "Yalnızca PDF dosyaları imzalanabilir."
            );
        }

        byte[] signedPdf =
                pdfSigningService.sign(
                        file.getBytes(),
                        page,
                        x,
                        y,
                        width,
                        height
                );

        String signedFilename =
                createSignedFilename(
                        file.getOriginalFilename()
                );

        HttpHeaders headers =
                new HttpHeaders();

        headers.setContentType(
                MediaType.APPLICATION_PDF
        );

        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename(signedFilename)
                        .build()
        );

        headers.setContentLength(
                signedPdf.length
        );

        return ResponseEntity
                .ok()
                .headers(headers)
                .body(signedPdf);
    }

    private String createSignedFilename(
            String originalFilename
    ) {
        if (originalFilename == null ||
                originalFilename.isBlank()) {

            return "signed-document.pdf";
        }

        if (originalFilename
                .toLowerCase()
                .endsWith(".pdf")) {

            return originalFilename.substring(
                    0,
                    originalFilename.length() - 4
            ) + "-signed.pdf";
        }

        return originalFilename + "-signed.pdf";
    }
}