let currentSection = "dashboard";
let adminData = {
  users: [],
  drivers: [],
  bookings: [],
  promos: [],
  supportTickets: [],
  analytics: {},
};

document.addEventListener("DOMContentLoaded", function () {
  initializeAdminPanel();
});

function initializeAdminPanel() {
  if (!checkAdminAuth()) {
    redirectToLogin();
    return;
  }

  setupAdminNavigation();
  loadAdminData();
  initializeCharts();
  setupFilters();
  loadDashboard();
}

function checkAdminAuth() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  return currentUser.type === "admin";
}

function redirectToLogin() {
  window.location.href = "index.html";
}

function setupAdminNavigation() {
  const navItems = document.querySelectorAll(".admin-nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      const section = this.dataset.section;
      switchAdminSection(section);
    });
  });
}

function switchAdminSection(section) {
  document.querySelectorAll(".admin-nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  document.querySelector(`[data-section="${section}"]`).classList.add("active");

  document.querySelectorAll(".admin-section").forEach((section) => {
    section.classList.remove("active");
  });

  document.getElementById(`${section}-section`).classList.add("active");
  currentSection = section;

  loadSectionData(section);
}

function loadAdminData() {
  adminData.users = generateMockUsers();
  adminData.drivers = generateMockDrivers();
  adminData.bookings = generateMockBookings();
  adminData.promos = generateMockPromos();
  adminData.supportTickets = generateMockSupportTickets();
  adminData.analytics = generateMockAnalytics();
}

function loadSectionData(section) {
  switch (section) {
    case "dashboard":
      loadDashboard();
      break;
    case "users":
      loadUsersTable();
      break;
    case "drivers":
      loadDriversTable();
      break;
    case "bookings":
      loadBookingsTable();
      break;
    case "tracking":
      loadLiveTracking();
      break;
    case "pricing":
      loadPricingSettings();
      break;
    case "promos":
      loadPromosTable();
      break;
    case "support":
      loadSupportTickets();
      break;
    case "analytics":
      loadAnalytics();
      break;
  }
}

function loadDashboard() {
  updateMetrics();
  updateRecentActivity();
  updateCharts();
}

function updateMetrics() {
  const metrics = {
    totalUsers: adminData.users.length,
    activeDrivers: adminData.drivers.filter((d) => d.status === "active")
      .length,
    bookingsToday: adminData.bookings.filter((b) => isToday(new Date(b.date)))
      .length,
    revenueToday: calculateTodayRevenue(),
  };

  console.log("Metrics updated:", metrics);
}

function updateRecentActivity() {
  const activities = [
    {
      icon: "fas fa-user-plus",
      message: "New user registered: john.smith@email.com",
      time: "2 minutes ago",
    },
    {
      icon: "fas fa-calendar-check",
      message: "Booking completed: Trip #BK1234 - £25.50",
      time: "5 minutes ago",
    },
    {
      icon: "fas fa-car",
      message: "Driver verified: Sarah Johnson (ID: DR567)",
      time: "15 minutes ago",
    },
  ];

  const activityList = document.querySelector(".activity-list");
  if (activityList) {
    activityList.innerHTML = activities
      .map(
        (activity) => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `
      )
      .join("");
  }
}

function initializeCharts() {
  const bookingsCtx = document.getElementById("bookingsChart");
  if (bookingsCtx) {
    new Chart(bookingsCtx, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Bookings",
            data: [120, 140, 160, 180, 200, 150, 130],
            borderColor: "#2c5aa0",
            backgroundColor: "rgba(44, 90, 160, 0.1)",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  const revenueCtx = document.getElementById("revenueChart");
  if (revenueCtx) {
    new Chart(revenueCtx, {
      type: "bar",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [
          {
            label: "Revenue",
            data: [15000, 18000, 22000, 25000],
            backgroundColor: "#27ae60",
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return "£" + value.toLocaleString();
              },
            },
          },
        },
      },
    });
  }
}

function updateCharts() {
  console.log("Charts updated");
}

function loadUsersTable() {
  const tbody = document.querySelector("#users-table tbody");
  if (!tbody) return;

  tbody.innerHTML = adminData.users
    .map(
      (user) => `
        <tr>
            <td><input type="checkbox" value="${user.id}"></td>
            <td>
                <div class="user-info">
                    <div class="user-avatar">${user.name.charAt(0)}</div>
                    <div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-id">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.tripCount}</td>
            <td>£${user.totalSpent}</td>
            <td><span class="status-badge status-${user.status}">${
        user.status
      }</span></td>
            <td>${formatDate(user.joinedDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editUser('${
                      user.id
                    }')" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-approve" onclick="viewUserDetails('${
                      user.id
                    }')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="suspendUser('${
                      user.id
                    }')" title="Suspend User">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");

  setupTableActions();
}

function loadDriversTable() {
  const tbody = document.querySelector("#drivers-table tbody");
  if (!tbody) return;

  tbody.innerHTML = adminData.drivers
    .map(
      (driver) => `
        <tr>
            <td><input type="checkbox" value="${driver.id}"></td>
            <td>
                <div class="driver-info">
                    <div class="driver-avatar">${driver.name.charAt(0)}</div>
                    <div>
                        <div class="driver-name">${driver.name}</div>
                        <div class="driver-id">ID: ${driver.id}</div>
                    </div>
                </div>
            </td>
            <td>${driver.license}</td>
            <td>
                <div class="vehicle-info">
                    <div>${driver.vehicle}</div>
                    <div class="vehicle-plate">${driver.licensePlate}</div>
                </div>
            </td>
            <td>
                <div class="rating">
                    <span class="rating-value">${driver.rating}</span>
                    <div class="rating-stars">
                        ${"★".repeat(Math.floor(driver.rating))}
                    </div>
                </div>
            </td>
            <td>${driver.tripCount}</td>
            <td><span class="status-badge status-${driver.status}">${
        driver.status
      }</span></td>
            <td><span class="online-status ${
              driver.online ? "online" : "offline"
            }">${driver.online ? "Online" : "Offline"}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-approve" onclick="verifyDriver('${
                      driver.id
                    }')" title="Verify Driver">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn btn-edit" onclick="editDriver('${
                      driver.id
                    }')" title="Edit Driver">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="suspendDriver('${
                      driver.id
                    }')" title="Suspend Driver">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");

  updateDriverStats();
}

function updateDriverStats() {
  const stats = {
    total: adminData.drivers.length,
    online: adminData.drivers.filter((d) => d.online).length,
    pending: adminData.drivers.filter((d) => d.status === "pending").length,
    averageRating: (
      adminData.drivers.reduce((sum, d) => sum + d.rating, 0) /
      adminData.drivers.length
    ).toFixed(1),
  };

  const statCards = document.querySelectorAll(
    "#drivers-section .stat-card .stat-number"
  );
  if (statCards.length >= 4) {
    statCards[0].textContent = stats.total;
    statCards[1].textContent = stats.online;
    statCards[2].textContent = stats.pending;
    statCards[3].textContent = stats.averageRating;
  }
}

function loadLiveTracking() {
  initializeTrackingMap();
  updateActiveTrips();
  startLiveTrackingUpdates();
}

function initializeTrackingMap() {
  const mapElement = document.getElementById("live-tracking-map");
  if (!mapElement || typeof google === "undefined") return;

  const map = new google.maps.Map(mapElement, {
    center: { lat: 51.5074, lng: -0.1278 },
    zoom: 12,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  });

  addTripMarkersToMap(map);
}

function addTripMarkersToMap(map) {
  const activeTrips = adminData.bookings.filter(
    (b) => b.status === "in_progress"
  );

  activeTrips.forEach((trip) => {
    const driverMarker = new google.maps.Marker({
      position: trip.driverLocation,
      map: map,
      title: `Driver: ${trip.driverName}`,
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="#27ae60"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">🚗</text>
                    </svg>
                `),
        scaledSize: new google.maps.Size(24, 24),
      },
    });

    const pickupMarker = new google.maps.Marker({
      position: trip.pickupLocation,
      map: map,
      title: "Pickup Location",
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="8" fill="#2c5aa0"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                `),
        scaledSize: new google.maps.Size(20, 20),
      },
    });

    const destinationMarker = new google.maps.Marker({
      position: trip.destinationLocation,
      map: map,
      title: "Destination",
      icon: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#e74c3c"/>
                        <circle cx="12" cy="9" r="2.5" fill="white"/>
                    </svg>
                `),
        scaledSize: new google.maps.Size(20, 20),
      },
    });
  });
}

