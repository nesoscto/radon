import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Alert, Container } from '@mui/material';
import api from '../api/client';
import nesosLogoBlue from '../assets/nesos-logo-blue.png';

function PasswordResetConfirmPage() {
  const { uidb64, token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (newPassword !== newPassword2) {
      setError('Passwords do not match');
      return;
    }
    try {
      await api.post(`/password-reset-confirm/${uidb64}/${token}/`, {
        new_password1: newPassword,
        new_password2: newPassword2,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('Failed to reset password. The link may be invalid or expired.');
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
        <Typography component="h1" variant="h5">Set New Password</Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirm New Password"
            type="password"
            value={newPassword2}
            onChange={e => setNewPassword2(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">Password reset successful! Redirecting to login...</Alert>}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            Set Password
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default PasswordResetConfirmPage; 