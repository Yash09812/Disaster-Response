// ✅ FIXED VERSION OF app.js

/* ----------  AI PRIORITY DETECTION ---------- */
function detectPriority(message) {
  const msg = message.toLowerCase();

  const highKeywords = ["fire", "bleeding", "collapse", "urgent", "injured", "unconscious", "accident"];
  const mediumKeywords = ["flood", "stuck", "water", "food", "stranded", "blocked"];
  const lowKeywords = ["electricity", "power", "transport", "slow", "internet", "mild"];

  if (highKeywords.some(word => msg.includes(word))) return "High";
  if (mediumKeywords.some(word => msg.includes(word))) return "Medium";
  if (lowKeywords.some(word => msg.includes(word))) return "Low";
  return "Medium"; // default fallback
}

/* ----------  INITIALISE MAP ---------- */
let map;
let priorityChart; // Pie chart reference
const markers = [];

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([28.6139, 77.2090], 10);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  loadInitialMarkers();
  hookUpUI();
  setInterval(generateRandomSOS, 20000); // 💡 AUTO SOS
});

/* ----------  LOAD JSON MARKERS ---------- */
function loadInitialMarkers() {
  fetch("data/sos.json")
    .then(res => res.json())
    .then(data => {
      data.forEach(addMarkerFromObject);
      updateStats();
      updateChart();
    })
    .catch(err => console.error("Failed to load JSON:", err));
}

function addMarkerFromObject(obj) {
  const color = getColor(obj.priority);
  const icon = L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  const marker = L.marker(obj.location, { icon })
    .addTo(map)
    .bindPopup(`<b>${obj.name}</b><br>${obj.message}<br><span style="color:${color};font-weight:600">${obj.priority}</span>`);

  marker.meta = { priority: obj.priority };
  markers.push(marker);
}

/* ----------  SOS FORM HANDLING ---------- */
const sosModal = document.getElementById("sosModal");
const newSosBtn = document.getElementById("newSosBtn");
const sosForm = document.getElementById("sosForm");

newSosBtn.addEventListener("click", () => sosModal.classList.remove("hidden"));
window.closeSOSModal = () => sosModal.classList.add("hidden");

// Live Priority Detection
const sosMessage = document.getElementById("sosMessage");
sosMessage.addEventListener("input", (e) => {
  const priority = detectPriority(e.target.value);
  document.getElementById("sosPriority").value = priority;
});

sosForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("sosName").value.trim();
  const message = document.getElementById("sosMessage").value.trim();
  const lat = parseFloat(document.getElementById("sosLat").value);
  const lng = parseFloat(document.getElementById("sosLng").value);
  const priority = detectPriority(message);

  const newSOS = { name, message, location: [lat, lng], priority };
  addMarkerFromObject(newSOS);
  updateStats();
  updateChart();
  closeSOSModal();
  sosForm.reset();
  showToast(`🚨 SOS added: ${name}`, priority);
});

/* ----------  FILTER ---------- */
document.getElementById("refreshBtn").addEventListener("click", () => {
  document.getElementById("filterSelect").value = "All";
  markers.forEach(m => m.addTo(map));
  updateStats();
  updateChart();
});

document.getElementById("filterSelect").addEventListener("change", () => {
  const value = document.getElementById("filterSelect").value;
  markers.forEach(m => map[value === "All" || m.meta.priority === value ? 'addLayer' : 'removeLayer'](m));
  updateStats();
  updateChart();
});

/* ----------  STATS & PIE CHART ---------- */
function updateStats() {
  document.getElementById("missionCount").textContent = markers.filter(m => map.hasLayer(m)).length;
}

function updateChart() {
  const counts = { High: 0, Medium: 0, Low: 0 };
  markers.forEach(marker => {
    if (map.hasLayer(marker)) counts[marker.meta.priority]++;
  });
  const data = {
    labels: ["High", "Medium", "Low"],
    datasets: [{
      data: [counts.High, counts.Medium, counts.Low],
      backgroundColor: ["#dc2626", "#ea580c", "#16a34a"],
      hoverOffset: 10
    }]
  };
  if (priorityChart) {
    priorityChart.data = data;
    priorityChart.update();
  } else {
    const ctx = document.getElementById("priorityChart")?.getContext("2d");
    if (ctx) priorityChart = new Chart(ctx, { type: 'pie', data });
  }
}

/* ----------  RANDOM SOS GENERATOR ---------- */
const randomNames = ["Ravi", "Meena", "Amit", "Tara", "Faizan", "Neha", "Rahul", "Priya"];
const randomMessages = [
  "Trapped under debris near market",
  "Need medical aid urgently",
  "Flooded road, unable to move",
  "Fire spreading in area",
  "Water supply cut off for days",
  "No electricity, family stuck",
  "Collapsed building – urgent help",
  "Injured and unconscious person spotted"
];

function generateRandomSOS() {
  const name = randomNames[Math.floor(Math.random() * randomNames.length)];
  const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
  const priority = detectPriority(message);
  const lat = 28.6139 + (Math.random() - 0.5) * 0.1;
  const lng = 77.2090 + (Math.random() - 0.5) * 0.1;
  const fakeSOS = { name, message, location: [lat, lng], priority };
  addMarkerFromObject(fakeSOS);
  updateStats();
  updateChart();
  showToast(`🚨 New SOS from ${name}`, priority);
}

/* ----------  TOAST NOTIFICATIONS ---------- */
function showToast(text, priority) {
  const toast = document.createElement("div");
  toast.textContent = text;
  toast.className = `fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 animate-fade-in-out ${
    priority === "High" ? "bg-red-600" : priority === "Medium" ? "bg-orange-500" : "bg-green-600"
  }`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

const style = document.createElement("style");
style.textContent = `
@keyframes fade-in-out {
  0% {opacity: 0; transform: translateY(-10px);}
  10% {opacity: 1; transform: translateY(0);}
  90% {opacity: 1; transform: translateY(0);}
  100% {opacity: 0; transform: translateY(-10px);}
}
.animate-fade-in-out {
  animation: fade-in-out 4s ease forwards;
}`;
document.head.appendChild(style);

/* ----------  UTILITY ---------- */
function getColor(priority) {
  const p = priority.toLowerCase();
  if (p === "high") return "red";
  if (p === "medium") return "orange";
  if (p === "low") return "green";
  return "gray";
}

function hookUpUI() {
  // Language selector and other dynamic UI features can go here
}
