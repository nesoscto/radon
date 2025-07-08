import GaugeComponent from 'react-gauge-component';

const DEFAULT_THRESHOLD = 200;
const envThreshold = Number(import.meta.env.VITE_RADON_THRESHOLD) || DEFAULT_THRESHOLD;

function RadonGauge({ value, min = 0, max = 400, threshold }) {
  const usedThreshold = typeof threshold === 'number' ? threshold : envThreshold;
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
          { limit: usedThreshold, color: '#5BE12C', showTick: true }, // green
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