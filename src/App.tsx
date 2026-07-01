import { useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Polygon, Popup, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './index.css'
import './App.css'
import type { Year } from './data/lgaData'
import {
  lgaData,
  getDensity,
  getDensityColor,
  getDensityCategory,
  formatPop,
  LEGEND_ITEMS,
  SATELLITE_LAYERS,
  yearStats,
} from './data/lgaData'
import { lagosStateBoundary } from './data/lagosStateBoundary'
import { lgaPolygons } from './data/lgaPolygons'

// ─── Fix Leaflet default icons ───────────────────────────────────────────────
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
})

const LAGOS_CENTER: [number, number] = [6.5244, 3.3792]
const LAGOS_ZOOM = 11

// ─── Map Reset Controller ─────────────────────────────────────────────────────
function MapController({ trigger }: { trigger: number }) {
  const map = useMap()
  const prev = useRef(trigger)
  if (trigger !== prev.current) {
    prev.current = trigger
    map.flyTo(LAGOS_CENTER, LAGOS_ZOOM, { duration: 1.2 })
  }
  return null
}

// ─── Satellite Tile Layer ─────────────────────────────────────────────────────
function SatelliteTileLayer({ year }: { year: Year }) {
  const cfg = SATELLITE_LAYERS[year]
  return (
    <TileLayer
      key={year}
      url={cfg.url}
      attribution={cfg.attribution}
      maxZoom={19}
    />
  )
}

// ─── LGA Label + Colored Polygon (40% opacity) ───────────────────────────────
interface LGAOverlayProps {
  name: string
  year: Year
}

