import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { CATEGORY_CLASS, MAP_ICON_CLASS } from "./data/categories";
import { locations } from "./data/locations";
import type { LocationCategory, LocationEntry } from "./types/location";
import {
  getImageBounds,
  imagePixelToLatLng,
  latLngToImagePixel,
  MAP_HEIGHT,
  MAP_IMAGE_URL,
  MAP_MAX_ZOOM,
  MAP_WIDTH,
} from "./utils/mapCoordinates";

const STORAGE_KEY = "icewind-dale-dm-spoilers";
const searchableText = (location: LocationEntry) =>
  [
    location.name,
    location.category,
    location.chapter ?? "",
    location.summary,
    location.lore,
    location.history ?? "",
    location.travelContext ?? "",
    location.adventureRelevance ?? "",
    location.tags.join(" "),
    location.notableFeatures.join(" "),
    location.notablePeopleOrFactions.join(" "),
    location.dmHooks.join(" "),
  ]
    .join(" ")
    .toLowerCase();

function slugFromHash() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

function createMarkerIcon(location: LocationEntry, isSelected: boolean, currentZoom: number) {
  const categoryClass = CATEGORY_CLASS[location.category];
  const iconClass = MAP_ICON_CLASS[location.mapIconType];
  const confidenceClass = `confidence-${location.positionConfidence}`;
  const spoilerClass = location.isDmSpoiler ? "is-dm-spoiler" : "is-player-facing";
  const selectedClass = isSelected ? "is-selected" : "";
  const lowZoomClass = currentZoom < -1.2 ? "is-low-zoom" : "";
  const warning =
    location.positionConfidence === "visible" ? "" : '<span class="marker-warning">!</span>';

  return L.divIcon({
    className: "atlas-marker-icon",
    html: `
      <div class="atlas-marker ${categoryClass} ${iconClass} ${confidenceClass} ${spoilerClass} ${selectedClass} ${lowZoomClass}">
        <span class="atlas-marker-label">${location.name}</span>
        <span class="atlas-marker-dot" aria-hidden="true">${warning}</span>
      </div>
    `,
    iconSize: [1, 1],
    iconAnchor: [0, 0],
  });
}

