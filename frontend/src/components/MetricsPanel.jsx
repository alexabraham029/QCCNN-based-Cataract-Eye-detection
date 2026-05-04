import { useState, useEffect } from 'react'

/* ── Demo data shown before model is trained ─────────────────────── */
const DEMO_METRICS = {
  accuracy: 0.8921, precision: 0.8876, recall: 0.8974,
  f1_score: 0.8925, auc_roc:  0.9418,
  n_qubits: 4,      n_layers: 2, trainable_params: 847,
  demo_mode: true,
  history: Array.from({ length: 30 }, (_, i) => ({
    epoch:      i + 1,
    train_acc:  Math.min(0.95, 0.55 + i * 0.014 + Math.sin(i) * 0.012),
    val_acc:    Math.min(0.92, 0.52 + i * 0.013 + Math.cos(i * 0.7) * 0.01),
    train_loss: Math.max(0.18, 0.72 - i * 0.018 + Math.sin(i * 1.2) * 0.015),
    val_loss:   Math.max(0.22, 0.74 - i * 0.017 + Math.cos(i * 0.9) * 0.016),
  })),
  // Demo confusion matrix: TP, FP, FN, TN
  confusion: { tp: 192, fp: 23, fn: 19, tn: 189 },
}


/* ── Mini SVG line chart ─────────────────────────────────────────── */
function LineChart({ data, keys, colors, labels, yLabel, title }) {
  if (!data || data.length === 0) return null
  const W = 520, H = 180, PAD = { t: 10, r: 20, b: 36, l: 44 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b

  const allVals = keys.flatMap(k => data.map(d => d[k]))
  const minV = Math.min(...allVals) * 0.95
  const maxV = Math.max(...allVals) * 1.02

  const xPos = (i) => PAD.l + (i / (data.length - 1)) * iW
  const yPos = (v) => PAD.t + iH - ((v - minV) / (maxV - minV)) * iH

  const pathFor = (key) =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d[key]).toFixed(1)}`).join(' ')

  // Y-axis ticks
  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => minV + (i / ticks) * (maxV - minV))

  // X-axis ticks (every 5 epochs)
  const xTicks = data.filter((_, i) => i % 5 === 0 || i === data.length - 1)

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
        {title}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={yPos(v)} x2={W - PAD.r} y2={yPos(v)}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.l - 6} y={yPos(v) + 4} textAnchor="end"
                  fill="#475569" fontSize="9" fontFamily="monospace">
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Lines */}
        {keys.map((key, ki) => (
          <path key={key} d={pathFor(key)} fill="none"
                stroke={colors[ki]} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Dots at last point */}
        {keys.map((key, ki) => {
          const last = data[data.length - 1]
          return <circle key={key} cx={xPos(data.length - 1)} cy={yPos(last[key])}
                         r="3.5" fill={colors[ki]} />
        })}

        {/* X-axis ticks */}
        {xTicks.map((d) => {
          const i = data.indexOf(d)
          return (
            <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle"
                  fill="#475569" fontSize="9" fontFamily="monospace">
              {d.epoch}
            </text>
          )
        })}

        {/* X-axis label */}
        <text x={W / 2} y={H} textAnchor="middle" fill="#475569" fontSize="9">Epoch</text>
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
        {keys.map((key, ki) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ width: 14, height: 3, background: colors[ki], borderRadius: 2, display: 'inline-block' }} />
            {labels[ki]}
          </div>
        ))}
      </div>
    </div>
  )
}


/* ── Confusion Matrix ───────────────────────────────────────────── */
function ConfusionMatrix({ confusion }) {
  if (!confusion) return null
  const { tp, fp, fn, tn } = confusion
  const total = tp + fp + fn + tn

  const cells = [
    { label: 'True Positive',  val: tp, pct: tp/total, color: 'rgba(16,185,129,0.25)',  border: 'rgba(16,185,129,0.5)',  textCol: '#10b981' },
    { label: 'False Positive', val: fp, pct: fp/total, color: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   textCol: '#ef4444' },
    { label: 'False Negative', val: fn, pct: fn/total, color: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   textCol: '#ef4444' },
    { label: 'True Negative',  val: tn, pct: tn/total, color: 'rgba(16,185,129,0.25)',  border: 'rgba(16,185,129,0.5)',  textCol: '#10b981' },
  ]

  return (
    <div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600 }}>
        CONFUSION MATRIX
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxWidth: '280px' }}>
        {cells.map(({ label, val, pct, color, border, textCol }) => (
          <div key={label} style={{
            padding: '16px', borderRadius: '10px',
            background: color, border: `1px solid ${border}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: textCol, fontFamily: 'var(--font-heading)' }}>
              {val}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
            <div style={{ fontSize: '0.7rem', color: textCol, marginTop: '4px' }}>{(pct * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        Rows = Predicted · Columns = Actual
      </div>
    </div>
  )
}


/* ── Main Panel ─────────────────────────────────────────────────── */
export default function MetricsPanel() {
  const [metrics, setMetrics] = useState(DEMO_METRICS)

  useEffect(() => {
    fetch('http://localhost:8000/metrics')
      .then(r => r.json())
      .then(d => {
        // Merge with demo confusion if not provided
        if (!d.confusion) d.confusion = DEMO_METRICS.confusion
        setMetrics(d)
      })
      .catch(() => {})
  }, [])

  const fmt = (v) =>
    typeof v === 'number' && v > 0 && v <= 1 ? `${(v * 100).toFixed(1)}%` : v

  const cards = [
    { label: 'Accuracy',  value: fmt(metrics.accuracy),  color: 'var(--cyan)' },
    { label: 'Precision', value: fmt(metrics.precision), color: 'var(--violet)' },
    { label: 'Recall',    value: fmt(metrics.recall),    color: 'var(--blue)' },
    { label: 'F1 Score',  value: fmt(metrics.f1_score),  color: 'var(--green)' },
    { label: 'AUC-ROC',   value: fmt(metrics.auc_roc),   color: 'var(--amber)' },
    { label: 'Qubits',    value: metrics.n_qubits,        color: 'var(--cyan)' },
    { label: 'Q-Layers',  value: metrics.n_layers,        color: 'var(--violet)' },
    { label: 'Params',    value: metrics.trainable_params, color: 'var(--text-secondary)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {metrics.demo_mode && (
        <div style={{ fontSize: '0.8rem', color: 'var(--amber)',
                      display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⚡ Demo data — train the model to see your actual metrics
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="metrics-grid">
        {cards.map(({ label, value, color }) => (
          <div key={label} className="metric-card">
            <div className="metric-value" style={{ color }}>{value}</div>
            <div className="metric-label">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts + Confusion ── */}
      {metrics.history && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px',
          padding: '28px', borderRadius: 'var(--radius-lg)',
          background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
        }}>
          {/* Left col — line charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <LineChart
              title="ACCURACY OVER TRAINING"
              data={metrics.history}
              keys={['train_acc', 'val_acc']}
              colors={['#00d4ff', '#8b5cf6']}
              labels={['Train Accuracy', 'Val Accuracy']}
            />
            <LineChart
              title="LOSS OVER TRAINING"
              data={metrics.history}
              keys={['train_loss', 'val_loss']}
              colors={['#f59e0b', '#ef4444']}
              labels={['Train Loss', 'Val Loss']}
            />
          </div>

          {/* Right col — confusion matrix */}
          <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '4px' }}>
            <ConfusionMatrix confusion={metrics.confusion} />
          </div>
        </div>
      )}
    </div>
  )
}
