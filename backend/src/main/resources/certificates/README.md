# Test Certificate

This directory is reserved for local development certificates.

Private certificate files such as `.p12`, `.pfx`, `.jks`, `.pem` and `.key`
must not be committed to the repository.

For local development, generate a test PKCS#12 certificate:

```powershell
keytool -genkeypair `
  -alias signflow-test `
  -keyalg RSA `
  -keysize 3072 `
  -sigalg SHA256withRSA `
  -validity 3650 `
  -storetype PKCS12 `
  -keystore signflow-test.p12 `
  -storepass signflow123 `
  -keypass signflow123 `
  -dname "CN=SignFlow Test User,OU=Development,O=SignFlow,L=Izmir,C=TR"