function updateActiveTrips() {
  const activeTrips = adminData.bookings.filter(
    (b) => b.status === "in_progress"
  );
  const tripsList = document.getElementById("active-trips-list");

  if (tripsList) {
    tripsList.innerHTML = activeTrips
      .map(
        (trip) => `
            <div class="trip-card" onclick="focusOnTrip('${trip.id}')">
                <div class="trip-header">
                    <h4>Trip #${trip.id}</h4>
                    <span class="trip-status status-${trip.status}">${trip.status}</span>
                </div>
                <div class="trip-details">
                    <p><strong>Driver:</strong> ${trip.driverName}</p>
                    <p><strong>Passenger:</strong> ${trip.passengerName}</p>
                    <p><strong>ETA:</strong> ${trip.eta}</p>
                    <p><strong>Distance:</strong> ${trip.distance} miles</p>
                </div>
                <div class="trip-actions">
                    <button class="btn btn-small" onclick="contactDriver('${trip.driverId}')">Contact Driver</button>
                    <button class="btn btn-small" onclick="viewTripDetails('${trip.id}')">Details</button>
                </div>
            </div>
        `
      )
      .join("");
  }
}

function startLiveTrackingUpdates() {
  setInterval(() => {
    updateActiveTrips();
  }, 10000);
}

