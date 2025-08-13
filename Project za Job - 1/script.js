let map;
let directionsService;
let directionsRenderer;
let pickupAutocomplete;
let destinationAutocomplete;
let currentUser = null;
let bookingData = {};
let liveTracking = {};

document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

function initializeApp() {
  setupEventListeners();
  initializeGoogleMaps();
  loadUserSession();
  setupFormValidation();
  initializeDateTimeDefaults();
}

function setupEventListeners() {
  const hamburger = document.getElementById("nav-hamburger");
  const navMenu = document.getElementById("nav-menu");

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }

  setupDropdownMenus();

  const mainForm = document.getElementById("main-booking-form");
  if (mainForm) {
    mainForm.addEventListener("submit", handleBookingSearch);
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  window.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
  });

  const pickupInput = document.getElementById("pickup-location");
  const destinationInput = document.getElementById("destination");

  if (pickupInput) {
    pickupInput.addEventListener("input", debounce(handleLocationInput, 300));
  }

  if (destinationInput) {
    destinationInput.addEventListener(
      "input",
      debounce(handleLocationInput, 300)
    );
  }

  document.addEventListener("click", function (event) {
    const isClickInsideDropdown = event.target.closest(".nav-dropdown");

    if (!isClickInsideDropdown) {
      closeAllDropdowns();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeAllDropdowns();
    }
  });
}

function setupDropdownMenus() {
  const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      const dropdown = this.closest(".nav-dropdown");
      const isActive = dropdown.classList.contains("active");

      closeAllDropdowns();

      if (!isActive) {
        dropdown.classList.add("active");
      }
    });
  });

  const dropdownLinks = document.querySelectorAll(".dropdown-content a");
  dropdownLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      closeAllDropdowns();
    });
  });
}

function closeAllDropdowns() {
  document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
    dropdown.classList.remove("active");
  });
}

function initializeGoogleMaps() {
  if (typeof google !== "undefined" && google.maps) {
    map = new google.maps.Map(document.createElement("div"), {
      center: { lat: 51.5074, lng: -0.1278 },
      zoom: 10,
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    const pickupInput = document.getElementById("pickup-location");
    const destinationInput = document.getElementById("destination");

    if (pickupInput) {
      pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, {
        componentRestrictions: { country: "uk" },
        types: ["establishment", "geocode"],
      });
      pickupAutocomplete.addListener("place_changed", onPickupPlaceChanged);
    }

    if (destinationInput) {
      destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput,
        {
          componentRestrictions: { country: "uk" },
          types: ["establishment", "geocode"],
        }
      );
      destinationAutocomplete.addListener(
        "place_changed",
        onDestinationPlaceChanged
      );
    }
  }
}

function onPickupPlaceChanged() {
  const place = pickupAutocomplete.getPlace();
  if (place.geometry) {
    bookingData.pickup = {
      address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    calculatePrice();
  }
}

function onDestinationPlaceChanged() {
  const place = destinationAutocomplete.getPlace();
  if (place.geometry) {
    bookingData.destination = {
      address: place.formatted_address,
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };
    calculatePrice();
  }
}

function handleLocationInput(event) {
  const input = event.target;
  const query = input.value;

  if (query.length < 3) return;

  const suggestions = generateLocationSuggestions(query);
  showLocationSuggestions(input, suggestions);
}

function generateLocationSuggestions(query) {
  const commonPlaces = [
    "Heathrow Airport, London",
    "Gatwick Airport, London",
    "London Victoria Station",
    "Kings Cross Station, London",
    "Birmingham New Street Station",
    "Manchester Airport",
    "Edinburgh Airport",
    "Central London",
    "Canary Wharf, London",
    "London Bridge Station",
  ];

  return commonPlaces
    .filter((place) => place.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);
}

function showLocationSuggestions(input, suggestions) {
  const suggestionsContainer = input.parentNode.querySelector(
    ".location-suggestions"
  );
  if (!suggestionsContainer) return;

  suggestionsContainer.innerHTML = "";

  if (suggestions.length === 0) {
    suggestionsContainer.style.display = "none";
    return;
  }

  suggestions.forEach((suggestion) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = suggestion;
    item.addEventListener("click", () => {
      input.value = suggestion;
      suggestionsContainer.style.display = "none";

      if (input.id === "pickup-location") {
        bookingData.pickup = { address: suggestion };
      } else if (input.id === "destination") {
        bookingData.destination = { address: suggestion };
      }
      calculatePrice();
    });
    suggestionsContainer.appendChild(item);
  });

  suggestionsContainer.style.display = "block";
}

