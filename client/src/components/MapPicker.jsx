import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

function PinEvents({ value, onChange }) {
  useMapEvents({ click(e) { onChange([e.latlng.lat, e.latlng.lng]); } });
  return value ? <Marker position={value} /> : null;
}
export default function MapPicker({ value, onChange, height = '300px', markers = [], onMarkerClick }) {
  const center = value || [18.5204, 73.8567];
  return <div className="map-wrap" style={{ height }}>
    <MapContainer center={center} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {onChange && <PinEvents value={value} onChange={onChange} />}
      {markers.map(r => <Marker key={r._id} position={[r.location.coordinates[1], r.location.coordinates[0]]} eventHandlers={{ click: () => onMarkerClick?.(r) }} />)}
    </MapContainer>
  </div>;
}
