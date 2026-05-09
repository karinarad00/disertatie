import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect as useReactEffect } from "react";

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
// MAP VIEW CONTROLLER
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
// CLUSTER LAYER (FIX)
// =========================
function ClusterLayer({ markers }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    const L = require("leaflet");

    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    clusterRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map]);

  useEffect(() => {
    if (!clusterRef.current) return;

    clusterRef.current.clearLayers();

    markers.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="min-width:160px">
          <strong>${loc.titlu}</strong><br/>
          <b>${loc.company}</b><br/>
          <span>${loc.address}</span><br/>
          <a href="/job/${loc.id_job}" target="_self">Vezi detalii</a>
        </div>
      `);

      clusterRef.current.addLayer(marker);
    });
  }, [markers]);

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
        (pos) => {
          setCurrentPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.warn("Geo error:", err),
      );
    }
  }, []);

  // =========================
  // DISTANCE
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
    setMapCenter([loc.lat, loc.lng]);
    setZoom(15);
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
            <div className="bg-white rounded-lg shadow-md h-[600px] overflow-hidden border">
              {loading ? (
                <div className="h-full flex items-center justify-center">
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
                    <Marker
                      position={currentPosition}
                      icon={currentLocationIcon}
                    >
                      <Popup>Locația ta curentă</Popup>
                    </Marker>
                  )}

                  {/* ✅ CLUSTER FIX */}
                  <ClusterLayer markers={filteredLocations} />
                </MapContainer>
              )}
            </div>
          </div>

          {/* LIST */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Job Locations ({filteredLocations.length})
            </h2>

            <div className="space-y-3 max-h-[550px] overflow-y-auto">
              {filteredLocations.map((loc, idx) => (
                <div
                  key={idx}
                  onClick={() => handleCardClick(loc)}
                  className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-md"
                >
                  <h3 className="font-semibold">{loc.titlu}</h3>
                  <p className="text-sm">{loc.company}</p>
                  <p className="text-xs flex items-center gap-1">
                    <MapPin className="size-3" />
                    {loc.address}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
          <div className="flex gap-6 flex-wrap">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Toate orașele</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="Rază km"
              className="p-2 border rounded"
              disabled={!currentPosition}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
