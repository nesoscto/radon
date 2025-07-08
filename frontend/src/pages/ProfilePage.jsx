import { useEffect, useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Container, Divider, Switch, FormControlLabel } from '@mui/material';
import api from '../api/client';

function ProfilePage() {
  const [profile, setProfile] = useState({ address: '', phone: '', alert_email_enabled: true });
  const [email, setEmail] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    api.get('/profile/')
      .then(res => {
        setProfile({
          address: res.data.address || '',
          phone: res.data.phone || '',
          alert_email_enabled: res.data.alert_email_enabled,
        });
        setEmail(res.data.email || '');
      })
      .catch(() => setProfileError('Failed to load profile.'));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    try {
      await api.put('/profile/', profile);
      setProfileMsg('Profile updated successfully!');
    } catch (err) {
      setProfileError('Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');
    try {
      await api.post('/password-change/', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPwMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwError('Failed to change password.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ px: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom align="center">Profile</Typography>
        <Typography align="center">Email: {email}</Typography>
        <Divider sx={{ my: 2, width: '100%' }} />
        <Typography variant="h6" align="center">Edit Profile</Typography>
        <Box component="form" onSubmit={handleProfileSubmit} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
          <TextField
            margin="normal"
            fullWidth
            label="Address"
            value={profile.address}
            onChange={e => setProfile({ ...profile, address: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Phone"
            value={profile.phone}
            onChange={e => setProfile({ ...profile, phone: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={!!profile.alert_email_enabled}
                onChange={e => setProfile({ ...profile, alert_email_enabled: e.target.checked })}
                name="alert_email_enabled"
                color="primary"
              />
            }
            label="Enable alert emails"
            sx={{ mt: 2 }}
          />
          {profileMsg && <Alert severity="success" sx={{ width: '100%' }}>{profileMsg}</Alert>}
          {profileError && <Alert severity="error" sx={{ width: '100%' }}>{profileError}</Alert>}
          <Button type="submit" variant="contained" sx={{ mt: 2, width: '100%' }}>Save</Button>
        </Box>
        <Divider sx={{ my: 4, width: '100%' }} />
        <Typography variant="h6" align="center">Change Password</Typography>
        <Box component="form" onSubmit={handlePasswordChange} sx={{ mt: 1, width: '100%', maxWidth: 400 }}>
          <TextField
            margin="normal"
            fullWidth
            label="Old Password"
            type="password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          {pwMsg && <Alert severity="success" sx={{ width: '100%' }}>{pwMsg}</Alert>}
          {pwError && <Alert severity="error" sx={{ width: '100%' }}>{pwError}</Alert>}
          <Button type="submit" variant="contained" sx={{ mt: 2, width: '100%' }}>Change Password</Button>
        </Box>
      </Box>
    </Container>
  );
}

export default ProfilePage; 