import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as turf from '@turf/turf';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  X, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  Home, 
  Briefcase, 
  Clock, 
  ChevronRight,
  RefreshCw,
  Bookmark,
  Plus,
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

// Central Fulfillment Dark Store Hub Coordinates (Gomti Nagar, Lucknow)
const DEFAULT_HUB = {
  id: 'hub_gomti_nagar_01',
  name: 'FreshCart Central Dark Store #1',
  address: 'Vibhuti Khand, Gomti Nagar, Lucknow, UP - 226010',
  lat: 26.8500,
  lng: 80.9490,
  deliveryRadiusKm: 5.0,
  estimatedMinutes: 12
};

// Preset locations for instant testing of geofence boundaries
const PRESET_LOCATIONS = [
  {
    name: 'Gomti Nagar (0.4 km - Deliverable)',
    address: 'Vibhuti Khand, Gomti Nagar, Lucknow - 226010',
    lat: 26.8520,
    lng: 80.9510,
    tag: 'Home'
  },
  {
    name: 'Aliganj (3.2 km - Deliverable)',
    address: 'Sector B, Aliganj, Lucknow - 226024',
    lat: 26.8780,
    lng: 80.9420,
    tag: 'Home'
  },
  {
    name: 'Hazratganj (4.5 km - Deliverable)',
    address: 'Mahatma Gandhi Marg, Hazratganj, Lucknow - 226001',
    lat: 26.8480,
    lng: 80.9120,
    tag: 'Work'
  },
  {
    name: 'Outer Ring Road (14 km - Out of Zone)',
    address: 'Kisan Path, Outer Ring Road, Lucknow - 226028',
    lat: 26.8950,
    lng: 81.0700,
    tag: 'Other'
  },
  {
    name: 'Delhi NCR (400 km - Out of Zone)',
    address: 'Sector 62, Noida, Uttar Pradesh - 201309',
    lat: 28.6280,
    lng: 77.3649,
    tag: 'Office'
  }
];

