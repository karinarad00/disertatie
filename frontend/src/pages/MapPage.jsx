import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Nu s-a putut obține locația curentă:", error);
        }
      );
    }
  }, []);

  const geocodeAddress = async (address) => {
    if (!address || address.trim() === "") return { lat: 0, lng: 0 };

    const tryGeocode = async (addr) => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/companii/geocode?q=${encodeURIComponent(
            addr
          )}`
        );
        const data = await res.json();
        if (data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
        }
      } catch (error) {
        console.error("Geocoding error:", error);
      }
      return null;
    };

    let result = await tryGeocode(address);
    if (result) return result;

    const cleanedAddress = address.replace(
      /^(Str\.?|Strada|Bd\.?|Bulevardul)\s*/i,
      ""
    );
    result = await tryGeocode(cleanedAddress);
    if (result) return result;

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
        loc.lng
      ) <= parseFloat(radius);
    return matchesCity && matchesRadius;
  });

  const uniqueCities = [
    ...new Set(locations.map((l) => l.CITY).filter(Boolean)),
  ];

  if (loading) return <div className="p-4">Se încarcă harta...</div>;

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 bg-gray-100 flex flex-wrap gap-4 items-center">
        <label>
          Oraș:
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="ml-2 p-1"
          >
            <option value="">Toate</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>

        <label>
          Distanță maximă (km):
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="ml-2 p-1 w-20"
            min={0}
          />
        </label>
      </div>

      <div className="flex-1">
        <MapContainer
          center={[45.9432, 24.9668]}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {currentPosition && (
            <CurrentLocationMarker
              position={[currentPosition.lat, currentPosition.lng]}
            />
          )}
          {filteredLocations.map((loc, idx) => (
            <Marker key={idx} position={[loc.lat, loc.lng]} icon={customIcon}>
              <Popup>
                <strong>{loc.COMPANY}</strong>
                <br />
                {loc.ADDRESS}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
