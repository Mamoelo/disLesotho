// live.js
// Event data structure
let events = JSON.parse(localStorage.getItem("events")) || [];
let currentEventId = 1;

// DOM Elements
const eventsList = document.getElementById("eventsList");
const createEventTab = document.getElementById("createEventTab");
const manageEventsTab = document.getElementById("manageEventsTab");
const totalEventsCount = document.getElementById("totalEventsCount");
const liveEventsCount = document.getElementById("liveEventsCount");
const viewersCount = document.getElementById("viewersCount");

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  renderEvents();
  updateDashboardCounts();
  setupTabNavigation();

  // Event type toggle
  const eventTypeRadios = document.querySelectorAll('input[name="eventType"]');
  const virtualSection = document.getElementById("virtualStreamSection");
  const physicalSection = document.getElementById("physicalSetupSection");

  eventTypeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "virtual") {
        virtualSection.style.display = "block";
        physicalSection.style.display = "none";
      } else {
        virtualSection.style.display = "none";
        physicalSection.style.display = "block";
      }
    });
  });

  // Form submission
  document.getElementById("eventForm").addEventListener("submit", function (e) {
    e.preventDefault();
    createNewEvent();
  });
});

function setupTabNavigation() {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");

      // Show the corresponding content
      const tabName = this.dataset.tab;

      if (tabName === "create") {
        createEventTab.style.display = "block";
        manageEventsTab.style.display = "none";
      } else if (tabName === "manage") {
        createEventTab.style.display = "none";
        manageEventsTab.style.display = "block";
        renderEvents(); // Refresh the events list
      }
    });
  });
}

function createNewEvent() {
  const newEvent = {
    id: currentEventId++,
    title: document.getElementById("eventTitle").value,
    date: document.getElementById("eventDate").value,
    type: document.querySelector('input[name="eventType"]:checked').value,
    host: document.getElementById("eventHost").value,
    presenter: document.getElementById("eventPresenter").value,
    location: document.getElementById("eventLocation").value,
    description: document.getElementById("eventDescription").value,
    streamLink: document.getElementById("streamLink").value,
    status: "upcoming", // upcoming, live, completed, canceled
    recording: false,
    viewers: 0,
  };

  events.push(newEvent);
  saveEvents();
  renderEvents();
  updateDashboardCounts();

  // Reset form
  document.getElementById("eventForm").reset();

  // Switch to Manage Events tab
  document.querySelector('.tab[data-tab="manage"]').click();

  alert("Event created successfully!");
}

function renderEvents() {
  eventsList.innerHTML = "";

  if (events.length === 0) {
    eventsList.innerHTML =
      '<div class="no-events">No events created yet. Create your first event!</div>';
    return;
  }

  events.forEach((event) => {
    const eventCard = document.createElement("div");
    eventCard.className = "event-card";
    eventCard.innerHTML = `
      <div class="event-banner">
        <span class="event-status status-${
          event.status
        }">${event.status.toUpperCase()}</span>
      </div>
      <div class="event-content">
        <h3 class="event-title">${event.title}</h3>
        <div class="event-meta">
          <div>
            <i class="far fa-calendar"></i>
            <span>${formatDate(event.date)}</span>
          </div>
          <div>
            <i class="fas fa-user"></i> Host: <span>${event.host}</span>
          </div>
          <div>
            <i class="fas fa-map-marker-alt"></i>
            <span>${event.location}</span>
          </div>
        </div>
        <div class="event-description">
          ${event.description}
        </div>
        <div class="event-stream">
          <div class="stream-placeholder">
            ${
              event.status === "live"
                ? `<div class="live-indicator">
                <span class="live-dot"></span> LIVE - ${event.viewers} viewers
              </div>`
                : '<i class="fas fa-video fa-2x"></i>'
            }
          </div>
          <div class="stream-info">
            <div>
              <i class="fas fa-link"></i>
              <a href="${
                event.streamLink || "#"
              }" class="stream-link" target="_blank">
                ${event.streamLink ? "Stream Link" : "No stream link"}
              </a>
            </div>
            <div><span>${event.type}</span> Event</div>
          </div>
        </div>
      </div>
      <div class="event-actions">
        ${
          event.status === "upcoming"
            ? `
          <button class="btn btn-primary go-live-btn" data-id="${event.id}">
            <i class="fas fa-broadcast-tower"></i> Go Live
          </button>
        `
            : ""
        }
        
        ${
          event.status === "live"
            ? `
          <button class="btn btn-danger stop-live-btn" data-id="${event.id}">
            <i class="fas fa-stop"></i> Stop Live
          </button>
        `
            : ""
        }
        
        <button class="btn ${
          event.recording ? "btn-danger" : "btn-success"
        } record-btn" data-id="${event.id}">
          <i class="fas fa-circle"></i> ${
            event.recording ? "Stop Recording" : "Start Recording"
          }
        </button>
        
        ${
          event.status === "upcoming" || event.status === "live"
            ? `
          <button class="btn btn-outline cancel-btn" data-id="${event.id}">
            <i class="fas fa-times"></i> Cancel
          </button>
        `
            : ""
        }
      </div>
    `;

    eventsList.appendChild(eventCard);
  });

  // Add event listeners to buttons
  document.querySelectorAll(".go-live-btn").forEach((btn) => {
    btn.addEventListener("click", () => goLive(parseInt(btn.dataset.id)));
  });

  document.querySelectorAll(".stop-live-btn").forEach((btn) => {
    btn.addEventListener("click", () => stopLive(parseInt(btn.dataset.id)));
  });

  document.querySelectorAll(".record-btn").forEach((btn) => {
    btn.addEventListener("click", () =>
      toggleRecording(parseInt(btn.dataset.id))
    );
  });

  document.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener("click", () => cancelEvent(parseInt(btn.dataset.id)));
  });
}

