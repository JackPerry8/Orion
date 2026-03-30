import { useState, useEffect, useRef, useCallback } from 'react'

// ─── Safe fetch helper ────────────────────────────────────────────────────────
async function parseResponse(res) {
  const text = await res.text()
  if (!text.trim()) return {}
  try { return JSON.parse(text) }
  catch { throw new Error(`Unexpected server response (HTTP ${res.status}): ${text.slice(0, 120)}`) }
}

// ─── Speaker helpers ──────────────────────────────────────────────────────────
const SPEAKER_COLORS = [
  { dot: 'bg-blue-500',    badge: 'bg-blue-500/15 border-blue-500/30',    label: 'text-blue-400'    },
  { dot: 'bg-violet-500',  badge: 'bg-violet-500/15 border-violet-500/30', label: 'text-violet-400'  },
  { dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 border-emerald-500/30',label:'text-emerald-400' },
  { dot: 'bg-amber-500',   badge: 'bg-amber-500/15 border-amber-500/30',   label: 'text-amber-400'   },
  { dot: 'bg-rose-500',    badge: 'bg-rose-500/15 border-rose-500/30',     label: 'text-rose-400'    },
  { dot: 'bg-cyan-500',    badge: 'bg-cyan-500/15 border-cyan-500/30',     label: 'text-cyan-400'    },
]

function speakerColor(idx) {
  return SPEAKER_COLORS[idx % SPEAKER_COLORS.length]
}

/** Extract unique "Speaker N" labels from a transcript string, sorted numerically. */
function extractSpeakerKeys(text) {
  const matches = [...text.matchAll(/^(Speaker \d+):/gm)]
  const unique = [...new Set(matches.map(m => m[1]))]
  return unique.sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]))
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const WaveformIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <line x1="2"  y1="12" x2="4"  y2="12" /><line x1="6"  y1="8"  x2="6"  y2="16" />
    <line x1="10" y1="5"  x2="10" y2="19" /><line x1="14" y1="8"  x2="14" y2="16" />
    <line x1="18" y1="10" x2="18" y2="14" /><line x1="22" y1="12" x2="20" y2="12" />
  </svg>
)
const SunIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1"  x2="12" y2="3"  /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)
const MoonIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)
const GearIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)
const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
)
const MicIcon = ({ size = 8 }) => (
  <svg className={`w-${size} h-${size}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)
const StopIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
)
const UploadIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)
const DownloadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const CheckIcon = ({ sm } = {}) => (
  <svg className={sm ? 'w-4 h-4' : 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const XIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const SpinnerIcon = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
)
const EyeIcon = ({ open }) => open ? (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
) : (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t) }, [onClose])
  const bg = type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
  return (
    <div className={`fixed bottom-5 right-5 ${bg} text-white px-4 py-3 rounded-xl shadow-2xl z-50 max-w-sm flex items-start gap-3 text-sm`}>
      <span className="flex-1 leading-relaxed">{message}</span>
      <button onClick={onClose} className="text-white/70 hover:text-white mt-0.5 shrink-0 text-lg leading-none">×</button>
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ children, dark, className = '' }) {
  return (
    <div className={`rounded-2xl p-6 shadow-sm border transition-colors duration-300
      ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} ${className}`}>
      {children}
    </div>
  )
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, dark }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${checked ? 'bg-blue-600' : dark ? 'bg-slate-600' : 'bg-gray-300'}`}
    >
      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow
        transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

