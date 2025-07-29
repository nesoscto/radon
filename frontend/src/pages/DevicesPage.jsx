import { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Container, 
  List, 
  ListItem, 
  ListItemText, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  CircularProgress,
  TextField,
  Grid
} from '@mui/material';
import { Scanner } from '@yudiel/react-qr-scanner';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import api from '../api/client';

function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [qrError, setQrError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    serial_number: ''
  });
  const [formErrors, setFormErrors] = useState({});

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

  const handleScan = (data) => {
    if (data) {
      setQrOpen(false);
      setQrError('');
      setFormData(prev => ({ ...prev, serial_number: data }));
    }
  };

  const handleError = (err) => {
    setQrError('QR scan error. Please try again.');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setError('');
    setSuccess('');

    // Validate form
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.serial_number.trim()) {
      errors.serial_number = 'Serial number is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await api.post('/devices/', formData);
      setSuccess('Device added successfully!');
      setFormOpen(false);
      setFormData({ name: '', serial_number: '' });
      fetchDevices();
    } catch (err) {
      if (err.response?.data) {
        // Handle Django REST Framework error format (arrays of strings)
        const errorData = err.response.data;
        const formattedErrors = {};
        
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            formattedErrors[key] = errorData[key][0]; // Take first error message
          } else {
            formattedErrors[key] = errorData[key];
          }
        });
        
        setFormErrors(formattedErrors);
      } else {
        setError('Failed to add device.');
      }
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom align="center">My Devices</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          sx={{ mb: 2 }}
        >
          Add Device
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
                    primary={device.name || device.serial_number}
                    secondary={`${device.serial_number} • Added: ${new Date(device.date_created).toLocaleString()}`}
                  />
                </ListItem>
              ))
            )}
          </List>
        )}

        {/* Add Device Form Dialog */}
        <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add New Device</DialogTitle>
          <DialogContent>
            {formErrors.detail && <Alert severity="error" sx={{ mb: 2 }}>{formErrors.detail}</Alert>}
            <Box component="form" onSubmit={handleFormSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Device Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                inputProps={{ maxLength: 100 }}
              />
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Serial Number"
                    value={formData.serial_number}
                    onChange={(e) => handleFormChange('serial_number', e.target.value)}
                    error={!!formErrors.serial_number}
                    helperText={formErrors.serial_number}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<QrCodeScannerIcon />}
                    onClick={() => setQrOpen(true)}
                    sx={{ mt: 2, height: 56 }}
                  >
                    Scan QR
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained">
                  Add Device
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        {/* QR Scanner Dialog */}
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