class StableMap extends HTMLElement {
  constructor() {
    super();
    this._map = null;
    this._markers = [];
  }

  connectedCallback() {
    if (!window.google) {
      console.error("Google Maps API not loaded");
      return;
    }

    const lat = parseFloat(this.getAttribute("lat")) || -16.5000;
    const lng = parseFloat(this.getAttribute("lng")) || -64.0000;
    const zoom = parseInt(this.getAttribute("zoom")) || 6;
    const height = this.getAttribute("height") || "520px";

    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = height;
    this.style.borderRadius = "12px";
    this.style.overflow = "hidden";

    this._map = new google.maps.Map(this, {
      center: { lat, lng },
      zoom,
      gestureHandling: "greedy",
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      clickableIcons: false,
      mapId: "native-map",
    });

    const pointsAttr = this.getAttribute("points");
    if (pointsAttr) {
      try {
        const points = JSON.parse(pointsAttr);
        points.forEach((p) => {
          const marker = new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            title: p.title || "",
            icon: {
              url: "/icons/billboard.svg",
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16),
            },
            map: this._map,
          });
          this._markers.push(marker);
        });
      } catch (e) {
        console.warn("Invalid points JSON");
      }
    }
  }

  disconnectedCallback() {
    this._markers.forEach((m) => m.setMap(null));
    this._markers = [];
    this._map = null;
  }
}

customElements.define("stable-map", StableMap);
