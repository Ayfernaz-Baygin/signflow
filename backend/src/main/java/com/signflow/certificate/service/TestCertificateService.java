package com.signflow.certificate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.security.Key;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;

@Service
public class TestCertificateService {

    @Value("${signflow.certificate.path}")
    private Resource certificate;

    @Value("${signflow.certificate.password}")
    private String password;

    @Value("${signflow.certificate.alias}")
    private String alias;

    private KeyStore loadKeyStore() throws Exception {

        KeyStore keyStore = KeyStore.getInstance("PKCS12");

        try (InputStream is = certificate.getInputStream()) {

            keyStore.load(is, password.toCharArray());

        }

        return keyStore;
    }

    public PrivateKey getPrivateKey() throws Exception {

        KeyStore keyStore = loadKeyStore();

        Key key = keyStore.getKey(alias, password.toCharArray());

        return (PrivateKey) key;
    }

    public X509Certificate getCertificate() throws Exception {

        KeyStore keyStore = loadKeyStore();

        return (X509Certificate) keyStore.getCertificate(alias);
    }
}