const LocationPickerModal = ({ isOpen, onClose }) => {
  const { selectedLocation, setSelectedLocation } = useCart();

  // Active Tab: 'map' | 'saved'
  const [activeTab, setActiveTab] = useState('saved');

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  // Map state refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const reverseGeocodeTimerRef = useRef(null);

  // Store Hub State
  const [hubInfo, setHubInfo] = useState(DEFAULT_HUB);
  const [hubPolygon, setHubPolygon] = useState(null);

  // Selected Pin Coordinates & Form Data
  const [currentCoords, setCurrentCoords] = useState({
    lat: selectedLocation?.lat || DEFAULT_HUB.lat,
    lng: selectedLocation?.lng || DEFAULT_HUB.lng
  });

  const [addressDetails, setAddressDetails] = useState({
    tag: selectedLocation?.tag || 'Home',
    address: selectedLocation?.address || 'Vibhuti Khand, Gomti Nagar, Lucknow, UP - 226010',
    flatNumber: selectedLocation?.flatNumber || '',
    landmark: selectedLocation?.landmark || '',
    postalCode: selectedLocation?.postalCode || '226010',
    city: selectedLocation?.city || 'Lucknow'
  });

  const [saveToAccountBook, setSaveToAccountBook] = useState(true);

  // Turf Geofencing Verification State
  const [geofenceState, setGeofenceState] = useState({
    isDeliverable: true,
    distanceKm: 0.35,
    etaMinutes: 10
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 1. Fetch dark store hub data
  useEffect(() => {
    const fetchHub = async () => {
      try {
        const res = await fetch(`${API_URL}/api/qcommerce/store-hub`);
        if (res.ok) {
          const data = await res.json();
          if (data.hub) {
            setHubInfo(data.hub);
            setHubPolygon(data.hub.zoneGeoJSON);
            return;
          }
        }
      } catch (e) {}

      // Fallback: Generate Turf circle polygon client-side
      const hubPoint = turf.point([DEFAULT_HUB.lng, DEFAULT_HUB.lat]);
      const zone = turf.circle(hubPoint, DEFAULT_HUB.deliveryRadiusKm, {
        steps: 64,
        units: 'kilometers'
      });
      setHubPolygon(zone);
    };

    fetchHub();
  }, []);

  // 2. Fetch User's Saved Addresses from Account / Redis
  const fetchSavedAddresses = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Provide default template saved addresses for seamless experience
      setSavedAddresses([
        {
          _id: 'default_1',
          label: 'Home',
          fullName: localStorage.getItem('fullName') || 'Primary Residence',
          phoneNumber: localStorage.getItem('userPhone') || '9876543210',
          streetAddress: 'Flat 402, Royal Residency, Vibhuti Khand, Gomti Nagar',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          postalCode: '226010',
          latitude: 26.8520,
          longitude: 80.9510,
          isDefault: true
        },
        {
          _id: 'default_2',
          label: 'Work',
          fullName: localStorage.getItem('fullName') || 'Office',
          phoneNumber: localStorage.getItem('userPhone') || '9876543210',
          streetAddress: 'Cyber Heights, TC-G-2/2, Vibhuti Khand',
          city: 'Lucknow',
          state: 'Uttar Pradesh',
          postalCode: '226010',
          latitude: 26.8540,
          longitude: 80.9580,
          isDefault: false
        }
      ]);
      return;
    }

    setIsLoadingSaved(true);
    try {
      const res = await fetch(`${API_URL}/api/account/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.addresses) && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
        } else {
          // Default initial address
          setSavedAddresses([
            {
              _id: 'sample_1',
              label: 'Home',
              fullName: data.user?.name || 'My Home',
              phoneNumber: data.user?.phone || '9876543210',
              streetAddress: 'Flat 402, Royal Residency, Gomti Nagar',
              city: 'Lucknow',
              state: 'Uttar Pradesh',
              postalCode: '226010',
              latitude: 26.8520,
              longitude: 80.9510,
              isDefault: true
            }
          ]);
        }
      }
    } catch (e) {
      console.warn('Notice fetching saved addresses:', e);
    } finally {
      setIsLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSavedAddresses();
    }
  }, [isOpen, fetchSavedAddresses]);

  // 3. Pure Turf Geofence calculation (zero state setter side-effects)
  const calculateGeofencePure = useCallback((lat, lng, polygon = hubPolygon, hub = hubInfo) => {
    try {
      const customerPoint = turf.point([Number(lng), Number(lat)]);
      const hubPoint = turf.point([Number(hub.lng), Number(hub.lat)]);

      // High-precision geodesic distance using Turf
      const distance = parseFloat(turf.distance(hubPoint, customerPoint, { units: 'kilometers' }).toFixed(2));

      // Point-in-polygon verification using Turf
      const zonePoly = polygon || turf.circle(hubPoint, hub.deliveryRadiusKm, { steps: 64, units: 'kilometers' });
      const isDeliverable = turf.booleanPointInPolygon(customerPoint, zonePoly);

      let eta = 10;
      if (distance > 1.5) eta = 12;
      if (distance > 3.0) eta = 15;
      if (distance > 4.5) eta = 18;

      return {
        isDeliverable,
        distanceKm: distance,
        etaMinutes: isDeliverable ? eta : null
      };
    } catch (err) {
      return { isDeliverable: true, distanceKm: 1.0, etaMinutes: 12 };
    }
  }, [hubPolygon, hubInfo]);

  // 4. Reverse Geocode via OpenStreetMap Nominatim
  const reverseGeocode = useCallback((lat, lng) => {
    if (reverseGeocodeTimerRef.current) clearTimeout(reverseGeocodeTimerRef.current);

    setIsResolvingAddress(true);
    reverseGeocodeTimerRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
          const data = await res.json();
          const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || '';
          const city = data.address?.city || data.address?.town || data.address?.county || 'Lucknow';
          const state = data.address?.state || 'Uttar Pradesh';
          const postcode = data.address?.postcode || '';

          const resolvedAddress = data.display_name || `${road}, ${city}, ${state} ${postcode}`.trim();

          setAddressDetails(prev => ({
            ...prev,
            address: resolvedAddress,
            city,
            postalCode: postcode
          }));
        }
      } catch (err) {
      } finally {
        setIsResolvingAddress(false);
      }
    }, 350);
  }, []);

  // 5. Update Coordinates handler
  const handleCoordinateChange = useCallback((lat, lng, flyTo = false) => {
    const cleanLat = Number(Number(lat).toFixed(6));
    const cleanLng = Number(Number(lng).toFixed(6));
    setCurrentCoords({ lat: cleanLat, lng: cleanLng });

    const result = calculateGeofencePure(cleanLat, cleanLng);
    setGeofenceState(result);
    reverseGeocode(cleanLat, cleanLng);

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([cleanLat, cleanLng]);
    }

    if (flyTo && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([cleanLat, cleanLng], 15, { duration: 1.0 });
    }
  }, [calculateGeofencePure, reverseGeocode]);

  const handleCoordinateChangeRef = useRef(handleCoordinateChange);
  useEffect(() => {
    handleCoordinateChangeRef.current = handleCoordinateChange;
  });

  // 6. Initialize Leaflet Map whenever Map tab is open
  useEffect(() => {
    if (!isOpen || activeTab !== 'map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = currentCoords.lat || hubInfo.lat;
    const initialLng = currentCoords.lng || hubInfo.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Turf GeoJSON Delivery Zone
    const zone = hubPolygon || turf.circle(turf.point([hubInfo.lng, hubInfo.lat]), hubInfo.deliveryRadiusKm, {
      steps: 64,
      units: 'kilometers'
    });

    const polygonLayer = L.geoJSON(zone, {
      style: {
        color: '#00B074',
        weight: 2.5,
        dashArray: '5, 8',
        fillColor: '#00B074',
        fillOpacity: 0.14
      }
    }).addTo(map);
    polygonLayerRef.current = polygonLayer;

    // Dark Store Hub Marker
    const hubHtml = `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-9 h-9 rounded-full bg-emerald-500/30 animate-ping"></div>
        <div class="w-8 h-8 rounded-xl bg-[#00B074] border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold">
          🏬
        </div>
      </div>
    `;
    const hubIcon = L.divIcon({
      className: 'store-hub-icon',
      html: hubHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    L.marker([hubInfo.lat, hubInfo.lng], { icon: hubIcon })
      .addTo(map)
      .bindPopup(`<strong class="text-xs">${hubInfo.name}</strong><br/><span class="text-[10px] text-gray-500">5km Delivery Geofence</span>`);

    // Customer Location Draggable Marker
    const customerPinHtml = `
      <div class="relative flex items-center justify-center cursor-grab active:cursor-grabbing">
        <div class="w-10 h-10 -mt-10 -ml-5 rounded-full bg-slate-900 border-2 border-white shadow-2xl flex items-center justify-center text-white text-base">
          📍
        </div>
      </div>
    `;
    const customerIcon = L.divIcon({
      className: 'customer-pin-icon',
      html: customerPinHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 36]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customerIcon,
      draggable: true
    }).addTo(map);

    markerInstanceRef.current = marker;

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      if (handleCoordinateChangeRef.current) {
        handleCoordinateChangeRef.current(lat, lng, false);
      }
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (handleCoordinateChangeRef.current) {
        handleCoordinateChangeRef.current(lat, lng, false);
      }
    });

    mapInstanceRef.current = map;

    // Invalidate size to ensure clean tiles
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    setGeofenceState(calculateGeofencePure(initialLat, initialLng));

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, activeTab, hubInfo, hubPolygon, calculateGeofencePure]);

  // 7. Use GPS Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setActiveTab('map');
        handleCoordinateChange(latitude, longitude, true);
      },
      (error) => {
        setIsLocating(false);
        alert('Could not retrieve GPS coordinates. You can pick your location on the map or choose a saved address.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 8. Place Search via Nominatim
  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Lucknow')}&limit=4`);
      if (res.ok) {
        const results = await res.json();
        setSearchSuggestions(results);
      }
    } catch (e) {
    } finally {
      setIsSearching(false);
    }
  };

  // 9. Select a Saved Address
  const handleSelectSavedAddress = async (addr) => {
    const lat = addr.latitude || DEFAULT_HUB.lat;
    const lng = addr.longitude || DEFAULT_HUB.lng;
    const distanceCheck = calculateGeofencePure(lat, lng);

    const fullLocation = {
      tag: addr.label || 'Home',
      address: `${addr.streetAddress}, ${addr.city} - ${addr.postalCode}`,
      flatNumber: addr.apartment || '',
      landmark: '',
      postalCode: addr.postalCode || '226010',
      city: addr.city || 'Lucknow',
      lat,
      lng,
      distanceKm: distanceCheck.distanceKm,
      isDeliverable: distanceCheck.isDeliverable,
      etaMinutes: distanceCheck.etaMinutes
    };

    setSelectedLocation(fullLocation);
    onClose();
  };

  // 10. Confirm & Save Custom Map Pin Location
  const handleConfirmLocation = async () => {
    const fullLocation = {
      tag: addressDetails.tag,
      address: addressDetails.address,
      flatNumber: addressDetails.flatNumber,
      landmark: addressDetails.landmark,
      postalCode: addressDetails.postalCode,
      city: addressDetails.city,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      distanceKm: geofenceState.distanceKm,
      isDeliverable: geofenceState.isDeliverable,
      etaMinutes: geofenceState.etaMinutes
    };

    // Save active location in CartContext & Redis
    setSelectedLocation(fullLocation);

    // If opted to save to account address book
    const token = localStorage.getItem('token');
    if (saveToAccountBook && token) {
      try {
        await fetch(`${API_URL}/api/account/addresses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            label: addressDetails.tag,
            fullName: localStorage.getItem('fullName') || 'My Address',
            phoneNumber: localStorage.getItem('userPhone') || '9876543210',
            streetAddress: addressDetails.address,
            apartment: addressDetails.flatNumber,
            city: addressDetails.city,
            postalCode: addressDetails.postalCode,
            latitude: currentCoords.lat,
            longitude: currentCoords.lng,
            isDefault: false
          })
        });
      } catch (e) {}
    }

    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] my-auto overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#00B074] flex items-center justify-center shrink-0">
              <MapPin size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Select Delivery Location
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ⚡ 10-15 Min Express Delivery inside 5.0 km Dark Store Zone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs Header */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'saved'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark size={15} className={activeTab === 'saved' ? 'text-[#00B074]' : ''} />
            <span>Saved Addresses ({savedAddresses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('map');
              setTimeout(() => {
                if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
              }, 150);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'map'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MapPin size={15} className={activeTab === 'map' ? 'text-[#00B074]' : ''} />
            <span>Interactive Map & GPS</span>
          </button>

          <div className="ml-auto hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#00B074] rounded-xl text-xs font-bold transition border border-emerald-200/60 shadow-2xs"
            >
              <Navigation size={13} className={isLocating ? 'animate-spin' : ''} />
              <span>{isLocating ? 'Detecting GPS...' : 'Use My GPS'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ========================================================= */}
          {/* TAB 1: SAVED ADDRESSES VIEW */}
          {/* ========================================================= */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Your Saved Addresses</h4>
                  <p className="text-xs text-slate-500">Pick any saved address or add a new delivery pin on the map</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('map');
                    setTimeout(() => {
                      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
                    }, 150);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#00B074] hover:bg-[#009663] text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add New on Map</span>
                </button>
              </div>

              {isLoadingSaved ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#00B074]" />
                  <p className="text-xs font-semibold">Loading saved addresses from Redis...</p>
                </div>
              ) : savedAddresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {savedAddresses.map((addr) => {
                    const lat = addr.latitude || DEFAULT_HUB.lat;
                    const lng = addr.longitude || DEFAULT_HUB.lng;
                    const geocheck = calculateGeofencePure(lat, lng);
                    const isCurrent = selectedLocation?.address?.includes(addr.streetAddress);

                    return (
                      <div
                        key={addr._id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                          isCurrent 
                            ? 'border-[#00B074] bg-emerald-50/40 shadow-xs' 
                            : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                                {addr.label === 'Work' ? <Briefcase size={14} /> : <Home size={14} />}
                              </div>
                              <span className="font-extrabold text-xs text-slate-900">{addr.label || 'Home'}</span>
                              {addr.isDefault && (
                                <span className="bg-emerald-100 text-[#00B074] text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                                  Default
                                </span>
                              )}
                            </div>

                            {/* Turf Geofence Status Badge */}
                            {geocheck.isDeliverable ? (
                              <span className="text-[10px] font-extrabold text-[#00B074] bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                <span>⚡ 10-15 Min</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle size={11} />
                                <span>Out of Zone</span>
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-xs text-slate-800">{addr.fullName}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {addr.apartment ? `${addr.apartment}, ` : ''}{addr.streetAddress}, {addr.city} - {addr.postalCode}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">
                            {geocheck.distanceKm} km from Hub
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                              isCurrent
                                ? 'bg-[#00B074] text-white'
                                : 'bg-slate-100 hover:bg-[#00B074] hover:text-white text-slate-800'
                            }`}
                          >
                            {isCurrent && <Check size={13} />}
                            <span>{isCurrent ? 'Selected' : 'Deliver Here'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                  <Bookmark size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No saved addresses yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Use the interactive map to drop your delivery pin.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('map')}
                    className="mt-4 px-4 py-2 bg-[#00B074] text-white rounded-xl text-xs font-bold hover:bg-[#009663] transition"
                  >
                    Open Interactive Map
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: INTERACTIVE MAP & GEOFENCE VIEW */}
          {/* ========================================================= */}
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Left Column: Search, Presets & Address Form (5 Cols) */}
              <div className="lg:col-span-6 space-y-3.5 order-2 lg:order-1">
                
                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search colony, road, or apartment in Lucknow..."
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30 focus:border-[#00B074] transition"
                  />
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  {isSearching && (
                    <RefreshCw size={13} className="absolute right-3 top-2.5 text-slate-400 animate-spin" />
                  )}
                </form>

                {/* Search suggestions */}
                {searchSuggestions.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-1.5 space-y-1 shadow-md">
                    {searchSuggestions.map((place, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          handleCoordinateChange(place.lat, place.lon, true);
                          setSearchSuggestions([]);
                          setSearchQuery('');
                        }}
                        className="p-1.5 hover:bg-white rounded-xl cursor-pointer transition flex items-start gap-2 text-xs text-slate-700"
                      >
                        <MapPin size={13} className="text-[#00B074] shrink-0 mt-0.5" />
                        <span className="truncate">{place.display_name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Presets */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Quick Test Presets:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_LOCATIONS.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setAddressDetails(prev => ({
                            ...prev,
                            address: loc.address,
                            tag: loc.tag
                          }));
                          handleCoordinateChange(loc.lat, loc.lng, true);
                        }}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 transition"
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detected Address Box */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Detected Street Address
                  </label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 line-clamp-2">
                    {addressDetails.address}
                  </div>
                </div>

                {/* Flat & Landmark Inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      House / Flat No.
                    </label>
                    <input
                      type="text"
                      value={addressDetails.flatNumber}
                      onChange={(e) => setAddressDetails({ ...addressDetails, flatNumber: e.target.value })}
                      placeholder="e.g. Flat 402, 4th Floor"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Nearby Landmark
                    </label>
                    <input
                      type="text"
                      value={addressDetails.landmark}
                      onChange={(e) => setAddressDetails({ ...addressDetails, landmark: e.target.value })}
                      placeholder="e.g. Near Wave Mall"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00B074]/30"
                    />
                  </div>
                </div>

                {/* Address Tag Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Address Label
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { tag: 'Home', icon: Home },
                      { tag: 'Work', icon: Briefcase },
                      { tag: 'Other', icon: Building }
                    ].map(({ tag, icon: Icon }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setAddressDetails({ ...addressDetails, tag })}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          addressDetails.tag === tag
                            ? 'bg-[#00B074] border-[#00B074] text-white shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={13} />
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save to address book checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={saveToAccountBook}
                    onChange={(e) => setSaveToAccountBook(e.target.checked)}
                    className="w-4 h-4 text-[#00B074] rounded focus:ring-[#00B074]"
                  />
                  <span>Save to my saved addresses for future orders</span>
                </label>

              </div>

              {/* Right Column: Leaflet Map & Turf Status (7 Cols) */}
              <div className="lg:col-span-6 space-y-3 order-1 lg:order-2">
                
                {/* Leaflet Map Card */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                  <div 
                    ref={mapContainerRef} 
                    id="leaflet-location-map" 
                    className="w-full h-56 sm:h-64 z-0" 
                  />

                  {/* Dark Store Hub Legend */}
                  <div className="absolute top-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-slate-100 flex items-center gap-1.5 text-[10px] font-bold text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Green Zone: 5km Geofence Area</span>
                  </div>

                  {isResolvingAddress && (
                    <div className="absolute bottom-2.5 left-2.5 z-10 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white flex items-center gap-1.5 font-semibold">
                      <RefreshCw size={10} className="animate-spin text-emerald-400" />
                      <span>Resolving address...</span>
                    </div>
                  )}
                </div>

                {/* Turf Geofence Status Banner */}
                {geofenceState.isDeliverable ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#00B074] text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-extrabold text-emerald-900">
                        ⚡ Within 5km Delivery Zone ({geofenceState.distanceKm} km from Hub)
                      </p>
                      <p className="text-emerald-700 text-[11px] mt-0.5">
                        Superfast Dispatch: Arriving in approx. <strong>{geofenceState.etaMinutes || 12} mins</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-extrabold text-rose-900">
                        ⚠️ Outside 5km Delivery Radius ({geofenceState.distanceKm} km away)
                      </p>
                      <p className="text-rose-700 text-[11px] mt-0.5">
                        Deliveries are limited to 5km around Gomti Nagar. Drag pin inside green circle.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            <span>Coordinates: </span>
            <strong className="text-slate-800 font-mono text-[11px]">
              {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
            </strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmLocation}
              className={`w-1/2 sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm ${
                geofenceState.isDeliverable
                  ? 'bg-[#00B074] hover:bg-[#009663] text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <span>{geofenceState.isDeliverable ? 'Confirm & Deliver Here' : 'Save (Outside Zone Warning)'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default LocationPickerModal;