function handleBookingSearch(event) {
  event.preventDefault();

  const formData = new FormData(event.target);

  bookingData = {
    pickup: {
      address:
        formData.get("pickup-location") ||
        document.getElementById("pickup-location").value,
    },
    destination: {
      address:
        formData.get("destination") ||
        document.getElementById("destination").value,
    },
    date: document.getElementById("pickup-date").value,
    time: document.getElementById("pickup-time").value,
    passengers: document.getElementById("passengers").value,
    luggage: document.getElementById("luggage").value,
    tripType: formData.get("trip-type"),
  };

  if (!bookingData.pickup.address || !bookingData.destination.address) {
    showNotification(
      "Please enter both pickup and destination locations",
      "error"
    );
    return;
  }

  if (!bookingData.date || !bookingData.time) {
    showNotification("Please select pickup date and time", "error");
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<div class="loading-spinner"></div> Searching...';
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    showSearchResults();
  }, 2000);
}

function showSearchResults() {
  const results = generateMockResults();
  const resultsHtml = generateResultsHtml(results);

  document.getElementById("search-results").innerHTML = resultsHtml;
  openModal("resultsModal");
}

function generateMockResults() {
  const basePrice = calculateBasePrice();
  const providers = [
    {
      name: "London Executive Cars",
      rating: 4.8,
      reviewCount: 127,
      price: basePrice,
      vehicleType: "Executive Sedan",
      eta: "5-10 minutes",
      features: ["Air Conditioning", "WiFi", "Water Bottles"],
      waitTime: "15 minutes free",
      cancellation: "Free cancellation",
      flashSale: false,
    },
    {
      name: "City Minicabs",
      rating: 4.6,
      reviewCount: 89,
      price: basePrice * 0.85,
      vehicleType: "Standard Taxi",
      eta: "3-8 minutes",
      features: ["Air Conditioning", "Card Payment"],
      waitTime: "10 minutes free",
      cancellation: "Free cancellation",
      flashSale: true,
      discount: "15% OFF",
    },
    {
      name: "Green Transport Co",
      rating: 4.9,
      reviewCount: 203,
      price: basePrice * 1.1,
      vehicleType: "Electric Vehicle",
      eta: "7-12 minutes",
      features: ["Eco-Friendly", "WiFi", "Phone Charger"],
      waitTime: "15 minutes free",
      cancellation: "Free cancellation",
      flashSale: false,
      eco: true,
    },
    {
      name: "Family Transport",
      rating: 4.7,
      reviewCount: 156,
      price: basePrice * 1.25,
      vehicleType: "MPV (6 seats)",
      eta: "10-15 minutes",
      features: ["Child Seats Available", "Extra Luggage Space"],
      waitTime: "20 minutes free",
      cancellation: "Free cancellation",
      flashSale: false,
    },
  ];

  return providers.sort((a, b) => a.price - b.price);
}

function calculateBasePrice() {
  const distance = calculateDistance();
  const baseRate = 2.5;
  const bookingFee = 3.0;

  let price = distance * baseRate + bookingFee;

  const hour = new Date().getHours();
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    price *= 1.3;
  }

  switch (bookingData.tripType) {
    case "airport":
      price += 5.0;
      break;
    case "port":
      price += 3.0;
      break;
    case "return":
      price *= 1.8;
      break;
  }

  return Math.round(price * 100) / 100;
}

function calculateDistance() {
  const mockDistances = {
    short: 5,
    medium: 15,
    long: 30,
    airport: 25,
  };

  if (bookingData.pickup.address && bookingData.destination.address) {
    const pickup = bookingData.pickup.address.toLowerCase();
    const destination = bookingData.destination.address.toLowerCase();

    if (pickup.includes("airport") || destination.includes("airport")) {
      return mockDistances.airport;
    }

    if (pickup.includes("london") && destination.includes("london")) {
      return mockDistances.short;
    }

    return mockDistances.medium;
  }

  return mockDistances.medium;
}

