import GaugeComponent from 'react-gauge-component';

const DEFAULT_ALERT_THRESHOLD = 200;
const DEFAULT_WARNING_THRESHOLD = 150;
const envAlertThreshold = Number(import.meta.env.RADON_ALERT_THRESHOLD) || DEFAULT_ALERT_THRESHOLD;
const envWarningThreshold = Number(import.meta.env.RADON_WARNING_THRESHOLD) || DEFAULT_WARNING_THRESHOLD;

function RadonGauge({ value, min = 0, max = 2500, alertThreshold, warningThreshold }) {
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
        padding: 0,
        cornerRadius: 1,
        subArcs: [
          { limit: usedWarningThreshold, color: '#5BE12C', showTick: true }, // green
          { limit: usedAlertThreshold, color: '#F5CD3D', showTick: true, tooltip: {text: "Warning"} }, // yellow/amber
          { color: '#EA4228', showTick: false, tooltip: {text: "Alert - Action Required"} }, // red
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
          defaultTickValueConfig: { style: { fontSize: "12px", fill: '#888' } },
        },
      }}
      style={{ width: 450, margin: '0 auto' }}
    />
  );
}

export default RadonGauge; 