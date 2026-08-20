import { useState, useRef } from 'react'
import type { ReportCategory, ReportSeverity } from '../types'
import { submitReport } from '../api'
import { CATEGORY_ICON } from '../utils'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'

const CATEGORIES: ReportCategory[] = ['road','drainage','water','electricity','garbage','environment','animals','accident','crime','other']
const SEVERITIES: ReportSeverity[] = ['low','medium','high','critical']

const SEVERITY_DESC: Record<ReportSeverity, string> = {
  low: 'Minor inconvenience, not urgent',
  medium: 'Noticeable issue, needs attention soon',
  high: 'Significant risk to people or property',
  critical: 'Immediate danger, requires emergency response',
}

const SEVERITY_COLOR_DOT: Record<ReportSeverity, string> = {
  low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500',
}

export default function SubmitView() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '', description: '',
    category: 'road' as ReportCategory,
    severity: 'medium' as ReportSeverity,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    contact_email: '', contact_phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Map for location picker
  useEffect(() => {
    if (step !== 2 || !mapContainerRef.current || mapRef.current) return
    const map = L.map(mapContainerRef.current, {
      center: [7.8731, 80.7718], zoom: 8, zoomControl: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO', maxZoom: 19, subdomains: 'abcd',
    }).addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setForm(f => ({ ...f, latitude: parseFloat(lat.toFixed(6)), longitude: parseFloat(lng.toFixed(6)) }))
      if (markerRef.current) markerRef.current.setLatLng(e.latlng)
      else {
        markerRef.current = L.circleMarker(e.latlng, {
          radius: 10, color: '#f97316', fillColor: '#f97316', fillOpacity: 0.8, weight: 2,
        }).addTo(map).bindPopup('📍 Hazard location').openPopup()
      }
    })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null; markerRef.current = null }
  }, [step])

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const body: any = {
        title: form.title, description: form.description,
        category: form.category, severity: form.severity,
      }
      if (form.latitude) body.latitude = form.latitude
      if (form.longitude) body.longitude = form.longitude
      if (form.contact_email) body.contact_email = form.contact_email
      if (form.contact_phone) body.contact_phone = form.contact_phone

      const res: any = await submitReport(body)
      setSuccess(res.data?.id ?? 'submitted')
      setStep(4)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 4) return <SuccessScreen reportId={success!} onReset={() => { setStep(1); setForm({ title:'',description:'',category:'road',severity:'medium',latitude:undefined,longitude:undefined,contact_email:'',contact_phone:'' }); setSuccess(null) }} />

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Details', 'Location', 'Contact'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${step > i + 1 ? 'bg-orange-500 text-white' : step === i + 1 ? 'bg-orange-500 text-white ring-2 ring-orange-500/30' : 'bg-[#2a2d3e] text-slate-500'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${step === i + 1 ? 'text-white' : 'text-slate-500'}`}>{label}</span>
            {i < 2 && <div className={`flex-1 h-px w-8 ${step > i + 1 ? 'bg-orange-500' : 'bg-[#2a2d3e]'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Step 1 — Details */}
      {step === 1 && (
        <div className="space-y-5">
          <SectionHeader icon="📝" title="Hazard Details" subtitle="Tell us what you observed" />
          <Field label="Title *">
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief description (e.g. Large pothole on Main St)"
              className="input-base w-full" />
          </Field>
          <Field label="Full Description *">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe the hazard in detail — what happened, how severe it is, potential risks…"
              className="input-base w-full resize-none" />
          </Field>
          <Field label="Category">
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => set('category', c)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all ${form.category === c ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-[#2a2d3e] bg-[#1e2130] text-slate-400 hover:border-[#3a3d4e]'}`}>
                  <span className="text-lg">{CATEGORY_ICON[c]}</span>
                  <span className="text-[9px] font-medium capitalize leading-tight">{c}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Severity">
            <div className="grid grid-cols-2 gap-2">
              {SEVERITIES.map(s => (
                <button key={s} onClick={() => set('severity', s)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${form.severity === s ? 'border-orange-500 bg-orange-500/10' : 'border-[#2a2d3e] bg-[#1e2130] hover:border-[#3a3d4e]'}`}>
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${SEVERITY_COLOR_DOT[s]}`} />
                  <div className="text-left min-w-0">
                    <p className={`text-xs font-semibold capitalize ${form.severity === s ? 'text-orange-400' : 'text-slate-300'}`}>{s}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{SEVERITY_DESC[s]}</p>
                  </div>
                </button>
              ))}
            </div>
          </Field>
          <NavButtons onNext={() => { if (!form.title || !form.description) { setError('Title and description are required.'); return }; setError(null); setStep(2) }} />
        </div>
      )}

      {/* Step 2 — Location */}
      {step === 2 && (
        <div className="space-y-5">
          <SectionHeader icon="📍" title="Location" subtitle="Click on the map to pin the hazard location" />
          <div className="rounded-2xl overflow-hidden border border-[#2a2d3e] h-72">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
          {form.latitude && form.longitude ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-sm text-orange-300">
              📍 Pinned: {form.latitude}, {form.longitude}
              <button onClick={() => { set('latitude', undefined); set('longitude', undefined) }} className="ml-auto text-slate-400 hover:text-white">✕</button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center">No location pinned — you can skip this</p>
          )}
          <NavButtons onBack={() => setStep(1)} onNext={() => { setError(null); setStep(3) }} nextLabel="Next →" />
        </div>
      )}

      {/* Step 3 — Contact */}
      {step === 3 && (
        <div className="space-y-5">
          <SectionHeader icon="📬" title="Contact (Optional)" subtitle="So authorities can follow up with you" />
          <Field label="Email">
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="your@email.com"
              className="input-base w-full" />
          </Field>
          <Field label="Phone">
            <input type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+94 71 234 5678"
              className="input-base w-full" />
          </Field>

          {/* Summary */}
          <div className="p-4 rounded-xl bg-[#1e2130] border border-[#2a2d3e] space-y-2 text-sm">
            <p className="font-semibold text-white mb-3">📋 Summary</p>
            <SummaryRow label="Title" value={form.title} />
            <SummaryRow label="Category" value={`${CATEGORY_ICON[form.category]} ${form.category}`} />
            <SummaryRow label="Severity" value={form.severity} />
            <SummaryRow label="Location" value={form.latitude ? `${form.latitude}, ${form.longitude}` : 'Not specified'} />
          </div>

          <NavButtons
            onBack={() => setStep(2)}
            onNext={handleSubmit}
            nextLabel={submitting ? 'Submitting…' : '🚨 Submit Report'}
            nextDisabled={submitting}
            nextClass="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
          />
        </div>
      )}
    </div>
  )
}

