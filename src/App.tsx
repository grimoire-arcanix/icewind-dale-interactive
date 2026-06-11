import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { CATEGORY_CLASS, CATEGORY_FILTERS } from "./data/categories";
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

const STORAGE_KEY = "icewind-dale-dm-notes";
const SPOILER_TAG = "spoiler";
const DUNGEON_TAG = "dungeon";
const searchableText = (location: LocationEntry) =>
  `${location.name} ${location.category} ${location.summary} ${location.tags.join(" ")}`.toLowerCase();

function slugFromHash() {
  return decodeURIComponent(window.location.hash.replace(/^#/, ""));
}

function locationMatchesFilter(location: LocationEntry, filters: Set<LocationCategory>) {
  if (location.tags.includes(SPOILER_TAG) && !filters.has("DM / Spoiler")) {
    return false;
  }

  if (filters.has(location.category)) {
    return true;
  }

  if (filters.has("Dungeons / Ruins") && location.tags.includes(DUNGEON_TAG)) {
    return true;
  }

  if (filters.has("DM / Spoiler") && location.tags.includes(SPOILER_TAG)) {
    return true;
  }

  if (filters.has("Settlements") && location.tags.includes("settlement")) {
    return true;
  }

  return false;
}

function createMarkerIcon(location: LocationEntry, isSelected: boolean) {
  const categoryClass = CATEGORY_CLASS[location.category];
  const confidenceClass = `confidence-${location.positionConfidence}`;
  const selectedClass = isSelected ? "is-selected" : "";
  const warning = location.positionConfidence === "visible" ? "" : '<span class="marker-warning">!</span>';

  return L.divIcon({
    className: "atlas-marker-icon",
    html: `
      <div class="atlas-marker ${categoryClass} ${confidenceClass} ${selectedClass}">
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
  const [activeFilters, setActiveFilters] = useState<Set<LocationCategory>>(
    () => new Set(CATEGORY_FILTERS.filter((category) => category !== "DM / Spoiler")),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dmMode, setDmMode] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [debugMode, setDebugMode] = useState(
    () => new URLSearchParams(window.location.search).get("debug") === "1",
  );
  const [cursorPixel, setCursorPixel] = useState<{ x: number; y: number } | null>(null);
  const [imageState, setImageState] = useState<"loading" | "ready" | "error">("loading");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  debugModeRef.current = debugMode;

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedId) ?? null,
    [selectedId],
  );

  const filteredLocations = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesSearch = !trimmedQuery || searchableText(location).includes(trimmedQuery);
      const matchesCategory = locationMatchesFilter(location, activeFilters);
      return matchesSearch && matchesCategory;
    });
  }, [activeFilters, query]);

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
        icon: createMarkerIcon(location, selectedId === location.id),
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
  }, [filteredLocations, focusLocation, selectedId]);

  useEffect(() => {
    const openHashLocation = () => {
      const id = slugFromHash();
      if (!id) {
        return;
      }

      const hashLocation = locations.find((location) => location.id === id);
      if (hashLocation) {
        focusLocation(hashLocation, 1.1);
      }
    };

    const timeout = window.setTimeout(openHashLocation, 80);
    window.addEventListener("hashchange", openHashLocation);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", openHashLocation);
    };
  }, [focusLocation]);

  useEffect(() => {
    mapRef.current?.getContainer().classList.toggle("is-debugging", debugMode);
    debugModeRef.current = debugMode;
  }, [debugMode]);

  const toggleFilter = (category: LocationCategory) => {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const showAllFilters = () => setActiveFilters(new Set(CATEGORY_FILTERS));

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

          <label className="search-field" aria-label="Search locations">
            <span>Search</span>
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Town, tag, lake, ruin..."
              type="search"
            />
          </label>

          <label className="dm-toggle">
            <input
              type="checkbox"
              checked={dmMode}
              onChange={(event) => setDmMode(event.target.checked)}
            />
            <span>DM Notes</span>
          </label>
        </div>

        <aside className="filter-panel glass-panel" aria-label="Map filters">
          <div className="panel-title-row">
            <h2>Filters</h2>
            <button type="button" onClick={showAllFilters}>
              All
            </button>
          </div>

          <div className="filter-list">
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                type="button"
                className={activeFilters.has(category) ? "is-active" : ""}
                onClick={() => toggleFilter(category)}
                aria-pressed={activeFilters.has(category)}
              >
                <span className={`filter-dot ${CATEGORY_CLASS[category]}`} />
                {category}
              </button>
            ))}
          </div>

          <div className="legend" aria-label="Marker legend">
            <span>
              <i className="legend-dot confidence-visible" /> Visible
            </span>
            <span>
              <i className="legend-dot confidence-approximate" /> Approx.
            </span>
            <span>
              <i className="legend-dot confidence-needs-review" /> Review
            </span>
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
                {location.tags.includes(SPOILER_TAG) && <strong>!</strong>}
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
  const hasSpoilerTag = location.tags.includes(SPOILER_TAG);

  return (
    <aside className="lore-panel" aria-label={`${location.name} lore panel`}>
      <div className="lore-header">
        <div>
          <p>{location.category}</p>
          <h2>{location.name}</h2>
        </div>
        <button type="button" aria-label="Close lore panel" onClick={onClose}>
          x
        </button>
      </div>

      <div className="lore-body">
        {hasSpoilerTag && <div className="spoiler-alert">Spoiler-heavy location. DM notes are hidden by default.</div>}

        <section>
          <h3>At a Glance</h3>
          <p>{location.summary}</p>
        </section>

        <section>
          <h3>Lore</h3>
          <p>{location.lore}</p>
        </section>

        <section>
          <h3>DM Hooks</h3>
          <ul>
            {location.hooks.map((hook) => (
              <li key={hook}>{hook}</li>
            ))}
          </ul>
        </section>

        {location.dmNotes && (
          <section className={dmMode ? "dm-notes is-visible" : "dm-notes"}>
            <h3>DM Notes</h3>
            {dmMode ? <p>{location.dmNotes}</p> : <p>Enable DM Notes to reveal campaign-facing details.</p>}
          </section>
        )}

        <section>
          <h3>Tags</h3>
          <div className="tag-list">
            {location.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </section>

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