function App() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debugModeRef = useRef(false);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dmMode, setDmMode] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [debugMode, setDebugMode] = useState(
    () => new URLSearchParams(window.location.search).get("debug") === "1",
  );
  const [cursorPixel, setCursorPixel] = useState<{ x: number; y: number } | null>(null);
  const [imageState, setImageState] = useState<"loading" | "ready" | "error">("loading");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [currentZoom, setCurrentZoom] = useState(-2);

  debugModeRef.current = debugMode;

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedId) ?? null,
    [selectedId],
  );

  const filteredLocations = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    return locations.filter((location) => {
      if (location.isDmSpoiler && !dmMode) {
        return false;
      }

      return !trimmedQuery || searchableText(location).includes(trimmedQuery);
    });
  }, [dmMode, query]);

  const visibleCategoryCounts = useMemo(() => {
    return filteredLocations.reduce((counts, location) => {
      counts.set(location.category, (counts.get(location.category) ?? 0) + 1);
      return counts;
    }, new Map<LocationCategory, number>());
  }, [filteredLocations]);

  const focusLocation = useCallback((location: LocationEntry, zoom = 1.35) => {
    const map = mapRef.current;
    if (!map) {
      setSelectedId(location.id);
      return;
    }

    const latLng = imagePixelToLatLng(map, location.x, location.y);
    map.flyTo(latLng, Math.max(map.getZoom(), zoom), { duration: 0.65 });
    setSelectedId(location.id);
    window.history.replaceState(null, "", `#${encodeURIComponent(location.id)}`);
  }, []);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.fitBounds(getImageBounds(map), { animate: true, padding: [30, 30] });
  }, []);

  const closeSidebar = useCallback(() => {
    setSelectedId(null);
    setCopyState("idle");
    if (window.location.hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(dmMode));
  }, [dmMode]);

  useEffect(() => {
    if (selectedLocation?.isDmSpoiler && !dmMode) {
      closeSidebar();
    }
  }, [closeSidebar, dmMode, selectedLocation]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (event.key === "Escape") {
        closeSidebar();
      }

      if (event.key === "/" && !isTextInput) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key.toLowerCase() === "c" && !isTextInput) {
        setDebugMode((value) => !value);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSidebar]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapElementRef.current, {
      crs: L.CRS.Simple,
      minZoom: -3,
      maxZoom: 4,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 85,
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: true,
      inertia: true,
      touchZoom: true,
    });

    mapRef.current = map;
    const bounds = getImageBounds(map);
    map.setMaxBounds(bounds.pad(0.18));
    map.fitBounds(bounds, { animate: false, padding: [20, 20] });
    setCurrentZoom(map.getZoom());

    const overlay = L.imageOverlay(MAP_IMAGE_URL, bounds, {
      alt: "Illustrated fantasy map of Icewind Dale",
      interactive: false,
      className: "icewind-map-image",
    });

    overlay.on("load", () => setImageState("ready"));
    overlay.on("error", () => setImageState("error"));
    overlay.addTo(map);

    L.control
      .scale({
        position: "bottomleft",
        imperial: true,
        metric: false,
        maxWidth: 160,
      })
      .addTo(map);

    const markerLayer = L.layerGroup().addTo(map);
    layerRef.current = markerLayer;

    const handleMove = (event: L.LeafletMouseEvent) => {
      setCursorPixel(latLngToImagePixel(map, event.latlng));
    };

    const handleDebugClick = (event: L.LeafletMouseEvent) => {
      if (!debugModeRef.current) {
        return;
      }

      const pixel = latLngToImagePixel(map, event.latlng);
      const snippet = `{ id: "new-location", name: "New Location", x: ${pixel.x}, y: ${pixel.y}, positionConfidence: "needs-review" }`;

      if (navigator.clipboard) {
        void navigator.clipboard.writeText(snippet).catch(() => undefined);
      }

      console.info("Icewind Dale marker coordinate:", snippet);
      setCursorPixel(pixel);
    };

    map.on("mousemove", handleMove);
    map.on("click", handleDebugClick);
    map.on("zoomend", () => setCurrentZoom(map.getZoom()));

    return () => {
      map.off("mousemove", handleMove);
      map.off("click", handleDebugClick);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      markerRefs.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) {
      return;
    }

    layer.clearLayers();
    markerRefs.current.clear();

    filteredLocations.forEach((location) => {
      const marker = L.marker(imagePixelToLatLng(map, location.x, location.y), {
        icon: createMarkerIcon(location, selectedId === location.id, currentZoom),
        title: location.name,
        keyboard: true,
        alt: location.name,
        riseOnHover: true,
      });

      marker.on("click", () => focusLocation(location));
      marker.on("keypress", (event: L.LeafletKeyboardEvent) => {
        if (event.originalEvent.key === "Enter" || event.originalEvent.key === " ") {
          focusLocation(location);
        }
      });

      marker.addTo(layer);
      markerRefs.current.set(location.id, marker);
    });
  }, [currentZoom, filteredLocations, focusLocation, selectedId]);

  useEffect(() => {
    const openHashLocation = () => {
      const id = slugFromHash();
      if (!id) {
        return;
      }

      const hashLocation = locations.find((location) => location.id === id);
      if (hashLocation && (!hashLocation.isDmSpoiler || dmMode)) {
        focusLocation(hashLocation, 1.1);
      }
    };

    const timeout = window.setTimeout(openHashLocation, 80);
    window.addEventListener("hashchange", openHashLocation);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", openHashLocation);
    };
  }, [dmMode, focusLocation]);

  useEffect(() => {
    mapRef.current?.getContainer().classList.toggle("is-debugging", debugMode);
    debugModeRef.current = debugMode;
  }, [debugMode]);

  const copySelectedLink = async () => {
    if (!selectedLocation) {
      return;
    }

    const link = `${window.location.origin}${window.location.pathname}${window.location.search}#${selectedLocation.id}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <main className="app-shell">
      <section className="map-stage" aria-label="Interactive Icewind Dale map">
        <div ref={mapElementRef} className="map-canvas" />

        {imageState === "loading" && (
          <div className="map-status" role="status">
            Loading Icewind Dale map...
          </div>
        )}

        {imageState === "error" && (
          <div className="map-status map-status-error" role="alert">
            The map image could not be loaded. Check `public/maps/icewind-dale.webp`.
          </div>
        )}

        <div className="topbar glass-panel">
          <div className="brand-block">
            <p>Forgotten Realms Atlas</p>
            <h1>Icewind Dale</h1>
          </div>

          <div className="search-field" role="search">
            <label htmlFor="location-search">Search</label>
            <div className="search-row">
              <input
                id="location-search"
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Town, lake, trail, ruin..."
                type="search"
              />
              {query && (
                <button type="button" className="clear-search" onClick={() => setQuery("")}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <label className="dm-toggle">
            <input
              type="checkbox"
              checked={dmMode}
              onChange={(event) => setDmMode(event.target.checked)}
            />
            <span>DM Spoilers <em>Reveals Rime of the Frostmaiden adventure locations.</em></span>
          </label>
        </div>

        <aside className="atlas-panel glass-panel" aria-label="Visible atlas categories">
          <div className="panel-title-row">
            <h2>Atlas</h2>
            <span>{filteredLocations.length}</span>
          </div>

          <div className="legend" aria-label="Marker legend">
            {[...visibleCategoryCounts.entries()].map(([category, count]) => (
              <span key={category}>
                <i className={`legend-dot ${CATEGORY_CLASS[category]}`} /> {category} {count}
              </span>
            ))}
            {dmMode && (
              <span>
                <i className="legend-diamond" /> DM marker
              </span>
            )}
          </div>
        </aside>

        <div className="map-controls glass-panel" aria-label="Map controls">
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn(0.5)}>
            +
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut(0.5)}>
            -
          </button>
          <button type="button" aria-label="Reset map view" onClick={resetView}>
            Reset
          </button>
          <button
            type="button"
            aria-label="Toggle coordinate debug mode"
            aria-pressed={debugMode}
            className={debugMode ? "is-active" : ""}
            onClick={() => setDebugMode((value) => !value)}
          >
            C
          </button>
        </div>

        <aside className="results-panel glass-panel" aria-label="Search results">
          <div className="panel-title-row">
            <h2>Locations</h2>
            <span>{filteredLocations.length}</span>
          </div>

          <div className="result-list">
            {filteredLocations.slice(0, 18).map((location) => (
              <button
                key={location.id}
                type="button"
                className={selectedId === location.id ? "is-selected" : ""}
                onClick={() => focusLocation(location)}
              >
                <span>{location.name}</span>
                {location.chapter && <small>{location.chapter}</small>}
                {location.isDmSpoiler && <strong>!</strong>}
              </button>
            ))}
          </div>
        </aside>

        {debugMode && (
          <div className="debug-readout glass-panel" aria-live="polite">
            <span>Debug coordinates</span>
            <strong>
              {cursorPixel ? `{ x: ${cursorPixel.x}, y: ${cursorPixel.y} }` : "Move over map"}
            </strong>
          </div>
        )}

        {selectedLocation && (
          <LorePanel
            location={selectedLocation}
            dmMode={dmMode}
            copyState={copyState}
            onClose={closeSidebar}
            onCopy={copySelectedLink}
          />
        )}
      </section>
    </main>
  );
}

interface LorePanelProps {
  location: LocationEntry;
  dmMode: boolean;
  copyState: "idle" | "copied" | "failed";
  onClose: () => void;
  onCopy: () => void;
}

function LorePanel({ location, dmMode, copyState, onClose, onCopy }: LorePanelProps) {
  const coordinateNeedsReview = location.positionConfidence !== "visible";
  const travelContext = location.travelContext ?? location.history;

  return (
    <aside className="lore-panel" aria-label={`${location.name} lore panel`}>
      <div className="lore-header">
        <div>
          <p>{location.category}</p>
          <h2>{location.name}</h2>
          <div className="badge-list">
            <span className={location.playerFacing ? "badge player-badge" : "badge spoiler-badge"}>
              {location.playerFacing ? "Player-facing" : "DM spoiler"}
            </span>
            {location.chapter && <span className="badge chapter-badge">{location.chapter}</span>}
            {coordinateNeedsReview && (
              <span className="badge coordinate-badge">{location.positionConfidence}</span>
            )}
          </div>
        </div>
        <button type="button" aria-label="Close lore panel" onClick={onClose}>
          x
        </button>
      </div>

      <div className="lore-body">
        {location.isDmSpoiler && (
          <div className="spoiler-alert">
            DM spoiler location. DM Spoilers reveals adventure locations and planning details.
          </div>
        )}

        <section>
          <h3>Overview</h3>
          <p>{location.summary}</p>
        </section>

        {location.lore && <section>
          <h3>Lore</h3>
          <p>{location.lore}</p>
        </section>}

        {travelContext && (
          <section>
            <h3>Geography / Travel Context</h3>
            <p>{travelContext}</p>
          </section>
        )}

        {(location.notableFeatures.length > 0 || location.notablePeopleOrFactions.length > 0) && (
          <section>
            <h3>Notable Features</h3>
            {location.notableFeatures.length > 0 && (
              <ul>
                {location.notableFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            )}
            {location.notablePeopleOrFactions.length > 0 && (
              <>
                <h4>People, Factions, Monsters</h4>
                <ul>
                  {location.notablePeopleOrFactions.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        {location.adventureRelevance && (
          <section>
            <h3>Adventure Relevance</h3>
            <p>{location.adventureRelevance}</p>
          </section>
        )}

        {dmMode && location.dmHooks.length > 0 && (
          <section>
            <h3>DM Hooks</h3>
            <div className="hook-list">
              {location.dmHooks.map((hook) => (
                <span key={hook}>{hook}</span>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3>Sources</h3>
          <ul className="source-list">
            {location.sourceUrls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {new URL(url).hostname.replace(/^www\./, "")}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {dmMode && location.dmNotes && (
          <section className="dm-notes is-visible">
            <h3>DM Notes</h3>
            <p>{location.dmNotes}</p>
          </section>
        )}

        <details>
          <summary>Coordinates and authoring data</summary>
          <dl className="debug-details">
            <div>
              <dt>Image pixel</dt>
              <dd>
                x={location.x}, y={location.y}
              </dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{location.positionConfidence}</dd>
            </div>
            <div>
              <dt>Map icon</dt>
              <dd>{location.mapIconType}</dd>
            </div>
            <div>
              <dt>Spoiler</dt>
              <dd>{location.isDmSpoiler ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{location.id}</dd>
            </div>
          </dl>
        </details>
      </div>

      <div className="lore-actions">
        <button type="button" onClick={onCopy}>
          Copy Link
        </button>
        <span aria-live="polite">
          {copyState === "copied" && "Copied"}
          {copyState === "failed" && "Copy failed"}
        </span>
      </div>
    </aside>
  );
}

export default App;
