import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Briefcase } from "lucide-react";

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

const CurrentLocationMarker = ({ position }) => {
  if (!position) return null;
  return (
    <Marker position={position} icon={currentLocationIcon}>
      <Popup>Locația ta curentă</Popup>
    </Marker>
  );
};

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("");
  const [radius, setRadius] = useState("");
  const [currentPosition, setCurrentPosition] = useState(null);

  // Fetch locations
  useEffect(() => {
    fetch("http://localhost:5000/api/companii/locations")
      .then((res) => res.json())
      .then(async (data) => {
        const dataWithCoords = await Promise.all(
          data.map(async (loc) => {
            const coords = await geocodeAddress(loc.ADDRESS);
            return { ...loc, ...coords };
          }),
        );
        setLocations(dataWithCoords);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Eroare la preluarea locațiilor:", err);
        setLoading(false);
      });
  }, []);

  // Get current user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.warn("Nu s-a putut obține locația curentă:", error),
      );
    }
  }, []);

  const geocodeAddress = async (address) => {
    if (!address || address.trim() === "") return { lat: 0, lng: 0 };
    try {
      const res = await fetch(
        `http://localhost:5000/api/companii/geocode?q=${encodeURIComponent(address)}`,
      );
      const data = await res.json();
      if (data.length > 0)
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (err) {
      console.error("Geocoding error:", err);
    }
    return { lat: 0, lng: 0 };
  };

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

  const filteredLocations = locations.filter((loc) => {
    const matchesCity =
      !selectedCity || loc.CITY?.toLowerCase() === selectedCity.toLowerCase();
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
    ...new Set(locations.map((l) => l.CITY).filter(Boolean)),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Job Map</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md h-[600px] overflow-hidden border border-gray-200">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Se încarcă harta...
                </div>
              ) : (
                <MapContainer
                  center={[45.9432, 24.9668]}
                  zoom={6}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                  />
                  {currentPosition && (
                    <CurrentLocationMarker position={currentPosition} />
                  )}
                  {filteredLocations.map((loc, idx) => (
                    <Marker
                      key={idx}
                      position={[loc.lat, loc.lng]}
                      icon={customIcon}
                    >
                      <Popup>
                        <strong>{loc.COMPANY}</strong>
                        <br />
                        {loc.ADDRESS}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Job List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Job Locations
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                >
                  <h3 className="font-semibold text-gray-900">{loc.COMPANY}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="size-4" />
                    <span>{loc.ADDRESS}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 p-4 bg-gray-100 flex flex-wrap gap-4 rounded-lg">
          <label className="flex items-center gap-2">
            Oraș:
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="p-1 border rounded"
            >
              <option value="">Toate</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2">
            Distanță maximă (km):
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="p-1 w-24 border rounded"
              min={0}
            />
          </label>
        </div>
      </main>
    </div>
  );
}
