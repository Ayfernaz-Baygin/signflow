package com.signflow.signature.service;

import com.signflow.signature.model.PdfSignatureCoordinates;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class VisibleSignatureService {

    private static final float PADDING = 8F;

    public byte[] createPreview(
            byte[] pdfBytes,
            List<SignaturePlacement> placements
    ) throws IOException {

        if (placements == null || placements.isEmpty()) {
            throw new IllegalArgumentException(
                    "En az bir imza alanı gereklidir."
            );
        }

        try (PDDocument document =
                     Loader.loadPDF(pdfBytes);
             ByteArrayOutputStream output =
                     new ByteArrayOutputStream()) {

            PDType1Font boldFont =
                    new PDType1Font(
                            Standard14Fonts.FontName
                                    .HELVETICA_BOLD
                    );

            PDType1Font regularFont =
                    new PDType1Font(
                            Standard14Fonts.FontName
                                    .HELVETICA
                    );

            for (int index = 0;
                 index < placements.size();
                 index++) {

                SignaturePlacement placement =
                        placements.get(index);

                PDPage page =
                        document.getPage(
                                placement.pageNumber() - 1
                        );

                PdfSignatureCoordinates coordinates =
                        placement.coordinates();

                drawSignatureBox(
                        document,
                        page,
                        coordinates,
                        index + 1,
                        boldFont,
                        regularFont
                );
            }

            document.save(output);
            return output.toByteArray();
        }
    }

    private void drawSignatureBox(
            PDDocument document,
            PDPage page,
            PdfSignatureCoordinates coordinates,
            int signatureNumber,
            PDType1Font boldFont,
            PDType1Font regularFont
    ) throws IOException {

        float x = (float) coordinates.x();
        float y = (float) coordinates.y();
        float width = (float) coordinates.width();
        float height = (float) coordinates.height();

        validateBox(width, height);

        float titleSize =
                Math.max(
                        7F,
                        Math.min(11F, height / 8F)
                );

        float textSize =
                Math.max(
                        6F,
                        Math.min(8.5F, height / 11F)
                );

        try (PDPageContentStream contentStream =
                     new PDPageContentStream(
                             document,
                             page,
                             PDPageContentStream
                                     .AppendMode.APPEND,
                             true,
                             true
                     )) {

            contentStream.setNonStrokingColor(
                    242F / 255F,
                    246F / 255F,
                    255F / 255F
            );

            contentStream.addRect(
                    x,
                    y,
                    width,
                    height
            );
            contentStream.fill();

            contentStream.setStrokingColor(
                    25F / 255F,
                    75F / 255F,
                    170F / 255F
            );
            contentStream.setLineWidth(1.3F);
            contentStream.addRect(
                    x,
                    y,
                    width,
                    height
            );
            contentStream.stroke();

            contentStream.setNonStrokingColor(
                    25F / 255F,
                    75F / 255F,
                    170F / 255F
            );

            writeText(
                    contentStream,
                    boldFont,
                    titleSize,
                    x + PADDING,
                    y + height - 17F,
                    "SIGNATURE " + signatureNumber
            );

            contentStream.setStrokingColor(
                    180F / 255F,
                    190F / 255F,
                    210F / 255F
            );
            contentStream.setLineWidth(0.6F);
            contentStream.moveTo(
                    x + PADDING,
                    y + height - 24F
            );
            contentStream.lineTo(
                    x + width - PADDING,
                    y + height - 24F
            );
            contentStream.stroke();

            contentStream.setNonStrokingColor(
                    35F / 255F,
                    35F / 255F,
                    35F / 255F
            );

            writeText(
                    contentStream,
                    boldFont,
                    textSize,
                    x + PADDING,
                    y + height - 38F,
                    "Signer"
            );

            writeText(
                    contentStream,
                    regularFont,
                    textSize,
                    x + PADDING,
                    y + height - 50F,
                    "Certificate information will be"
            );

            writeText(
                    contentStream,
                    regularFont,
                    textSize,
                    x + PADDING,
                    y + height - 61F,
                    "added during signing."
            );
        }
    }

    private void writeText(
            PDPageContentStream contentStream,
            PDType1Font font,
            float fontSize,
            float x,
            float y,
            String text
    ) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(text);
        contentStream.endText();
    }

    private void validateBox(
            float width,
            float height
    ) {
        if (width < 70F || height < 35F) {
            throw new IllegalArgumentException(
                    "İmza alanı çok küçük."
            );
        }
    }

    public record SignaturePlacement(
            int pageNumber,
            PdfSignatureCoordinates coordinates
    ) {
    }
}