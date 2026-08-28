'use client'

import dynamic from 'next/dynamic'

// Leaflet mutates window/document — must be loaded client-side only
const LeafletMap = dynamic(() => import('./MapViewInner'), { ssr: false })

export default function MapView() {
  return <LeafletMap />
}
