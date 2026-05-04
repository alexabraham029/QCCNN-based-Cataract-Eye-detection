import CircuitVisualizer from '../components/CircuitVisualizer'

const CIRCUIT = {
  n_qubits: 4, n_layers: 2, trainable_params: 24,
  circuit_depth: 14, embedding: 'AngleEmbedding (Ry)',
  ansatz: 'StronglyEntanglingLayers', measurement: 'PauliZ expectation values',
}

const STACK = [
  { icon: '⚛',  name: 'PennyLane',   role: 'Quantum circuit simulation & autodiff', color: 'var(--cyan)' },
  { icon: '🔥',  name: 'PyTorch',     role: 'Deep learning framework & backprop',    color: 'var(--red)' },
  { icon: '🏛',  name: 'ResNet-18',   role: 'Classical CNN backbone (ImageNet)',      color: 'var(--blue)' },
  { icon: '🚀',  name: 'FastAPI',     role: 'High-performance REST API',             color: 'var(--green)' },
  { icon: '⚡',  name: 'React + Vite','role': 'Frontend framework',                  color: 'var(--violet)' },
  { icon: '👁',  name: 'OpenCV',      role: 'CLAHE image enhancement',               color: 'var(--amber)' },
]

export default function About() {
  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: '100px' }}>

        {/* Header */}
        <div style={{ paddingTop: '48px', marginBottom: '64px', maxWidth: '680px' }}>
          <div className="section-label">About</div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', marginBottom: '20px' }}>
            How the <span className="gradient-text">QCNN</span> Works
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8 }}>
            This project implements a <strong style={{ color: 'var(--text-primary)' }}>Hybrid Quantum-Classical
            Convolutional Neural Network</strong> — a novel architecture that fuses the feature-extraction
            power of classical deep learning with the expressive capacity of parameterized quantum circuits.
          </p>
        </div>

        {/* Architecture Flow */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Pipeline Architecture</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
            A classical CNN extracts features; a quantum layer classifies them.
          </p>

          <div className="arch-flow" style={{ gridTemplateColumns: 'repeat(9, 1fr)', gap: 0 }}>
            {[
              { icon: '🖼', title: 'Eye Image', sub: '224×224 RGB', q: false },
              null,
              { icon: '🏛', title: 'ResNet-18', sub: '512-dim features', q: false },
              null,
              { icon: '📉', title: 'Compress', sub: '512 → 4 dims', q: false },
              null,
              { icon: '⚛', title: '4-Qubit VQC', sub: 'AngleEmbed + SEL', q: true },
              null,
              { icon: '📊', title: 'Diagnosis', sub: 'Cataract / Normal', q: false },
            ].map((node, i) =>
              node === null ? (
                <div key={i} className="arch-arrow">→</div>
              ) : (
                <div key={i} className={`arch-node ${node.q ? 'quantum' : ''}`}>
                  <div className="arch-node-icon">{node.icon}</div>
                  <h4>{node.title}</h4>
                  <p>{node.sub}</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Circuit */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>The Quantum Circuit</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
            Built with PennyLane's <code style={{ color: 'var(--cyan)' }}>default.qubit</code> simulator.
            The variational ansatz uses <strong style={{ color: 'var(--text-primary)' }}>StronglyEntanglingLayers</strong> —
            a hardware-efficient circuit with full qubit connectivity and 24 trainable parameters
            optimized end-to-end via classical backpropagation.
          </p>
          <CircuitVisualizer circuitInfo={CIRCUIT} />
        </div>

        {/* Key Concepts */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '32px' }}>Key Quantum Concepts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '20px' }}>
            {[
              { title: 'Angle Embedding', icon: '📐',
                desc: 'Classical feature values θᵢ are encoded as rotation angles of Ry gates on each qubit, mapping the 4-dim feature vector into quantum state amplitudes.' },
              { title: 'Entanglement', icon: '🔗',
                desc: 'CNOT gates create quantum entanglement between qubits, allowing the circuit to model correlations between features that classical networks handle with more parameters.' },
              { title: 'Variational Ansatz', icon: '🌀',
                desc: 'StronglyEntanglingLayers apply parameterized Rx, Ry, Rz rotations + CNOT gates. The 24 angles are trained via gradient descent using the parameter-shift rule.' },
              { title: 'PauliZ Measurement', icon: '📏',
                desc: 'After the circuit, the expectation value ⟨Z⟩ is measured for each qubit, producing 4 classical values that feed the final linear classification layer.' },
            ].map(({ title, icon, desc }) => (
              <div key={title} className="glass-card" style={{ padding: '28px' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>{icon}</div>
                <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>{title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dataset */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>Dataset</h2>
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
              <div>
                <h3 style={{ marginBottom: '8px' }}>Eye Diseases Classification</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '440px', lineHeight: 1.7 }}>
                  A curated fundus image dataset with 4,217 images across 4 classes
                  (Cataract, Normal, Glaucoma, Diabetic Retinopathy). We train the QCNN
                  exclusively on <strong style={{ color: 'var(--text-primary)' }}>Cataract vs. Normal</strong> for
                  the binary classification task.
                </p>
                <a href="https://www.kaggle.com/datasets/gunavenkatdoddi/eye-diseases-classification"
                   target="_blank" rel="noreferrer" className="btn-outline"
                   style={{ marginTop: '16px', display: 'inline-flex', fontSize: '0.85rem' }}>
                  View on Kaggle ↗
                </a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
                {[
                  { label: 'Total Images', value: '4,217' },
                  { label: 'Cataract',     value: '~1,098' },
                  { label: 'Normal',       value: '~1,074' },
                  { label: 'Train / Val',  value: '80 / 20 %' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '24px',
                                            padding: '8px 0', borderBottom: '1px solid var(--border-mid)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '24px' }}>Technology Stack</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
            {STACK.map(({ icon, name, role, color }) => (
              <div key={name} className="glass-card" style={{ padding: '20px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color, marginBottom: '4px' }}>{name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
