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
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Device: {device.serial_number}</Typography>
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
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Recent Reading</Typography>
            <Typography>Value: {recent_reading.value ?? 'N/A'} <Typography component="span" variant="body2">{recent_reading.value ? units : ''}</Typography></Typography>
            <Typography>RSSI: {recent_reading.rssi ?? 'N/A'}</Typography>
            <Typography>Time: {recent_reading.timestamp ? new Date(recent_reading.timestamp).toLocaleString() : 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Averages ({units})</Typography>
            <Typography>24 hours: {averages['24_hours'] ?? 'N/A'}</Typography>
            <Typography>7 days: {averages['7_days'] ?? 'N/A'}</Typography>
            <Typography>30 days: {averages['30_days'] ?? 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle2">Details</Typography>
            <Typography>Device: {device.serial_number}</Typography>
          </Grid>
        </Grid>
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
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        {loading && <CircularProgress sx={{ my: 2 }} />}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && devices.length === 0 && (
          <Alert severity="info">No devices found. Add a device to see dashboard data.</Alert>
        )}
        {!loading && !error && (
          <Grid container spacing={3}>
            {devices.map(device => (
              <Grid item xs={12} md={6} lg={4} key={device.id}>
                <DeviceDashboard device={device} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

export default DashboardPage; 