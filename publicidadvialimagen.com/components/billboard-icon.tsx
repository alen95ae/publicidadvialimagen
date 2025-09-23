import L from "leaflet"

export const createBillboardIcon = (isSelected = false) => {
  const iconSize = isSelected ? [30, 30] : [25, 25]
  const iconAnchor = [iconSize[0] / 2, iconSize[1]]
  
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${iconSize[0]}" height="${iconSize[1]}" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
          </filter>
        </defs>
        <!-- Billboard sign -->
        <rect x="2" y="2" width="21" height="12" rx="2" fill="#dc2626" stroke="white" stroke-width="2" filter="url(#shadow)"/>
        <!-- Support post -->
        <rect x="11" y="14" width="3" height="8" fill="#dc2626" stroke="white" stroke-width="1" filter="url(#shadow)"/>
      </svg>
    `)}`,
    iconSize,
    iconAnchor,
    popupAnchor: [0, -iconSize[1]],
    className: 'billboard-marker'
  })
}