function SettingsPage({ dark, showToast, onBack, onSaved }) {
  const [status, setStatus]     = useState({ anthropic_key_set: false, hf_token_set: false })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [anthropicKey, setAnthropicKey] = useState('')
  const [hfToken, setHfToken]   = useState('')
  const [showAk, setShowAk]     = useState(false)
  const [showHf, setShowHf]     = useState(false)

  const muted   = dark ? 'text-slate-400' : 'text-gray-500'
  const inputCls = `w-full rounded-xl px-4 py-2.5 pr-10 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow font-mono
    ${dark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => setStatus(d))
      .catch(() => {
        showToast('Could not reach the backend. Start the app with both frontend and backend running.', 'error')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!anthropicKey.trim() && !hfToken.trim()) {
      showToast('Enter at least one key to save.', 'error'); return
    }
    setSaving(true)
    try {
      const body = {}
      if (anthropicKey.trim()) body.anthropic_api_key = anthropicKey.trim()
      if (hfToken.trim())      body.hf_token = hfToken.trim()

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await parseResponse(res)
      if (!res.ok) throw new Error(data.detail || 'Save failed')

      setStatus(data)
      setAnthropicKey('')
      setHfToken('')
      showToast('Settings saved!', 'success')
      onSaved(data)
    } catch (err) {
      const message = err?.message === 'Failed to fetch'
        ? 'Could not reach the backend to save settings. Make sure the backend is running on localhost:8000.'
        : err.message
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const StatusBadge = ({ set }) => set
    ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-500"><CheckIcon sm />Configured</span>
    : <span className="flex items-center gap-1 text-xs font-medium text-red-400"><XIcon />Not set</span>

  const RevealInput = ({ value, onChange, show, onToggle, placeholder }) => (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="button"
        onClick={onToggle}
        className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted} hover:text-current transition-colors`}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-5">
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-sm ${muted} hover:text-current transition-colors mb-2`}
      >
        <ArrowLeftIcon /> Back
      </button>

      <Card dark={dark}>
        <h2 className="text-base font-semibold mb-1">API Keys</h2>
        <p className={`text-xs mb-6 ${muted}`}>
          Keys are stored in your local <code className="font-mono">.env</code> file and never sent anywhere except the respective APIs.
        </p>

        {loading ? (
          <div className="flex justify-center py-8"><SpinnerIcon /></div>
        ) : (
          <div className="space-y-6">

            {/* Anthropic */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Anthropic API Key</label>
                <StatusBadge set={status.anthropic_key_set} />
              </div>
              <RevealInput
                value={anthropicKey}
                onChange={setAnthropicKey}
                show={showAk}
                onToggle={() => setShowAk(v => !v)}
                placeholder={status.anthropic_key_set ? '••••••••  (leave blank to keep current)' : 'sk-ant-…'}
              />
              <p className={`text-xs ${muted}`}>
                Get your key at{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:underline">console.anthropic.com</a>
              </p>
            </div>

            {/* HF Token */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Hugging Face Token</label>
                <StatusBadge set={status.hf_token_set} />
              </div>
              <RevealInput
                value={hfToken}
                onChange={setHfToken}
                show={showHf}
                onToggle={() => setShowHf(v => !v)}
                placeholder={status.hf_token_set ? '••••••••  (leave blank to keep current)' : 'hf_…'}
              />
              <p className={`text-xs ${muted}`}>
                Required for speaker diarization. Accept the{' '}
                <a href="https://huggingface.co/pyannote/speaker-diarization-3.1" target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:underline">pyannote model license</a>{' '}
                then generate a token at{' '}
                <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:underline">huggingface.co/settings/tokens</a>.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
            >
              {saving && <SpinnerIcon />}
              {saving ? 'Saving…' : 'Save Keys'}
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Speaker Renaming Panel ───────────────────────────────────────────────────

function SpeakerPanel({ speakers, onRename, dark }) {
  const [editValues, setEditValues] = useState(() =>
    Object.fromEntries(speakers.map(s => [s.key, s.name]))
  )

  // Keep edit values in sync if speakers list changes (e.g. new transcription)
  useEffect(() => {
    setEditValues(Object.fromEntries(speakers.map(s => [s.key, s.name])))
  }, [speakers])

  const commit = (key, currentSpeakerName) => {
    const newName = editValues[key].trim()
    if (!newName || newName === currentSpeakerName) return
    onRename(key, currentSpeakerName, newName)
  }

  const muted = dark ? 'text-slate-400' : 'text-gray-500'

  return (
    <div className={`rounded-xl border p-4 ${dark ? 'bg-slate-700/40 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest ${muted} mb-3`}>
        Speakers detected — rename as needed
      </p>
      <div className="flex flex-wrap gap-3">
        {speakers.map((sp) => {
          const c = speakerColor(sp.index)
          return (
            <div
              key={sp.key}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border ${c.badge} transition-shadow`}
            >
              {/* Color dot + number */}
              <span className={`w-6 h-6 rounded-full ${c.dot} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                {sp.index + 1}
              </span>

              {/* Name input */}
              <input
                type="text"
                value={editValues[sp.key] ?? sp.name}
                onChange={e => setEditValues(v => ({ ...v, [sp.key]: e.target.value }))}
                onBlur={() => commit(sp.key, sp.name)}
                onKeyDown={e => { if (e.key === 'Enter') { e.target.blur() } }}
                className={`w-28 text-sm font-medium bg-transparent border-b focus:outline-none focus:border-current transition-colors
                  ${c.label} ${dark ? 'border-slate-500 placeholder-slate-500' : 'border-gray-300 placeholder-gray-400'}`}
                placeholder="Name…"
              />
            </div>
          )
        })}
      </div>
      <p className={`text-xs mt-3 ${muted}`}>
        Tab or press Enter to apply — the transcript updates live.
      </p>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── Theme ──
  const [dark, setDark] = useState(true)

  // ── Page ──
  const [page, setPage] = useState('main') // 'main' | 'settings'

  // ── Key status ──
  const [keysStatus, setKeysStatus] = useState({ anthropic_key_set: false, hf_token_set: false })
  const [keysLoaded, setKeysLoaded] = useState(false)

  // ── Toast ──
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), [])

  // ── Recording / upload ──
  const [stage, setStage]       = useState('idle')
  const [audioBlob, setAudioBlob] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)

  // ── Transcription ──
  const [transcribing, setTranscribing] = useState(false)
  const [txProgress, setTxProgress]     = useState(0)
  const [transcript, setTranscript]     = useState('')
  const [diarize, setDiarize]           = useState(false)

  // ── Speakers ──
  // Each entry: { key: 'Speaker 1', name: 'Speaker 1', index: 0 }
  const [speakers, setSpeakers] = useState([])

  // ── Summary ──
  const [summaryFormat, setSummaryFormat] = useState('key_takeaways')
  const [customPrompt, setCustomPrompt]   = useState('')
  const [summarizing, setSummarizing]     = useState(false)
  const [summary, setSummary]             = useState('')

  // ── Export ──
  const [exporting, setExporting]   = useState(false)
  const [exportLinks, setExportLinks] = useState(null)

  // ── Refs ──
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const streamRef        = useRef(null)
  const audioCtxRef      = useRef(null)
  const analyserRef      = useRef(null)
  const animFrameRef     = useRef(null)
  const timerRef         = useRef(null)
  const canvasRef        = useRef(null)
  const fileInputRef     = useRef(null)

  // ── Load key status on mount ──
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { setKeysStatus(d); setKeysLoaded(true) })
      .catch(() => setKeysLoaded(true))
  }, [])

  // ── Waveform ──
  const startWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const analyser = analyserRef.current
    const bufLen   = analyser.frequencyBinCount
    const data     = new Uint8Array(bufLen)
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(data)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth   = 2
      ctx.strokeStyle = '#3b82f6'
      ctx.beginPath()
      const sliceW = canvas.width / bufLen
      let x = 0
      for (let i = 0; i < bufLen; i++) {
        const y = (data[i] / 128.0) * (canvas.height / 2)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        x += sliceW
      }
      ctx.lineTo(canvas.width, canvas.height / 2)
      ctx.stroke()
    }
    draw()
  }, [])

  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    if (canvasRef.current) canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }, [])

  // ── Record start ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = audioCtx
      const source  = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
      const mimeType =
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
        MediaRecorder.isTypeSupported('audio/webm')             ? 'audio/webm' : 'audio/mp4'
      chunksRef.current = []
      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm'
        const name = `recording_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.${ext}`
        setAudioBlob(blob); setFileSize(blob.size); setFileName(name)
      }
      mr.start(100)
      setStage('recording')
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
      setTimeout(startWaveform, 150)
    } catch (err) {
      showToast(`Microphone error: ${err.message}`, 'error')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    clearInterval(timerRef.current)
    stopWaveform()
    setStage('ready')
  }

  const reset = () => {
    setStage('idle'); setAudioBlob(null); setFileName(''); setFileSize(0); setDuration(0)
    setTxProgress(0); setTranscript(''); setSummary(''); setExportLinks(null)
    setTranscribing(false); setSummarizing(false); setExporting(false); setSpeakers([])
  }

  const handleFile = (file) => {
    const allowedExts = ['wav', 'mp3', 'm4a', 'webm', 'ogg', 'flac', 'mp4']
    const ext = file.name.split('.').pop().toLowerCase()
    if (!allowedExts.includes(ext)) {
      showToast('Unsupported format. Use WAV, MP3, M4A, WebM, OGG, or FLAC.', 'error'); return
    }
    setAudioBlob(file); setFileName(file.name); setFileSize(file.size); setDuration(0)
    setStage('ready'); setTranscript(''); setSummary(''); setExportLinks(null); setSpeakers([])
  }

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  // ── Transcribe ──
  const handleTranscribe = async () => {
    if (!audioBlob) return
    setTranscribing(true); setTxProgress(0); setTranscript(''); setSummary(''); setExportLinks(null); setSpeakers([])
    try {
      const fd = new FormData()
      fd.append('file', audioBlob, fileName)
      const upRes  = await fetch('/api/upload', { method: 'POST', body: fd })
      const upBody = await parseResponse(upRes)
      if (!upRes.ok) throw new Error(upBody.detail || `Upload failed (HTTP ${upRes.status})`)
      const { file_id } = upBody

      await new Promise((resolve, reject) => {
        const es = new EventSource(`/api/transcribe/${file_id}?diarize=${diarize}`)
        es.addEventListener('status', (ev) => {
          const d = JSON.parse(ev.data)
          setTxProgress(d.progress || 0)
          if (d.status === 'complete') {
            const text = d.transcript || ''
            setTranscript(text)
            // Parse speaker labels if diarization was on
            if (diarize) {
              const keys = extractSpeakerKeys(text)
              setSpeakers(keys.map((key, index) => ({ key, name: key, index })))
            }
            es.close(); resolve()
          } else if (d.status === 'error') {
            es.close(); reject(new Error(d.error || 'Transcription failed'))
          }
        })
        es.onerror = () => { es.close(); reject(new Error('Lost connection to transcription service')) }
      })
      showToast('Transcription complete!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setTranscribing(false)
    }
  }

  // ── Speaker rename ──
  // oldName is the speaker's CURRENT name in the transcript; newName is what to replace it with.
  const renameSpeaker = useCallback((key, oldName, newName) => {
    if (!newName.trim() || newName === oldName) return
    setTranscript(t => t.replaceAll(oldName + ':', newName + ':'))
    setSpeakers(prev => prev.map(s => s.key === key ? { ...s, name: newName } : s))
  }, [])

  // ── Summarize ──
  const handleSummarize = async () => {
    if (!transcript.trim()) return
    setSummarizing(true); setSummary('')
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, summary_format: summaryFormat, custom_prompt: customPrompt || undefined, original_filename: fileName }),
      })
      const body = await parseResponse(res)
      if (!res.ok) throw new Error(body.detail || `Summarization failed (HTTP ${res.status})`)
      setSummary(body.summary)
      showToast('Summary generated!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSummarizing(false)
    }
  }

  // ── Export ──
  const handleExport = async () => {
    if (!transcript.trim() || !summary.trim()) {
      showToast('Generate both transcript and summary before exporting.', 'error'); return
    }
    setExporting(true); setExportLinks(null)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, summary, original_filename: fileName, summary_format: summaryFormat }),
      })
      const body = await parseResponse(res)
      if (!res.ok) throw new Error(body.detail || `Export failed (HTTP ${res.status})`)
      setExportLinks(body)
      showToast('Documents exported!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Theme tokens ──
  const bg       = dark ? 'bg-slate-900'   : 'bg-gray-50'
  const text     = dark ? 'text-slate-100'  : 'text-gray-900'
  const muted    = dark ? 'text-slate-400'  : 'text-gray-500'
  const divider  = dark ? 'bg-slate-700'   : 'bg-gray-200'
  const inputCls = `w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-y border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow
    ${dark ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`
  const selectCls = `rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500
    ${dark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`

  // ── Shared header ──
  const Header = () => (
    <header className={`sticky top-0 z-40 backdrop-blur border-b transition-colors duration-300
      ${dark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200'}`}
    >
      <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
        <button
          onClick={() => setPage('main')}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <span className="text-blue-500"><WaveformIcon /></span>
          <span className="text-lg font-bold tracking-tight">Orion</span>
          <span className={`text-xs hidden sm:block ${muted}`}>Audio → Transcript → Summary</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage('settings')}
            className={`p-2 rounded-lg transition-colors relative ${dark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}
              ${page === 'settings' ? (dark ? 'bg-slate-800 text-blue-400' : 'bg-gray-100 text-blue-600') : ''}`}
            title="Settings"
          >
            <GearIcon />
            {/* Red dot when a key is missing */}
            {keysLoaded && (!keysStatus.anthropic_key_set) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
          <button
            onClick={() => setDark(d => !d)}
            className={`p-2 rounded-lg transition-colors ${dark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  )

  // ── Settings page ──
  if (page === 'settings') {
    return (
      <div className={`min-h-screen ${bg} ${text} transition-colors duration-300`}>
        <Header />
        <SettingsPage
          dark={dark}
          showToast={showToast}
          onBack={() => setPage('main')}
          onSaved={(data) => setKeysStatus(data)}
        />
        <footer className={`text-center py-10 text-xs ${muted}`}>
          Orion · Powered by OpenAI Whisper + Anthropic Claude
        </footer>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    )
  }

  // ── Main page ──
  return (
    <div className={`min-h-screen ${bg} ${text} transition-colors duration-300`}>
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* ── Setup banner ── */}
        {keysLoaded && !keysStatus.anthropic_key_set && (
          <div className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 border
            ${dark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}
          >
            <p className="text-sm">
              Set up your API keys in Settings to get started.
            </p>
            <button
              onClick={() => setPage('settings')}
              className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap hover:opacity-75 transition-opacity"
            >
              Open Settings →
            </button>
          </div>
        )}

        {/* ══ Section 1: Record / Upload ══ */}
        <Card dark={dark}>
          <p className={`text-xs font-semibold uppercase tracking-widest ${muted} mb-5`}>1 — Record or Upload</p>

          {/* Idle */}
          {stage === 'idle' && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center shadow-lg hover:shadow-blue-500/30 transition-all duration-200"
                >
                  <MicIcon size={8} />
                </button>
                <p className={`text-sm ${muted}`}>Click to start recording</p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex-1 h-px ${divider}`} />
                <span className={`text-xs ${muted}`}>or upload a file</span>
                <div className={`flex-1 h-px ${divider}`} />
              </div>

              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragOver
                    ? 'border-blue-500 bg-blue-500/10'
                    : dark ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/40' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
              >
                <div className={`flex justify-center mb-3 ${muted}`}><UploadIcon /></div>
                <p className="text-sm font-medium">Drag & drop an audio file here</p>
                <p className={`text-xs mt-1 ${muted}`}>WAV · MP3 · M4A · WebM · OGG · FLAC</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".wav,.mp3,.m4a,.webm,.ogg,.flac,.mp4"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>
          )}

          {/* Recording */}
          {stage === 'recording' && (
            <div className="flex flex-col items-center gap-5">
              <canvas ref={canvasRef} width={640} height={72}
                className={`w-full max-w-lg rounded-xl ${dark ? 'bg-slate-900' : 'bg-slate-100'}`} />
              <div className="text-4xl font-mono font-bold tabular-nums text-blue-400">
                {formatDuration(duration)}
              </div>
              <button onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-lg animate-pulse-ring transition-all duration-200">
                <StopIcon />
              </button>
              <p className={`text-sm ${muted}`}>Recording… click to stop</p>
            </div>
          )}

          {/* Ready */}
          {stage === 'ready' && (
            <div className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${dark ? 'bg-slate-700/60' : 'bg-gray-50'}`}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{fileName}</p>
                <p className={`text-xs mt-0.5 ${muted}`}>
                  {fileSize > 0 ? formatBytes(fileSize) : ''}
                  {duration > 0 ? `  ·  ${formatDuration(duration)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Diarize toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Toggle checked={diarize} onChange={setDiarize} dark={dark} />
                  <span className={`text-xs whitespace-nowrap ${muted}`}>Detect Speakers</span>
                </label>
                <button onClick={reset}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors
                    ${dark ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-100'}`}>
                  Reset
                </button>
                <button onClick={handleTranscribe} disabled={transcribing}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors">
                  {transcribing && <SpinnerIcon />}
                  {transcribing ? 'Transcribing…' : 'Transcribe'}
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Progress bar */}
        {transcribing && (
          <Card dark={dark}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">
                {txProgress >= 90 && diarize ? 'Detecting speakers…' : 'Running Whisper locally…'}
              </p>
              <span className={`text-xs font-mono ${muted}`}>{txProgress}%</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${dark ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${txProgress}%` }} />
            </div>
            <p className={`text-xs mt-2 ${muted}`}>
              {diarize ? 'Transcribing then running speaker diarization — this takes a bit longer.' : 'Larger files and models take longer — hang tight.'}
            </p>
          </Card>
        )}

        {/* ══ Section 2: Transcript & Summary ══ */}
        {(transcript || summarizing) && (
          <Card dark={dark} className="space-y-5">
            <p className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>2 — Transcript & Summary</p>

            {/* Speaker renaming panel */}
            {speakers.length > 0 && (
              <SpeakerPanel speakers={speakers} onRename={renameSpeaker} dark={dark} />
            )}

            {/* Transcript */}
            <div>
              <label className="text-sm font-medium block mb-2">
                Transcript
                <span className={`font-normal ml-2 text-xs ${muted}`}>(editable — fix any errors before exporting)</span>
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                className={inputCls}
                placeholder="Transcript appears here…"
              />
            </div>

            {/* Summary controls */}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-44">
                <label className="text-sm font-medium block mb-2">Summary Format</label>
                <select value={summaryFormat} onChange={(e) => setSummaryFormat(e.target.value)} className={`w-full ${selectCls}`}>
                  <option value="key_takeaways">Key Takeaways & Action Items</option>
                  <option value="meeting_notes">Meeting Notes</option>
                  <option value="executive_summary">Executive Summary</option>
                  <option value="follow_up_email">Follow-up Email</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <button onClick={handleSummarize} disabled={summarizing || !transcript.trim()}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shrink-0">
                {summarizing && <SpinnerIcon />}
                {summarizing ? 'Summarizing…' : 'Summarize'}
              </button>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Custom Instructions <span className={`font-normal text-xs ${muted}`}>(optional — add specific focus or instructions to any format)</span>
              </label>
              <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} rows={3}
                className={inputCls} placeholder="e.g. Focus only on technical decisions, or write in Spanish…" />
            </div>

            {(summary || summarizing) && (
              <div>
                <label className="text-sm font-medium block mb-2">
                  Summary
                  {summary && <span className={`font-normal ml-2 text-xs ${muted}`}>(editable)</span>}
                </label>
                {summarizing ? (
                  <div className={`rounded-xl px-4 py-10 border flex items-center justify-center gap-3 text-blue-400
                    ${dark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                    <SpinnerIcon /><span className="text-sm">Generating with Claude…</span>
                  </div>
                ) : (
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={10}
                    className={inputCls} placeholder="Summary appears here…" />
                )}
              </div>
            )}
          </Card>
        )}

        {/* ══ Section 3: Export ══ */}
        {transcript && summary && (
          <Card dark={dark}>
            <p className={`text-xs font-semibold uppercase tracking-widest ${muted} mb-5`}>3 — Export</p>
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={handleExport} disabled={exporting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors">
                {exporting ? <SpinnerIcon /> : <DownloadIcon />}
                {exporting ? 'Exporting…' : 'Export as .docx'}
              </button>
              {exportLinks && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckIcon /><span className="text-sm font-medium">Files ready</span>
                </div>
              )}
            </div>
            {exportLinks && (
              <div className="mt-4 flex flex-wrap gap-3">
                <a href={exportLinks.transcript_url} download={exportLinks.transcript_filename}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-medium transition-colors
                    ${dark ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-50 hover:bg-blue-100 text-blue-600'}`}>
                  <DownloadIcon />{exportLinks.transcript_filename}
                </a>
                <a href={exportLinks.summary_url} download={exportLinks.summary_filename}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl font-medium transition-colors
                    ${dark ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'}`}>
                  <DownloadIcon />{exportLinks.summary_filename}
                </a>
              </div>
            )}
          </Card>
        )}

      </main>

      <footer className={`text-center py-10 text-xs ${muted}`}>
        Orion · Powered by{' '}
        <span className="text-slate-400">OpenAI Whisper</span>{' '}+{' '}
        <span className="text-slate-400">Anthropic Claude</span>
        <div className="mt-1 text-[11px] italic opacity-60">a Jack Perry production</div>
      </footer>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
