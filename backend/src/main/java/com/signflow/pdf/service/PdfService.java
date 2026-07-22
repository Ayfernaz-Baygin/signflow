package com.signflow.pdf.service;

import com.signflow.common.util.HashUtil;
import com.signflow.pdf.dto.PdfUploadResponse;
import com.signflow.pdf.storage.PdfStorageService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentInformation;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class PdfService {

    private final PdfStorageService pdfStorageService;

    public PdfService(
            PdfStorageService pdfStorageService
    ) {
        this.pdfStorageService = pdfStorageService;
    }

    public PdfUploadResponse upload(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Dosya boş olamaz."
            );
        }

        if (!"application/pdf".equalsIgnoreCase(
                file.getContentType()
        )) {
            throw new IllegalArgumentException(
                    "Sadece PDF dosyaları yüklenebilir."
            );
        }

        try {
            byte[] fileBytes = file.getBytes();

            try (PDDocument document =
                         Loader.loadPDF(fileBytes)) {

                int pageCount =
                        document.getNumberOfPages();

                float pdfVersion =
                        document.getVersion();

                PDDocumentInformation information =
                        document.getDocumentInformation();

                String title =
                        information.getTitle();

                String author =
                        information.getAuthor();

                String producer =
                        information.getProducer();

                String creator =
                        information.getCreator();

                String sha256 =
                        HashUtil.calculateSha256(
                                fileBytes
                        );

                /*
                 * PDF geçerli şekilde okunduktan sonra
                 * bellekte saklanır.
                 */
                pdfStorageService.save(fileBytes);

                return new PdfUploadResponse(
                        file.getOriginalFilename(),
                        file.getSize(),
                        pageCount,
                        pdfVersion,
                        title,
                        author,
                        producer,
                        creator,
                        sha256,
                        "READY_FOR_SIGNING"
                );
            }

        } catch (IOException e) {
            throw new IllegalArgumentException(
                    "PDF dosyası okunamadı veya geçerli bir PDF değil.",
                    e
            );
        }
    }
}