function loadPricingSettings() {
  const pricingData = {
    baseRate: 2.5,
    bookingFee: 3.0,
    commissionRate: 15,
    surgeRules: [
      {
        id: "peak",
        name: "Peak Hours (7-9 AM, 5-7 PM)",
        description: "Monday to Friday",
        multiplier: 1.3,
        active: true,
      },
      {
        id: "weekend",
        name: "Weekend Nights",
        description: "Friday & Saturday 10 PM - 3 AM",
        multiplier: 1.5,
        active: true,
      },
    ],
  };

  updatePricingOverview(pricingData);

  updateSurgeRules(pricingData.surgeRules);
}

function updatePricingOverview(data) {
  const pricingCards = document.querySelectorAll(
    "#pricing-section .pricing-value"
  );
  if (pricingCards.length >= 3) {
    pricingCards[0].innerHTML = `£${data.baseRate} <span>per mile</span>`;
    pricingCards[1].innerHTML = `£${data.bookingFee} <span>per booking</span>`;
    pricingCards[2].innerHTML = `${data.commissionRate}% <span>per trip</span>`;
  }
}

function updateSurgeRules(rules) {
  const surgeContainer = document.querySelector(".surge-rules");
  if (!surgeContainer) return;

  surgeContainer.innerHTML = rules
    .map(
      (rule) => `
        <div class="surge-rule">
            <div class="surge-info">
                <h4>${rule.name}</h4>
                <p>${rule.description}</p>
            </div>
            <div class="surge-multiplier">${rule.multiplier}x</div>
            <div class="surge-actions">
                <button class="btn btn-small" onclick="editSurgeRule('${rule.id}')">Edit</button>
                <button class="btn btn-small btn-delete" onclick="deleteSurgeRule('${rule.id}')">Delete</button>
            </div>
        </div>
    `
    )
    .join("");
}

