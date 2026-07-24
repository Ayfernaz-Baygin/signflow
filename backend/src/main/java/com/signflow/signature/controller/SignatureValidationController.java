package com.signflow.signature.controller;

import com.signflow.signature.dto.SignatureValidationResponse;
import com.signflow.signature.service.SignatureValidationService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/signature")
public class SignatureValidationController {

    private final SignatureValidationService signatureValidationService;

    public SignatureValidationController(
            SignatureValidationService signatureValidationService
    ) {
        this.signatureValidationService =
                signatureValidationService;
    }

    @PostMapping(
            value = "/validate",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public SignatureValidationResponse validate(
            @RequestPart("file") MultipartFile file
    ) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Doğrulanacak PDF dosyası boş olamaz."
            );
        }

        return signatureValidationService.validate(
                file.getOriginalFilename(),
                file.getBytes()
        );
    }
}