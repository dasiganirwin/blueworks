'use client';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Static Mapbox map with a single pin.
 * Uses the Mapbox Static Images API — no extra packages required.
 *
 * Props:
 *   lat, lng      – pin coordinates (required)
 *   label         – optional heading above the map
 *   markerColor   – hex without '#', defaults to brand-600 (2563eb)
 */
export function JobMap({ lat, lng, label, markerColor = '2563eb' }) {
  if (lat == null || lng == null) return null;

  const src =
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `pin-s+${markerColor}(${lng},${lat})/` +
    `${lng},${lat},14,0/640x320@2x` +
    `?access_token=${TOKEN}`;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      {label && (
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
          {label}
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={label ?? 'Map'}
        className="w-full block"
        style={{ aspectRatio: '2 / 1' }}
      />
    </div>
  );
}