function loadPromosTable() {
  const tbody = document.querySelector("#promos-table tbody");
  if (!tbody) return;

  tbody.innerHTML = adminData.promos
    .map(
      (promo) => `
        <tr>
            <td><code>${promo.code}</code></td>
            <td><span class="promo-type type-${promo.type}">${
        promo.type
      }</span></td>
            <td>${
              promo.type === "percentage"
                ? promo.discount + "%"
                : "£" + promo.discount
            }</td>
            <td>${promo.usedCount}</td>
            <td>${promo.maxUses || "Unlimited"}</td>
            <td>${formatDate(promo.expiryDate)}</td>
            <td><span class="status-badge status-${promo.status}">${
        promo.status
      }</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editPromo('${
                      promo.id
                    }')" title="Edit Promo">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-approve" onclick="duplicatePromo('${
                      promo.id
                    }')" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deletePromo('${
                      promo.id
                    }')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");

  updatePromoStats();
}

function updatePromoStats() {
  const stats = {
    active: adminData.promos.filter((p) => p.status === "active").length,
    usedToday: adminData.promos.reduce((sum, p) => sum + (p.usedToday || 0), 0),
    totalSavings: adminData.promos.reduce(
      (sum, p) => sum + (p.totalSavings || 0),
      0
    ),
  };

  const statCards = document.querySelectorAll(
    "#promos-section .stat-card .stat-number"
  );
  if (statCards.length >= 3) {
    statCards[0].textContent = stats.active;
    statCards[1].textContent = stats.usedToday;
    statCards[2].textContent = "£" + stats.totalSavings.toLocaleString();
  }
}

function loadSupportTickets() {
  const ticketsList = document.querySelector(".tickets-list");
  if (!ticketsList) return;

  ticketsList.innerHTML = adminData.supportTickets
    .map(
      (ticket) => `
        <div class="support-ticket" onclick="openTicketDetails('${ticket.id}')">
            <div class="ticket-header">
                <div class="ticket-info">
                    <h4>Ticket #${ticket.id}</h4>
                    <span class="ticket-priority priority-${ticket.priority}">${
        ticket.priority
      }</span>
                </div>
                <div class="ticket-meta">
                    <span class="ticket-time">${getTimeAgo(
                      ticket.createdAt
                    )}</span>
                    <span class="ticket-status status-${ticket.status}">${
        ticket.status
      }</span>
                </div>
            </div>
            <div class="ticket-content">
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>User:</strong> ${ticket.userName} (${
        ticket.userEmail
      })</p>
                <p class="ticket-preview">${ticket.message.substring(
                  0,
                  100
                )}...</p>
            </div>
            <div class="ticket-actions">
                <button class="btn btn-small" onclick="assignTicket('${
                  ticket.id
                }')">Assign</button>
                <button class="btn btn-small" onclick="respondToTicket('${
                  ticket.id
                }')">Respond</button>
            </div>
        </div>
    `
    )
    .join("");

  updateSupportStats();
}

function updateSupportStats() {
  const stats = {
    openTickets: adminData.supportTickets.filter((t) => t.status === "open")
      .length,
    avgResponseTime: "12 min",
    satisfactionRate: "94%",
  };

  const statCards = document.querySelectorAll(
    "#support-section .support-card .support-number"
  );
  if (statCards.length >= 3) {
    statCards[0].textContent = stats.openTickets;
    statCards[1].textContent = stats.avgResponseTime;
    statCards[2].textContent = stats.satisfactionRate;
  }
}

function setupFilters() {
  const userSearch = document.getElementById("user-search");
  if (userSearch) {
    userSearch.addEventListener("input", debounce(filterUsers, 300));
  }

  const userStatusFilter = document.getElementById("user-status-filter");
  if (userStatusFilter) {
    userStatusFilter.addEventListener("change", filterUsers);
  }
}

function filterUsers() {
  const searchTerm =
    document.getElementById("user-search")?.value.toLowerCase() || "";
  const statusFilter =
    document.getElementById("user-status-filter")?.value || "";

  let filteredUsers = adminData.users;

  if (searchTerm) {
    filteredUsers = filteredUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.phone.includes(searchTerm)
    );
  }

  if (statusFilter) {
    filteredUsers = filteredUsers.filter(
      (user) => user.status === statusFilter
    );
  }

  updateUsersTable(filteredUsers);
}

function updateUsersTable(users) {
  const tbody = document.querySelector("#users-table tbody");
  if (!tbody) return;

  tbody.innerHTML = users
    .map(
      (user) => `
        <tr>
            <td><input type="checkbox" value="${user.id}"></td>
            <td>
                <div class="user-info">
                    <div class="user-avatar">${user.name.charAt(0)}</div>
                    <div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-id">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.tripCount}</td>
            <td>£${user.totalSpent}</td>
            <td><span class="status-badge status-${user.status}">${
        user.status
      }</span></td>
            <td>${formatDate(user.joinedDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editUser('${
                      user.id
                    }')" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-approve" onclick="viewUserDetails('${
                      user.id
                    }')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="suspendUser('${
                      user.id
                    }')" title="Suspend User">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

function setupTableActions() {
  const selectAllUsers = document.getElementById("select-all-users");
  if (selectAllUsers) {
    selectAllUsers.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(
        '#users-table tbody input[type="checkbox"]'
      );
      checkboxes.forEach((cb) => (cb.checked = this.checked));
    });
  }

  const selectAllDrivers = document.getElementById("select-all-drivers");
  if (selectAllDrivers) {
    selectAllDrivers.addEventListener("change", function () {
      const checkboxes = document.querySelectorAll(
        '#drivers-table tbody input[type="checkbox"]'
      );
      checkboxes.forEach((cb) => (cb.checked = this.checked));
    });
  }
}