function LGAOverlay({ name, year }: LGAOverlayProps) {
  const data = lgaData[name]
  const density = getDensity(data, year)
  const color = getDensityColor(density)
  const positions = lgaPolygons[name]

  const popupContent = (
    <div className="popup-inner">
      <div className="popup-name">{name}</div>
      <div className="popup-divider" />
      <div className="popup-rows">
        <div className="popup-row">
          <span className="popup-label">Population ({year}):</span>
          <span className="popup-value" style={{ color: '#00D4FF' }}>
            {formatPop(data, year)}
          </span>
        </div>
        <div className="popup-row">
          <span className="popup-label">Density ({year}):</span>
          <span className="popup-value" style={{ color }}>
            {density.toLocaleString()}/km²
          </span>
        </div>
        <div className="popup-row">
          <span className="popup-label">Category:</span>
          <span
            className="popup-badge"
            style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
          >
            {getDensityCategory(density)}
          </span>
        </div>
        <div className="popup-row">
          <span className="popup-label">Land Area:</span>
          <span className="popup-value">{data.area} km²</span>
        </div>
        <div className="popup-row">
          <span className="popup-label">Character:</span>
          <span className="popup-value">{data.urban}</span>
        </div>
        <div className="popup-row">
          <span className="popup-label">Region:</span>
          <span className="popup-value">{data.region}</span>
        </div>
        <div className="popup-row">
          <span className="popup-label">2006 Baseline:</span>
          <span className="popup-value">{(data.pop2006 / 1000).toFixed(0)}K</span>
        </div>
        <div className="popup-row">
          <span className="popup-label">2016:</span>
          <span className="popup-value">{(data.pop2016 / 1000).toFixed(0)}K</span>
        </div>
        <div className="popup-row">
          <span className="popup-label">2021:</span>
          <span className="popup-value">{(data.pop2021 / 1000).toFixed(0)}K</span>
        </div>
        <div className="popup-row">
          <span className="popup-label">2026 (est):</span>
          <span className="popup-value">{(data.pop2026 / 1000).toFixed(0)}K</span>
        </div>
      </div>
    </div>
  )

  const labelIcon = L.divIcon({
    className: '',
    html: `<div class=\"lga-label\">${name}</div>`,
    iconAnchor: [0, 0],
  })

  if (!positions) {
    return (
      <Marker
        position={[data.lat, data.lng]}
        icon={labelIcon}
      >
        <Popup className="lga-popup">{popupContent}</Popup>
      </Marker>
    )
  }

  return (
    <>
      {/* Colored LGA polygon with 40% opacity + density-colored border */}
      <Polygon
        positions={positions}
        pathOptions={{
          color: color,           // density color border
          fillColor: color,
          fillOpacity: 0.4,       // 40% opacity fill
          weight: 2.5,
          opacity: 0.95,
        }}
      >
        <Popup className="lga-popup">{popupContent}</Popup>
      </Polygon>

      {/* LGA name label */}
      <Marker
        position={[data.lat, data.lng]}
        icon={labelIcon}
        interactive={false}
      />
    </>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [year, setYear] = useState<Year>(2016)
  const [resetTrigger, setResetTrigger] = useState(0)

  const handleReset = useCallback(() => setResetTrigger(t => t + 1), [])
  const handleYear = useCallback((y: Year) => setYear(y), [])

  const stats = yearStats[year]

  return (
    <div className="map-wrapper">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-badge">
          <span className="header-icon">🛰️</span>
          <div className="header-text">
            <div className="header-title">Lagos Population Density Map</div>
            <div className="header-sub">
              Satellite imagery · Interactive LGA density by year
            </div>
          </div>
        </div>
      </header>

      {/* ── Satellite imagery badge ── */}
      <div className="imagery-badge">
        <span className="imagery-dot" />
        {SATELLITE_LAYERS[year].label} · Esri Satellite
      </div>

      {/* ── Map ── */}
      <MapContainer
        className="map-container"
        center={LAGOS_CENTER}
        zoom={LAGOS_ZOOM}
        zoomControl={false}
        scrollWheelZoom
        attributionControl
      >
        <MapController trigger={resetTrigger} />
        <SatelliteTileLayer year={year} />

        {/* Lagos State outer boundary — red outline only, no fill */}
        <Polygon
          positions={lagosStateBoundary}
          pathOptions={{
            color: '#FF3030',
            fillOpacity: 0,
            weight: 2.5,
            dashArray: undefined,
          }}
        />

        {/* Per-LGA invisible click areas + name labels */}
        {Object.keys(lgaData).map(name => (
          <LGAOverlay key={`${name}-${year}`} name={name} year={year} />
        ))}
      </MapContainer>

      {/* ── Stats + Legend (right panel) ── */}
      <aside className="panel stat-panel" aria-label="Statistics and legend">
        <div className="panel-header">
          <span className="panel-title">📊 Statistics</span>
        </div>
        <div className="panel-scroll">
          <div className="stat-card">
            <div className="stat-row">
              <span className="stat-label">State</span>
              <span className="stat-value">Lagos State</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total LGAs</span>
              <span className="stat-value">20</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Land Area</span>
              <span className="stat-value">3,577 km²</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Avg Density ({year})</span>
              <span className="stat-value highlight">{stats.density}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Population ({year})</span>
              <span className="stat-value highlight">{stats.population}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Growth</span>
              <span className="stat-value growth-positive">{stats.growth}</span>
            </div>
          </div>

          <div>
            <div className="legend-title">🌡️ Density Scale</div>
            <div className="legend-card">
              {LEGEND_ITEMS.map(item => (
                <div key={item.label} className="legend-row">
                  <div
                    className="legend-dot"
                    style={{ background: item.color }}
                  />
                  <span className="legend-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="reset-btn" onClick={handleReset} aria-label="Reset map view">
            ↩ Reset Map View
          </button>

          <p className="data-note">
            Projections based on 2006 NPC census + 3% annual growth<br />
            Click any LGA name to view details
          </p>
        </div>
      </aside>

      {/* ── LGA count ── */}
      <div className="lga-count" aria-hidden="true">
        {Object.keys(lgaData).length} LGAs · Click name or area to explore
      </div>

      {/* ── Year Selector (bottom) ── */}
      <nav className="year-bar" aria-label="Select year">
        {([2016, 2021, 2026] as Year[]).map(y => (
          <button
            key={y}
            className={`year-btn${year === y ? ' active' : ''}`}
            onClick={() => handleYear(y)}
            aria-pressed={year === y}
            aria-label={`View ${y} density data`}
          >
            {y}
          </button>
        ))}
      </nav>
    </div>
  )
}
