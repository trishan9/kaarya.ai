"use client";

import * as React from "react";
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from "react-leaflet";

type LatLngTuple = [number, number];

type LocationMapCanvasProps = {
  center: LatLngTuple;
  markerPosition?: LatLngTuple | null;
  onPickLocation: (coords: LatLngTuple) => void;
};

function ClickHandler({
  onPickLocation,
}: {
  onPickLocation: (coords: LatLngTuple) => void;
}) {
  useMapEvents({
    click(event) {
      onPickLocation([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

export function LocationMapCanvas({
  center,
  markerPosition,
  onPickLocation,
}: LocationMapCanvasProps) {
  const marker = markerPosition ?? center;

  return (
    <div className="relative z-0 overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-52 w-full"
      >
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        />
        <CircleMarker
          center={marker}
          pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.8 }}
          radius={8}
        />
        <ClickHandler onPickLocation={onPickLocation} />
      </MapContainer>
    </div>
  );
}
