'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent({ lat, lng, radiusKm, onLocationChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const circleRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialiser la carte
    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: getZoomForRadius(radiusKm),
      zoomControl: true,
      attributionControl: false,
    });

    // Style de carte sombre
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Marqueur personnalisé
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #f472b6);
          border: 3px solid #fff;
          box-shadow: 0 4px 15px rgba(168, 85, 247, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        ">
          📍
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([lat, lng], { 
      icon: customIcon,
      draggable: !!onLocationChange,
    }).addTo(map);

    // Cercle de rayon
    const circle = L.circle([lat, lng], {
      radius: radiusKm * 1000,
      color: '#a855f7',
      fillColor: '#a855f7',
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 5',
    }).addTo(map);

    // Event drag du marker
    if (onLocationChange) {
      marker.on('dragend', (e) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        onLocationChange(newLat, newLng);
        circle.setLatLng([newLat, newLng]);
      });
    }

    mapInstanceRef.current = map;
    circleRef.current = circle;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Mettre à jour le rayon quand il change
  useEffect(() => {
    if (circleRef.current && mapInstanceRef.current) {
      circleRef.current.setRadius(radiusKm * 1000);
      mapInstanceRef.current.setZoom(getZoomForRadius(radiusKm));
    }
  }, [radiusKm]);

  // Mettre à jour la position
  useEffect(() => {
    if (circleRef.current && markerRef.current && mapInstanceRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng]);
    }
  }, [lat, lng]);

  function getZoomForRadius(radius) {
    if (radius <= 10) return 12;
    if (radius <= 25) return 11;
    if (radius <= 50) return 10;
    if (radius <= 100) return 9;
    return 8;
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: 300,
        borderRadius: 12,
      }}
    />
  );
}

