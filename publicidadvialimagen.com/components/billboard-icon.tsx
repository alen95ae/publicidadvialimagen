import L from "leaflet"

export const createBillboardIcon = (isSelected = false) => {
  const iconSize = isSelected ? [32, 32] : [32, 32]
  const iconAnchor = [iconSize[0] / 2, iconSize[1]]
  
  return L.icon({
    iconUrl: "/icons/billboard.svg",
    iconSize,
    iconAnchor,
    popupAnchor: [0, -iconSize[1]],
    className: 'billboard-marker'
  })
}
