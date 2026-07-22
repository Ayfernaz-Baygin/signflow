package com.signflow.signature.controller;

import com.signflow.pdf.storage.PdfStorageService;
import com.signflow.signature.dto.MultiSignaturePreviewRequest;
import com.signflow.signature.dto.SignaturePrepareRequest;
import com.signflow.signature.dto.SignaturePrepareResponse;
import com.signflow.signature.model.PdfSignatureCoordinates;
import com.signflow.signature.service.CoordinateConverter;
import com.signflow.signature.service.PadesService;
import com.signflow.signature.service.VisibleSignatureService;
import eu.europa.esig.dss.pades.PAdESSignatureParameters;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/signature")
public class SignatureController {

    private final PadesService padesService;
    private final CoordinateConverter coordinateConverter;
    private final PdfStorageService pdfStorageService;
    private final VisibleSignatureService visibleSignatureService;

    public SignatureController(
            PadesService padesService,
            CoordinateConverter coordinateConverter,
            PdfStorageService pdfStorageService,
            VisibleSignatureService visibleSignatureService
    ) {
        this.padesService = padesService;
        this.coordinateConverter = coordinateConverter;
        this.pdfStorageService = pdfStorageService;
        this.visibleSignatureService = visibleSignatureService;
    }

    @PostMapping("/prepare")
    public ResponseEntity<SignaturePrepareResponse> prepareSignature(
            @RequestBody SignaturePrepareRequest request
    ) throws IOException {

        PreparedSignatureContext context =
                prepareContext(request);

        PAdESSignatureParameters parameters =
                padesService.createParameters();

        PdfSignatureCoordinates coordinates =
                context.coordinates();

        SignaturePrepareResponse response =
                new SignaturePrepareResponse(
                        "PDF_COORDINATES_CALCULATED",
                        parameters.getSignatureLevel().name(),
                        parameters.getDigestAlgorithm().name(),
                        request.pageNumber(),
                        request.x(),
                        request.y(),
                        request.width(),
                        request.height(),
                        request.renderedPageWidth(),
                        request.renderedPageHeight(),
                        coordinates.x(),
                        coordinates.y(),
                        coordinates.width(),
                        coordinates.height(),
                        coordinates.pageWidth(),
                        coordinates.pageHeight()
                );

        return ResponseEntity.ok(response);
    }

    @PostMapping(
            value = "/preview",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> previewSignature(
            @RequestBody SignaturePrepareRequest request
    ) throws IOException {

        PreparedSignatureContext context =
                prepareContext(request);

        byte[] previewPdf =
                visibleSignatureService.createPreview(
                        context.pdfBytes(),
                        List.of(
                                new VisibleSignatureService
                                        .SignaturePlacement(
                                        request.pageNumber(),
                                        context.coordinates()
                                )
                        )
                );

        return pdfResponse(previewPdf);
    }

    @PostMapping(
            value = "/preview-multiple",
            produces = MediaType.APPLICATION_PDF_VALUE
    )
    public ResponseEntity<byte[]> previewMultipleSignatures(
            @RequestBody MultiSignaturePreviewRequest request
    ) throws IOException {

        if (request.signatures() == null
                || request.signatures().isEmpty()) {
            throw new IllegalArgumentException(
                    "En az bir imza alanı gönderilmelidir."
            );
        }

        byte[] pdfBytes = pdfStorageService.get();

        List<VisibleSignatureService.SignaturePlacement>
                placements = new ArrayList<>();

        for (SignaturePrepareRequest signature :
                request.signatures()) {

            PreparedSignatureContext context =
                    prepareContext(pdfBytes, signature);

            placements.add(
                    new VisibleSignatureService.SignaturePlacement(
                            signature.pageNumber(),
                            context.coordinates()
                    )
            );
        }

        byte[] previewPdf =
                visibleSignatureService.createPreview(
                        pdfBytes,
                        placements
                );

        return pdfResponse(previewPdf);
    }

    private ResponseEntity<byte[]> pdfResponse(
            byte[] pdfBytes
    ) {
        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"signflow-preview.pdf\""
                )
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    private PreparedSignatureContext prepareContext(
            SignaturePrepareRequest request
    ) throws IOException {
        return prepareContext(
                pdfStorageService.get(),
                request
        );
    }

    private PreparedSignatureContext prepareContext(
            byte[] pdfBytes,
            SignaturePrepareRequest request
    ) throws IOException {

        try (PDDocument document =
                     Loader.loadPDF(pdfBytes)) {

            validatePageNumber(
                    request.pageNumber(),
                    document.getNumberOfPages()
            );

            PDPage page =
                    document.getPage(
                            request.pageNumber() - 1
                    );

            int rotation =
                    normalizeRotation(
                            page.getRotation()
                    );

            if (rotation != 0) {
                throw new IllegalArgumentException(
                        "Döndürülmüş PDF sayfaları henüz desteklenmiyor. "
                                + "Sayfa dönüş açısı: "
                                + rotation
                );
            }

            PDRectangle cropBox =
                    page.getCropBox();

            PdfSignatureCoordinates coordinates =
                    coordinateConverter.convert(
                            request,
                            cropBox.getWidth(),
                            cropBox.getHeight()
                    );

            return new PreparedSignatureContext(
                    pdfBytes,
                    coordinates
            );
        }
    }

    private void validatePageNumber(
            int pageNumber,
            int totalPages
    ) {
        if (pageNumber < 1
                || pageNumber > totalPages) {
            throw new IllegalArgumentException(
                    "Geçersiz sayfa numarası. PDF toplam "
                            + totalPages
                            + " sayfadan oluşuyor."
            );
        }
    }

    private int normalizeRotation(int rotation) {
        int normalized = rotation % 360;

        if (normalized < 0) {
            normalized += 360;
        }

        return normalized;
    }

    private record PreparedSignatureContext(
            byte[] pdfBytes,
            PdfSignatureCoordinates coordinates
    ) {
    }
}