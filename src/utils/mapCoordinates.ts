import L from "leaflet";

export const MAP_WIDTH = 6000;
export const MAP_HEIGHT = 4215;
export const MAP_MAX_ZOOM = 4;
export const MAP_IMAGE_URL = `${import.meta.env.BASE_URL}maps/icewind-dale.webp`;

export function imagePixelToLatLng(map: L.Map, x: number, y: number): L.LatLng {
  return map.unproject([x, y], MAP_MAX_ZOOM);
}

export function latLngToImagePixel(map: L.Map, latLng: L.LatLng): { x: number; y: number } {
  const point = map.project(latLng, MAP_MAX_ZOOM);

  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  };
}

export function getImageBounds(map: L.Map): L.LatLngBounds {
  const southWest = map.unproject([0, MAP_HEIGHT], MAP_MAX_ZOOM);
  const northEast = map.unproject([MAP_WIDTH, 0], MAP_MAX_ZOOM);

  return new L.LatLngBounds(southWest, northEast);
}
