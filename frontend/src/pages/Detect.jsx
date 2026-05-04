import { useState } from 'react'
import UploadPanel from '../components/UploadPanel'
import ResultCard  from '../components/ResultCard'
import MetricsPanel from '../components/MetricsPanel'

export default function Detect() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="page">
      <div className="container" style={{ paddingBottom: '80px' }}>

        {/* Page header */}
        <div style={{ paddingTop: '40px', marginBottom: '40px' }}>
          <div className="section-label">Detection</div>
          <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', marginBottom: '12px' }}>
            Quantum Cataract <span className="gradient-text">Analyzer</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '560px' }}>
            Upload a fundus or slit-lamp eye photograph. The hybrid QCNN will
            process it through a 4-qubit quantum circuit and return a diagnosis.
          </p>
        </div>

        {/* Main two-column layout */}
        <div className="detect-layout">
          {/* Left — upload */}
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
              01 · Upload Image
            </h2>
            <UploadPanel onResult={setResult} onLoading={setLoading} />
          </div>

          {/* Right — results */}
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
              02 · Quantum Analysis
            </h2>
            <ResultCard result={result} loading={loading} />
          </div>
        </div>

        {/* Metrics below */}
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-secondary)' }}>
            03 · Model Performance Metrics
          </h2>
          <MetricsPanel />
        </div>

        {/* Training tip */}
        <div style={{
          marginTop: '40px', padding: '24px 28px',
          background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 'var(--radius-md)',
        }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '10px', color: 'var(--violet)' }}>
            ⚛ Running in Demo Mode?
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            To train the real QCNN model:
          </p>
          <ol style={{ paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 2, marginTop: '6px' }}>
            <li>Add your Kaggle credentials to <code style={{ color: 'var(--cyan)' }}>backend/.env</code></li>
            <li>Run <code style={{ color: 'var(--cyan)' }}>python download_dataset.py</code> in <code style={{ color: 'var(--cyan)' }}>backend/</code></li>
            <li>Run <code style={{ color: 'var(--cyan)' }}>python -m model.train --data_dir dataset/train</code></li>
            <li>Restart the FastAPI server — it will auto-load the trained weights</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
