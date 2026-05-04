/**
 * SVG visualization of the 4-qubit quantum circuit used inside the QCNN.
 * Shows: AngleEmbedding (Ry gates) → StronglyEntanglingLayers → PauliZ measurement
 */
export default function CircuitVisualizer({ circuitInfo }) {
  const qubits   = circuitInfo?.n_qubits  ?? 4
  const layers   = circuitInfo?.n_layers  ?? 2

  // Layout constants
  const W = 700, H = 200
  const wireY    = (q) => 30 + q * 46   // y-coord for qubit q
  const wireColor = 'rgba(0,212,255,0.25)'
  const gateColor = 'rgba(0,212,255,0.15)'
  const gateStroke = '#00d4ff'
  const cnotColor  = '#8b5cf6'

  // Gate x-positions
  const ryX   = [80, 130]                     // two Ry columns (one per qubit pair)
  const cnotX = [220, 320, 420]               // CNOT columns (two entangling layers)
  const rzX   = [510]                         // Rz column
  const measX = 620                           // Measurement

  const Gate = ({ x, y, label, color = gateColor, stroke = gateStroke, small = false }) => {
    const w = small ? 32 : 42, h = 26
    return (
      <g>
        <rect x={x - w/2} y={y - h/2} width={w} height={h}
              rx="5" fill={color} stroke={stroke} strokeWidth="1.2" />
        <text x={x} y={y + 4.5} textAnchor="middle"
              fill={stroke} fontSize={small ? '9' : '10'} fontFamily="monospace" fontWeight="600">
          {label}
        </text>
      </g>
    )
  }

  const CNOT = ({ x, control, target }) => {
    const cy = wireY(control), ty = wireY(target)
    return (
      <g>
        <line x1={x} y1={cy} x2={x} y2={ty} stroke={cnotColor} strokeWidth="1.5" />
        <circle cx={x} cy={cy} r="5" fill={cnotColor} />
        <circle cx={x} cy={ty} r="9" fill="none" stroke={cnotColor} strokeWidth="1.5" />
        <line x1={x-9} y1={ty} x2={x+9} y2={ty} stroke={cnotColor} strokeWidth="1.5" />
        <line x1={x} y1={ty-9} x2={x} y2={ty+9} stroke={cnotColor} strokeWidth="1.5" />
      </g>
    )
  }

  const Measure = ({ x, y }) => (
    <g>
      <rect x={x - 18} y={y - 13} width={36} height={26}
            rx="5" fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" strokeWidth="1.2" />
      <path d={`M${x-10},${y+6} Q${x},${y-6} ${x+10},${y+6}`}
            fill="none" stroke="#8b5cf6" strokeWidth="1.2" />
      <line x1={x} y1={y+6} x2={x+8} y2={y-2} stroke="#8b5cf6" strokeWidth="1.2" />
    </g>
  )

  return (
    <div className="circuit-container">
      <h3>⚛ Quantum Circuit (4 Qubits · 2 Variational Layers)</h3>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: '480px' }}>
        {/* Qubit wires */}
        {Array.from({ length: qubits }).map((_, q) => (
          <g key={q}>
            <line x1={16} y1={wireY(q)} x2={W - 16} y2={wireY(q)}
                  stroke={wireColor} strokeWidth="1.5" />
            <text x={8} y={wireY(q) + 4} textAnchor="middle"
                  fill="#94a3b8" fontSize="10" fontFamily="monospace">
              q{q}
            </text>
          </g>
        ))}

        {/* Input labels */}
        <text x={16} y={wireY(0) - 14} fill="#475569" fontSize="8" fontFamily="monospace">INPUT ENCODING</text>

        {/* AngleEmbedding — Ry gates */}
        {Array.from({ length: qubits }).map((_, q) => (
          <Gate key={q} x={80} y={wireY(q)} label="Ry(θ)" />
        ))}

        {/* Layer 1: CNOT ring */}
        <text x={220} y={wireY(0) - 14} fill="#475569" fontSize="8" fontFamily="monospace">LAYER 1</text>
        <CNOT x={210} control={0} target={1} />
        <CNOT x={260} control={1} target={2} />
        <CNOT x={310} control={2} target={3} />
        {Array.from({ length: qubits }).map((_, q) => (
          <Gate key={q} x={370} y={wireY(q)} label="Rz(φ)" />
        ))}

        {/* Layer 2: CNOT ring */}
        <text x={420} y={wireY(0) - 14} fill="#475569" fontSize="8" fontFamily="monospace">LAYER 2</text>
        <CNOT x={430} control={3} target={0} />
        <CNOT x={480} control={0} target={2} />
        {Array.from({ length: qubits }).map((_, q) => (
          <Gate key={q} x={530} y={wireY(q)} label="Rx(ψ)" small />
        ))}

        {/* Measurement */}
        <text x={measX} y={wireY(0) - 14} fill="#8b5cf6" fontSize="8" fontFamily="monospace">MEASURE</text>
        {Array.from({ length: qubits }).map((_, q) => (
          <Measure key={q} x={measX} y={wireY(q)} />
        ))}

        {/* Animated pulse on wire 0 */}
        <circle r="4" fill="#00d4ff" opacity="0.8">
          <animateMotion dur="3s" repeatCount="indefinite"
            path={`M16,${wireY(0)} L${W-16},${wireY(0)}`} />
        </circle>
        <circle r="3" fill="#8b5cf6" opacity="0.7">
          <animateMotion dur="3.5s" repeatCount="indefinite" begin="1s"
            path={`M16,${wireY(2)} L${W-16},${wireY(2)}`} />
        </circle>
      </svg>

      {/* Circuit stats */}
      {circuitInfo && (
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            ['Qubits',      circuitInfo.n_qubits],
            ['Layers',      circuitInfo.n_layers],
            ['Params',      circuitInfo.trainable_params],
            ['Depth',       circuitInfo.circuit_depth],
            ['Embedding',   'AngleEmbed'],
            ['Measurement', 'PauliZ'],
          ].map(([k, v]) => (
            <div key={k} style={{ fontSize: '0.75rem' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>{k}</div>
              <div style={{ color: 'var(--cyan)', fontWeight: 600 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
