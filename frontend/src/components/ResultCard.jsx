import CircuitVisualizer from './CircuitVisualizer'

/**
 * Confidence arc gauge (SVG semi-circle meter)
 */
function ConfidenceArc({ value, label, isPositive }) {
  const r = 60, cx = 80, cy = 80
  const circ = 2 * Math.PI * r
  const fill = circ * value
  const stroke = isPositive ? '#ef4444' : '#10b981'

  return (
    <div className="confidence-arc" style={{ width: 160, height: 160 }}>
      <svg viewBox="0 0 160 160" width="160" height="160">
        <circle cx={cx} cy={cy} r={r} className="arc-bg"
                style={{ fill: 'none', stroke: 'var(--border-mid)', strokeWidth: 10 }} />
        <circle cx={cx} cy={cy} r={r}
                style={{
                  fill: 'none', stroke, strokeWidth: 10, strokeLinecap: 'round',
                  strokeDasharray: `${fill} ${circ}`,
                  transform: 'rotate(-90deg)', transformOrigin: '50% 50%',
                  transition: 'stroke-dasharray 1.2s ease',
                }} />
      </svg>
      <div className="confidence-label">
        <span className="pct" style={{ color: stroke }}>{(value * 100).toFixed(1)}%</span>
        <span className="lbl">confidence</span>
      </div>
    </div>
  )
}

export default function ResultCard({ result, loading }) {
  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
        <div className="processing-ring" />
        <h3 style={{ marginBottom: '8px' }}>Quantum Processing…</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Running image through 4-qubit variational circuit
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          {['AngleEmbedding', 'Entangling', 'Measurement'].map((s, i) => (
            <div key={s} style={{
              padding: '4px 12px', background: 'var(--cyan-dim)',
              border: '1px solid var(--border)', borderRadius: '50px',
              fontSize: '0.75rem', color: 'var(--cyan)',
              animation: `pulse-glow 1.5s ${i * 0.4}s ease-in-out infinite`,
            }}>{s}</div>
          ))}
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👁</div>
        <h3 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>Awaiting Analysis</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Upload an eye image to receive a quantum-powered diagnosis
        </p>
      </div>
    )
  }

  const isCataract  = result.label === 'Cataract'
  const confidence  = result.confidence
  const probCat     = result.probabilities?.Cataract ?? 0
  const probNor     = result.probabilities?.Normal   ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Main result */}
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
        {result.demo_mode && (
          <div style={{ marginBottom: '12px', fontSize: '0.75rem', color: 'var(--amber)',
                        padding: '4px 12px', background: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.3)', borderRadius: '50px',
                        display: 'inline-block' }}>
            ⚡ Demo Mode — Upload your kaggle.json & train for real predictions
          </div>
        )}

        <ConfidenceArc value={confidence} isPositive={isCataract} />

        <div className={`result-badge ${isCataract ? 'cataract' : 'normal'}`}>
          {isCataract ? '🔴' : '🟢'} {result.label} Detected
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
          {isCataract
            ? 'Signs of cataract detected. Please consult an ophthalmologist for confirmation.'
            : 'No significant cataract signs found. Regular check-ups are still recommended.'}
        </p>

        <div style={{ marginTop: '24px', textAlign: 'left' }}>
          <div className="prob-bar">
            <div className="prob-bar-header">
              <span>Cataract</span><span>{(probCat * 100).toFixed(1)}%</span>
            </div>
            <div className="prob-bar-track">
              <div className="prob-bar-fill cataract" style={{ width: `${probCat * 100}%` }} />
            </div>
          </div>
          <div className="prob-bar">
            <div className="prob-bar-header">
              <span>Normal</span><span>{(probNor * 100).toFixed(1)}%</span>
            </div>
            <div className="prob-bar-track">
              <div className="prob-bar-fill normal" style={{ width: `${probNor * 100}%` }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '20px',
                      padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px',
                      justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--cyan)', fontWeight: 700 }}>{result.inference_time_ms} ms</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Inference Time</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--violet)', fontWeight: 700 }}>4 Qubits</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quantum Circuit</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--green)', fontWeight: 700 }}>Hybrid</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Architecture</div>
          </div>
        </div>
      </div>

      {/* Circuit diagram */}
      {result.circuit_info && <CircuitVisualizer circuitInfo={result.circuit_info} />}
    </div>
  )
}
