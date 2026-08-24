import { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { submitReport } from '../api'

function generateToken() {
  return crypto.randomUUID() + '-' + Math.random().toString(36).slice(2, 10)
}

export default function SubmitView() {
  const [token, setToken] = useState('')
  const [tokenConfirmed, setTokenConfirmed] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setToken(generateToken())
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current).setView([7.8731, 80.7718], 8)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      setLatitude(parseFloat(lat.toFixed(6)))
      setLongitude(parseFloat(lng.toFixed(6)))

      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng)
      } else {
        markerRef.current = L.circleMarker(e.latlng, {
          radius: 8,
          color: '#ea580c',
          fillColor: '#ea580c',
          fillOpacity: 0.85,
        }).addTo(map)
      }
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  async function handleSubmit() {
    if (!tokenConfirmed) {
      setError('Please confirm that you have saved your access token.')
      return
    }
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await submitReport({
        title: title.trim(),
        description: description.trim(),
        latitude,
        longitude,
        token,
      })
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSuccess(false)
    setTitle('')
    setDescription('')
    setLatitude(undefined)
    setLongitude(undefined)
    setTokenConfirmed(false)
    setToken(generateToken())
    setError('')
  }

  // Success screen
  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl mx-auto mb-5">
            ✓
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Report Submitted
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Your report has been received. Please save the token below. You will need it to check the status of your report later.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-2">
            <p className="text-xs text-slate-500 mb-1.5 font-medium">Your Access Token</p>
            <p className="font-mono text-sm text-slate-800 break-all select-all">
              {token}
            </p>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            We cannot recover this token if you lose it.
          </p>

          <button
            onClick={resetForm}
            className="w-full py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Submit a Hazard Report</h1>
        <p className="text-sm text-slate-500 mt-1">
          Report potholes, water leaks, fallen trees, power issues and more.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Token Section - Most important for the user */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2 mb-3">
          <span className="text-amber-600 font-bold text-sm">1</span>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Save your private access token
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              You will need this token later to view or track your report. Keep it private.
            </p>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-lg p-3 mb-3">
          <p className="font-mono text-sm text-slate-800 break-all select-all">
            {token}
          </p>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={tokenConfirmed}
            onChange={(e) => setTokenConfirmed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
          />
          I have copied and saved this token
        </label>
      </div>

      {/* Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-base"
            placeholder="e.g. Large pothole on Galle Road"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input-base resize-none"
            placeholder="Describe what you saw, the size of the problem, and any danger it may cause..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Location
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Click on the map to mark the location of the hazard (optional but helpful)
          </p>
          <div
            ref={mapContainerRef}
            className="h-56 rounded-lg border border-slate-200 overflow-hidden"
          />
          {latitude && longitude && (
            <p className="text-xs text-slate-500 mt-2">
              Selected: {latitude}, {longitude}
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !tokenConfirmed}
          className="w-full py-3 bg-orange-500 text-white text-sm font-semibold rounded-lg
                     hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors"
        >
          {submitting ? 'Submitting Report…' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}
