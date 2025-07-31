import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { TextField, Button, Box, Typography, Alert, Container, Card, CardContent } from '@mui/material';
import api from '../api/client';
import nesosLogoBlue from '../assets/nesos-logo-blue.png';

function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      await api.post('/password-reset/', { email });
      setSuccess(true);
    } catch (err) {
      setError('Failed to send password reset email.');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Container maxWidth="xs">
        <Card sx={{ p: 3, boxShadow: 3 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            '&:hover': {
              opacity: 0.8,
            },
          }}
        >
          <img 
            src={nesosLogoBlue} 
            alt="Nesos Group Logo" 
            style={{ 
              width: '320px', 
              height: 'auto',
              marginBottom: '48px'
            }} 
          />
        </Box>
        <Typography component="h1" variant="h5" sx={{ fontWeight: "bold"}}>Password Recovery</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">If the email exists, a reset link has been sent.</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Send Reset Email
          </Button>
        </Box>
                </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default PasswordResetPage; 