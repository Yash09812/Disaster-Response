document.addEventListener("DOMContentLoaded", () => {
  // Initialize the map
  const map = L.map("map").setView([28.6139, 77.2090], 10); // Delhi

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Fetch SOS data from local file
  fetch("data/sos.json")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((sos) => {
        const [lat, lon] = sos.location;
        const color = getMarkerColor(sos.priority);

        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([lat, lon], { icon })
          .addTo(map)
          .bindPopup(`
            <b>${sos.name}</b><br>
            ${sos.message}<br>
            <span style="color:${color}; font-weight:bold;">Priority: ${sos.priority}</span>
          `);
      });
    })
    .catch((error) => console.error("Error loading SOS data:", error));

  // Helper to get marker color
  function getMarkerColor(priority) {
    switch (priority) {
      case "High":
        return "red";
      case "Medium":
        return "orange";
      case "Low":
        return "green";
      default:
        return "gray";
    }
  }
});
