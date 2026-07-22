import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  previewMultipleSignatures,
  uploadPdf,
} from '../api/pdfApi';
import type {
  SignaturePrepareRequest,
} from '../api/pdfApi';
import PdfViewer from '../components/pdf/PdfViewer';
import type { PdfUploadResponse } from '../types/pdf';
import type { SignatureBox } from '../types/signature';

function SignPage() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewFile, setPreviewFile] =
    useState<File | null>(null);

  const [pdfInfo, setPdfInfo] =
    useState<PdfUploadResponse | null>(null);

  const [signatureBox, setSignatureBox] =
    useState<SignatureBox | null>(null);

  const [signatureBoxes, setSignatureBoxes] =
    useState<SignaturePrepareRequest[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isPreparing, setIsPreparing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const displayedFile =
    previewFile ?? selectedFile;

  const handleSelectPdf = () => {
    fileInputRef.current?.click();
  };

  const toRequest = (
    box: SignatureBox,
  ): SignaturePrepareRequest => ({
    pageNumber: box.pageNumber,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    renderedPageWidth: box.pageWidth,
    renderedPageHeight: box.pageHeight,
  });

  const refreshPreview = async (
    boxes: SignaturePrepareRequest[],
  ) => {
    if (!pdfInfo) {
      return;
    }

    if (boxes.length === 0) {
      setPreviewFile(null);
      return;
    }

    const pdfBlob =
      await previewMultipleSignatures({
        signatures: boxes,
      });

    const generatedPreviewFile =
      new File(
        [pdfBlob],
        `preview-${pdfInfo.fileName}`,
        {
          type: 'application/pdf',
        },
      );

    setPreviewFile(generatedPreviewFile);
  };

  const handleAddSignatureArea = async () => {
    if (!signatureBox || !pdfInfo) {
      return;
    }

    setErrorMessage('');
    setIsPreparing(true);

    try {
      const updatedBoxes = [
        ...signatureBoxes,
        toRequest(signatureBox),
      ];

      await refreshPreview(updatedBoxes);

      setSignatureBoxes(updatedBoxes);
      setSignatureBox(null);
    } catch (error) {
      console.error(
        'İmza önizleme hatası:',
        error,
      );

      setErrorMessage(
        'İmza alanları PDF üzerine eklenemedi.',
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const handleRemoveSignatureArea = async (
    indexToRemove: number,
  ) => {
    setErrorMessage('');
    setIsPreparing(true);

    try {
      const updatedBoxes =
        signatureBoxes.filter(
          (_, index) =>
            index !== indexToRemove,
        );

      await refreshPreview(updatedBoxes);
      setSignatureBoxes(updatedBoxes);
      setSignatureBox(null);
    } catch (error) {
      console.error(
        'İmza alanı silme hatası:',
        error,
      );

      setErrorMessage(
        'İmza alanı silinemedi.',
      );
    } finally {
      setIsPreparing(false);
    }
  };

  const handleClearAll = () => {
    setSignatureBoxes([]);
    setSignatureBox(null);
    setPreviewFile(null);
    setErrorMessage('');
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreviewFile(null);
    setPdfInfo(null);
    setSignatureBox(null);
    setSignatureBoxes([]);
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await uploadPdf(file);
      setPdfInfo(response);
    } catch {
      setSelectedFile(null);

      setErrorMessage(
        'PDF yüklenemedi. Backend uygulamasının çalıştığını kontrol edin.',
      );
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  return (
    <Container maxWidth="xl">
      <Stack
        spacing={3}
        sx={{ py: { xs: 3, md: 5 } }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
           PDF İmzalama
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: 'text.secondary',
            }}
          >
            İmza alanını yerleştirin ve
            “İmza alanını ekle” düğmesine basın.
            Aynı veya farklı sayfalara birden
            fazla alan ekleyebilirsiniz.
          </Typography>
        </Box>

        {errorMessage && (
          <Alert severity="error">
            {errorMessage}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'minmax(0, 2fr) minmax(340px, 1fr)',
            },
            gap: 3,
            alignItems: 'stretch',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              minHeight: 620,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>
                PDF Önizleme
              </Typography>
            </Box>

            <Box
              sx={{
                minHeight: 550,
                backgroundColor: '#EEF1F6',
              }}
            >
              {isLoading ? (
                <Stack
                  spacing={2}
                  sx={{
                    minHeight: 550,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress />
                  <Typography>
                    PDF analiz ediliyor...
                  </Typography>
                </Stack>
              ) : (
                <PdfViewer
                  key={
                    displayedFile
                      ? `${displayedFile.name}-${displayedFile.lastModified}`
                      : 'empty-pdf'
                  }
                  file={displayedFile}
                  onSignatureChange={
                    setSignatureBox
                  }
                />
              )}
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700 }}
                >
                  İmza Alanları
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Eklenen alan sayısı:{' '}
                  {signatureBoxes.length}
                </Typography>
              </Box>

              <Divider />

              {signatureBox && (
                <Alert severity="info">
                  Yeni alan seçildi: Sayfa{' '}
                  {signatureBox.pageNumber},{' '}
                  X {Math.round(signatureBox.x)},{' '}
                  Y {Math.round(signatureBox.y)}
                </Alert>
              )}

              <Button
                variant="contained"
                disabled={
                  !pdfInfo ||
                  !signatureBox ||
                  isLoading ||
                  isPreparing
                }
                onClick={
                  handleAddSignatureArea
                }
              >
                {isPreparing
                  ? 'Önizleme hazırlanıyor...'
                  : 'İmza alanını ekle'}
              </Button>

              {signatureBoxes.length > 0 ? (
                <Stack spacing={1}>
                  {signatureBoxes.map(
                    (box, index) => (
                      <Paper
                        key={`${box.pageNumber}-${box.x}-${box.y}-${index}`}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent:
                            'space-between',
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            İmza {index + 1}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color:
                                'text.secondary',
                            }}
                          >
                            Sayfa{' '}
                            {box.pageNumber} · X{' '}
                            {Math.round(box.x)} · Y{' '}
                            {Math.round(box.y)}
                          </Typography>
                        </Box>

                        <Button
                          size="small"
                          color="error"
                          disabled={isPreparing}
                          onClick={() =>
                            handleRemoveSignatureArea(
                              index,
                            )
                          }
                        >
                          Sil
                        </Button>
                      </Paper>
                    ),
                  )}
                </Stack>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Henüz kalıcı bir imza alanı
                  eklenmedi.
                </Typography>
              )}

              <Divider />

              <Chip
                label={
                  isLoading
                    ? 'PDF analiz ediliyor'
                    : isPreparing
                      ? 'Önizleme hazırlanıyor'
                      : signatureBoxes.length > 0
                        ? `${signatureBoxes.length} imza alanı hazır`
                        : pdfInfo
                          ? 'İmza alanı bekleniyor'
                          : 'PDF bekleniyor'
                }
                color={
                  signatureBoxes.length > 0
                    ? 'success'
                    : 'default'
                }
                variant={
                  signatureBoxes.length > 0
                    ? 'filled'
                    : 'outlined'
                }
                size="small"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleFileChange}
              />

              <Button
                variant="outlined"
                disabled={
                  isLoading || isPreparing
                }
                onClick={handleSelectPdf}
              >
                {pdfInfo
                  ? 'Başka PDF Seç'
                  : 'PDF Seç'}
              </Button>

              <Button
                variant="outlined"
                color="error"
                disabled={
                  signatureBoxes.length === 0 ||
                  isPreparing
                }
                onClick={handleClearAll}
              >
                Tüm imza alanlarını temizle
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Container>
  );
}

export default SignPage;