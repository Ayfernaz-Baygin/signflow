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
  prepareSignature,
  previewMultipleSignatures,
  signMultiplePdf,
  uploadPdf,
  validatePdfSignatures,
} from '../api/pdfApi';
import type {
  SignaturePrepareRequest,
} from '../api/pdfApi';

import PdfViewer from '../components/pdf/PdfViewer';
import type { PdfUploadResponse } from '../types/pdf';
import type { SignatureBox } from '../types/signature';

import ValidationPanel from '../components/validation/ValidationPanel';

import type {
  SignatureValidationResponse,
} from '../types/validation';



function SignPage() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

    const [
  isSignatureOverlapping,
  setIsSignatureOverlapping,
] = useState(false);

const validationInputRef =
  useRef<HTMLInputElement | null>(null);

const [validationResult, setValidationResult] =
  useState<SignatureValidationResponse | null>(null);

const [isValidating, setIsValidating] =
  useState(false);

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

  const [isSigning, setIsSigning] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const displayedFile =
    previewFile ?? selectedFile;

  const isBusy =
  isLoading ||
  isPreparing ||
  isSigning ||
  isValidating;

  const handleSelectPdf = () => {
    fileInputRef.current?.click();
  };

  const handleSelectValidationPdf = () => {
  validationInputRef.current?.click();
};

const handleValidationFileChange = async (
  event: ChangeEvent<HTMLInputElement>,
) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  setErrorMessage('');
  setSuccessMessage('');
  setValidationResult(null);
  setIsValidating(true);

  try {
    const result =
      await validatePdfSignatures(file);

    setValidationResult(result);

    setSuccessMessage(
      `${result.signatureCount} elektronik imza analiz edildi.`,
    );
  } catch (error) {
    console.error(
      'PDF imza doğrulama hatası:',
      error,
    );

    setErrorMessage(
      'PDF imzaları doğrulanamadı. Backend uygulamasının çalıştığını kontrol edin.',
    );
  } finally {
    setIsValidating(false);
    event.target.value = '';
  }
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

  const isSignatureAreaOverlapping = (
  first: SignaturePrepareRequest,
  second: SignaturePrepareRequest,
): boolean => {
  // Farklı PDF sayfalarındaki alanlar çakışmaz.
  if (first.pageNumber !== second.pageNumber) {
    return false;
  }

  // Kenarların birbirine değmesine izin verir.
  // Yalnızca alanlar gerçekten kesişiyorsa true döner.
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
};

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
  setSuccessMessage('');

  const newSignatureArea =
    toRequest(signatureBox);

  const overlappingAreaIndex =
    signatureBoxes.findIndex(
      (existingArea) =>
        isSignatureAreaOverlapping(
          existingArea,
          newSignatureArea,
        ),
    );

