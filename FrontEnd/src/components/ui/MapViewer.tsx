"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, MapPin } from "lucide-react";

// Importações do OpenLayers
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";

interface MapViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationString: string; // Recebe a string completa (Ex: "Rua X | Lat: 12, Lng: 34")
}

export function MapViewerModal({ isOpen, onClose, locationString }: MapViewerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource | null>(null);
  const [hasCoords, setHasCoords] = useState(true);

  useEffect(() => {
    if (isOpen && mapRef.current && !mapInstance.current) {
      
      // 1. Tenta extrair as coordenadas da string
      let lon = -43.76; // Padrão Barbacena
      let lat = -21.22;
      let coordsFound = false;

      const latMatch = locationString.match(/Lat:\s*(-?\d+\.\d+)/) || locationString.match(/\s*(-?\d+\.\d+,)/);
      const lngMatch = locationString.match(/Lng:\s*(-?\d+\.\d+)/) || locationString.match(/,\s*(-?\d+\.\d+)/);

      if (latMatch && lngMatch) {
        lat = parseFloat(latMatch[1]);
        lon = parseFloat(lngMatch[1]);
        coordsFound = true;
      }
      setHasCoords(coordsFound);

      const centerCoords = fromLonLat([lon, lat]);

      // 2. Prepara o pino (Feature)
      vectorSource.current = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource.current,
        style: new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
            scale: 0.06,
          }),
        }),
      });

      if (coordsFound) {
        vectorSource.current.addFeature(new Feature({ geometry: new Point(centerCoords) }));
      }

      // 3. Monta o Mapa
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [new TileLayer({ source: new OSM() }), vectorLayer],
        view: new View({
          center: centerCoords,
          zoom: coordsFound ? 16 : 13, // Dá um zoom maior se tiver o pino
        }),
      });
    }

    // 4. Limpeza ao fechar
    return () => {
      if (mapInstance.current && !isOpen) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, [isOpen, locationString]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6">
      <div className="bg-background w-full max-w-4xl h-[85vh] rounded-sm shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden relative">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 absolute top-0 left-0 right-0 z-10 backdrop-blur">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[250px] md:max-w-md">
              {locationString || "Localização não informada"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODO MAPA */}
        <div className="flex-1 flex flex-col relative bg-muted pt-14">
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Aviso se não houver coordenadas exatas */}
          {!hasCoords && locationString && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur shadow-xl border border-amber-500/50 rounded-md p-3 text-center w-11/12 max-w-sm">
              <p className="text-xs font-bold uppercase text-amber-500 tracking-wider mb-1">Atenção</p>
              <p className="text-sm font-medium text-foreground">Este projeto não possui coordenadas GPS exatas cadastradas.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}