function openAdminModal(title, content) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = content;
  document.getElementById("admin-modal").style.display = "block";
}

function closeAdminModal() {
  document.getElementById("admin-modal").style.display = "none";
}

function editUser(userId) {
  const user = adminData.users.find((u) => u.id === userId);
  if (!user) return;

  const modalContent = `
        <form id="edit-user-form">
            <div class="form-group">
                <label for="edit-user-name">Name</label>
                <input type="text" id="edit-user-name" value="${
                  user.name
                }" required>
            </div>
            <div class="form-group">
                <label for="edit-user-email">Email</label>
                <input type="email" id="edit-user-email" value="${
                  user.email
                }" required>
            </div>
            <div class="form-group">
                <label for="edit-user-phone">Phone</label>
                <input type="tel" id="edit-user-phone" value="${
                  user.phone
                }" required>
            </div>
            <div class="form-group">
                <label for="edit-user-status">Status</label>
                <select id="edit-user-status">
                    <option value="active" ${
                      user.status === "active" ? "selected" : ""
                    }>Active</option>
                    <option value="inactive" ${
                      user.status === "inactive" ? "selected" : ""
                    }>Inactive</option>
                    <option value="suspended" ${
                      user.status === "suspended" ? "selected" : ""
                    }>Suspended</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Save Changes</button>
                <button type="button" class="btn btn-outline" onclick="closeAdminModal()">Cancel</button>
            </div>
        </form>
    `;

  openAdminModal("Edit User", modalContent);

  document
    .getElementById("edit-user-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      user.name = document.getElementById("edit-user-name").value;
      user.email = document.getElementById("edit-user-email").value;
      user.phone = document.getElementById("edit-user-phone").value;
      user.status = document.getElementById("edit-user-status").value;

      loadUsersTable();
      closeAdminModal();
      showAdminNotification("User updated successfully", "success");
    });
}

function suspendUser(userId) {
  if (confirm("Are you sure you want to suspend this user?")) {
    const user = adminData.users.find((u) => u.id === userId);
    if (user) {
      user.status = "suspended";
      loadUsersTable();
      showAdminNotification("User suspended successfully", "success");
    }
  }
}

function verifyDriver(driverId) {
  const driver = adminData.drivers.find((d) => d.id === driverId);
  if (driver) {
    driver.status = "active";
    loadDriversTable();
    showAdminNotification("Driver verified successfully", "success");
  }
}

function createPromoCode() {
  const modalContent = `
        <form id="create-promo-form">
            <div class="form-group">
                <label for="promo-code">Promo Code</label>
                <input type="text" id="promo-code" placeholder="e.g., SAVE20" required>
            </div>
            <div class="form-group">
                <label for="promo-type">Discount Type</label>
                <select id="promo-type" required>
                    <option value="">Select Type</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                </select>
            </div>
            <div class="form-group">
                <label for="promo-discount">Discount Value</label>
                <input type="number" id="promo-discount" min="1" required>
            </div>
            <div class="form-group">
                <label for="promo-max-uses">Max Uses (optional)</label>
                <input type="number" id="promo-max-uses" min="1">
            </div>
            <div class="form-group">
                <label for="promo-expiry">Expiry Date</label>
                <input type="date" id="promo-expiry" required>
            </div>
            <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Create Promo Code</button>
                <button type="button" class="btn btn-outline" onclick="closeAdminModal()">Cancel</button>
            </div>
        </form>
    `;

  openAdminModal("Create Promo Code", modalContent);

  document
    .getElementById("create-promo-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const newPromo = {
        id: "PROMO" + Date.now(),
        code: document.getElementById("promo-code").value.toUpperCase(),
        type: document.getElementById("promo-type").value,
        discount: parseFloat(document.getElementById("promo-discount").value),
        maxUses: document.getElementById("promo-max-uses").value || null,
        expiryDate: document.getElementById("promo-expiry").value,
        status: "active",
        usedCount: 0,
        totalSavings: 0,
      };

      adminData.promos.push(newPromo);
      loadPromosTable();
      closeAdminModal();
      showAdminNotification("Promo code created successfully", "success");
    });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-GB");
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function calculateTodayRevenue() {
  return adminData.bookings
    .filter((b) => isToday(new Date(b.date)) && b.status === "completed")
    .reduce((sum, b) => sum + b.price, 0);
}

function showAdminNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `admin-notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
}

function generateMockUsers() {
  return [
    {
      id: "USR001",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "+44 20 1234 5678",
      tripCount: 15,
      totalSpent: 425.5,
      status: "active",
      joinedDate: "2024-01-15",
    },
    {
      id: "USR002",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      phone: "+44 20 2345 6789",
      tripCount: 8,
      totalSpent: 180.25,
      status: "active",
      joinedDate: "2024-02-20",
    },
    {
      id: "USR003",
      name: "Mike Wilson",
      email: "mike.wilson@email.com",
      phone: "+44 20 3456 7890",
      tripCount: 23,
      totalSpent: 650.0,
      status: "inactive",
      joinedDate: "2023-12-10",
    },
    {
      id: "USR004",
      name: "Emma Brown",
      email: "emma.brown@email.com",
      phone: "+44 20 4567 8901",
      tripCount: 5,
      totalSpent: 125.75,
      status: "pending",
      joinedDate: "2024-03-05",
    },
  ];
}

function generateMockDrivers() {
  return [
    {
      id: "DRV001",
      name: "David Miller",
      license: "DL123456",
      vehicle: "Toyota Prius 2020",
      licensePlate: "AB12 CDE",
      rating: 4.8,
      tripCount: 156,
      status: "active",
      online: true,
    },
    {
      id: "DRV002",
      name: "Lisa Davis",
      license: "DL234567",
      vehicle: "BMW 3 Series 2019",
      licensePlate: "FG34 HIJ",
      rating: 4.9,
      tripCount: 203,
      status: "active",
      online: false,
    },
    {
      id: "DRV003",
      name: "James Wilson",
      license: "DL345678",
      vehicle: "Mercedes E-Class 2021",
      licensePlate: "KL56 MNO",
      rating: 4.7,
      tripCount: 89,
      status: "pending",
      online: false,
    },
    {
      id: "DRV004",
      name: "Amanda Taylor",
      license: "DL456789",
      vehicle: "Tesla Model S 2022",
      licensePlate: "PQ78 RST",
      rating: 4.6,
      tripCount: 134,
      status: "inactive",
      online: false,
    },
  ];
}

function generateMockBookings() {
  return [
    {
      id: "BK001",
      passengerName: "John Smith",
      driverName: "David Miller",
      driverId: "DRV001",
      pickup: "Central London",
      destination: "Heathrow Airport",
      date: new Date().toISOString(),
      price: 45.5,
      status: "in_progress",
      driverLocation: { lat: 51.5074, lng: -0.1278 },
      pickupLocation: { lat: 51.5074, lng: -0.1278 },
      destinationLocation: { lat: 51.47, lng: -0.4543 },
      eta: "25 min",
      distance: 18.5,
    },
    {
      id: "BK002",
      passengerName: "Sarah Johnson",
      driverName: "Lisa Davis",
      driverId: "DRV002",
      pickup: "King's Cross Station",
      destination: "Canary Wharf",
      date: new Date().toISOString(),
      price: 22.0,
      status: "completed",
      driverLocation: { lat: 51.5308, lng: -0.1238 },
      pickupLocation: { lat: 51.5308, lng: -0.1238 },
      destinationLocation: { lat: 51.5054, lng: -0.0235 },
      eta: "Completed",
      distance: 8.2,
    },
  ];
}

function generateMockPromos() {
  return [
    {
      id: "PROMO001",
      code: "WELCOME10",
      type: "percentage",
      discount: 10,
      maxUses: 100,
      usedCount: 45,
      expiryDate: "2024-12-31",
      status: "active",
      totalSavings: 450.25,
      usedToday: 5,
    },
    {
      id: "PROMO002",
      code: "SAVE5",
      type: "fixed",
      discount: 5,
      maxUses: null,
      usedCount: 128,
      expiryDate: "2024-06-30",
      status: "active",
      totalSavings: 640.0,
      usedToday: 8,
    },
    {
      id: "PROMO003",
      code: "FIRST50",
      type: "percentage",
      discount: 50,
      maxUses: 50,
      usedCount: 50,
      expiryDate: "2024-03-31",
      status: "expired",
      totalSavings: 1250.75,
      usedToday: 0,
    },
  ];
}

function generateMockSupportTickets() {
  return [
    {
      id: "TK001",
      subject: "Payment Issue - Double Charged",
      userName: "John Smith",
      userEmail: "john.smith@email.com",
      message:
        "I was charged twice for my trip yesterday. The booking ID is BK12345. Can you please help me get a refund for the duplicate charge?",
      priority: "high",
      status: "open",
      assignedTo: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "TK002",
      subject: "Driver No-Show",
      userName: "Sarah Johnson",
      userEmail: "sarah.johnson@email.com",
      message:
        "My driver never showed up for my pickup at 2 PM today. I waited for 30 minutes and had to book another taxi.",
      priority: "medium",
      status: "in_progress",
      assignedTo: "Support Agent 1",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "TK003",
      subject: "App Crashed During Booking",
      userName: "Mike Wilson",
      userEmail: "mike.wilson@email.com",
      message:
        "The app keeps crashing when I try to book a ride. I've tried restarting the app and my phone but the issue persists.",
      priority: "low",
      status: "resolved",
      assignedTo: "Tech Support",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateMockAnalytics() {
  return {
    totalRevenue: 125450.75,
    totalTrips: 2847,
    activeUsers: 1245,
    averageRating: 4.7,
    monthlyGrowth: 12.5,
  };
}

function addAdminStyles() {
  const styles = `
        .admin-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        }
        .notification-success { background: #28a745; }
        .notification-error { background: #dc3545; }
        .notification-info { background: #17a2b8; }
        .notification-warning { background: #ffc107; color: #212529; }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .metric-icon {
            font-size: 32px;
            color: #2c5aa0;
            width: 60px;
            text-align: center;
        }
        
        .metric-number {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin: 5px 0;
        }
        
        .metric-change {
            font-size: 14px;
            font-weight: 500;
        }
        
        .metric-change.positive { color: #28a745; }
        .metric-change.negative { color: #dc3545; }
        
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .chart-container {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            height: 300px;
        }
        
        .action-buttons {
            display: flex;
            gap: 5px;
        }
        
        .user-info, .driver-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .user-avatar, .driver-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #2c5aa0;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .user-name, .driver-name {
            font-weight: 500;
            color: #333;
        }
        
        .user-id, .driver-id {
            font-size: 12px;
            color: #666;
        }
        
        .online-status.online { color: #28a745; }
        .online-status.offline { color: #6c757d; }
        
        .trip-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .trip-card:hover {
            border-color: #2c5aa0;
            box-shadow: 0 2px 10px rgba(44, 90, 160, 0.1);
        }
        
        .pricing-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .pricing-value {
            font-size: 24px;
            font-weight: bold;
            color: #2c5aa0;
            margin: 10px 0;
        }
        
        .pricing-value span {
            font-size: 14px;
            color: #666;
            font-weight: normal;
        }
        
        .support-ticket {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .support-ticket:hover {
            border-color: #2c5aa0;
        }
        
        .ticket-priority.priority-high { 
            background: #dc3545; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
        }
        .ticket-priority.priority-medium { 
            background: #ffc107; 
            color: #212529; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
        }
        .ticket-priority.priority-low { 
            background: #28a745; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 12px; 
            font-size: 12px; 
        }
    `;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

document.addEventListener("DOMContentLoaded", addAdminStyles);

window.switchAdminSection = switchAdminSection;
window.editUser = editUser;
window.suspendUser = suspendUser;
window.verifyDriver = verifyDriver;
window.createPromoCode = createPromoCode;
window.closeAdminModal = closeAdminModal;
