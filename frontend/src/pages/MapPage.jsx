import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

// =========================
// ICONS
// =========================
const customIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const currentLocationIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// =========================
// CURRENT LOCATION MARKER
// =========================
const CurrentLocationMarker = ({ position }) => {
  if (!position) return null;

  return (
    <Marker position={position} icon={currentLocationIcon}>
      <Popup>Locația ta curentă</Popup>
    </Marker>
  );
};

// =========================
// MAP HELPER COMPONENT
// =========================
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
}

// =========================
// MAIN COMPONENT
// =========================
export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState("");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([45.9432, 24.9668]);
  const [zoom, setZoom] = useState(7);

  const markerRefs = useRef({});

  // =========================
  // FETCH LOCATIONS
  // =========================
  useEffect(() => {
    fetch("http://localhost:5000/api/companii/locations")
      .then((res) => res.json())
      .then((data) => {
        const cleaned = data
          .filter((loc) => loc.LAT && loc.LNG)
          .map((loc) => ({
            id_job: loc.ID_JOB,
            id_oras: loc.ID_ORAS,
            titlu: loc.TITLU,
            company: loc.COMPANY,
            address: loc.ADDRESS,
            city: loc.CITY,
            lat: parseFloat(loc.LAT),
            lng: parseFloat(loc.LNG),
          }));
        setLocations(cleaned);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Eroare la preluarea locațiilor:", err);
        setLoading(false);
      });
  }, []);

  // =========================
  // CURRENT LOCATION
  // =========================
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentPosition(pos);
        },
        (error) => console.warn("Nu s-a putut obține locația curentă:", error),
      );
    }
  }, []);

  // =========================
  // DISTANCE CALC
  // =========================
  const distanceInKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // =========================
  // FILTERS
  // =========================
  const filteredLocations = locations.filter((loc) => {
    const matchesCity =
      !selectedCity || loc.city?.toLowerCase() === selectedCity.toLowerCase();

    const matchesRadius =
      !radius ||
      !currentPosition ||
      distanceInKm(
        currentPosition.lat,
        currentPosition.lng,
        loc.lat,
        loc.lng,
      ) <= parseFloat(radius);

    return matchesCity && matchesRadius;
  });

  const uniqueCities = [
    ...new Set(locations.map((l) => l.city).filter(Boolean)),
  ];

  const handleCardClick = (loc) => {
    const markerKey = `${loc.id_job}-${loc.id_oras}`;
    const marker = markerRefs.current[markerKey];

    // Center the map on the location and zoom in
    setMapCenter([loc.lat, loc.lng]);
    setZoom(15); // Deeper zoom for "selecting" the location

    if (marker) {
      marker.openPopup();
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAP */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md h-[600px] overflow-hidden border border-gray-200">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Se încarcă harta...
                </div>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={zoom}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                  <ChangeView center={mapCenter} zoom={zoom} />

                  {currentPosition && (
                    <CurrentLocationMarker position={currentPosition} />
                  )}

                  {filteredLocations.map((loc, idx) => {
                    const markerKey = `${loc.id_job}-${loc.id_oras}`;
                    return (
                      <Marker
                        key={markerKey}
                        position={[loc.lat, loc.lng]}
                        icon={customIcon}
                        ref={(el) => (markerRefs.current[markerKey] = el)}
                      >
                        <Popup>
                          <div className="p-1">
                            <h3 className="font-bold text-sm mb-1">
                              {loc.titlu}
                            </h3>
                            <p className="text-gray-700 font-medium text-xs !mt-0 !mb-1">
                              {loc.company}
                            </p>
                            <p className="text-gray-500 text-xs !mt-0 !mb-3 flex items-center gap-1">
                              <MapPin className="size-3 flex-shrink-0" />
                              {loc.address}
                            </p>
                            <div className="flex justify-end">
                              <Link
                                to={`/job/${loc.id_job}`}
                                className="px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Vezi detalii
                              </Link>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              )}
            </div>
          </div>

          {/* LIST */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Job Locations ({filteredLocations.length})
            </h2>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((loc, idx) => (
                  <div
                    key={`${loc.id_job}-${loc.id_oras}-${idx}`}
                    onClick={() => handleCardClick(loc)}
                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-blue-400 group"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {loc.titlu}
                    </h3>
                    <p className="text-sm text-gray-700 font-medium mt-0.5">
                      {loc.company}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                      <MapPin className="size-3 flex-shrink-0" />
                      <span className="truncate">{loc.address}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Nu s-au găsit joburi în zona selectată.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mt-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Filtrează Rezultatele
          </h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Oraș:</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="p-2 border rounded-md min-w-[200px] focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Toate orașele</option>
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Distanță maximă (km):
                {currentPosition ? "" : " (necesită locație activă)"}
              </label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="p-2 w-48 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                min={0}
                placeholder="Ex: 10"
                disabled={!currentPosition}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
