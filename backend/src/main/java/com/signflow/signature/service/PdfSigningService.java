package com.signflow.signature.service;

import eu.europa.esig.dss.enumerations.DigestAlgorithm;
import eu.europa.esig.dss.enumerations.SignatureLevel;
import eu.europa.esig.dss.model.DSSDocument;
import eu.europa.esig.dss.model.InMemoryDocument;
import eu.europa.esig.dss.model.SignatureValue;
import eu.europa.esig.dss.model.ToBeSigned;
import eu.europa.esig.dss.pades.PAdESSignatureParameters;
import eu.europa.esig.dss.pades.SignatureFieldParameters;
import eu.europa.esig.dss.pades.SignatureImageParameters;
import eu.europa.esig.dss.pades.SignatureImageTextParameters;
import eu.europa.esig.dss.pades.signature.PAdESService;
import eu.europa.esig.dss.spi.validation.CommonCertificateVerifier;
import eu.europa.esig.dss.token.DSSPrivateKeyEntry;
import eu.europa.esig.dss.token.Pkcs12SignatureToken;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.security.KeyStore.PasswordProtection;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfSigningService {

    private static final DateTimeFormatter SIGNING_DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final Resource certificateResource;
    private final String certificatePassword;

    public PdfSigningService(
            @Value("${signflow.certificate.path}")
            Resource certificateResource,
            @Value("${signflow.certificate.password}")
            String certificatePassword
    ) {
        this.certificateResource = certificateResource;
        this.certificatePassword = certificatePassword;
    }

    public byte[] sign(
            byte[] pdfBytes,
            int page,
            float x,
            float y,
            float width,
            float height
    ) {
        validateRequest(
                pdfBytes,
                page,
                x,
                y,
                width,
                height
        );

        try (
                Pkcs12SignatureToken token =
                        new Pkcs12SignatureToken(
                                certificateResource.getInputStream(),
                                new PasswordProtection(
                                        certificatePassword.toCharArray()
                                )
                        )
        ) {
            DSSPrivateKeyEntry privateKey =
                    findPrivateKey(token.getKeys());

            PAdESSignatureParameters parameters =
                    createSignatureParameters(
                            privateKey,
                            page,
                            x,
                            y,
                            width,
                            height
                    );

            DSSDocument documentToSign =
                    new InMemoryDocument(
                            pdfBytes,
                            "document.pdf"
                    );

            PAdESService padesService =
                    new PAdESService(
                            new CommonCertificateVerifier()
                    );

            ToBeSigned dataToSign =
                    padesService.getDataToSign(
                            documentToSign,
                            parameters
                    );

            SignatureValue signatureValue =
                    token.sign(
                            dataToSign,
                            parameters.getDigestAlgorithm(),
                            privateKey
                    );

            DSSDocument signedDocument =
                    padesService.signDocument(
                            documentToSign,
                            parameters,
                            signatureValue
                    );

            try (
                    ByteArrayOutputStream outputStream =
                            new ByteArrayOutputStream()
            ) {
                signedDocument.writeTo(outputStream);
                return outputStream.toByteArray();
            }

        } catch (Exception exception) {
            throw new IllegalStateException(
                    "PDF PAdES Baseline-B olarak imzalanamadı.",
                    exception
            );
        }
    }

    private PAdESSignatureParameters createSignatureParameters(
            DSSPrivateKeyEntry privateKey,
            int page,
            float x,
            float y,
            float width,
            float height
    ) {
        PAdESSignatureParameters parameters =
                new PAdESSignatureParameters();

        parameters.setSignatureLevel(
                SignatureLevel.PAdES_BASELINE_B
        );

        parameters.setDigestAlgorithm(
                DigestAlgorithm.SHA256
        );

        parameters.setSigningCertificate(
                privateKey.getCertificate()
        );

        parameters.setCertificateChain(
                privateKey.getCertificateChain()
        );

        parameters.setImageParameters(
                createVisibleSignatureParameters(
                        page,
                        x,
                        y,
                        width,
                        height
                )
        );

        return parameters;
    }

    private SignatureImageParameters createVisibleSignatureParameters(
            int page,
            float x,
            float y,
            float width,
            float height
    ) {
        SignatureFieldParameters fieldParameters =
                new SignatureFieldParameters();

        fieldParameters.setPage(page);
        fieldParameters.setOriginX(x);
        fieldParameters.setOriginY(y);
        fieldParameters.setWidth(width);
        fieldParameters.setHeight(height);

        String signingDate =
                LocalDateTime.now().format(
                        SIGNING_DATE_FORMAT
                );

        SignatureImageTextParameters textParameters =
                new SignatureImageTextParameters();

        textParameters.setText(
                """
                Elektronik olarak imzalandı

                İmzalayan: SignFlow Test User
                Tarih: %s
                """.formatted(signingDate)
        );

        SignatureImageParameters imageParameters =
                new SignatureImageParameters();

        imageParameters.setFieldParameters(
                fieldParameters
        );

        imageParameters.setTextParameters(
                textParameters
        );

        return imageParameters;
    }

    private void validateRequest(
            byte[] pdfBytes,
            int page,
            float x,
            float y,
            float width,
            float height
    ) {
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException(
                    "İmzalanacak PDF boş olamaz."
            );
        }

        if (page < 1) {
            throw new IllegalArgumentException(
                    "Sayfa numarası 1 veya daha büyük olmalıdır."
            );
        }

        if (x < 0 || y < 0) {
            throw new IllegalArgumentException(
                    "İmza koordinatları negatif olamaz."
            );
        }

        if (width <= 0 || height <= 0) {
            throw new IllegalArgumentException(
                    "İmza genişliği ve yüksekliği sıfırdan büyük olmalıdır."
            );
        }
    }

    private DSSPrivateKeyEntry findPrivateKey(
            List<DSSPrivateKeyEntry> keys
    ) {
        if (keys == null || keys.isEmpty()) {
            throw new IllegalStateException(
                    "PKCS#12 içerisinde özel anahtar bulunamadı."
            );
        }

        return keys.getFirst();
    }
}