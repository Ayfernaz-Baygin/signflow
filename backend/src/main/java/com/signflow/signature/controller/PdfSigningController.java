package com.signflow.signature.controller;

import com.signflow.signature.dto.MultipleSignatureRequest;
import com.signflow.signature.service.PdfSigningService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
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

        validatePdfFile(file);

        byte[] signedPdf =
                pdfSigningService.sign(
                        file.getBytes(),
                        page,
                        x,
                        y,
                        width,
                        height
                );

        return createPdfResponse(
                signedPdf,
                file.getOriginalFilename()
        );
    }

    @PostMapping(
            value = "/sign-multiple",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> signMultiplePdf(
            @RequestPart("file") MultipartFile file,
            @RequestPart("request")
            MultipleSignatureRequest request
    ) throws Exception {

        validatePdfFile(file);

        if (
                request == null ||
                request.signatures() == null ||
                request.signatures().isEmpty()
        ) {
            throw new IllegalArgumentException(
                    "En az bir imza alanı belirtilmelidir."
            );
        }

        byte[] signedPdf =
                pdfSigningService.signMultiple(
                        file.getBytes(),
                        request.signatures()
                );

        return createPdfResponse(
                signedPdf,
                file.getOriginalFilename()
        );
    }

    private void validatePdfFile(
            MultipartFile file
    ) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "İmzalanacak PDF dosyası boş olamaz."
            );
        }

        String contentType =
                file.getContentType();

        String originalFilename =
                file.getOriginalFilename();

        boolean hasPdfContentType =
                MediaType.APPLICATION_PDF_VALUE.equals(
                        contentType
                );

        boolean hasPdfExtension =
                originalFilename != null &&
                originalFilename
                        .toLowerCase()
                        .endsWith(".pdf");

        if (!hasPdfContentType && !hasPdfExtension) {
            throw new IllegalArgumentException(
                    "Yalnızca PDF dosyaları imzalanabilir."
            );
        }
    }

    private ResponseEntity<byte[]> createPdfResponse(
            byte[] signedPdf,
            String originalFilename
    ) {
        String signedFilename =
                createSignedFilename(
                        originalFilename
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
        if (
                originalFilename == null ||
                originalFilename.isBlank()
        ) {
            return "signed-document.pdf";
        }

        if (
                originalFilename
                        .toLowerCase()
                        .endsWith(".pdf")
        ) {
            return originalFilename.substring(
                    0,
                    originalFilename.length() - 4
            ) + "-signed.pdf";
        }

        return originalFilename + "-signed.pdf";
    }
}