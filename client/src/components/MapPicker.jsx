import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

// Classic bundler gotcha: Leaflet can't find its own marker icons
// after Vite processes them. We hand them over explicitly.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click: (e) => onPick([e.latlng.lat, e.latlng.lng]),
  });
  return null;
}

export default function MapPicker({ position, onPick, defaultCenter }) {
  return (
    <div className="relative z-0"> {/* keeps map tiles below our dropdowns/modals */}
      <MapContainer center={position || defaultCenter} zoom={13} className="h-72 w-full rounded-lg">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
                {/* Only attach click-handling in "picker" mode */}
        {onPick && <ClickHandler onPick={onPick} />}
        {position && <Marker position={position} />}
      </MapContainer>
    </div>
  );
}