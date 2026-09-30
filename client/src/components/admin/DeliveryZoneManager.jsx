import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { 
  MapPin, 
  Layers, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Crosshair, 
  Compass, 
  Sliders, 
  Edit3, 
  ShieldCheck, 
  Clock, 
  Navigation,
  Info
} from 'lucide-react';
import { API_URL } from '../../config';

const DeliveryZoneManager = () => {
  // Zone metadata
  const [zoneId, setZoneId] = useState('');
  const [zoneName, setZoneName] = useState('Primary Delivery Zone');
  const [hubName, setHubName] = useState('FreshCart Central Dark Store');
  const [hubAddress, setHubAddress] = useState('Tamkuhi Raj, Kushinagar, UP');
  const [hubCoords, setHubCoords] = useState({ lat: 26.6924, lng: 84.2868 });
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [isActive, setIsActive] = useState(true);

  // Polygon Vertices [[lat, lng], [lat, lng], ...]
  const [polygonPoints, setPolygonPoints] = useState([]);
  
  // Tool Modes: 'draw' | 'edit' | 'radius' | 'test'
  const [toolMode, setToolMode] = useState('draw');
  const [radiusKm, setRadiusKm] = useState(5);

  // Search & Test states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const testMarkerRef = useRef(null);
  const hubMarkerRef = useRef(null);

  // Computed metrics
  const areaSqKm = React.useMemo(() => {
    if (polygonPoints.length < 3) return 0;
    try {
      // Turf expects coordinates in [lng, lat] format and closed ring
      const coords = polygonPoints.map(p => [p[1], p[0]]);
      coords.push(coords[0]);
      const poly = turf.polygon([coords]);
      return parseFloat((turf.area(poly) / 1000000).toFixed(2));
    } catch (e) {
      return 0;
    }
  }, [polygonPoints]);

  // Fetch saved active delivery zone from backend
  const fetchActiveZone = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_URL}/api/delivery-zone/delivery-zone`);
      const data = await res.json();
      if (data.success && data.zone) {
        const z = data.zone;
        setZoneId(z._id || '');
        setZoneName(z.name || 'Primary Delivery Zone');
        setHubName(z.hubName || 'FreshCart Central Hub');
        setHubAddress(z.hubAddress || 'Tamkuhi Raj, Kushinagar, UP');
        if (z.center) {
          setHubCoords({ lat: z.center.lat, lng: z.center.lng });
        }
        setEstimatedMinutes(z.estimatedDeliveryMinutes || 15);
        setIsActive(z.isActive !== undefined ? z.isActive : true);
        setRadiusKm(z.radiusKm || 5);

        // Convert GeoJSON coordinates [[lng, lat]] to Leaflet [[lat, lng]]
        if (z.polygon && z.polygon.coordinates && z.polygon.coordinates[0]) {
          const ring = z.polygon.coordinates[0];
          // remove closing point if identical to first
          const pts = ring.slice(0, ring.length - 1).map(c => [c[1], c[0]]);
          setPolygonPoints(pts);
        }
      }
    } catch (err) {
      console.error('Failed to load active delivery zone:', err);
      setErrorMessage('Failed to load delivery zone from server. Using local default.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveZone();
  }, [fetchActiveZone]);

  // Generate Circle Polygon from Hub Center
  const generateRadiusPolygon = useCallback((centerLat, centerLng, radius) => {
    try {
      const centerPoint = turf.point([centerLng, centerLat]);
      const circlePoly = turf.circle(centerPoint, Number(radius), { steps: 36, units: 'kilometers' });
      const ring = circlePoly.geometry.coordinates[0];
      const pts = ring.slice(0, ring.length - 1).map(c => [c[1], c[0]]);
      setPolygonPoints(pts);
    } catch (e) {
      console.error('Error creating circle polygon:', e);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialLat = hubCoords.lat || 26.6924;
      const initialLng = hubCoords.lng || 84.2868;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      // Create Layer Groups
      polygonLayerRef.current = L.polygon([], {
        color: '#00875A',
        weight: 3,
        opacity: 0.9,
        fillColor: '#00B074',
        fillOpacity: 0.25,
        dashArray: '6, 6'
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);

      // Hub Marker (Store location)
      const hubIcon = L.divIcon({
        className: 'custom-hub-icon',
        html: `
          <div style="background:#0F172A; width:34px; height:34px; border-radius:50%; border:3px solid #FFF; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.35);">
            <span style="font-size:16px;">🏬</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      hubMarkerRef.current = L.marker([initialLat, initialLng], {
        icon: hubIcon,
        draggable: true
      }).addTo(map);

      hubMarkerRef.current.bindPopup(`<b>${hubName}</b><br/>Drag to move Dark Store Center`);

      hubMarkerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setHubCoords({ lat: parseFloat(pos.lat.toFixed(5)), lng: parseFloat(pos.lng.toFixed(5)) });
      });

      mapInstanceRef.current = map;
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoading]);

  // Sync Polygon & Markers on Map whenever polygonPoints or toolMode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Update main polygon geometry
    if (polygonLayerRef.current) {
      polygonLayerRef.current.setLatLngs(polygonPoints);
      if (polygonPoints.length >= 3) {
        polygonLayerRef.current.setStyle({
          fillOpacity: 0.25,
          dashArray: toolMode === 'draw' ? '6, 6' : null
        });
      } else {
        polygonLayerRef.current.setStyle({ fillOpacity: 0.05 });
      }
    }

    // Update editable vertex handles
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      if (toolMode === 'edit' || toolMode === 'draw') {
        polygonPoints.forEach((point, index) => {
          const vertexIcon = L.divIcon({
            className: 'vertex-handle-icon',
            html: `
              <div style="
                background: ${index === 0 ? '#10B981' : '#FFF'};
                color: ${index === 0 ? '#FFF' : '#0F172A'};
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 2px solid #00875A;
                box-shadow: 0 2px 8px rgba(0,0,0,0.25);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: 800;
                cursor: grab;
              ">
                ${index + 1}
              </div>
            `,
            iconSize: [22, 22],
            iconAnchor: [11, 11]
          });

          const marker = L.marker(point, {
            icon: vertexIcon,
            draggable: toolMode === 'edit'
          });

          // Drag vertex in edit mode
          marker.on('drag', (e) => {
            const newPos = e.target.getLatLng();
            setPolygonPoints(prev => {
              const updated = [...prev];
              updated[index] = [parseFloat(newPos.lat.toFixed(5)), parseFloat(newPos.lng.toFixed(5))];
              return updated;
            });
          });

          // Click on vertex to delete point in edit mode
          marker.on('click', () => {
            if (toolMode === 'edit') {
              setPolygonPoints(prev => prev.filter((_, i) => i !== index));
            }
          });

          markersGroupRef.current.addLayer(marker);
        });
      }
    }
  }, [polygonPoints, toolMode]);

  // Handle map clicks according to active toolMode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));

      if (toolMode === 'draw') {
        // Add new vertex to polygon
        setPolygonPoints(prev => [...prev, [lat, lng]]);
      } else if (toolMode === 'test') {
        // Simulate point-in-polygon verification
        if (polygonPoints.length < 3) {
          setTestResult({
            isInside: false,
            message: 'Please define at least 3 polygon points before testing.'
          });
          return;
        }

        try {
          const testPoint = turf.point([lng, lat]);
          const coords = polygonPoints.map(p => [p[1], p[0]]);
          coords.push(coords[0]);
          const deliveryPoly = turf.polygon([coords]);

          const isInside = turf.booleanPointInPolygon(testPoint, deliveryPoly);
          const hubPt = turf.point([hubCoords.lng, hubCoords.lat]);
          const distKm = parseFloat(turf.distance(hubPt, testPoint, { units: 'kilometers' }).toFixed(2));

          // Draw test pin on map
          if (testMarkerRef.current) {
            testMarkerRef.current.remove();
          }

          const pinIcon = L.divIcon({
            className: 'test-pin-icon',
            html: `
              <div style="background:${isInside ? '#10B981' : '#EF4444'}; width:32px; height:32px; border-radius:50%; border:3px solid #FFF; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.3); color:#FFF; font-weight:bold;">
                ${isInside ? '✓' : '✕'}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          testMarkerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);

          setTestResult({
            isInside,
            lat,
            lng,
            distanceKm: distKm,
            etaMinutes: isInside ? (distKm <= 2 ? 10 : distKm <= 4 ? 12 : 15) : null
          });
        } catch (err) {
          console.error('Testing error:', err);
        }
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [toolMode, polygonPoints, hubCoords]);

  // Search Address / City via Nominatim
  const handleSearchCity = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);

        setHubCoords({ lat: newLat, lng: newLng });
        setHubAddress(item.display_name);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([newLat, newLng], 14, { duration: 1.5 });
          if (hubMarkerRef.current) {
            hubMarkerRef.current.setLatLng([newLat, newLng]);
          }
        }
      } else {
        alert('Location not found. Please try entering a city or landmark name.');
      }
    } catch (err) {
      alert('Error searching for location.');
    } finally {
      setIsSearching(false);
    }
  };

  // Undo Last Vertex Point
  const handleUndoPoint = () => {
    setPolygonPoints(prev => prev.slice(0, prev.length - 1));
  };

  // Clear Polygon
  const handleClearPolygon = () => {
    if (window.confirm('Are you sure you want to clear the polygon boundary?')) {
      setPolygonPoints([]);
      setTestResult(null);
      if (testMarkerRef.current) testMarkerRef.current.remove();
    }
  };

  // Fit Map to Polygon Bounds
  const handleFitBounds = () => {
    if (mapInstanceRef.current && polygonPoints.length >= 2) {
      mapInstanceRef.current.fitBounds(polygonPoints, { padding: [50, 50] });
    }
  };

  // Save Delivery Zone Polygon to Backend
  const handleSaveDeliveryZone = async () => {
    if (polygonPoints.length < 3) {
      setErrorMessage('A polygon must have at least 3 vertices to enclose a delivery area.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      // Prepare GeoJSON Polygon with closed ring [[lng, lat], ...]
      const ringCoords = polygonPoints.map(p => [p[1], p[0]]);
      ringCoords.push(ringCoords[0]); // Ensure closed loop

      const payload = {
        name: zoneName,
        hubName: hubName,
        hubAddress: hubAddress,
        center: hubCoords,
        polygon: {
          type: 'Polygon',
          coordinates: [ringCoords]
        },
        areaSqKm,
        radiusKm,
        isActive,
        estimatedDeliveryMinutes: Number(estimatedMinutes)
      };

      const res = await fetch(`${API_URL}/api/delivery-zone/delivery-zone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to save delivery zone.');
      }
    } catch (err) {
      console.error('Save error:', err);
      setErrorMessage('Server connection error. Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Sub-bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Operational Geofencing Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Zone & Polygon Management</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">
            Draw and customize exact delivery boundaries on the map. Orders will be strictly restricted within this polygon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchActiveZone}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 transition"
          >
            <RotateCcw size={15} className={isLoading ? 'animate-spin' : ''} />
            <span>Reload Active Zone</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDeliveryZone}
            disabled={isSaving || polygonPoints.length < 3}
            className="px-6 py-2.5 rounded-2xl bg-[#00B074] hover:bg-[#00875A] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save size={16} />
            <span>{isSaving ? 'Saving...' : 'Save & Enforce Zone'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Delivery Polygon has been saved! Only customers located within this polygon boundary can place orders now.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center gap-3 shadow-xs">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid: Left Map + Controls, Right Parameters & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Map Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Map Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
            
            {/* Mode Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setToolMode('draw')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                  toolMode === 'draw' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus size={14} />
                <span>Draw Points</span>
              </button>

              <button
                type="button"
                onClick={() => setToolMode('edit')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                  toolMode === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 size={14} />
                <span>Drag Vertices</span>
              </button>

              <button
                type="button"
                onClick={() => setToolMode('radius')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                  toolMode === 'radius' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders size={14} />
                <span>Circle Radius</span>
              </button>

              <button
                type="button"
                onClick={() => setToolMode('test')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                  toolMode === 'test' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crosshair size={14} />
                <span>Test Pin</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndoPoint}
                disabled={polygonPoints.length === 0}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition disabled:opacity-40"
                title="Undo last added point"
              >
                Undo Point
              </button>

              <button
                type="button"
                onClick={handleClearPolygon}
                disabled={polygonPoints.length === 0}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition disabled:opacity-40 flex items-center gap-1"
                title="Clear polygon"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={handleFitBounds}
                disabled={polygonPoints.length < 2}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition disabled:opacity-40 flex items-center gap-1"
                title="Zoom to fit polygon"
              >
                <Compass size={13} />
                <span>Fit Bounds</span>
              </button>
            </div>
          </div>

          {/* Search Box on Map */}
          <form onSubmit={handleSearchCity} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, town or landmark to center map (e.g. Tamkuhi Raj, Gorakhpur, Lucknow)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#00B074]"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition"
            >
              {isSearching ? 'Searching...' : 'Go to Area'}
            </button>
          </form>

          {/* Map Container */}
          <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Mode Guide Banner Floating on Map */}
            <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200/80 text-xs font-bold text-slate-800 flex items-center gap-2">
              {toolMode === 'draw' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Click on the map to add delivery polygon boundary corners.</span>
                </>
              )}
              {toolMode === 'edit' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Drag any numbered circle handle to modify the polygon boundary. Click to delete.</span>
                </>
              )}
              {toolMode === 'radius' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Use radius slider to instantly generate a clean circular polygon around dark store hub.</span>
                </>
              )}
              {toolMode === 'test' && (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Click anywhere to test whether an address falls inside or outside the delivery zone!</span>
                </>
              )}
            </div>

            {/* Polygon Stats Pill */}
            <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-xl border border-white/10 flex items-center gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-black">Vertices</span>
                <span className="font-black text-sm text-emerald-400">{polygonPoints.length} Points</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-black">Service Area</span>
                <span className="font-black text-sm text-emerald-400">{areaSqKm} km²</span>
              </div>
              <div className="w-[1px] h-6 bg-slate-700" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-black">Store Hub</span>
                <span className="font-black text-xs text-white">{hubCoords.lat.toFixed(4)}, {hubCoords.lng.toFixed(4)}</span>
              </div>
            </div>
          </div>

          {/* Circle Radius Controls (Visible when toolMode === 'radius') */}
          {toolMode === 'radius' && (
            <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-black uppercase text-slate-700">Radius From Dark Store Hub:</span>
                  <span className="text-sm font-black text-purple-600">{radiusKm} Kilometers</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>
              <button
                type="button"
                onClick={() => generateRadiusPolygon(hubCoords.lat, hubCoords.lng, radiusKm)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition shrink-0"
              >
                Generate Smooth Polygon
              </button>
            </div>
          )}

          {/* Test Result Pill */}
          {testResult && (
            <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between shadow-xs ${
              testResult.isInside 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-3">
                {testResult.isInside ? (
                  <CheckCircle2 size={22} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={22} className="text-rose-600" />
                )}
                <div>
                  <div className="font-black text-base">
                    {testResult.isInside ? 'Within Delivery Zone (Deliverable)' : 'Out of Delivery Zone (Non-Deliverable)'}
                  </div>
                  <div className="text-xs font-semibold opacity-80 mt-0.5">
                    Location: [{testResult.lat}, {testResult.lng}] • Distance from Hub: {testResult.distanceKm} km
                    {testResult.etaMinutes ? ` • Estimated ETA: ${testResult.etaMinutes} mins` : ''}
                  </div>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                testResult.isInside ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {testResult.isInside ? 'Serviceable' : 'Blocked'}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Zone Settings & Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Navigation size={18} className="text-[#00B074]" />
              <span>Zone Specifications</span>
            </h3>

            {/* Zone Name */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Zone Identifier
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00B074] focus:outline-hidden"
                placeholder="e.g. Kushinagar Express Area"
              />
            </div>

            {/* Hub Name */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Central Dark Store Hub Name
              </label>
              <input
                type="text"
                value={hubName}
                onChange={(e) => setHubName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00B074] focus:outline-hidden"
                placeholder="e.g. Tamkuhi Raj Central Hub"
              />
            </div>

            {/* Hub Address */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Hub Street Address
              </label>
              <textarea
                value={hubAddress}
                onChange={(e) => setHubAddress(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00B074] focus:outline-hidden resize-none"
                placeholder="NH28, Tamkuhi Raj, Kushinagar, UP"
              />
            </div>

            {/* Estimated Delivery Minutes */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Express Delivery Promise (Minutes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#00B074] focus:outline-hidden"
                />
                <span className="text-xs font-bold text-slate-500">Mins</span>
              </div>
            </div>

            {/* Active Status Switch */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs font-black text-slate-800 block">Strict Enforcement</span>
                <span className="text-[11px] font-semibold text-slate-400 block">Block orders outside polygon</span>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  isActive ? 'bg-[#00B074]' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleSaveDeliveryZone}
              disabled={isSaving || polygonPoints.length < 3}
              className="w-full py-3.5 rounded-2xl bg-[#00B074] hover:bg-[#00875A] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save & Enforce Zone'}</span>
            </button>
          </div>

          {/* Quick presets for common locations */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Quick Area Presets</h4>
            
            <button
              type="button"
              onClick={() => {
                setHubCoords({ lat: 26.6924, lng: 84.2868 });
                setHubName('FreshCart Tamkuhi Raj Hub');
                setHubAddress('NH28, Tamkuhi Raj, Kushinagar, UP - 274407');
                generateRadiusPolygon(26.6924, 84.2868, 5);
                if (mapInstanceRef.current) mapInstanceRef.current.flyTo([26.6924, 84.2868], 13);
              }}
              className="w-full p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-left transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-800">Tamkuhi Raj Hub (5 km)</div>
                <div className="text-[11px] text-slate-400">NH28, Kushinagar, UP</div>
              </div>
              <span className="text-xs font-black text-[#00B074]">Load</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHubCoords({ lat: 26.7820, lng: 84.3410 });
                setHubName('FreshCart Sewarahi Hub');
                setHubAddress('Station Road, Sewarahi, Kushinagar, UP - 274406');
                generateRadiusPolygon(26.7820, 84.3410, 5);
                if (mapInstanceRef.current) mapInstanceRef.current.flyTo([26.7820, 84.3410], 13);
              }}
              className="w-full p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-left transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-800">Sewarahi Hub (5 km)</div>
                <div className="text-[11px] text-slate-400">Station Road, Kushinagar, UP</div>
              </div>
              <span className="text-xs font-black text-[#00B074]">Load</span>
            </button>
          </div>

          {/* Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info size={14} className="text-[#00B074]" />
              <span>How Geofencing Works</span>
            </div>
            <p className="leading-relaxed">
              When a customer sets their delivery address on the storefront, our system tests their GPS pin using Turf Point-in-Polygon algorithm against this active polygon. If outside, checkout is automatically blocked.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DeliveryZoneManager;
