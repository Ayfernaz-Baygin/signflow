import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

function PdfUploadPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState('');

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFileName(file.name);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 6 },
        border: '1px dashed #B8C2D1',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Stack
        spacing={2}
        sx={{
          alignItems: 'center',
        }}
      >
        <Typography variant="h5">
          İmzalanacak PDF dosyasını yükleyin
        </Typography>

        <Typography
          sx={{
            color: 'text.secondary',
          }}
        >
          Yalnızca PDF dosyaları desteklenir.
        </Typography>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleFileChange}
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleSelectFile}
        >
          PDF Seç
        </Button>

        {fileName && (
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Seçilen dosya
            </Typography>

            <Typography
              sx={{
                fontWeight: 600,
              }}
            >
              {fileName}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

export default PdfUploadPanel;