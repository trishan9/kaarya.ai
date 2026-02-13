"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LatLngTuple = [number, number];

type GeocodeSuggestion = {
  displayName: string;
  lat: number;
  lon: number;
};

type PhotonFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    city?: string;
    district?: string;
    county?: string;
    state?: string;
    country?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
  };
};

type LocationPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

const DEFAULT_CENTER: LatLngTuple = [27.7172, 85.324];

const LocationMapCanvas = dynamic(
  () =>
    import("./location-map-canvas").then((module) => module.LocationMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-52 items-center justify-center rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
        Loading map...
      </div>
    ),
  },
);

const buildPhotonDisplayName = (feature: PhotonFeature) => {
  const props = feature.properties ?? {};
  const streetLine = [props.housenumber, props.street].filter(Boolean).join(" ");
  const segments = [
    props.name,
    streetLine || undefined,
    props.city,
    props.district,
    props.county,
    props.state,
    props.country,
    props.postcode,
  ].filter(Boolean);

  return segments.join(", ");
};

const reverseGeocodeNominatim = async (coords: LatLngTuple) => {
  const [lat, lon] = coords;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { display_name?: string };
  return data.display_name ?? null;
};

const reverseGeocodePhoton = async (coords: LatLngTuple) => {
  const [lat, lon] = coords;
  const response = await fetch(
    `https://photon.komoot.io/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&lang=en`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) return null;
  const data = (await response.json()) as {
    features?: PhotonFeature[];
  };
  const feature = data.features?.[0];
  if (!feature) return null;
  return buildPhotonDisplayName(feature) || null;
};

const reverseGeocode = async (coords: LatLngTuple) => {
  const nominatimValue = await reverseGeocodeNominatim(coords);
  if (nominatimValue) return nominatimValue;
  return reverseGeocodePhoton(coords);
};

const searchNominatimLocations = async (query: string) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&q=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) return [];
  const data = (await response.json()) as Array<{
    display_name?: string;
    lat?: string;
    lon?: string;
  }>;
  return data
    .map((item) => ({
      displayName: item.display_name ?? "",
      lat: Number(item.lat),
      lon: Number(item.lon),
    }))
    .filter(
      (item) =>
        item.displayName &&
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lon),
    ) as GeocodeSuggestion[];
};

const searchPhotonLocations = async (query: string) => {
  const response = await fetch(
    `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=en&limit=8`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) return [];
  const data = (await response.json()) as {
    features?: PhotonFeature[];
  };

  return (data.features ?? [])
    .map((feature) => {
      const coordinates = feature.geometry?.coordinates;
      if (!coordinates || coordinates.length < 2) return null;
      const [lon, lat] = coordinates;

      return {
        displayName: buildPhotonDisplayName(feature),
        lat: Number(lat),
        lon: Number(lon),
      };
    })
    .filter(
      (item): item is GeocodeSuggestion =>
        !!item &&
        Boolean(item.displayName) &&
        Number.isFinite(item.lat) &&
        Number.isFinite(item.lon),
    );
};

const dedupeSuggestions = (items: GeocodeSuggestion[]) => {
  const seen = new Set<string>();
  const deduped: GeocodeSuggestion[] = [];

  for (const item of items) {
    const key = `${item.lat.toFixed(5)}:${item.lon.toFixed(5)}:${item.displayName.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
};

const searchLocations = async (query: string) => {
  const photonResults = await searchPhotonLocations(query);
  if (photonResults.length >= 8) {
    return dedupeSuggestions(photonResults).slice(0, 8);
  }

  const nominatimResults = await searchNominatimLocations(query);
  return dedupeSuggestions([...photonResults, ...nominatimResults]).slice(0, 8);
};

export function LocationPicker({
  value,
  onChange,
  placeholder = "Search for a city or address",
  className,
}: LocationPickerProps) {
  const [query, setQuery] = React.useState(value ?? "");
  const [suggestions, setSuggestions] = React.useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [center, setCenter] = React.useState<LatLngTuple>(DEFAULT_CENTER);
  const [markerPosition, setMarkerPosition] = React.useState<LatLngTuple | null>(
    null,
  );
  const latestQueryRef = React.useRef("");

  React.useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    latestQueryRef.current = trimmed;

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const nextSuggestions = await searchLocations(trimmed);
        if (latestQueryRef.current !== trimmed) return;
        setSuggestions(nextSuggestions);
      } catch {
        if (latestQueryRef.current !== trimmed) return;
        setSuggestions([]);
      } finally {
        if (latestQueryRef.current === trimmed) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const applySuggestion = React.useCallback(
    (suggestion: GeocodeSuggestion) => {
      const coords: LatLngTuple = [suggestion.lat, suggestion.lon];
      setCenter(coords);
      setMarkerPosition(coords);
      setQuery(suggestion.displayName);
      onChange(suggestion.displayName);
      setSuggestions([]);
    },
    [onChange],
  );

  const handleMapPick = React.useCallback(
    async (coords: LatLngTuple) => {
      setCenter(coords);
      setMarkerPosition(coords);
      setIsSearching(true);
      try {
        const resolved = await reverseGeocode(coords);
        const nextValue =
          resolved ??
          `Lat ${coords[0].toFixed(5)}, Lng ${coords[1].toFixed(5)}`;
        setQuery(nextValue);
        onChange(nextValue);
      } finally {
        setIsSearching(false);
      }
    },
    [onChange],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {isSearching ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      {suggestions.length > 0 ? (
        <div className="relative z-20 space-y-1 rounded-lg border border-border bg-white p-2 shadow-sm">
          {suggestions.map((suggestion) => (
            <Button
              key={`${suggestion.lat}-${suggestion.lon}-${suggestion.displayName}`}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-1.5 text-left text-xs whitespace-normal"
              onClick={() => applySuggestion(suggestion)}
            >
              {suggestion.displayName}
            </Button>
          ))}
        </div>
      ) : null}

      <LocationMapCanvas
        center={center}
        markerPosition={markerPosition}
        onPickLocation={handleMapPick}
      />
      <p className="text-xs text-muted-foreground">
        Search a place or click the map to set location.
      </p>
    </div>
  );
}
