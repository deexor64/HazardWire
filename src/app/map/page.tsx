import MapView from './MapView'

export const metadata = {
  title: 'Map – HazardWire',
  description: 'Live map of reported hazards across the country.',
}

export default function Page() {
  return (
    <div className="h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-slate-200 bg-white">
      <MapView />
    </div>
  )
}
