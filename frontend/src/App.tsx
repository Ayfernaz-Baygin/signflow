import { Box } from '@mui/material';
import Header from './components/layout/Header';
import SignPage from './pages/SignPage';

function App() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Header />
      <SignPage />
    </Box>
  );
}

export default App;