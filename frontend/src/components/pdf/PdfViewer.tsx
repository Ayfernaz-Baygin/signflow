import {
  useEffect,
  useRef,
  useState,
} from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';

import type { SignatureBox } from '../../types/signature';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type ExistingSignatureArea = {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PdfViewerProps = {
  file: File | null;

  onSignatureChange: (
    signatureBox: SignatureBox | null,
  ) => void;

  existingSignatureAreas?: ExistingSignatureArea[];

  onOverlapChange?: (
    isOverlapping: boolean,
  ) => void;
};

const DEFAULT_SIGNATURE_WIDTH = 250;
const DEFAULT_SIGNATURE_HEIGHT = 110;

const MIN_SIGNATURE_WIDTH = 180;
const MIN_SIGNATURE_HEIGHT = 80;

function PdfViewer({
  file,
  onSignatureChange,
  existingSignatureAreas = [],
  onOverlapChange,
}: PdfViewerProps) {
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loadError, setLoadError] = useState('');

  const [signatureBox, setSignatureBox] =
    useState<SignatureBox | null>(null);

  const [dragOffset, setDragOffset] = useState({
    x: 0,
    y: 0,
  });

  const [resizeStart, setResizeStart] = useState({
    pointerX: 0,
    pointerY: 0,
    width: 0,
    height: 0,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const isSignatureOverlapping =
  signatureBox !== null &&
  existingSignatureAreas.some(
    (existingArea) =>
      isOverlapping(
        signatureBox,
        existingArea,
      ),
  );

useEffect(() => {
  onOverlapChange?.(
    isSignatureOverlapping,
  );
}, [
  isSignatureOverlapping,
  onOverlapChange,
]);

  const updateSignatureBox = (
    nextSignatureBox: SignatureBox | null,
  ) => {
    setSignatureBox(nextSignatureBox);
    onSignatureChange(nextSignatureBox);
  };

  const handleLoadSuccess = ({
    numPages,
  }: {
    numPages: number;
  }) => {
    setPageCount(numPages);
    setPageNumber(1);
    setLoadError('');
    updateSignatureBox(null);
  };

  const handleLoadError = () => {
    setPageCount(0);
    setLoadError('PDF önizlemesi oluşturulamadı.');
    updateSignatureBox(null);
  };

  const handlePreviousPage = () => {
    setPageNumber((currentPage) =>
      Math.max(currentPage - 1, 1),
    );
  };

  const handleNextPage = () => {
    setPageNumber((currentPage) =>
      Math.min(currentPage + 1, pageCount),
    );
  };

  const handlePagePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (isDragging || isResizing) {
      return;
    }

    const container = pageContainerRef.current;

    if (!container) {
      return;
    }

    const bounds = container.getBoundingClientRect();

    const requestedX =
      event.clientX -
      bounds.left -
      DEFAULT_SIGNATURE_WIDTH / 2;

    const requestedY =
      event.clientY -
      bounds.top -
      DEFAULT_SIGNATURE_HEIGHT / 2;

    updateSignatureBox({
  pageNumber,
  x: clamp(
    requestedX,
    0,
    bounds.width - DEFAULT_SIGNATURE_WIDTH,
  ),
  y: clamp(
    requestedY,
    0,
    bounds.height - DEFAULT_SIGNATURE_HEIGHT,
  ),
  width: DEFAULT_SIGNATURE_WIDTH,
  height: DEFAULT_SIGNATURE_HEIGHT,
  pageWidth: bounds.width,
  pageHeight: bounds.height,
});
  };

  const handleSignaturePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();

    const container = pageContainerRef.current;

    if (!container || !signatureBox) {
      return;
    }

    const bounds = container.getBoundingClientRect();

    setDragOffset({
      x: event.clientX - bounds.left - signatureBox.x,
      y: event.clientY - bounds.top - signatureBox.y,
    });

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleSignaturePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!isDragging || !signatureBox) {
      return;
    }

    const container = pageContainerRef.current;

    if (!container) {
      return;
    }

    const bounds = container.getBoundingClientRect();

    const requestedX =
      event.clientX - bounds.left - dragOffset.x;

    const requestedY =
      event.clientY - bounds.top - dragOffset.y;

    updateSignatureBox({
      ...signatureBox,
      x: clamp(
        requestedX,
        0,
        bounds.width - signatureBox.width,
      ),
      y: clamp(
        requestedY,
        0,
        bounds.height - signatureBox.height,
      ),
    });
  };

  const handleSignaturePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  };

  const handleResizePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.stopPropagation();

    if (!signatureBox) {
      return;
    }

    setResizeStart({
      pointerX: event.clientX,
      pointerY: event.clientY,
      width: signatureBox.width,
      height: signatureBox.height,
    });

    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleResizePointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (!isResizing || !signatureBox) {
      return;
    }

    const container = pageContainerRef.current;

    if (!container) {
      return;
    }

    const bounds = container.getBoundingClientRect();

    const widthDifference =
      event.clientX - resizeStart.pointerX;

    const heightDifference =
      event.clientY - resizeStart.pointerY;

    const maximumWidth =
      bounds.width - signatureBox.x;

    const maximumHeight =
      bounds.height - signatureBox.y;

    updateSignatureBox({
      ...signatureBox,
      width: clamp(
        resizeStart.width + widthDifference,
        MIN_SIGNATURE_WIDTH,
        maximumWidth,
      ),
      height: clamp(
        resizeStart.height + heightDifference,
        MIN_SIGNATURE_HEIGHT,
        maximumHeight,
      ),
    });
  };

  const handleResizePointerUp = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    setIsResizing(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }
  };

  if (!file) {
    return (
      <Stack
        spacing={1}
        sx={{
          minHeight: 550,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>
          Henüz PDF yüklenmedi
        </Typography>

        <Typography sx={{ color: 'text.secondary' }}>
          Önizlemek için bir PDF dosyası seçin.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      spacing={2}
      sx={{
        minHeight: 550,
        alignItems: 'center',
        py: 3,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
        }}
      >
        İmza alanını yerleştirmek için PDF üzerine tıklayın.
        Kutuyu taşıyabilir veya sağ alt köşeden yeniden
        boyutlandırabilirsiniz.
      </Typography>

      {loadError && (
        <Typography sx={{ color: 'error.main' }}>
          {loadError}
        </Typography>
      )}

      <Box
        sx={{
          width: '100%',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Document
          file={file}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={
            <Stack
              spacing={2}
              sx={{
                minHeight: 450,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress />

              <Typography>
                PDF hazırlanıyor...
              </Typography>
            </Stack>
          }
        >
          <Box
            ref={pageContainerRef}
            onPointerDown={handlePagePointerDown}
            sx={{
              position: 'relative',
              width: 'fit-content',
              lineHeight: 0,
              cursor: 'crosshair',
              boxShadow: '0 4px 20px rgba(16, 24, 40, 0.12)',
            }}
          >
            <Page
              pageNumber={pageNumber}
              width={720}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />

            {signatureBox?.pageNumber === pageNumber && (
              <Box
                onPointerDown={handleSignaturePointerDown}
                onPointerMove={handleSignaturePointerMove}
                onPointerUp={handleSignaturePointerUp}
                onPointerCancel={handleSignaturePointerUp}
                sx={{
                  position: 'absolute',
                  left: signatureBox.x,
                  top: signatureBox.y,
                  width: signatureBox.width,
                  height: signatureBox.height,
                  p: 1.5,
                  border: '2px solid',
                  borderColor:
  isSignatureOverlapping
    ? 'error.main'
    : 'primary.main',

backgroundColor:
  isSignatureOverlapping
    ? 'rgba(255, 235, 238, 0.97)'
    : 'rgba(255, 255, 255, 0.96)',

boxShadow:
  isSignatureOverlapping
    ? '0 8px 24px rgba(211, 47, 47, 0.25)'
    : '0 8px 24px rgba(16, 24, 40, 0.18)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  touchAction: 'none',
                  lineHeight: 1.35,
                  zIndex: 2,
                  overflow: 'hidden',
                }}
              >
                <Stack
                  spacing={0.75}
                  sx={{
                    height: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
  isSignatureOverlapping
    ? 'error.main'
    : 'success.main',
                        color: '#FFFFFF',
                        fontSize: 15,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                     {isSignatureOverlapping
  ? '!'
  : '✓'}
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        color:
                          isSignatureOverlapping
                            ? 'error.main'
                            : 'primary.main',
                      }}
                    >
                      {isSignatureOverlapping
                        ? 'İMZA ALANI ÇAKIŞIYOR'
                        : 'ELEKTRONİK OLARAK İMZALANACAK'}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                    }}
                  >
                    İmza sahibi
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {isSignatureOverlapping
                      ? 'Bu alan mevcut bir imza alanıyla üst üste geliyor.'
                      : 'Sertifika bilgileri imzalama sırasında eklenecek'}
                  </Typography>
                </Stack>

                <Box
                  onPointerDown={handleResizePointerDown}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerUp}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 22,
                    height: 22,
                    cursor: 'nwse-resize',
                    touchAction: 'none',
                    zIndex: 3,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      right: 4,
                      bottom: 4,
                      width: 10,
                      height: 10,
                      borderRight: '3px solid',
                      borderBottom: '3px solid',
                      borderColor:
                        isSignatureOverlapping
                          ? 'error.main'
                          : 'primary.main',
                    },
                  }}
                />
              </Box>
            )}
          </Box>
        </Document>
      </Box>

      {pageCount > 0 && (
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Button
            variant="outlined"
            disabled={pageNumber <= 1}
            onClick={handlePreviousPage}
          >
            Önceki
          </Button>

          <Typography sx={{ fontWeight: 600 }}>
            {pageNumber} / {pageCount}
          </Typography>

          <Button
            variant="outlined"
            disabled={pageNumber >= pageCount}
            onClick={handleNextPage}
          >
            Sonraki
          </Button>
        </Stack>
      )}

      {signatureBox && (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          İmza alanı: Sayfa {signatureBox.pageNumber},
          X: {Math.round(signatureBox.x)},
          Y: {Math.round(signatureBox.y)},
          Genişlik: {Math.round(signatureBox.width)},
          Yükseklik: {Math.round(signatureBox.height)}
        </Typography>
      )}
    </Stack>
  );
}

function isOverlapping(
  first: ExistingSignatureArea,
  second: ExistingSignatureArea,
): boolean {
  if (
    first.pageNumber !==
    second.pageNumber
  ) {
    return false;
  }

  return (
    first.x <
      second.x + second.width &&
    first.x + first.width >
      second.x &&
    first.y <
      second.y + second.height &&
    first.y + first.height >
      second.y
  );
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    Math.max(value, minimum),
    Math.max(maximum, minimum),
  );
}

export default PdfViewer;