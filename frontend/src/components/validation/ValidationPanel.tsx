import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import type {
  SignatureValidationResponse,
  ValidatedSignatureResponse,
} from '../../types/validation';

type ValidationPanelProps = {
  result: SignatureValidationResponse | null;
};

function ValidationPanel({
  result,
}: ValidationPanelProps) {
  if (!result) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
            }}
          >
            İmza Doğrulama Sonucu
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: 'text.secondary',
            }}
          >
            Dosya: {result.fileName}
          </Typography>
        </Box>

        <ValidationSummary result={result} />

        <Divider />

        <Stack spacing={2}>
          {result.signatures.map((signature) => (
            <SignatureCard
              key={`${signature.index}-${signature.serialNumber}`}
              signature={signature}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function ValidationSummary({
  result,
}: {
  result: SignatureValidationResponse;
}) {
  if (!result.signed) {
    return (
      <Alert severity="warning">
        Bu PDF dosyasında elektronik imza bulunamadı.
      </Alert>
    );
  }

  const allSignaturesIntact =
    result.signatures.every(
      (signature) => signature.signatureIntact,
    );

  const documentModified =
    result.signatures.some(
      (signature) =>
        signature.documentModifiedAfterSigning,
    );

  const allChainsTrusted =
    result.signatures.every(
      (signature) =>
        signature.trustedCertificateChain,
    );

  return (
    <Stack spacing={2}>
      <Alert
        severity={
          allSignaturesIntact && !documentModified
            ? 'success'
            : 'error'
        }
      >
        {allSignaturesIntact && !documentModified
          ? `${result.signatureCount} elektronik imza kriptografik olarak sağlam.`
          : 'İmza bütünlüğü veya belge değişikliğiyle ilgili bir sorun bulundu.'}
      </Alert>

      {!allChainsTrusted && (
        <Alert severity="warning">
          İmzalar sağlam görünüyor ancak sertifika
          zinciri güvenilir bir kök sertifikaya kadar
          doğrulanamadı.
        </Alert>
      )}

   <Stack
  direction={{
    xs: 'column',
    sm: 'row',
  }}
  spacing={1}
  useFlexGap
  sx={{
    flexWrap: 'wrap',
  }}
>
        <Chip
          label={`${result.signatureCount} imza bulundu`}
          color="primary"
          variant="outlined"
        />

        <Chip
          label={
            allSignaturesIntact
              ? 'İmza bütünlüğü geçerli'
              : 'İmza bütünlüğü geçersiz'
          }
          color={
            allSignaturesIntact
              ? 'success'
              : 'error'
          }
        />

        <Chip
          label={
            documentModified
              ? 'Belge değiştirilmiş'
              : 'Belge değiştirilmemiş'
          }
          color={
            documentModified
              ? 'error'
              : 'success'
          }
          variant="outlined"
        />

        <Chip
          label={
            allChainsTrusted
              ? 'Sertifika güvenilir'
              : 'Sertifika zinciri doğrulanamadı'
          }
          color={
            allChainsTrusted
              ? 'success'
              : 'warning'
          }
          variant="outlined"
        />
      </Stack>
    </Stack>
  );
}

function SignatureCard({
  signature,
}: {
  signature: ValidatedSignatureResponse;
}) {
  const statusSeverity =
    signature.signatureIntact &&
    !signature.documentModifiedAfterSigning
      ? 'success'
      : 'error';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{
            xs: 'column',
            sm: 'row',
          }}
          spacing={1}
          sx={{
            justifyContent: 'space-between',
            alignItems: {
              xs: 'flex-start',
              sm: 'center',
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            İmza {signature.index}
          </Typography>

          <Chip
            label={
              statusSeverity === 'success'
                ? 'Kriptografik olarak sağlam'
                : 'Doğrulama sorunu'
            }
            color={statusSeverity}
            size="small"
          />
        </Stack>

        <Divider />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          <Detail
            label="İmzalayan"
            value={signature.signerName}
          />

          <Detail
            label="Sertifika sağlayıcısı"
            value={signature.issuerName}
          />

          <Detail
            label="Seri numarası"
            value={signature.serialNumber}
          />

          <Detail
            label="İmza formatı"
            value={signature.signatureFormat}
          />

          <Detail
            label="İmza seviyesi"
            value={signature.signatureLevel}
          />

          <Detail
            label="Özet algoritması"
            value={signature.digestAlgorithm}
          />

          <Detail
            label="İmzalama zamanı"
            value={formatDate(signature.signingTime)}
          />

          <Detail
            label="Sertifika başlangıcı"
            value={formatDate(
              signature.certificateValidFrom,
            )}
          />

          <Detail
            label="Sertifika bitişi"
            value={formatDate(
              signature.certificateValidUntil,
            )}
          />

          <Detail
            label="Doğrulama durumu"
            value={translateIndication(
              signature.indication,
            )}
          />

          <Detail
            label="Doğrulama açıklaması"
            value={translateSubIndication(
              signature.subIndication,
            )}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          mt: 0.25,
          fontWeight: 600,
          overflowWrap: 'anywhere',
        }}
      >
        {value || 'Bilgi bulunamadı'}
      </Typography>
    </Box>
  );
}

function formatDate(
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

function translateIndication(
  indication: string | null,
): string | null {
  switch (indication) {
    case 'TOTAL_PASSED':
      return 'Geçerli';

    case 'TOTAL_FAILED':
      return 'Geçersiz';

    case 'INDETERMINATE':
      return 'Belirsiz';

    default:
      return indication;
  }
}

function translateSubIndication(
  subIndication: string | null,
): string | null {
  switch (subIndication) {
    case 'NO_CERTIFICATE_CHAIN_FOUND':
      return 'Sertifika zinciri bulunamadı';

    case 'HASH_FAILURE':
      return 'Belge özeti doğrulanamadı';

    case 'SIG_CRYPTO_FAILURE':
      return 'Kriptografik imza doğrulanamadı';

    case 'REVOKED':
      return 'Sertifika iptal edilmiş';

    case 'EXPIRED':
      return 'Sertifikanın süresi dolmuş';

    case 'NOT_YET_VALID':
      return 'Sertifika henüz geçerli değil';

    default:
      return subIndication;
  }
}

export default ValidationPanel;