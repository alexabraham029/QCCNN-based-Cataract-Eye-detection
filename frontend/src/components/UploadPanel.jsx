import { useState, useRef } from 'react'

const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp']

export default function UploadPanel({ onResult, onLoading }) {
  const [preview,  setPreview]  = useState(null)
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState(null)
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      setError('Please upload a JPEG or PNG image.')
      return
    }
    setError(null)
    setPreview(URL.createObjectURL(file))
    onLoading(true)

    const form = new FormData()
    form.append('file', file)

    try {
      const res  = await fetch('http://localhost:8000/predict', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      onResult(data)
    } catch (e) {
      setError(`API error: ${e.message}`)
      onResult(null)
    } finally {
      onLoading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div>
      <div
        id="upload-zone"
        className={`upload-zone ${dragging ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current.click()}
      >
        <input
          ref={fileRef} type="file" accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])}
          style={{ display: 'none' }}
        />

        {preview ? (
          <>
            <img src={preview} alt="Preview" className="preview-img" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Click or drop a new image to replace
            </p>
          </>
        ) : (
          <>
            <span className="upload-icon">🔬</span>
            <h3>Drop Eye Image Here</h3>
            <p>Drag & drop or click to browse<br />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Supports JPEG · PNG · BMP
              </span>
            </p>
          </>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '12px', padding: '12px 16px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px', color: '#ef4444', fontSize: '0.85rem',
        }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-card)',
                    border: '1px solid var(--border-mid)', borderRadius: '10px', fontSize: '0.82rem',
                    color: 'var(--text-muted)', lineHeight: 1.8 }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Tips for best results:</strong>
        <ul style={{ paddingLeft: '16px', marginTop: '6px' }}>
          <li>Use a clear, front-facing eye / fundus image</li>
          <li>Ensure good lighting with no blur</li>
          <li>Avoid images with heavy filters or overlays</li>
        </ul>
      </div>
    </div>
  )
}
