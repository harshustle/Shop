import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { 
  Crosshair, 
  ArrowRight, 
  ChevronLeft, 
  MapPin, 
  User, 
  Phone, 
  Home, 
  AlertCircle, 
  X 
} from 'lucide-react';
import { useCart } from '../context/CartContext';

// Quick commerce operational hubs (Kushinagar, UP)
const SERVICE_AREAS = {
  'TAMKUHI RAJ': {
    name: 'TAMKUHI RAJ',
    title: 'NH28',
    subtitle: 'NH28, TAMKUHI RAJ, KUSHINAGAR, UTTAR PRADESH, 274407',
    lat: 26.6924,
    lng: 84.2868,
    postalCode: '274407',
    city: 'Tamkuhi Raj',
    state: 'Uttar Pradesh'
  },
  'SEWARAHI': {
    name: 'SEWARAHI',
    title: 'Station Road',
    subtitle: 'STATION ROAD, SEWARAHI, KUSHINAGAR, UTTAR PRADESH, 274406',
    lat: 26.7820,
    lng: 84.3410,
    postalCode: '274406',
    city: 'Sewarahi',
    state: 'Uttar Pradesh'
  }
};

const LocationPickerModal = ({ isOpen, onClose }) => {
  const { selectedLocation, setLocation } = useCart();

  // Multi-Step State: 'location' (Step 1 of 2) | 'details' (Step 2 of 2)
  const [step, setStep] = useState('location');

  // Active Area Selection ('TAMKUHI RAJ' | 'SEWARAHI')
  const [activeArea, setActiveArea] = useState(() => {
    if (selectedLocation?.city?.toLowerCase().includes('sewarahi') || selectedLocation?.address?.toUpperCase().includes('SEWARAHI')) {
      return 'SEWARAHI';
    }
    return 'TAMKUHI RAJ';
  });

  // Current display data for map / area
  const [currentCoords, setCurrentCoords] = useState({
    lat: selectedLocation?.lat || SERVICE_AREAS['TAMKUHI RAJ'].lat,
    lng: selectedLocation?.lng || SERVICE_AREAS['TAMKUHI RAJ'].lng
  });

  const [currentTitle, setCurrentTitle] = useState(() => {
    return selectedLocation?.title || (selectedLocation?.address ? selectedLocation.address.split(',')[0] : SERVICE_AREAS['TAMKUHI RAJ'].title);
  });

  const [currentSubtitle, setCurrentSubtitle] = useState(() => {
    return selectedLocation?.address || SERVICE_AREAS['TAMKUHI RAJ'].subtitle;
  });

  const [isLocating, setIsLocating] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  // Step 2: Delivery Details Form State
  const [recipientName, setRecipientName] = useState(() => {
    return selectedLocation?.recipientName || localStorage.getItem('fullName') || 'Harsh Srivastav';
  });
  const [contactNumber, setContactNumber] = useState(() => {
    return selectedLocation?.recipientPhone || localStorage.getItem('userPhone') || '';
  });
  const [flatDetails, setFlatDetails] = useState(() => {
    return selectedLocation?.flatNumber || selectedLocation?.landmark || '';
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Map DOM refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Reset step to 'location' whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setStep('location');
      setErrorMessage('');
      const defaultName = localStorage.getItem('fullName') || 'Harsh Srivastav';
      const defaultPhone = localStorage.getItem('userPhone') || '';
      if (defaultName && !recipientName) setRecipientName(defaultName);
      if (defaultPhone && !contactNumber) setContactNumber(defaultPhone);
    }
  }, [isOpen]);

  // Reverse Geocoding with fallback
  const reverseGeocode = useCallback(async (lat, lng, fallbackArea) => {
    setIsResolving(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        
        const road = addr.road || addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.county || 'NH28';
        const display = data.display_name ? data.display_name.toUpperCase() : fallbackArea.subtitle;

        setCurrentTitle(road.toUpperCase());
        setCurrentSubtitle(display);
        return;
      }
    } catch (e) {
      // Fallback to area
    } finally {
      setIsResolving(false);
    }

    setCurrentTitle(fallbackArea.title);
    setCurrentSubtitle(fallbackArea.subtitle);
  }, []);

  // Initialize Leaflet Map in Step 1
  useEffect(() => {
    if (!isOpen || step !== 'location') return;

    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const initialArea = SERVICE_AREAS[activeArea] || SERVICE_AREAS['TAMKUHI RAJ'];
      const initialLat = currentCoords.lat || initialArea.lat;
      const initialLng = currentCoords.lng || initialArea.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      map.on('moveend', () => {
        const center = map.getCenter();
        const newLat = center.lat;
        const newLng = center.lng;

        setCurrentCoords({ lat: newLat, lng: newLng });

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          const areaObj = SERVICE_AREAS[activeArea] || SERVICE_AREAS['TAMKUHI RAJ'];
          reverseGeocode(newLat, newLng, areaObj);
        }, 500);
      });

      mapInstanceRef.current = map;

      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, step, activeArea, reverseGeocode]);

  // Switch between TAMKUHI RAJ & SEWARAHI
  const handleSelectArea = (areaKey) => {
    setActiveArea(areaKey);
    const target = SERVICE_AREAS[areaKey];
    if (!target) return;

    setCurrentCoords({ lat: target.lat, lng: target.lng });
    setCurrentTitle(target.title);
    setCurrentSubtitle(target.subtitle);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], 16, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  };

  // GPS Locate Current Position
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      handleSelectArea(activeArea);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, {
            duration: 1.2
          });
        }
      },
      () => {
        setIsLocating(false);
        const target = SERVICE_AREAS[activeArea] || SERVICE_AREAS['TAMKUHI RAJ'];
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([target.lat, target.lng], 16);
        }
      },
      { timeout: 8000 }
    );
  };

  // Step 1: Confirm Location on Map -> Advance to Step 2 (Delivery Details)
  const handleProceedToDetails = () => {
    setErrorMessage('');
    setStep('details');
  };

  // Step 2: Save Delivery Details and finalize location
  const handleSaveAndContinue = (e) => {
    if (e) e.preventDefault();

    // Validation
    const cleanName = recipientName.trim();
    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter a valid recipient name (at least 2 characters).');
      return;
    }

    const cleanPhone = contactNumber.trim().replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile contact number.');
      return;
    }

    const cleanFlat = flatDetails.trim();
    if (!cleanFlat || cleanFlat.length < 2) {
      setErrorMessage('Please enter your flat no, house, floor, or nearby landmark.');
      return;
    }

    const areaObj = SERVICE_AREAS[activeArea] || SERVICE_AREAS['TAMKUHI RAJ'];

    const fullDeliveryLocation = {
      tag: 'Home',
      title: currentTitle || areaObj.title,
      address: currentSubtitle || areaObj.subtitle,
      streetAddress: `${cleanFlat}, ${currentSubtitle || areaObj.subtitle}`,
      flatNumber: cleanFlat,
      landmark: cleanFlat,
      recipientName: cleanName,
      recipientPhone: cleanPhone,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      city: areaObj.city,
      state: areaObj.state,
      postalCode: areaObj.postalCode,
      isDeliverable: true,
      distanceKm: 0.5,
      etaMinutes: 10
    };

    // Save in Cart Context and local storage
    setLocation(fullDeliveryLocation);
    localStorage.setItem('freshcart_selected_location', JSON.stringify(fullDeliveryLocation));
    localStorage.setItem('fullName', cleanName);
    localStorage.setItem('userPhone', cleanPhone);
    sessionStorage.setItem('freshcart_location_confirmed', 'true');

    // Notify listeners
    window.dispatchEvent(new CustomEvent('freshcart-location-updated', { detail: fullDeliveryLocation }));
    window.dispatchEvent(new Event('storage'));

    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4">
      
      {/* Modal Frame: Mobile-first responsive card */}
      <div className="relative w-full sm:max-w-md h-full sm:h-[90vh] sm:max-h-[760px] bg-white sm:rounded-[36px] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95">
        
        {/* ========================================================= */}
        {/* STEP 1: INTERACTIVE MAP & AREA SELECTOR                   */}
        {/* ========================================================= */}
        {step === 'location' && (
          <div className="relative flex-1 w-full h-full flex flex-col">
            
            {/* Top Area Switcher (TAMKUHI RAJ | SEWARAHI) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => handleSelectArea('TAMKUHI RAJ')}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  activeArea === 'TAMKUHI RAJ'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                TAMKUHI RAJ
              </button>
              <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
              <button
                type="button"
                onClick={() => handleSelectArea('SEWARAHI')}
                className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  activeArea === 'SEWARAHI'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                SEWARAHI
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-[400] w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-slate-500 hover:text-slate-800 shadow-lg flex items-center justify-center transition border border-slate-200/60"
              title="Close"
            >
              <X size={18} />
            </button>

            {/* Map Canvas */}
            <div className="relative flex-1 w-full h-full bg-[#E5E3DF]">
              <div
                ref={mapContainerRef}
                className="w-full h-full z-0"
              />

              {/* Center Red Teardrop Pin Marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[300] pointer-events-none flex flex-col items-center select-none">
                <div className="w-10 h-10 rounded-full bg-[#E11449] border-2 border-white flex items-center justify-center shadow-2xl ring-4 ring-[#E11449]/25">
                  <div className="w-3.5 h-3.5 rounded-full bg-white" />
                </div>
                <div className="w-1.5 h-3 bg-[#E11449] -mt-0.5 rounded-b-xs" />
                <div className="w-4 h-1.5 bg-black/30 rounded-full blur-[1.5px] mt-0.5" />
              </div>

              {/* Floating Locate Me (GPS) Button */}
              <button
                type="button"
                onClick={handleLocateMe}
                className="absolute bottom-56 sm:bottom-52 right-4 z-[300] w-12 h-12 rounded-full bg-white text-slate-800 shadow-2xl border border-slate-200/80 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition"
                title="Locate Current Position"
              >
                <Crosshair size={22} className={`stroke-[2.2] ${isLocating ? 'animate-spin text-[#E11449]' : 'text-slate-800'}`} />
              </button>
            </div>

            {/* Bottom Sheet Card: Step 1 Confirmation */}
            <div className="relative z-[400] bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-7 shadow-[0_-10px_35px_rgba(0,0,0,0.12)] border-t border-slate-100 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SERVICEABLE AREA</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  {currentTitle}
                </h3>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide truncate block">
                  {isResolving ? 'Resolving street address...' : currentSubtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={handleProceedToDetails}
                className="w-full py-4 bg-[#E11449] hover:bg-[#c90f3e] text-white rounded-2xl text-base font-black tracking-wide transition flex items-center justify-center gap-2 shadow-xl shadow-[#E11449]/30 active:scale-[0.98]"
              >
                <span>Confirm Location</span>
                <ArrowRight size={20} className="stroke-[2.5]" />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: DELIVERY DETAILS FORM (EXACT MATCH TO SCREENSHOT)  */}
        {/* ========================================================= */}
        {step === 'details' && (
          <div className="flex-1 w-full h-full flex flex-col justify-between p-5 sm:p-6 bg-gradient-to-b from-white via-[#FAF9FA] to-[#F5F3F7] overflow-y-auto scrollbar-none animate-in fade-in slide-in-from-right-4 duration-200">
            
            <div className="space-y-5">
              
              {/* Header with Back Button */}
              <div className="flex items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('location')}
                  className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-800 hover:bg-slate-50 transition cursor-pointer active:scale-95"
                  title="Back to Map"
                >
                  <ChevronLeft size={22} className="stroke-[2.5]" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    Delivery Details
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                    STEP 2 OF 2 • DETAILS
                  </p>
                </div>
              </div>

              {/* Card 1: Selected Location Summary */}
              <div className="bg-white p-4 sm:p-4.5 rounded-3xl border border-slate-100/90 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E11449] flex items-center justify-center shrink-0 shadow-xs">
                    <MapPin size={22} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      SELECTED LOCATION
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                      {currentSubtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('location')}
                  className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-600 font-black text-xs hover:bg-rose-100 transition shrink-0 uppercase tracking-wide"
                >
                  CHANGE
                </button>
              </div>

              {/* Delivery Details Form */}
              <form onSubmit={handleSaveAndContinue} className="space-y-4">
                
                {/* Field 1: Recipient Name */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>RECIPIENT NAME</span>
                  </label>
                  <div className="flex items-center gap-3 px-5 py-3.5 bg-white border border-slate-200/80 rounded-full shadow-xs focus-within:ring-2 focus-within:ring-rose-500/30 focus-within:border-rose-400 transition">
                    <User size={18} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Your Full Name"
                      className="text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none w-full bg-transparent"
                    />
                  </div>
                </div>

                {/* Field 2: Contact Number */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>CONTACT NUMBER</span>
                  </label>
                  <div className="flex items-center gap-3 px-5 py-3.5 bg-white border border-slate-200/80 rounded-full shadow-xs focus-within:ring-2 focus-within:ring-rose-500/30 focus-within:border-rose-400 transition">
                    <Phone size={18} className="text-slate-400 shrink-0" />
                    <input
                      type="tel"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none w-full bg-transparent"
                    />
                  </div>
                </div>

                {/* Field 3: Flat / House / Landmark */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>FLAT / HOUSE / LANDMARK</span>
                  </label>
                  <div className="flex items-start gap-3 px-5 py-4 bg-white border border-slate-200/80 rounded-3xl shadow-xs focus-within:ring-2 focus-within:ring-rose-500/30 focus-within:border-rose-400 transition min-h-[110px]">
                    <Home size={18} className="text-slate-400 shrink-0 mt-0.5" />
                    <textarea
                      rows={3}
                      required
                      value={flatDetails}
                      onChange={(e) => setFlatDetails(e.target.value)}
                      placeholder="Add flat no, floor, landmark etc."
                      className="text-sm font-medium text-slate-800 placeholder-slate-300 focus:outline-none w-full bg-transparent resize-none leading-relaxed"
                    />
                  </div>
                </div>

              </form>

            </div>

            {/* Bottom Actions & Notice */}
            <div className="pt-4 space-y-3 shrink-0">
              
              {/* Notice Banner */}
              {errorMessage ? (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-in fade-in">
                  <AlertCircle size={15} />
                  <span>{errorMessage}</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-rose-600 text-[11px] font-semibold text-center">
                  Superfast 10-15 minute delivery will be dispatched to this address.
                </div>
              )}

              {/* Save & Continue Button */}
              <button
                type="button"
                onClick={handleSaveAndContinue}
                className="w-full py-4 bg-[#E55A7E] hover:bg-[#d84a70] text-white rounded-full text-base font-black tracking-wide transition flex items-center justify-center gap-2 shadow-lg shadow-[#E55A7E]/30 active:scale-[0.98]"
              >
                <span>Save & Continue</span>
                <ArrowRight size={20} className="stroke-[2.5]" />
              </button>

            </div>

          </div>
        )}

      </div>

    </div>,
    document.body
  );
};

export default LocationPickerModal;
