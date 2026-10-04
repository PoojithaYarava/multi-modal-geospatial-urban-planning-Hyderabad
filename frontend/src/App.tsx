import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import L from 'leaflet';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Ward = {
  ward_id: string;
  population: number;
  population_density: number;
  distance_to_hospital_km: number;
  population_score: number;
  hospital_gap_score: number;
  road_accessibility: number;
  metro_accessibility: number;
  environmental_score: number;
  final_score?: number;
};

const fallbackWards: Ward[] = [
  {
    ward_id: 'W-101',
    population: 62000,
    population_density: 12600,
    distance_to_hospital_km: 3.8,
    population_score: 0.9,
    hospital_gap_score: 0.88,
    road_accessibility: 0.82,
    metro_accessibility: 0.73,
    environmental_score: 0.66,
    final_score: 0.88,
  },
  {
    ward_id: 'W-102',
    population: 41000,
    population_density: 9200,
    distance_to_hospital_km: 5.4,
    population_score: 0.72,
    hospital_gap_score: 0.7,
    road_accessibility: 0.62,
    metro_accessibility: 0.55,
    environmental_score: 0.58,
    final_score: 0.71,
  },
  {
    ward_id: 'W-103',
    population: 21000,
    population_density: 4800,
    distance_to_hospital_km: 8.8,
    population_score: 0.35,
    hospital_gap_score: 0.32,
    road_accessibility: 0.48,
    metro_accessibility: 0.43,
    environmental_score: 0.67,
    final_score: 0.43,
  },
];

type Summary = {
  total_wards: number;
  population: number;
  hospitals: number;
  schools: number;
  metro_stations: number;
  road_length_km: number;
  parks: number;
};

type TabKey = 'overview' | 'map' | 'accessibility' | 'growth' | 'environment' | 'site' | 'data';

type WeightKey = 'population' | 'health' | 'roads' | 'transit' | 'environment';

const defaultSummary: Summary = {
  total_wards: 3,
  population: 124000,
  hospitals: 44,
  schools: 128,
  metro_stations: 25,
  road_length_km: 480,
  parks: 22,
};

const navItems: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'map', label: 'Map' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'growth', label: 'Urban Growth' },
  { key: 'environment', label: 'Environment' },
  { key: 'site', label: 'Site Analysis' },
  { key: 'data', label: 'Data Sources' },
];

