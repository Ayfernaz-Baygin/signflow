package com.signflow.certificate.controller;

import com.signflow.certificate.dto.CertificateInfoResponse;
import com.signflow.certificate.service.TestCertificateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.cert.X509Certificate;

@RestController
@RequestMapping("/api/v1/certificate")
public class CertificateController {

    private final TestCertificateService testCertificateService;

    public CertificateController(
            TestCertificateService testCertificateService
    ) {
        this.testCertificateService = testCertificateService;
    }

    @GetMapping("/test")
    public CertificateInfoResponse getTestCertificate() throws Exception {

        X509Certificate certificate =
                testCertificateService.getCertificate();

        return new CertificateInfoResponse(
                certificate.getSubjectX500Principal().getName(),
                certificate.getIssuerX500Principal().getName(),
                certificate.getSigAlgName()
        );
    }
}