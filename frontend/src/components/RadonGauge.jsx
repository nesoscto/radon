import GaugeComponent from 'react-gauge-component';

const DEFAULT_ALERT_THRESHOLD = 200;
const DEFAULT_WARNING_THRESHOLD = 150;
const envAlertThreshold = Number(import.meta.env.RADON_ALERT_THRESHOLD) || DEFAULT_ALERT_THRESHOLD;
const envWarningThreshold = Number(import.meta.env.RADON_WARNING_THRESHOLD) || DEFAULT_WARNING_THRESHOLD;

function RadonGauge({ value, min = 0, max = 400, alertThreshold, warningThreshold }) {
  const usedAlertThreshold = typeof alertThreshold === 'number' ? alertThreshold : envAlertThreshold;
  const usedWarningThreshold = typeof warningThreshold === 'number' ? warningThreshold : envWarningThreshold;
  
  return (
    <GaugeComponent
      type="semicircle"
      value={value}
      minValue={min}
      maxValue={max}
      arc={{
        width: 0.2,
        padding: 0.005,
        subArcs: [
          { limit: usedWarningThreshold, color: '#5BE12C', showTick: true }, // green
          { limit: usedAlertThreshold, color: '#F5CD3D', showTick: true }, // yellow/amber
          { color: '#EA4228', showTick: true }, // red
        ],
      }}
      pointer={{
        color: '#1976d2',
        length: 0.8,
        width: 12,
      }}
      labels={{
        valueLabel: {
          formatTextValue: v => `${v} bq/m³`,
          style: { fontSize: 32, fill: '#222', fontWeight: 'bold' },
        },
        tickLabels: {
          type: 'outer',
          defaultTickValueConfig: { style: { fontSize: 12, fill: '#888' } },
        },
      }}
      style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}
    />
  );
}

export default RadonGauge; 