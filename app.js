
function runAI(inputText) {
  const fakeResponses = [
    "This situation appears to be critical. Please deploy emergency services immediately.",
    "It looks like the issue is of medium severity. Suggest monitoring and sending volunteers if needed.",
    "This seems to be a low-priority case, but still keep an eye on it.",
    "Urgent medical aid is required based on the message content.",
    "Recommend contacting nearby resources for quick resolution.",
    "This message indicates risk to human life – prioritize immediately."
  ];
  const index = Math.floor(Math.random() * fakeResponses.length);
  return {
    aiMessage: fakeResponses[index],
    timestamp: new Date().toISOString(),
  };
}


function detectPriority(message) {
  const msg = message.toLowerCase();

  const highKeywords = ["fire", "burning", "explosion", "injured", "unconscious", "accident", "collapsed", "severe", "blood", "emergency", "critical"];
  const mediumKeywords = ["stuck", "stranded", "flood", "water", "blocked", "trapped", "no food", "shortage", "rescued"];
  const lowKeywords = ["power", "electricity", "internet", "transport", "mild", "waiting", "slow", "supply", "signal"];

  if (highKeywords.some(word => msg.includes(word))) return "High";
  if (mediumKeywords.some(word => msg.includes(word))) return "Medium";
  if (lowKeywords.some(word => msg.includes(word))) return "Low";

  return "Medium";
}

function suggestResources(message) {
  const lower = message.toLowerCase();

  const mapping = [
    { keywords: ["injury", "injured", "bleeding", "accident", "unconscious"], resources: ["Ambulance", "Medical Team"] },
    { keywords: ["fire", "burning", "smoke", "blast"], resources: ["Fire Brigade", "Rescue Team"] },
    { keywords: ["collapsed", "debris", "trapped", "buried"], resources: ["Search & Rescue", "Heavy Equipment"] },
    { keywords: ["flood", "water", "drowned"], resources: ["Boat Team", "Flood Relief"] },
    { keywords: ["no food", "hungry", "starving"], resources: ["Food Supply"] },
    { keywords: ["electricity", "power", "outage"], resources: ["Electricity Dept."] },
    { keywords: ["stuck", "stranded", "blocked"], resources: ["Evacuation Team", "Transport Unit"] }
  ];

  const recommendations = new Set();

  mapping.forEach(entry => {
    if (entry.keywords.some(k => lower.includes(k))) {
      entry.resources.forEach(r => recommendations.add(r));
    }
  });

  return [...recommendations].join(", ") || "General Response Team";
}


let map, priorityChart;
const markers = [];

document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([22.9734, 78.6569], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  loadInitialMarkers();
  hookUpUI();
  setInterval(generateRandomSOS, 45000);
});

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

  const ai = runAI(obj.message);

  const marker = L.marker(obj.location, { icon })
    .addTo(map)
    .bindPopup(`<b>${obj.name}</b><br>${obj.message}<br><span style="color:${color};font-weight:600">${obj.priority}</span><br><i>🤖 AI: ${ai.aiMessage}</i>`);

  marker.meta = { priority: obj.priority };
  markers.push(marker);
}

const sosForm = document.getElementById("sosForm");
document.getElementById("newSosBtn").addEventListener("click", () => sosModal.classList.remove("hidden"));
window.closeSOSModal = () => sosModal.classList.add("hidden");

document.getElementById("sosMessage").addEventListener("input", (e) => {
  document.getElementById("sosPriority").value = detectPriority(e.target.value);
  document.getElementById("sosRecommendation").value = suggestResources(e.target.value);
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
  const lat = 8 + Math.random() * 23;
  const lng = 68 + Math.random() * 30;

  const sos = { name, message, location: [lat, lng], priority };
  addMarkerFromObject(sos);
  updateStats();
  updateChart();
  showToast(`🚨 New SOS from ${name}`, priority);
}

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

function getColor(priority) {
  const p = priority.toLowerCase();
  if (p === "high") return "red";
  if (p === "medium") return "orange";
  if (p === "low") return "green";
  return "gray";
}

function hookUpUI() {
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
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById("sosLat").value = pos.coords.latitude.toFixed(6);
        document.getElementById("sosLng").value = pos.coords.longitude.toFixed(6);
        alert("📍 Location auto-filled!");
      },
      (err) => {
        alert("❌ Location access denied. Enter manually.");
        console.error(err);
      }
    );
  } else {
    alert("Geolocation not supported.");
  }
}
