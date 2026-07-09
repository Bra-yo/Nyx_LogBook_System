"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

// Import useMapEvents separately to avoid dynamic import issues
let useMapEvents: unknown;
/* eslint-disable @typescript-eslint/no-require-imports */
try {
  const leafletModule = require("react-leaflet");
  // assign hook if available (unsafe assignment guarded below)

  useMapEvents = leafletModule.useMapEvents;
} catch (error) {
  console.error("Failed to import useMapEvents:", error);
}
/* eslint-enable @typescript-eslint/no-require-imports */

// Fix Leaflet default icon issues
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)[
  "_getIconUrl"
];
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  className?: string;
}

// Default coordinates for Kenya/Embu region
const DEFAULT_LATITUDE = -0.5348;
const DEFAULT_LONGITUDE = 37.4546;

function LocationMarker({
  onLocationChange,
}: {
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<[number, number]>([
    DEFAULT_LATITUDE,
    DEFAULT_LONGITUDE,
  ]);

  try {
    const hook = useMapEvents as unknown as
      | ((opts: {
          click?: (e: { latlng: { lat: number; lng: number } }) => void;
        }) => void)
      | undefined;
    if (hook) {
      hook({
        click(e: { latlng: { lat: number; lng: number } }) {
          const { lat, lng } = e.latlng;
          setPosition([lat, lng]);
          onLocationChange(lat, lng);
        },
      });
    }
  } catch (err) {
    // ignore when hook unavailable
  }

  return (
    <Marker position={position}>
      <Popup>
        Office Location
        <br />
        Lat: {position[0].toFixed(6)}
        <br />
        Lng: {position[1].toFixed(6)}
      </Popup>
    </Marker>
  );
}

export function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  className,
}: MapPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number]>([
    latitude || DEFAULT_LATITUDE,
    longitude || DEFAULT_LONGITUDE,
  ]);

  useEffect(() => {
    const id = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      const id = setTimeout(() => setCurrentPosition([latitude, longitude]), 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [latitude, longitude]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          setCurrentPosition([lat, lng]);
          onLocationChange(lat, lng);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert(
            "Unable to get your current location. Please allow location access.",
          );
        },
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setCurrentPosition([lat, lng]);
    onLocationChange(lat, lng);
  };

  if (!isClient) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center h-64 ${className}`}
      >
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          Click on map to set office location
        </h4>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Use My Current Location
        </button>
      </div>

      <div className="h-64 rounded-lg overflow-hidden border">
        <MapContainer
          center={currentPosition}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationChange={handleMapClick} />
        </MapContainer>
      </div>

      <div className="text-xs text-gray-600">
        Selected: {currentPosition[0].toFixed(6)},{" "}
        {currentPosition[1].toFixed(6)}
      </div>
    </div>
  );
}

export default MapPicker;
