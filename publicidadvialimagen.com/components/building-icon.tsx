import L from "leaflet"

export const createBuildingIcon = (size: number = 28) => {
  const iconSize: [number, number] = [size, size]
  const iconAnchor: [number, number] = [iconSize[0] / 2, iconSize[1]]

  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.25)"/>
          </filter>
        </defs>
        <!-- Building only, no background frame -->
        <!-- Roof cap -->
        <rect x="8" y="4" width="12" height="3" rx="1" fill="#dc2626" stroke="white" stroke-width="2" filter="url(#shadow)"/>
        <!-- Body -->
        <rect x="7" y="6" width="14" height="18" rx="1.5" fill="#dc2626" stroke="white" stroke-width="2" filter="url(#shadow)"/>
        <!-- Windows (white) -->
        <rect x="9" y="8" width="3" height="3" rx="0.5" fill="white"/>
        <rect x="13" y="8" width="3" height="3" rx="0.5" fill="white"/>
        <rect x="17" y="8" width="3" height="3" rx="0.5" fill="white"/>
        <rect x="9" y="12" width="3" height="3" rx="0.5" fill="white"/>
        <rect x="13" y="12" width="3" height="3" rx="0.5" fill="white"/>
        <rect x="17" y="12" width="3" height="3" rx="0.5" fill="white"/>
        <!-- Door -->
        <rect x="13" y="16" width="3" height="7" rx="0.5" fill="white"/>
      </svg>
    `)}`,
    iconSize,
    iconAnchor,
    popupAnchor: [0, -iconSize[1]],
    className: 'building-marker'
  })
}