function calculatePrice() {
  if (bookingData.pickup && bookingData.destination) {
    const price = calculateBasePrice();

    const pricePreview = document.getElementById("price-preview");
    if (pricePreview) {
      pricePreview.textContent = `Estimated fare: £${price}`;
      pricePreview.style.display = "block";
    }
  }
}

function generateResultsHtml(results) {
  return results
    .map(
      (result) => `
        <div class="result-item ${result.flashSale ? "flash-sale" : ""} ${
        result.eco ? "eco-friendly" : ""
      }">
            <div class="result-header">
                <div class="provider-info">
                    <h4>${result.name} ${
        result.flashSale ? '<span class="flash-badge">FLASH SALE</span>' : ""
      }</h4>
                    <div class="provider-rating">
                        ${"★".repeat(Math.floor(result.rating))}
                        <span>${result.rating} (${
        result.reviewCount
      } reviews)</span>
                    </div>
                </div>
                <div class="price-info">
                    <div class="price">£${result.price}</div>
                    <div class="price-label">Fixed Price</div>
                    ${
                      result.flashSale
                        ? `<div class="discount-badge">${result.discount}</div>`
                        : ""
                    }
                </div>
            </div>
            
            <div class="result-details">
                <div class="detail-item">
                    <i class="fas fa-car"></i>
                    <span>${result.vehicleType}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>ETA: ${result.eta}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-shield-alt"></i>
                    <span>${result.waitTime}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-times-circle"></i>
                    <span>${result.cancellation}</span>
                </div>
            </div>
            
            <div class="result-features">
                ${result.features
                  .map(
                    (feature) => `<span class="feature-tag">${feature}</span>`
                  )
                  .join("")}
            </div>
            
            <div class="result-actions">
                <button class="btn-book" onclick="bookRide('${result.name}', ${
        result.price
      })">
                    Book Now
                </button>
                <button class="btn-details" onclick="showProviderDetails('${
                  result.name
                }')">
                    View Details
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

function bookRide(providerName, price) {
  if (!currentUser) {
    closeModal("resultsModal");
    openLoginModal();
    showNotification("Please login to book a ride", "info");
    return;
  }

  const booking = {
    id: generateBookingId(),
    provider: providerName,
    price: price,
    pickup: bookingData.pickup,
    destination: bookingData.destination,
    date: bookingData.date,
    time: bookingData.time,
    passengers: bookingData.passengers,
    luggage: bookingData.luggage,
    tripType: bookingData.tripType,
    status: "confirmed",
    user: currentUser.email,
    createdAt: new Date().toISOString(),
  };

  saveBooking(booking);

  closeModal("resultsModal");
  showBookingConfirmation(booking);
}

function showProviderDetails(providerName) {
  showNotification(`Showing details for ${providerName}`, "info");
}

function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get("login-email");
  const password = formData.get("login-password");

  if (email && password) {
    currentUser = {
      email: email,
      name: email.split("@")[0],
      type: email.includes("admin") ? "admin" : "user",
    };

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    closeModal("loginModal");
    updateUIForLoggedInUser();
    showNotification("Login successful!", "success");
  } else {
    showNotification("Please enter valid credentials", "error");
  }
}

function handleSignup(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const name = formData.get("signup-name");
  const email = formData.get("signup-email");
  const phone = formData.get("signup-phone");
  const password = formData.get("signup-password");
  const confirmPassword = formData.get("signup-confirm-password");

  if (password !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    return;
  }

  if (password.length < 6) {
    showNotification("Password must be at least 6 characters", "error");
    return;
  }

  currentUser = {
    name: name,
    email: email,
    phone: phone,
    type: "user",
  };

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  closeModal("signupModal");
  updateUIForLoggedInUser();
  showNotification("Registration successful!", "success");
}

function updateUIForLoggedInUser() {
  const loginBtn = document.querySelector('button[onclick="openLoginModal()"]');
  const signupBtn = document.querySelector(
    'button[onclick="openSignupModal()"]'
  );

  if (loginBtn && signupBtn && currentUser) {
    loginBtn.textContent = currentUser.name;
    loginBtn.onclick = () => showUserProfile();
    signupBtn.textContent = "Logout";
    signupBtn.onclick = () => logout();
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  location.reload();
}

function loadUserSession() {
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUIForLoggedInUser();
  }
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

function openLoginModal() {
  openModal("loginModal");
}

function openSignupModal() {
  openModal("signupModal");
}

function switchModal(fromModal, toModal) {
  closeModal(fromModal);
  openModal(toModal);
}

function openAdminPanel() {
  if (!currentUser || currentUser.type !== "admin") {
    showNotification("Admin access required", "error");
    return;
  }

  createAdminPanel();
}

function createAdminPanel() {
  const adminPanel = document.createElement("div");
  adminPanel.id = "admin-panel";
  adminPanel.className = "modal large-modal";
  adminPanel.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Admin Panel</h2>
                <span class="close" onclick="closeModal('admin-panel')">&times;</span>
            </div>
            <div class="admin-content">
                <div class="admin-nav">
                    <button class="admin-nav-item active" onclick="showAdminSection('users')">Users</button>
                    <button class="admin-nav-item" onclick="showAdminSection('drivers')">Drivers</button>
                    <button class="admin-nav-item" onclick="showAdminSection('bookings')">Bookings</button>
                    <button class="admin-nav-item" onclick="showAdminSection('tracking')">Live Tracking</button>
                    <button class="admin-nav-item" onclick="showAdminSection('pricing')">Pricing</button>
                    <button class="admin-nav-item" onclick="showAdminSection('promos')">Promo Codes</button>
                    <button class="admin-nav-item" onclick="showAdminSection('support')">Support</button>
                </div>
                <div id="admin-section-content">
                    ${generateUsersSection()}
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(adminPanel);
  openModal("admin-panel");
}

function showAdminSection(section) {
  document.querySelectorAll(".admin-nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  event.target.classList.add("active");

  const content = document.getElementById("admin-section-content");
  switch (section) {
    case "users":
      content.innerHTML = generateUsersSection();
      break;
    case "drivers":
      content.innerHTML = generateDriversSection();
      break;
    case "bookings":
      content.innerHTML = generateBookingsSection();
      break;
    case "tracking":
      content.innerHTML = generateTrackingSection();
      break;
    case "pricing":
      content.innerHTML = generatePricingSection();
      break;
    case "promos":
      content.innerHTML = generatePromosSection();
      break;
    case "support":
      content.innerHTML = generateSupportSection();
      break;
  }
}

function generateUsersSection() {
  const users = getMockUsers();
  return `
        <h3>User Management</h3>
        <div class="admin-actions">
            <button class="btn btn-primary" onclick="exportUsers()">Export Users</button>
            <button class="btn btn-outline" onclick="sendBulkEmail()">Send Bulk Email</button>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Trips</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users
                  .map(
                    (user) => `
                    <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.phone}</td>
                        <td>${user.tripCount}</td>
                        <td><span class="status-badge status-${user.status}">${user.status}</span></td>
                        <td>
                            <button class="action-btn btn-edit" onclick="editUser('${user.id}')">Edit</button>
                            <button class="action-btn btn-delete" onclick="suspendUser('${user.id}')">Suspend</button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;
}

function generateDriversSection() {
  const drivers = getMockDrivers();
  return `
        <h3>Driver Management</h3>
        <div class="admin-actions">
            <button class="btn btn-primary" onclick="addNewDriver()">Add New Driver</button>
            <button class="btn btn-outline" onclick="verifyDrivers()">Bulk Verify</button>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>License</th>
                    <th>Vehicle</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${drivers
                  .map(
                    (driver) => `
                    <tr>
                        <td>${driver.name}</td>
                        <td>${driver.license}</td>
                        <td>${driver.vehicle}</td>
                        <td>${driver.rating}/5.0</td>
                        <td><span class="status-badge status-${driver.status}">${driver.status}</span></td>
                        <td>
                            <button class="action-btn btn-approve" onclick="verifyDriver('${driver.id}')">Verify</button>
                            <button class="action-btn btn-edit" onclick="editDriver('${driver.id}')">Edit</button>
                            <button class="action-btn btn-delete" onclick="suspendDriver('${driver.id}')">Suspend</button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
    `;
}

function generateTrackingSection() {
  return `
        <h3>Live Trip Tracking</h3>
        <div class="tracking-controls">
            <button class="btn btn-primary" onclick="refreshTracking()">Refresh All</button>
            <button class="btn btn-outline" onclick="exportTrackingData()">Export Data</button>
        </div>
        <div class="tracking-map" id="live-tracking-map">
            <!-- Google Maps will be inserted here -->
        </div>
        <div class="tracking-info">
            ${generateActiveTrips()}
        </div>
    `;
}

function generateActiveTrips() {
  const activeTrips = getMockActiveTrips();
  return activeTrips
    .map(
      (trip) => `
        <div class="tracking-card">
            <h4>Trip #${trip.id}</h4>
            <p><strong>Driver:</strong> ${trip.driver}</p>
            <p><strong>Passenger:</strong> ${trip.passenger}</p>
            <p><strong>Status:</strong> ${trip.status}</p>
            <p><strong>ETA:</strong> ${trip.eta}</p>
            <button class="btn btn-primary" onclick="showTripDetails('${trip.id}')">View Details</button>
        </div>
    `
    )
    .join("");
}

function getMockUsers() {
  return [
    {
      id: "1",
      name: "John Smith",
      email: "john@example.com",
      phone: "+44 20 1234 5678",
      tripCount: 15,
      status: "active",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+44 20 2345 6789",
      tripCount: 8,
      status: "active",
    },
    {
      id: "3",
      name: "Mike Wilson",
      email: "mike@example.com",
      phone: "+44 20 3456 7890",
      tripCount: 23,
      status: "inactive",
    },
    {
      id: "4",
      name: "Emma Brown",
      email: "emma@example.com",
      phone: "+44 20 4567 8901",
      tripCount: 5,
      status: "pending",
    },
  ];
}

function getMockDrivers() {
  return [
    {
      id: "1",
      name: "David Miller",
      license: "DL123456",
      vehicle: "Toyota Prius 2020",
      rating: 4.8,
      status: "active",
    },
    {
      id: "2",
      name: "Lisa Davis",
      license: "DL234567",
      vehicle: "BMW 3 Series 2019",
      rating: 4.9,
      status: "active",
    },
    {
      id: "3",
      name: "James Wilson",
      license: "DL345678",
      vehicle: "Mercedes E-Class 2021",
      rating: 4.7,
      status: "pending",
    },
    {
      id: "4",
      name: "Amanda Taylor",
      license: "DL456789",
      vehicle: "Tesla Model S 2022",
      rating: 4.6,
      status: "inactive",
    },
  ];
}

function getMockActiveTrips() {
  return [
    {
      id: "T001",
      driver: "David Miller",
      passenger: "John Smith",
      status: "En Route",
      eta: "5 mins",
    },
    {
      id: "T002",
      driver: "Lisa Davis",
      passenger: "Sarah Johnson",
      status: "Waiting",
      eta: "2 mins",
    },
    {
      id: "T003",
      driver: "James Wilson",
      passenger: "Mike Wilson",
      status: "Completed",
      eta: "-",
    },
  ];
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

function generateBookingId() {
  return "BK" + Date.now().toString(36).toUpperCase();
}

function saveBooking(booking) {
  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function showBookingConfirmation(booking) {
  const confirmationHtml = `
        <div class="booking-confirmation">
            <h2>Booking Confirmed!</h2>
            <div class="confirmation-details">
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Provider:</strong> ${booking.provider}</p>
                <p><strong>Price:</strong> £${booking.price}</p>
                <p><strong>Pickup:</strong> ${booking.pickup.address}</p>
                <p><strong>Destination:</strong> ${booking.destination.address}</p>
                <p><strong>Date & Time:</strong> ${booking.date} at ${booking.time}</p>
            </div>
            <div class="confirmation-actions">
                <button class="btn btn-primary" onclick="trackRide('${booking.id}')">Track Ride</button>
                <button class="btn btn-outline" onclick="closeConfirmation()">Close</button>
            </div>
        </div>
    `;

  showModal("Booking Confirmation", confirmationHtml);
}

function showModal(title, content) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "temp-modal";
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <span class="close" onclick="document.getElementById('temp-modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;

  document.body.appendChild(modal);
  modal.style.display = "block";
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;

  if (!document.querySelector("#notification-styles")) {
    const styles = document.createElement("style");
    styles.id = "notification-styles";
    styles.textContent = `
            .notification {
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
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 15px;
            }
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
    document.head.appendChild(styles);
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function toggleFAQ(element) {
  const faqAnswer = element.nextElementSibling;
  const isActive = element.classList.contains("active");

  document.querySelectorAll(".faq-question").forEach((q) => {
    q.classList.remove("active");
    q.nextElementSibling.classList.remove("active");
  });

  if (!isActive) {
    element.classList.add("active");
    faqAnswer.classList.add("active");
  }
}

function initializeDateTimeDefaults() {
  const dateInput = document.getElementById("pickup-date");
  const timeInput = document.getElementById("pickup-time");

  if (dateInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split("T")[0];
    dateInput.min = today.toISOString().split("T")[0];
  }

  if (timeInput) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(Math.ceil(now.getMinutes() / 15) * 15).padStart(
      2,
      "0"
    );
    timeInput.value = `${hours}:${minutes}`;
  }
}

function setupFormValidation() {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    const inputs = form.querySelectorAll("input[required]");
    inputs.forEach((input) => {
      input.addEventListener("blur", validateField);
      input.addEventListener("input", clearFieldError);
    });
  });
}

function validateField(event) {
  const field = event.target;
  const value = field.value.trim();

  clearFieldError(event);

  let isValid = true;
  let errorMessage = "";

  if (field.type === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      isValid = false;
      errorMessage = "Please enter a valid email address";
    }
  } else if (field.type === "tel") {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      errorMessage = "Please enter a valid phone number";
    }
  } else if (field.type === "password") {
    if (value.length < 6) {
      isValid = false;
      errorMessage = "Password must be at least 6 characters";
    }
  } else if (field.required && !value) {
    isValid = false;
    errorMessage = "This field is required";
  }

  if (!isValid) {
    showFieldError(field, errorMessage);
  }

  return isValid;
}

function showFieldError(field, message) {
  field.classList.add("error");

  let errorElement = field.parentNode.querySelector(".field-error");
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.className = "field-error";
    field.parentNode.appendChild(errorElement);
  }

  errorElement.textContent = message;

  if (!document.querySelector("#form-error-styles")) {
    const styles = document.createElement("style");
    styles.id = "form-error-styles";
    styles.textContent = `
            .form-group input.error,
            .form-group select.error {
                border-color: #dc3545;
                box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
            }
            .field-error {
                color: #dc3545;
                font-size: 14px;
                margin-top: 5px;
            }
        `;
    document.head.appendChild(styles);
  }
}

function clearFieldError(event) {
  const field = event.target;
  field.classList.remove("error");

  const errorElement = field.parentNode.querySelector(".field-error");
  if (errorElement) {
    errorElement.remove();
  }
}

function initializePaymentMethods() {
  return {
    stripe: {
      name: "Credit/Debit Card",
      icon: "fas fa-credit-card",
      enabled: true,
    },
    paypal: {
      name: "PayPal",
      icon: "fab fa-paypal",
      enabled: true,
    },
    applepay: {
      name: "Apple Pay",
      icon: "fab fa-apple-pay",
      enabled: window.ApplePaySession && ApplePaySession.canMakePayments(),
    },
    googlepay: {
      name: "Google Pay",
      icon: "fab fa-google-pay",
      enabled: window.google && window.google.payments,
    },
  };
}

function processPayment(method, amount, bookingId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
        resolve({
          transactionId: "TXN" + Date.now(),
          method: method,
          amount: amount,
          status: "completed",
        });
      } else {
        reject(new Error("Payment failed. Please try again."));
      }
    }, 2000);
  });
}

function validatePromoCode(code) {
  const promoCodes = {
    WELCOME10: { discount: 10, type: "percentage", minAmount: 0 },
    SAVE5: { discount: 5, type: "fixed", minAmount: 20 },
    FIRST50: {
      discount: 50,
      type: "percentage",
      minAmount: 15,
      newUsersOnly: true,
    },
    AIRPORT25: {
      discount: 25,
      type: "percentage",
      minAmount: 30,
      tripType: "airport",
    },
  };

  const promo = promoCodes[code.toUpperCase()];
  if (!promo) {
    return { valid: false, message: "Invalid promo code" };
  }

  if (promo.newUsersOnly && currentUser && currentUser.tripCount > 0) {
    return { valid: false, message: "This promo is for new users only" };
  }

  if (promo.tripType && bookingData.tripType !== promo.tripType) {
    return {
      valid: false,
      message: `This promo is only valid for ${promo.tripType} trips`,
    };
  }

  const bookingAmount = calculateBasePrice();
  if (bookingAmount < promo.minAmount) {
    return {
      valid: false,
      message: `Minimum booking amount is £${promo.minAmount}`,
    };
  }

  return { valid: true, promo: promo };
}

function applyPromoCode(code, amount) {
  const validation = validatePromoCode(code);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const promo = validation.promo;
  let discount = 0;

  if (promo.type === "percentage") {
    discount = (amount * promo.discount) / 100;
  } else {
    discount = promo.discount;
  }

  const finalAmount = Math.max(0, amount - discount);

  return {
    success: true,
    discount: discount,
    finalAmount: finalAmount,
    message: `Promo code applied! You saved £${discount.toFixed(2)}`,
  };
}

function showRatingModal(bookingId, driverId) {
  const ratingHtml = `
        <div class="rating-system">
            <h3>Rate Your Trip</h3>
            <p>How was your experience with this trip?</p>
            
            <div class="star-rating" id="star-rating">
                <span class="star" onclick="setRating(1)">★</span>
                <span class="star" onclick="setRating(2)">★</span>
                <span class="star" onclick="setRating(3)">★</span>
                <span class="star" onclick="setRating(4)">★</span>
                <span class="star" onclick="setRating(5)">★</span>
            </div>
            
            <textarea placeholder="Tell us about your experience (optional)" id="feedback-text"></textarea>
            
            <div class="rating-actions">
                <button class="btn btn-primary" onclick="submitRating('${bookingId}', '${driverId}')">Submit Rating</button>
                <button class="btn btn-outline" onclick="closeModal('temp-modal')">Skip</button>
            </div>
        </div>
    `;

  showModal("Rate Your Trip", ratingHtml);
}

let selectedRating = 0;

function setRating(rating) {
  selectedRating = rating;
  const stars = document.querySelectorAll("#star-rating .star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

function submitRating(bookingId, driverId) {
  const feedback = document.getElementById("feedback-text").value;

  if (selectedRating === 0) {
    showNotification("Please select a rating", "error");
    return;
  }

  const rating = {
    bookingId: bookingId,
    driverId: driverId,
    rating: selectedRating,
    feedback: feedback,
    userId: currentUser.email,
    timestamp: new Date().toISOString(),
  };

  const ratings = JSON.parse(localStorage.getItem("ratings") || "[]");
  ratings.push(rating);
  localStorage.setItem("ratings", JSON.stringify(ratings));

  closeModal("temp-modal");
  showNotification("Thank you for your feedback!", "success");
}

function openSupportModal() {
  const supportHtml = `
        <div class="support-system">
            <h3>How can we help you?</h3>
            
            <div class="support-options">
                <button class="support-option" onclick="openChat()">
                    <i class="fas fa-comments"></i>
                    <span>Live Chat</span>
                </button>
                <button class="support-option" onclick="submitComplaint()">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>File Complaint</span>
                </button>
                <button class="support-option" onclick="openFAQ()">
                    <i class="fas fa-question-circle"></i>
                    <span>FAQ</span>
                </button>
                <button class="support-option" onclick="requestCallback()">
                    <i class="fas fa-phone"></i>
                    <span>Request Callback</span>
                </button>
            </div>
            
            <div class="quick-contact">
                <p><strong>Quick Contact:</strong></p>
                <p>Phone: +44 1322 251 351</p>
                <p>Email: info@minicabit.com</p>
            </div>
        </div>
    `;

  showModal("Customer Support", supportHtml);
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in");
      }
    });
  }, observerOptions);

  document.querySelectorAll("section").forEach((section) => {
    observer.observe(section);
  });
});

window.openLoginModal = openLoginModal;
window.openSignupModal = openSignupModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.openAdminPanel = openAdminPanel;
window.showAdminSection = showAdminSection;
window.toggleFAQ = toggleFAQ;
window.bookRide = bookRide;
window.showProviderDetails = showProviderDetails;
window.setRating = setRating;
window.submitRating = submitRating;
window.openSupportModal = openSupportModal;
