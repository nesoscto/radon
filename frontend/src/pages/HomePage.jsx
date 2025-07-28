import { useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { isAuthenticated } from '../api/client';
import { Box, Button, Typography, Container, Link } from '@mui/material';
import nesosLogoBlue from '../assets/nesos-logo-blue.png';

function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // If not authenticated, show login prompt with registration link
  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img 
          src={nesosLogoBlue} 
          alt="Nesos Group Logo" 
          style={{ 
            height: '60px', 
            width: 'auto',
            marginBottom: '24px'
          }} 
        />
        <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
          Welcome to the LoRaWAN Radon Sensor Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mb: 2 }}
          component={RouterLink}
          to="/login"
        >
          Login
        </Button>
        <Link component={RouterLink} to="/register" variant="body2">
          Create a new account
        </Link>
      </Box>
    </Container>
  );
}

export default HomePage; 