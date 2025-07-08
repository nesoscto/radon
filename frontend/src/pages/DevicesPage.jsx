import { useEffect, useState } from 'react';
import { Box, Button, Typography, Container, List, ListItem, ListItemText, Alert, Dialog, DialogTitle, DialogContent, IconButton, CircularProgress } from '@mui/material';
import { Scanner } from '@yudiel/react-qr-scanner';
import AddIcon from '@mui/icons-material/Add';
import api from '../api/client';

function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [qrError, setQrError] = useState('');

  const fetchDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/devices/');
      setDevices(res.data);
    } catch (err) {
      setError('Failed to load devices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleScan = async (data) => {
    if (data) {
      setQrOpen(false);
      setQrError('');
      setSuccess('');
      setError('');
      try {
        await api.post('/devices/', { serial_number: data });
        setSuccess('Device added successfully!');
        fetchDevices();
      } catch (err) {
        setError('Failed to add device.');
      }
    }
  };

  const handleError = (err) => {
    setQrError('QR scan error. Please try again.');
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom align="center">My Devices</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setQrOpen(true)}
          sx={{ mb: 2 }}
        >
          Add Device (Scan QR Code)
        </Button>
        {success && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
        {loading ? (
          <CircularProgress />
        ) : (
          <List sx={{ width: '100%' }}>
            {devices.length === 0 ? (
              <ListItem><ListItemText primary="No devices found." /></ListItem>
            ) : (
              devices.map(device => (
                <ListItem key={device.id} divider>
                  <ListItemText
                    primary={device.serial_number}
                    secondary={`Added: ${new Date(device.date_created).toLocaleString()}`}
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
        <Dialog open={qrOpen} onClose={() => setQrOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Scan Device QR Code</DialogTitle>
          <DialogContent>
            {qrError && <Alert severity="error">{qrError}</Alert>}
            <Scanner
              onScan={(codes) => {
                if (codes && codes.length > 0) {
                  handleScan(codes[0].rawValue);
                }
              }}
              onError={handleError}
              constraints={{ facingMode: 'environment' }}
              styles={{ container: { width: '100%' } }}
            />
            <Button onClick={() => setQrOpen(false)} sx={{ mt: 2 }}>Cancel</Button>
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
}

export default DevicesPage; 