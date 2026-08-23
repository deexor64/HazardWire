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

  // Generate token on first load
  useEffect(() => {
    setToken(generateToken())
  }, [])

  // Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current).setView([7.8731, 80.7718], 8)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
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
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: 0.8,
        }).addTo(map)
      }
    })

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  async function handleSubmit() {
    if (!tokenConfirmed) {
      setError('Please confirm that you have saved the token')
      return
    }
    if (!title || !description) {
      setError('Title and description are required')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await submitReport({
        title,
        description,
        latitude,
        longitude,
        token,
      })
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Report Submitted</h2>
        <p className="text-gray-600 mb-6">
          Save this token. You will need it to view or manage your report.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 font-mono text-sm break-all mb-6">
          {token}
        </div>
        <button
          onClick={() => {
            setSuccess(false)
            setTitle('')
            setDescription('')
            setLatitude(undefined)
            setLongitude(undefined)
            setTokenConfirmed(false)
            setToken(generateToken())
          }}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Submit Another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Submit a Hazard Report</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Token Box */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm font-medium text-amber-800 mb-2">
          Your Private Access Token
        </p>
        <div className="font-mono text-sm bg-white border rounded p-3 break-all mb-3">
          {token}
        </div>
        <p className="text-xs text-amber-700 mb-3">
          Copy and save this token somewhere safe. You will need it later to view or delete your report. We cannot recover it.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={tokenConfirmed}
            onChange={(e) => setTokenConfirmed(e.target.checked)}
          />
          I have saved this token
        </label>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-base"
            placeholder="e.g. Large pothole on Galle Road"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="input-base"
            placeholder="Describe the hazard..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location (click on map)</label>
          <div ref={mapContainerRef} className="h-64 rounded-lg border border-gray-300" />
          {latitude && longitude && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {latitude}, {longitude}
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !tokenConfirmed}
          className="w-full py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </div>
    </div>
  )
}