function goLive(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (!event) return;

  if (event.type === "virtual" && !event.streamLink) {
    alert("Please add a stream link for this virtual event");
    return;
  }

  event.status = "live";
  event.viewers = Math.floor(Math.random() * 1000); // Simulate viewers
  saveEvents();
  renderEvents();
  updateDashboardCounts();

  // Simulate viewer count increase
  const intervalId = setInterval(() => {
    if (event.status === "live") {
      event.viewers += Math.floor(Math.random() * 10);
      saveEvents();
      updateDashboardCounts();

      // Update the specific event card
      const viewerElement = document.querySelector(
        `.event-card[data-id="${eventId}"] .live-indicator`
      );
      if (viewerElement) {
        viewerElement.textContent = `LIVE - ${event.viewers} viewers`;
      }
    } else {
      clearInterval(intervalId);
    }
  }, 5000);
}

function stopLive(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (!event) return;

  event.status = "completed";
  saveEvents();
  renderEvents();
  updateDashboardCounts();
}

function toggleRecording(eventId) {
  const event = events.find((e) => e.id === eventId);
  if (!event) return;

  event.recording = !event.recording;
  saveEvents();
  renderEvents();

  // Simulate saving recording to database
  if (event.recording) {
    console.log(`Recording started for event: ${event.title}`);
  } else {
    console.log(`Recording stopped and saved for event: ${event.title}`);
    // In a real app, you would save to database here
  }
}

function cancelEvent(eventId) {
  if (!confirm("Are you sure you want to cancel this event?")) return;

  const event = events.find((e) => e.id === eventId);
  if (!event) return;

  event.status = "canceled";
  saveEvents();
  renderEvents();
  updateDashboardCounts();
}

function saveEvents() {
  localStorage.setItem("events", JSON.stringify(events));
  localStorage.setItem("currentEventId", currentEventId.toString());
}

function updateDashboardCounts() {
  totalEventsCount.textContent = events.length;

  const liveCount = events.filter((e) => e.status === "live").length;
  liveEventsCount.textContent = liveCount;

  const totalViewers = events.reduce((sum, event) => sum + event.viewers, 0);
  viewersCount.textContent = totalViewers.toLocaleString();
}

function formatDate(dateString) {
  if (!dateString) return "Date not set";
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Initialize currentEventId from localStorage
document.addEventListener("DOMContentLoaded", function () {
  const savedId = localStorage.getItem("currentEventId");
  if (savedId) {
    currentEventId = parseInt(savedId);
  }
});