function App() {
  const [summary, setSummary] = useState<Summary>(defaultSummary);
  const [wards, setWards] = useState<Ward[]>(fallbackWards);
  const [selectedWard, setSelectedWard] = useState<Ward>(fallbackWards[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [weights, setWeights] = useState<Record<WeightKey, number>>({
    population: 30,
    health: 25,
    roads: 20,
    transit: 15,
    environment: 10,
  });
  const [layerVisibility, setLayerVisibility] = useState({
    wards: true,
    roads: true,
    hospitals: true,
    schools: true,
    parks: true,
    water: false,
    metro: true,
    suitability: true,
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/analysis/summary');
        if (response.ok) {
          const data = await response.json();
          setSummary(data);
        }
      } catch {
        setSummary(defaultSummary);
      }

      try {
        const response = await fetch('http://localhost:8000/api/v1/wards');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setWards(data.items as Ward[]);
            setSelectedWard(data.items[0] as Ward);
          }
        }
      } catch {
        setWards(fallbackWards);
      }
    };

    fetchAnalysis();
  }, []);

  const chartData = useMemo(
    () =>
      wards.map((ward) => ({
        name: ward.ward_id,
        score: Number(((ward.final_score ?? ward.population_score) * 100).toFixed(0)),
      })),
    [wards],
  );

  const filteredWards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return wards;
    return wards.filter((ward) => ward.ward_id.toLowerCase().includes(query));
  }, [searchQuery, wards]);

  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;

  const renderOverview = () => (
    <>
      <section className="kpi-grid">
        <article className="kpi-card">
          <p>Total wards</p>
          <h3>{summary.total_wards}</h3>
        </article>
        <article className="kpi-card">
          <p>Population</p>
          <h3>{summary.population.toLocaleString()}</h3>
        </article>
        <article className="kpi-card">
          <p>Service access</p>
          <h3>{summary.hospitals}</h3>
        </article>
        <article className="kpi-card">
          <p>Education</p>
          <h3>{summary.schools}</h3>
        </article>
        <article className="kpi-card">
          <p>Transit nodes</p>
          <h3>{summary.metro_stations}</h3>
        </article>
        <article className="kpi-card">
          <p>Road network</p>
          <h3>{summary.road_length_km} km</h3>
        </article>
        <article className="kpi-card">
          <p>Green cover</p>
          <h3>{summary.parks}</h3>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel map-panel">
          <div className="panel-header">
            <h3>Interactive GIS Map</h3>
            <div className="legend">
              <span><i className="dot ward" />Wards</span>
              <span><i className="dot hospital" />Service</span>
              <span><i className="dot metro" />Transit</span>
            </div>
          </div>

          <div className="toolbar-row">
            <input
              className="search-box"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search ward or area"
            />
          </div>

          <MapContainer center={[17.385, 78.4867]} zoom={11} scrollWheelZoom className="map">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {layerVisibility.wards &&
              filteredWards.map((ward) => (
                <Polygon
                  key={ward.ward_id}
                  positions={[
                    [17.34, 78.39],
                    [17.42, 78.39],
                    [17.42, 78.53],
                    [17.34, 78.53],
                  ]}
                  pathOptions={{
                    color: ward.ward_id === selectedWard.ward_id ? '#6ee7b7' : '#5b9cff',
                    fillColor: ward.final_score && ward.final_score > 0.7 ? '#2dd4bf' : '#3b82f6',
                    fillOpacity: 0.25,
                    weight: ward.ward_id === selectedWard.ward_id ? 3 : 1,
                  }}
                  eventHandlers={{ click: () => setSelectedWard(ward) }}
                >
                  <Tooltip>{ward.ward_id}</Tooltip>
                </Polygon>
              ))}

            {layerVisibility.hospitals &&
              filteredWards.map((ward) => (
                <Marker key={`${ward.ward_id}-marker`} position={[17.38 + ward.population / 300000, 78.47]} icon={markerIcon}>
                  <Popup>{ward.ward_id}</Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>

        <div className="panel analytics-panel">
          <div className="panel-header">
            <h3>Priority Zone Analysis</h3>
          </div>
          <div className="selected-ward">
            <p className="eyebrow">Selected area</p>
            <h4>{selectedWard.ward_id}</h4>
            <div className="score-badges">
              <span>Opportunity {((selectedWard.final_score ?? 0.75) * 100).toFixed(0)}</span>
              <span>Population {(selectedWard.population_score * 100).toFixed(0)}</span>
            </div>
            <p>High-priority planning zone driven by demand concentration, service access, and environmental suitability.</p>
          </div>
          <div className="mini-metrics">
            <div><span>Need index</span><strong>{(selectedWard.hospital_gap_score * 100).toFixed(0)}</strong></div>
            <div><span>Road access</span><strong>{(selectedWard.road_accessibility * 100).toFixed(0)}</strong></div>
            <div><span>Transit access</span><strong>{(selectedWard.metro_accessibility * 100).toFixed(0)}</strong></div>
            <div><span>Environment</span><strong>{(selectedWard.environmental_score * 100).toFixed(0)}</strong></div>
          </div>
        </div>
      </section>

      <section className="panel lower-panel">
        <div className="panel-header">
          <h3>Priority Areas by Composite Score</h3>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="score" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );

  const renderAccessibility = () => (
    <section className="stacked-section">
      <div className="info-grid">
        <article className="info-card">
          <h3>Hospital Coverage</h3>
          <p>Average service reach is moderate with concentrated gaps in peripheral wards.</p>
          <div className="metric-line"><span>Coverage index</span><strong>78/100</strong></div>
        </article>
        <article className="info-card">
          <h3>Road Network</h3>
          <p>Road density is strongest in central and corridor-connected wards.</p>
          <div className="metric-line"><span>Network index</span><strong>82/100</strong></div>
        </article>
        <article className="info-card">
          <h3>Transit Access</h3>
          <p>Metro-oriented access is strongest near planned corridors and transfer hubs.</p>
          <div className="metric-line"><span>Transit score</span><strong>74/100</strong></div>
        </article>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Accessibility by Ward</h3>
        </div>
        <div className="table-card">
          {wards.map((ward) => (
            <div key={ward.ward_id} className="table-row">
              <span>{ward.ward_id}</span>
              <span>{(ward.road_accessibility * 100).toFixed(0)}</span>
              <span>{(ward.metro_accessibility * 100).toFixed(0)}</span>
              <span>{(ward.hospital_gap_score * 100).toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const renderGrowth = () => (
    <section className="stacked-section">
      <div className="info-grid">
        <article className="info-card">
          <h3>Population Pressure</h3>
          <p>Growth hotspots coincide with emerging peri-urban development and densification corridors.</p>
          <div className="metric-line"><span>Trend score</span><strong>71/100</strong></div>
        </article>
        <article className="info-card">
          <h3>Infrastructure Demand</h3>
          <p>Demand is rising around high-density residential and mixed-use nodes.</p>
          <div className="metric-line"><span>Demand score</span><strong>76/100</strong></div>
        </article>
        <article className="info-card">
          <h3>Development Risk</h3>
          <p>Unplanned expansion zones should be prioritized for infrastructure planning and review.</p>
          <div className="metric-line"><span>Risk score</span><strong>64/100</strong></div>
        </article>
      </div>
    </section>
  );

  const renderEnvironment = () => (
    <section className="stacked-section">
      <div className="info-grid">
        <article className="info-card">
          <h3>Green Space</h3>
          <p>Access to parks and vegetated areas is concentrated in more mature residential districts.</p>
          <div className="metric-line"><span>Green index</span><strong>69/100</strong></div>
        </article>
        <article className="info-card">
          <h3>Water Exposure</h3>
          <p>Waterways and flood-sensitive areas should be reviewed before major land conversion.</p>
          <div className="metric-line"><span>Buffer concern</span><strong>41/100</strong></div>
        </article>
        <article className="info-card">
          <h3>Built-up Pressure</h3>
          <p>Land-use intensification remains high near commercial and transit corridors.</p>
          <div className="metric-line"><span>Built footprint</span><strong>83/100</strong></div>
        </article>
      </div>
    </section>
  );

  const renderSite = () => (
    <section className="stacked-section">
      <div className="panel">
        <div className="panel-header">
          <h3>Analytical Site Suitability Recommendation</h3>
        </div>

        <div className="weight-list">
          {(Object.keys(weights) as WeightKey[]).map((key) => (
            <div key={key} className="weight-row">
              <div className="label-row">
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <span>{weights[key]}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setWeights((current) => ({
                    ...current,
                    [key]: value,
                  }));
                }}
              />
            </div>
          ))}
        </div>

        <div className="recommendation-box">
          <h4>Recommended planning strategy</h4>
          <p>
            Prioritize mixed-use, transit-connected, and service-deficient zones with manageable environmental risk and strong demand pull.
          </p>
          <div className="score-pill">Composite score: {((selectedWard.final_score ?? 0.7) * 100).toFixed(0)} / 100</div>
        </div>
      </div>
    </section>
  );

  const renderData = () => (
    <section className="stacked-section">
      <div className="info-grid">
        <article className="info-card">
          <h3>Ward boundaries</h3>
          <p>TGRAC administrative features and boundary references for Hyderabad planning units.</p>
          <span className="status-badge ok">Ready</span>
        </article>
        <article className="info-card">
          <h3>OpenStreetMap</h3>
          <p>Roads, schools, amenities, green spaces, water, and urban points of interest.</p>
          <span className="status-badge ok">Cached</span>
        </article>
        <article className="info-card">
          <h3>GTFS transit</h3>
          <p>Metro stations and routes from HMRL public transport feeds.</p>
          <span className="status-badge warn">Needs refresh</span>
        </article>
        <article className="info-card">
          <h3>Census population</h3>
          <p>Demographic demand indicators and ward-level population estimates.</p>
          <span className="status-badge ok">Validated</span>
        </article>
        <article className="info-card">
          <h3>Copernicus</h3>
          <p>Advanced environmental layers remain optional and are only active when credentials are configured.</p>
          <span className="status-badge muted">Not configured</span>
        </article>
      </div>
    </section>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'map':
        return renderOverview();
      case 'accessibility':
        return renderAccessibility();
      case 'growth':
        return renderGrowth();
      case 'environment':
        return renderEnvironment();
      case 'site':
        return renderSite();
      case 'data':
        return renderData();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">GIA</div>
          <div>
            <h1>Hyderabad Geospatial Analytics</h1>
          </div>
        </div>

        <nav className="nav-section">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="filter-card">
          <h3>Layer Controls</h3>
          {Object.entries(layerVisibility).map(([key, value]) => (
            <label key={key} className="toggle-row">
              <span>{key}</span>
              <input
                type="checkbox"
                checked={value}
                onChange={() =>
                  setLayerVisibility((prev) => ({
                    ...prev,
                    [key]: !prev[key as keyof typeof prev],
                  }))
                }
              />
            </label>
          ))}
        </div>
      </aside>

      <main className="main-panel">
        <header className="top-bar">
          <div>
            <p className="eyebrow">Multi-domain urban intelligence</p>
            <h2>
              {activeTab === 'overview' && 'Geospatial Analysis Dashboard'}
              {activeTab === 'map' && 'Map Explorer'}
              {activeTab === 'accessibility' && 'Accessibility Analysis'}
              {activeTab === 'growth' && 'Urban Growth Insights'}
              {activeTab === 'environment' && 'Environmental Overview'}
              {activeTab === 'site' && 'Site Suitability Engine'}
              {activeTab === 'data' && 'Data Sources'}
            </h2>
          </div>
          <button className="primary-button">Refresh data</button>
        </header>

        {renderTabContent()}
      </main>
    </div>
  );
}

export default App;