function SuccessScreen({ reportId, onReset }: { reportId: string; onReset: () => void }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-sm px-6">
        <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">
          ✅
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Report Submitted!</h2>
        <p className="text-slate-400 text-sm mb-6">Your hazard report has been logged and will be routed to the appropriate authority.</p>
        <p className="text-xs font-mono text-orange-400 bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20 mb-6">{reportId}</p>
        <button onClick={onReset} className="w-full py-2.5 rounded-xl bg-[#1e2130] border border-[#2a2d3e] text-slate-300 hover:bg-[#2a2d3e] transition-colors text-sm">
          Submit Another Report
        </button>
      </div>
    </div>
  )
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <p className="text-sm text-slate-400">{subtitle}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}

function NavButtons({ onBack, onNext, nextLabel = 'Next →', nextDisabled, nextClass }: {
  onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean; nextClass?: string
}) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack && (
        <button onClick={onBack} className="flex-1 py-2.5 rounded-xl bg-[#1e2130] border border-[#2a2d3e] text-slate-300 hover:bg-[#2a2d3e] transition-colors text-sm">
          ← Back
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled}
        className={`flex-1 py-2.5 rounded-xl border transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${nextClass ?? 'bg-[#1e2130] border-orange-500 text-orange-400 hover:bg-orange-500/10'}`}>
        {nextLabel}
      </button>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-300 font-medium">{value}</span>
    </div>
  )
}
