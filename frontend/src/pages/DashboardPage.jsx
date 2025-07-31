import { useEffect, useState } from 'react';
import { Box, Typography, Container, Card, CardContent, CircularProgress, Alert, Grid, Divider } from '@mui/material';
import api from '../api/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import RadonGauge from '../components/RadonGauge';

function DeviceDashboard({ device }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    api.get(`/devices/${device.serial_number}/dashboard/`)
      .then(res => {
        if (mounted) {
          setData(res.data);
        }
      })
      .catch(() => {
        if (mounted) setError('Failed to load dashboard data.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [device.serial_number]);

  if (loading) return <CircularProgress sx={{ my: 2 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const { recent_reading, averages, trend } = data;
  const alertThreshold = Number(import.meta.env.RADON_ALERT_THRESHOLD) || 200;
  const warningThreshold = Number(import.meta.env.RADON_WARNING_THRESHOLD) || 150;
  const alert = recent_reading.value && recent_reading.value > alertThreshold;
  const warning = recent_reading.value && recent_reading.value > warningThreshold && recent_reading.value <= alertThreshold;
  const units = (<>bq/m<sup>3</sup></>);

  return (
    <Card sx={{ mb: 4 }}>
      <Box sx={{ 
        bgcolor: 'primary.main', 
        color: 'white', 
        px: 2, 
        py: 1,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {device.name || device.serial_number} ({device.serial_number})
        </Typography>
      </Box>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <RadonGauge 
            value={recent_reading.value ?? 0} 
            alertThreshold={alertThreshold}
            warningThreshold={warningThreshold}
          />
        </Box>
        {alert && <Alert severity="error" sx={{ mb: 2 }}>Alert: Recent value {recent_reading.value} exceeds alert threshold!</Alert>}
        {warning && <Alert severity="warning" sx={{ mb: 2 }}>Warning: Recent value {recent_reading.value} exceeds warning threshold!</Alert>}
        <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', mb: 2 }}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={v => {
                  const d = new Date(v);
                  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                }}
                minTickGap={20}
                angle={-35}
                textAnchor="end"
                height={40}
              />
              <YAxis />
              <Tooltip labelFormatter={v => new Date(v).toLocaleString()} />
              <Line type="monotone" dataKey="value" stroke="#1976d2" dot={false} name="Value" />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Card variant="outlined" sx={{ p: 2, flex: { xs: 'none', sm: '1 1 0%' } }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Recent Reading</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">Value:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {recent_reading.value ?? 'N/A'} {recent_reading.value ? units : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">RSSI:</Typography>
                  <Typography variant="body1" fontWeight="medium">{recent_reading.rssi ?? 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">Time:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {recent_reading.timestamp ? new Date(recent_reading.timestamp).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Card>
            <Card variant="outlined" sx={{ p: 2, flex: { xs: 'none', sm: '1 1 0%' } }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Averages</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">24 hours:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {averages['24_hours'] ?? 'N/A'} {units}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">7 days:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {averages['7_days'] ?? 'N/A'} {units}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">30 days:</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {averages['30_days'] ?? 'N/A'} {units}
                  </Typography>
                </Box>
                              </Box>
              </Card>
            </Box>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api.get('/devices/')
      .then(res => setDevices(res.data))
      .catch(() => setError('Failed to load devices.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 4 } }}>
      <Box sx={{ mt: 2 }}>
        <Typography variant="h4" gutterBottom align="center">Dashboard</Typography>
        {loading && <CircularProgress sx={{ my: 2 }} />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && devices.length === 0 && (
          <Alert severity="info">No devices found. Add a device to see dashboard data.</Alert>
        )}
        {!loading && !error && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            width: '100%',
            flexWrap: 'wrap',
            gap: 3
          }}>
            {devices.map(device => (
              <Box key={device.id} sx={{ 
                width: { xs: '100%', md: 'calc(50% - 12px)' },
                maxWidth: 600
              }}>
                <DeviceDashboard device={device} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default DashboardPage; 