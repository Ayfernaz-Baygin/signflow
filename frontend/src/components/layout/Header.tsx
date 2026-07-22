import {
  AppBar,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';

function Header() {
  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E4E7EC',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          sx={{
            minHeight: 72,
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.5px',
            }}
          >
            SignFlow
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Header;