if (overlappingAreaIndex !== -1) {
  setErrorMessage(
    `Yeni imza alanı, İmza ${
      overlappingAreaIndex + 1
    } alanıyla çakışıyor. Lütfen üst üste gelmeyecek şekilde farklı bir konuma yerleştirin.`,
  );

  setSignatureBox(null);

  return;
}

  setIsPreparing(true);

  try {
    const updatedBoxes = [
      ...signatureBoxes,
      newSignatureArea,
    ];

    await refreshPreview(updatedBoxes);

    setSignatureBoxes(updatedBoxes);
    setSignatureBox(null);

    setSuccessMessage(
      'İmza alanı başarıyla eklendi.',
    );
  } catch (error) {
    console.error(
      'İmza önizleme hatası:',
      error,
    );

    setErrorMessage(
      'İmza alanı PDF önizlemesine eklenemedi.',
    );
  } finally {
    setIsPreparing(false);
  }
};
  const handleRemoveSignatureArea = async (
    indexToRemove: number,
  ) => {
    setErrorMessage('');
    setSuccessMessage('');
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

  const handleSignPdf = async () => {
  if (
    !selectedFile ||
    signatureBoxes.length === 0
  ) {
    setErrorMessage(
      'PDF’yi imzalamadan önce en az bir imza alanı ekleyin.',
    );

    return;
  }

  setErrorMessage('');
  setSuccessMessage('');
  setIsSigning(true);

  try {
    /*
     * Ekran koordinatları önce PDF koordinatlarına
     * dönüştürülür.
     */
    const preparedSignatures =
      await Promise.all(
        signatureBoxes.map(
          (signatureBox) =>
            prepareSignature(
              signatureBox,
            ),
        ),
      );

    /*
     * DSS görünür imza koordinatında Y değeri
     * sayfanın üst tarafından hesaplanır.
     */
    const signingCoordinates =
      preparedSignatures.map(
        (preparedSignature) => {
          const dssTopY =
            preparedSignature.pdfPageHeight -
            preparedSignature.pdfY -
            preparedSignature.pdfHeight;

          return {
            page:
              preparedSignature.pageNumber,

            x:
              preparedSignature.pdfX,

            y:
              dssTopY,

            width:
              preparedSignature.pdfWidth,

            height:
              preparedSignature.pdfHeight,
          };
        },
      );

    /*
     * Bütün imza alanları tek istekte backend'e
     * gönderilir. Backend PDF'yi her alan için
     * sıralı olarak yeniden imzalar.
     */
    const signedPdfBlob =
      await signMultiplePdf(
        selectedFile,
        signingCoordinates,
      );

    const downloadUrl =
      URL.createObjectURL(
        signedPdfBlob,
      );

    const downloadLink =
      document.createElement('a');

    const originalName =
      selectedFile.name.replace(
        /\.pdf$/i,
        '',
      );

    downloadLink.href =
      downloadUrl;

    downloadLink.download =
      `${originalName}-signed.pdf`;

    document.body.appendChild(
      downloadLink,
    );

    downloadLink.click();
    downloadLink.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(
        downloadUrl,
      );
    }, 1000);

    setSuccessMessage(
      `${signingCoordinates.length} dijital imza başarıyla PDF’ye eklendi ve indirme işlemi başlatıldı.`,
    );
  } catch (error) {
    console.error(
      'Çoklu PDF imzalama hatası:',
      error,
    );

    setErrorMessage(
      'PDF imzalanamadı. Backend terminalindeki hata ayrıntılarını kontrol edin.',
    );
  } finally {
    setIsSigning(false);
  }
};

  const handleClearAll = () => {
    setSignatureBoxes([]);
    setSignatureBox(null);
    setPreviewFile(null);
    setErrorMessage('');
    setSuccessMessage('');
    setIsSignatureOverlapping(false);

    setValidationResult(null);
  };

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreviewFile(null);
    setPdfInfo(null);
    setSignatureBox(null);
    setSignatureBoxes([]);
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    setIsSignatureOverlapping(false);

    try {
      const response =
        await uploadPdf(file);

      setPdfInfo(response);
    } catch (error) {
      console.error(
        'PDF yükleme hatası:',
        error,
      );

      setSelectedFile(null);
      setPreviewFile(null);
      setPdfInfo(null);

      setErrorMessage(
        'PDF yüklenemedi. Backend uygulamasının çalıştığını kontrol edin.',
      );
    } finally {
      setIsLoading(false);

      /*
       * Aynı dosyanın tekrar seçilebilmesi için
       * input değeri temizleniyor.
       */
      event.target.value = '';
    }
  };

  const getStatusLabel = () => {
    if (isLoading) {
      return 'PDF analiz ediliyor';
    }

    if (isPreparing) {
      return 'Önizleme hazırlanıyor';
    }

    if (isSigning) {
      return 'PDF imzalanıyor';
    }

    if (signatureBoxes.length > 0) {
      return `${signatureBoxes.length} imza alanı hazır`;
    }

    if (pdfInfo) {
      return 'İmza alanı bekleniyor';
    }

    return 'PDF bekleniyor';
  };

  return (
    <Container maxWidth="xl">
      <Stack
        spacing={3}
        sx={{
          py: {
            xs: 3,
            md: 5,
          },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
          >
            PDF İmzalama
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: 'text.secondary',
            }}
          >
            PDF dosyanızı seçin, imza
            alanını çizerek yerleştirin ve
            “İmza alanını ekle” düğmesine
            basın.
          </Typography>
        </Box>

        {errorMessage && (
          <Alert
            severity="error"
            onClose={() =>
              setErrorMessage('')
            }
          >
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert
            severity="success"
            onClose={() =>
              setSuccessMessage('')
            }
          >
            {successMessage}
          </Alert>
        )}

        

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg:
                'minmax(0, 2fr) minmax(340px, 1fr)',
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
                borderBottom:
                  '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                }}
              >
                PDF Önizleme
              </Typography>
            </Box>

            <Box
              sx={{
                minHeight: 550,
                backgroundColor:
                  '#EEF1F6',
              }}
            >
              {isLoading ? (
                <Stack
                  spacing={2}
                  sx={{
                    minHeight: 550,
                    alignItems: 'center',
                    justifyContent:
                      'center',
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
  existingSignatureAreas={
    signatureBoxes
  }
  onOverlapChange={
    setIsSignatureOverlapping
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
                  sx={{
                    fontWeight: 700,
                  }}
                >
                  İmza Alanları
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color:
                      'text.secondary',
                  }}
                >
                  Eklenen alan sayısı:{' '}
                  {signatureBoxes.length}
                </Typography>
              </Box>

              <Divider />

              {selectedFile && (
                <Alert severity="info">
                  Seçilen dosya:{' '}
                  <strong>
                    {selectedFile.name}
                  </strong>
                </Alert>
              )}

              {signatureBox && (
                <Alert severity="info">
                  Yeni alan seçildi:
                  Sayfa{' '}
                  {signatureBox.pageNumber},
                  X{' '}
                  {Math.round(
                    signatureBox.x,
                  )},
                  Y{' '}
                  {Math.round(
                    signatureBox.y,
                  )}
                </Alert>
              )}

              <Button
                variant="contained"
               disabled={
  !pdfInfo ||
  !signatureBox ||
  isSignatureOverlapping ||
  isBusy
}
                onClick={
                  handleAddSignatureArea
                }
              >
               {isPreparing
  ? 'Önizleme hazırlanıyor...'
  : isSignatureOverlapping
    ? 'İmza alanı çakışıyor'
    : 'İmza alanını ekle'}
              </Button>

              {signatureBoxes.length >
              0 ? (
                <Stack spacing={1}>
                  {signatureBoxes.map(
                    (box, index) => (
                      <Paper
                        key={`${box.pageNumber}-${box.x}-${box.y}-${index}`}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'space-between',
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{
                              fontWeight:
                                700,
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
                            {box.pageNumber}
                            {' · '}
                            X{' '}
                            {Math.round(
                              box.x,
                            )}
                            {' · '}
                            Y{' '}
                            {Math.round(
                              box.y,
                            )}
                          </Typography>

                          <Typography
                            variant="body2"
                            sx={{
                              color:
                                'text.secondary',
                            }}
                          >
                            Genişlik{' '}
                            {Math.round(
                              box.width,
                            )}
                            {' · '}
                            Yükseklik{' '}
                            {Math.round(
                              box.height,
                            )}
                          </Typography>
                        </Box>

                        <Button
                          size="small"
                          color="error"
                          disabled={isBusy}
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
                    color:
                      'text.secondary',
                  }}
                >
                  Henüz kalıcı bir imza
                  alanı eklenmedi.
                </Typography>
              )}

              <Divider />

              <Chip
                label={getStatusLabel()}
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

              <input
  ref={validationInputRef}
  type="file"
  accept="application/pdf"
  hidden
  onChange={handleValidationFileChange}
/>

              <Button
                variant="contained"
                color="success"
                disabled={
                  !selectedFile ||
                  signatureBoxes.length ===
                    0 ||
                  isBusy
                }
                onClick={handleSignPdf}
              >
                {isSigning
                  ? 'PDF imzalanıyor...'
                  : 'PDF’yi İmzala ve İndir'}
              </Button>

              <Button
                variant="outlined"
                disabled={isBusy}
                onClick={handleSelectPdf}
              >

    
                {pdfInfo
                  ? 'Başka PDF Seç'
                  : 'PDF Seç'}
              </Button>
              <Button
  variant="outlined"
  color="secondary"
  disabled={isBusy}
  onClick={handleSelectValidationPdf}
>
  {isValidating
    ? 'İmzalar doğrulanıyor...'
    : 'İmzalı PDF Doğrula'}
</Button>

              <Button
                variant="outlined"
                color="error"
                disabled={
                  signatureBoxes.length ===
                    0 ||
                  isBusy
                }
                onClick={handleClearAll}
              >
                Tüm imza alanlarını temizle
              </Button>
            </Stack>
          </Paper>
        </Box>
         <ValidationPanel
  result={validationResult}
/>

      </Stack>
    </Container>

    
  );
 
  
}


export default SignPage;