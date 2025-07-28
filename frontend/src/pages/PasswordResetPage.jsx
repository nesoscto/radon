import { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Container } from '@mui/material';
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
        <Typography component="h1" variant="h5">Password Recovery</Typography>
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
      </Box>
    </Container>
  );
}

export default PasswordResetPage; 