import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icon path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/companii/locations")
      .then((res) => res.json())
      .then(async (data) => {
        const dataWithCoords = await Promise.all(
          data.map(async (loc) => {
            const coords = await geocodeAddress(loc.ADDRESS);
            return { ...loc, ...coords };
          })
        );
        setLocations(dataWithCoords);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Eroare la preluarea locațiilor:", err);
        setLoading(false);
      });
  }, []);

  const geocodeAddress = async (address) => {
    if (!address || address.trim() === "") return { lat: 0, lon: 0 };

    try {
        const res = await fetch(
          `http://localhost:5000/api/companii/geocode?q=${encodeURIComponent(
            address
          )}`
        );

      const data = await res.json();

      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }

    return { lat: 0, lon: 0 };
  };  

  if (loading) {
    return <div className="p-4">Se încarcă harta...</div>;
  }

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={[45.9432, 24.9668]}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc, idx) => (
          <Marker key={idx} position={[loc.lat, loc.lon]}>
            <Popup>
              <strong>{loc.company}</strong>
              <br />
              {loc.address}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
