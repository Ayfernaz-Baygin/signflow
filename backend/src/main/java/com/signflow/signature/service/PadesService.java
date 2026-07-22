package com.signflow.signature.service;

import eu.europa.esig.dss.enumerations.DigestAlgorithm;
import eu.europa.esig.dss.enumerations.SignatureLevel;
import eu.europa.esig.dss.pades.PAdESSignatureParameters;
import org.springframework.stereotype.Service;

@Service
public class PadesService {

    public PAdESSignatureParameters createParameters() {

        PAdESSignatureParameters parameters =
                new PAdESSignatureParameters();

        parameters.setSignatureLevel(
                SignatureLevel.PAdES_BASELINE_B
        );

        parameters.setDigestAlgorithm(
                DigestAlgorithm.SHA256
        );

        return parameters;
    }
}