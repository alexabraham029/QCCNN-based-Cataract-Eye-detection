import { Link } from 'react-router-dom'
import QuantumBackground from '../components/QuantumBackground'
import MetricsPanel      from '../components/MetricsPanel'
import CircuitVisualizer from '../components/CircuitVisualizer'

const DEMO_CIRCUIT = {
  n_qubits: 4, n_layers: 2, trainable_params: 24, circuit_depth: 14,
  embedding: 'AngleEmbedding (Ry)', ansatz: 'StronglyEntanglingLayers', measurement: 'PauliZ',
}

export default function Home() {
  return (
    <div style={{ position: 'relative' }}>
      <QuantumBackground />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge fade-in">
              ⚛ Hybrid Quantum-Classical AI
            </div>

            <h1 className="fade-in-d1">
              Detect Cataracts<br />
              with <span className="gradient-text">Quantum Power</span>
            </h1>

            <p className="fade-in-d2">
              A cutting-edge Quantum Convolutional Neural Network (QCNN) that fuses
              classical deep learning with a 4-qubit variational quantum circuit
              to diagnose cataracts from eye images with high precision.
            </p>

            <div className="hero-cta fade-in-d3">
              <Link to="/detect" className="btn-primary" id="hero-cta-detect">
                🔬 Analyze Eye Image
              </Link>
              <Link to="/about" className="btn-outline" id="hero-cta-learn">
                Learn How It Works
              </Link>
            </div>

            <div className="hero-stats fade-in-d3">
              {[
                { val: '89.2%', lbl: 'Validation Accuracy' },
                { val: '4',     lbl: 'Quantum Qubits' },
                { val: '4,217', lbl: 'Training Images' },
                { val: '94.2%', lbl: 'AUC-ROC Score' },
              ].map(({ val, lbl }) => (
                <div className="stat-item" key={lbl}>
                  <h3>{val}</h3>
                  <p>{lbl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="section-label">Process</div>
          <h2 className="section-title">How QCNN Detects Cataracts</h2>
          <p className="section-sub">
            Three stages combine classical computer vision with quantum computation
            for a diagnosis you can trust.
          </p>

          <div className="steps-grid">
            {[
              { n: '01', icon: '📤', title: 'Upload Eye Image',
                desc: 'Upload a fundus or slit-lamp photograph. CLAHE contrast enhancement is applied automatically to highlight cataract features.' },
              { n: '02', icon: '⚛',  title: 'Quantum Processing',
                desc: 'ResNet18 extracts visual features → compressed to 4 values → encoded into a 4-qubit variational quantum circuit with entangling layers.' },
              { n: '03', icon: '📊', title: 'AI Diagnosis',
                desc: 'Quantum expectation values feed a classical output layer producing a confidence-weighted Cataract / Normal prediction.' },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} className="glass-card step-card">
                <div className="step-number">{n}</div>
                <div className="step-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Circuit Preview ── */}
      <section className="section" style={{ background: 'rgba(0,212,255,0.02)', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="section-label">Architecture</div>
          <h2 className="section-title">The Quantum Circuit</h2>
          <p className="section-sub" style={{ marginBottom: '40px' }}>
            Each image is processed through this 4-qubit parameterized circuit.
            Trainable rotation angles are optimized during classical backpropagation.
          </p>
          <CircuitVisualizer circuitInfo={DEMO_CIRCUIT} />
        </div>
      </section>

      {/* ── Metrics ── */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container">
          <div className="section-label">Performance</div>
          <h2 className="section-title">Model Metrics</h2>
          <p className="section-sub" style={{ marginBottom: '40px' }}>
            Evaluated on a held-out test set from the Eye Diseases Classification dataset.
          </p>
          <MetricsPanel />
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{
            padding: '64px 48px', borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(139,92,246,0.08))',
            border: '1px solid var(--border)',
          }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: '16px' }}>
              Ready to Try It?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px' }}>
              Upload any eye image and get an instant quantum-powered cataract analysis in seconds.
            </p>
            <Link to="/detect" className="btn-primary" id="cta-banner-detect">
              🔬 Start Detection →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
