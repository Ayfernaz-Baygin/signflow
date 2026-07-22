package com.signflow.signature.service;

import com.signflow.signature.dto.SignaturePrepareRequest;
import com.signflow.signature.model.PdfSignatureCoordinates;
import org.springframework.stereotype.Service;

@Service
public class CoordinateConverter {

    public PdfSignatureCoordinates convert(
            SignaturePrepareRequest request,
            double pdfPageWidth,
            double pdfPageHeight
    ) {
        validateRequest(request);

        double scaleX =
                pdfPageWidth / request.renderedPageWidth();

        double scaleY =
                pdfPageHeight / request.renderedPageHeight();

        double pdfX =
                request.x() * scaleX;

        double pdfWidth =
                request.width() * scaleX;

        double pdfHeight =
                request.height() * scaleY;

        /*
         * React/PDF.js:
         * Koordinat başlangıcı sol üst köşedir.
         *
         * PDF:
         * Koordinat başlangıcı sol alt köşedir.
         */
        double pdfY =
                pdfPageHeight
                        - ((request.y() + request.height()) * scaleY);

        validateConvertedCoordinates(
                pdfX,
                pdfY,
                pdfWidth,
                pdfHeight,
                pdfPageWidth,
                pdfPageHeight
        );

        return new PdfSignatureCoordinates(
                request.pageNumber(),
                pdfX,
                pdfY,
                pdfWidth,
                pdfHeight,
                pdfPageWidth,
                pdfPageHeight
        );
    }

    private void validateRequest(SignaturePrepareRequest request) {
        if (request.pageNumber() < 1) {
            throw new IllegalArgumentException(
                    "Sayfa numarası 1 veya daha büyük olmalıdır."
            );
        }

        if (request.renderedPageWidth() <= 0
                || request.renderedPageHeight() <= 0) {
            throw new IllegalArgumentException(
                    "Render edilmiş sayfa ölçüleri sıfırdan büyük olmalıdır."
            );
        }

        if (request.width() <= 0 || request.height() <= 0) {
            throw new IllegalArgumentException(
                    "İmza alanının genişliği ve yüksekliği sıfırdan büyük olmalıdır."
            );
        }

        if (request.x() < 0 || request.y() < 0) {
            throw new IllegalArgumentException(
                    "İmza alanı koordinatları negatif olamaz."
            );
        }

        if (request.x() + request.width()
                > request.renderedPageWidth()) {
            throw new IllegalArgumentException(
                    "İmza alanı sayfanın sağ sınırını aşıyor."
            );
        }

        if (request.y() + request.height()
                > request.renderedPageHeight()) {
            throw new IllegalArgumentException(
                    "İmza alanı sayfanın alt sınırını aşıyor."
            );
        }
    }

    private void validateConvertedCoordinates(
            double x,
            double y,
            double width,
            double height,
            double pageWidth,
            double pageHeight
    ) {
        if (x < 0 || y < 0) {
            throw new IllegalArgumentException(
                    "Dönüştürülen PDF koordinatları negatif olamaz."
            );
        }

        if (x + width > pageWidth) {
            throw new IllegalArgumentException(
                    "Dönüştürülen imza alanı PDF sayfasının sağ sınırını aşıyor."
            );
        }

        if (y + height > pageHeight) {
            throw new IllegalArgumentException(
                    "Dönüştürülen imza alanı PDF sayfasının üst sınırını aşıyor."
            );
        }
    }
}