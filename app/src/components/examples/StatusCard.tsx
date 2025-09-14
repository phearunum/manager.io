import { StatusCard } from '../status-card'

export default function StatusCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      <StatusCard title="UP SERVICES" value={24} type="up" />
      <StatusCard title="DOWN SERVICES" value={2} type="down" />
      <StatusCard title="PAUSED SERVICES" value={5} type="paused" />
      <StatusCard title="WARNING SERVICES" value={31} type="warning" />
    </div>
  )
}