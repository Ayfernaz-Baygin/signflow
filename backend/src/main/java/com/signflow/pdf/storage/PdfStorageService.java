package com.signflow.pdf.storage;

import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class PdfStorageService {

    private byte[] currentPdf;

    public synchronized void save(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException(
                    "PDF içeriği boş olamaz."
            );
        }

        currentPdf = Arrays.copyOf(
                pdfBytes,
                pdfBytes.length
        );
    }

    public synchronized byte[] get() {
        if (currentPdf == null) {
            throw new IllegalStateException(
                    "Önce bir PDF dosyası yüklenmelidir."
            );
        }

        return Arrays.copyOf(
                currentPdf,
                currentPdf.length
        );
    }

    public synchronized boolean exists() {
        return currentPdf != null;
    }

    public synchronized void clear() {
        currentPdf = null;
    }
}