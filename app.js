// Golden-Spark SmartRide - Main Application JavaScript
// Matches Database Structure: Users, Drivers, Passengers, Bookings

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize empty arrays if not exists
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('drivers')) {
        localStorage.setItem('drivers', JSON.stringify([]));
    }
    if (!localStorage.getItem('passengers')) {
        localStorage.setItem('passengers', JSON.stringify([]));
    }
    if (!localStorage.getItem('bookings')) {
        localStorage.setItem('bookings', JSON.stringify([]));
    }
    if (!localStorage.getItem('securityLogs')) {
        localStorage.setItem('securityLogs', JSON.stringify([]));
    }
    if (!localStorage.getItem('rideSettings')) {
        const settings = {
            economyRate: 1.50,
            premiumRate: 2.50,
            luxuryRate: 4.00,
            baseFare: 3.00,
            surgeMultiplier: 1.0,
            minFare: 5.00
        };
        localStorage.setItem('rideSettings', JSON.stringify(settings));
    }

    updateNavigation();
}

// ==================== TOGGLE PASSWORD ====================
function togglePass(id) {
    const field = document.getElementById(id);
    if (field) {
        field.type = field.type === 'password' ? 'text' : 'password';
    }
}

// ==================== USER MANAGEMENT ====================
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getDrivers() {
    return JSON.parse(localStorage.getItem('drivers') || '[]');
}

function saveDrivers(drivers) {
    localStorage.setItem('drivers', JSON.stringify(drivers));
}

function getPassengers() {
    return JSON.parse(localStorage.getItem('passengers') || '[]');
}

function savePassengers(passengers) {
    localStorage.setItem('passengers', JSON.stringify(passengers));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentDriver() {
    const user = getCurrentUser();
    if (!user || user.role !== 'Driver') return null;
    const drivers = getDrivers();
    return drivers.find(d => d.userId === user.id);
}

function getCurrentPassenger() {
    const user = getCurrentUser();
    if (!user || user.role !== 'Passenger') return null;
    const passengers = getPassengers();
    return passengers.find(p => p.userId === user.id);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ==================== REGISTRATION ====================
function handleRegister() {
    const firstName = document.getElementById('firstName') ? document.getElementById('firstName').value.trim() : '';
    const lastName = document.getElementById('lastName') ? document.getElementById('lastName').value.trim() : '';
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword') ? document.getElementById('confirmPassword').value : '';
    const phone = document.getElementById('phone') ? document.getElementById('phone').value.trim() : '';
    const role = document.getElementById('userRole') ? document.getElementById('userRole').value : 'Passenger';

    // Validation
    if (!firstName || !lastName || !email || !password) {
        showMessage('Please fill in all required fields!', 'error');
        return;
    }

    if (firstName.length < 2 || lastName.length < 2) {
        showMessage('Name must be at least 2 characters!', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address!', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters!', 'error');
        return;
    }

    if (confirmPassword && password !== confirmPassword) {
        showMessage('Passwords do not match!', 'error');
        return;
    }

    const users = getUsers();
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        showMessage('Email already registered!', 'error');
        return;
    }

    // Validate driver-specific fields
    if (role === 'Driver') {
        const licenseNumber = document.getElementById('licenseNumber') ? document.getElementById('licenseNumber').value.trim() : '';
        const vehicleModel = document.getElementById('vehicleModel') ? document.getElementById('vehicleModel').value.trim() : '';
        const plateNumber = document.getElementById('plateNumber') ? document.getElementById('plateNumber').value.trim() : '';
        const vehicleYear = document.getElementById('vehicleYear') ? document.getElementById('vehicleYear').value : '';

        if (!licenseNumber || !vehicleModel || !plateNumber || !vehicleYear) {
            showMessage('Please fill in all vehicle details!', 'error');
            return;
        }

        // Check for duplicate plate number
        const existingDrivers = getDrivers();
        if (existingDrivers.find(d => d.plateNumber.toLowerCase() === plateNumber.toLowerCase())) {
            showMessage('Plate number already registered!', 'error');
            return;
        }

        if (existingDrivers.find(d => d.licenseNumber.toLowerCase() === licenseNumber.toLowerCase())) {
            showMessage('License number already registered!', 'error');
            return;
        }
    }

    const now = new Date().toISOString();
    const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        phone: phone,
        role: role,
        profilePic: 'default-avatar.png',
        isActive: true,
        createdAt: now,
        updatedAt: now
    };

    users.push(newUser);
    saveUsers(users);

    // Create role-specific record
    if (role === 'Passenger') {
        const passengers = getPassengers();
        const newPassenger = {
            id: passengers.length > 0 ? Math.max(...passengers.map(p => p.id)) + 1 : 1,
            userId: newUser.id,
            walletBalance: 0,
            loyaltyPoints: 0
        };
        passengers.push(newPassenger);
        savePassengers(passengers);
    } else if (role === 'Driver') {
        const drivers = getDrivers();
        const newDriver = {
            id: drivers.length > 0 ? Math.max(...drivers.map(d => d.id)) + 1 : 1,
            userId: newUser.id,
            licenseNumber: document.getElementById('licenseNumber').value.trim(),
            licenseExpiry: document.getElementById('licenseExpiry') ? document.getElementById('licenseExpiry').value : '2028-12-31',
            vehicleModel: document.getElementById('vehicleModel').value.trim(),
            plateNumber: document.getElementById('plateNumber').value.trim(),
            vehicleYear: parseInt(document.getElementById('vehicleYear').value),
            vehicleColor: document.getElementById('vehicleColor') ? document.getElementById('vehicleColor').value.trim() : 'White',
            isAvailable: true,
            isOnline: false,
            rating: 0,
            totalRides: 0,
            totalEarnings: 0,
            currentLocation: { lat: 6.5244, lng: 3.3792 }
        };
        drivers.push(newDriver);
        saveDrivers(drivers);
    }

    // Add security log
    addSecurityLog('registration', newUser.id, 'New ' + role.toLowerCase() + ' registered: ' + firstName + ' ' + lastName);

    const overlay = document.getElementById('success-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }

    setTimeout(() => {
        setCurrentUser(newUser);
        
        // Redirect based on role
        switch (role) {
            case 'Admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'Driver':
                window.location.href = 'driver-dashboard.html';
                break;
            default:
                window.location.href = 'passenger-dashboard.html';
        }
    }, 2500);
}

// ==================== LOGIN ====================
function handleLogin() {
    const email = document.getElementById('email') ? document.getElementById('email').value.trim() : '';
    const password = document.getElementById('login-pass') ? document.getElementById('login-pass').value : '';

    if (!email || !password) {
        showMessage('Please enter email and password!', 'error');
        return;
    }

    const users = getUsers();
    const user = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
    );

    if (!user) {
        showMessage('Invalid email or password!', 'error');
        return;
    }

    if (!user.isActive) {
        showMessage('Account is deactivated. Contact admin.', 'error');
        return;
    }

    // Add security log
    addSecurityLog('login', user.id, user.firstName + ' ' + user.lastName + ' logged in');

    setCurrentUser(user);

    switch (user.role) {
        case 'Admin':
            window.location.href = 'admin-dashboard.html';
            break;
        case 'Driver':
            window.location.href = 'driver-dashboard.html';
            break;
        default:
            window.location.href = 'passenger-dashboard.html';
    }
}

// ==================== BOOKING MANAGEMENT ====================
function getBookings() {
    return JSON.parse(localStorage.getItem('bookings') || '[]');
}

function saveBookings(bookings) {
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

function createBooking(bookingData) {
    const bookings = getBookings();
    const user = getCurrentUser();
    const passenger = getCurrentPassenger();
    
    const newBooking = {
        id: 'BK' + Date.now(),
        passengerId: passenger ? passenger.id : null,
        passengerUserId: user.id,
        passengerName: user.firstName + ' ' + user.lastName,
        passengerPhone: user.phone,
        driverId: null,
        driverUserId: null,
        driverName: null,
        driverPhone: null,
        driverVehicle: null,
        driverPlate: null,
        pickup: bookingData.pickup,
        dropoff: bookingData.dropoff,
        pickupLat: bookingData.pickupLat || null,
        pickupLng: bookingData.pickupLng || null,
        dropoffLat: bookingData.dropoffLat || null,
        dropoffLng: bookingData.dropoffLng || null,
        date: bookingData.date,
        time: bookingData.time,
        vehicleType: bookingData.vehicleType,
        passengerCount: parseInt(bookingData.passengerCount) || 1,
        fare: parseFloat(bookingData.fare),
        distance: parseFloat(bookingData.distance) || 0,
        status: 'Pending',
        paymentStatus: 'Pending',
        rating: null,
        feedback: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    saveBookings(bookings);

    // Add security log
    addSecurityLog('booking', user.id, 'New booking created: ' + newBooking.id);

    return newBooking;
}

function updateBookingStatus(bookingId, status, driverId = null) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = status;
        booking.updatedAt = new Date().toISOString();
        
        if (driverId) {
            const drivers = getDrivers();
            const driver = drivers.find(d => d.id === driverId);
            if (driver) {
                booking.driverId = driver.id;
                booking.driverUserId = driver.userId;
                const driverUser = getUsers().find(u => u.id === driver.userId);
                booking.driverName = driverUser ? driverUser.firstName + ' ' + driverUser.lastName : 'Unknown';
                booking.driverPhone = driverUser ? driverUser.phone : '';
                booking.driverVehicle = driver.vehicleModel;
                booking.driverPlate = driver.plateNumber;
            }
        }

        saveBookings(bookings);
    }
}

function rateBooking(bookingId, rating, feedback = '') {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.rating = rating;
        booking.feedback = feedback;
        booking.paymentStatus = 'Paid';
        booking.updatedAt = new Date().toISOString();
        saveBookings(bookings);
    }
}

function getUserBookings(userId) {
    const bookings = getBookings();
    return bookings.filter(b => b.passengerUserId === userId || b.driverUserId === userId);
}

function getPassengerBookings(passengerId) {
    const bookings = getBookings();
    return bookings.filter(b => b.passengerId === passengerId);
}

function getDriverBookings(driverId) {
    const bookings = getBookings();
    return bookings.filter(b => b.driverId === driverId);
}

// ==================== DRIVER FUNCTIONS ====================
function toggleDriverStatus() {
    const driver = getCurrentDriver();
    if (driver) {
        driver.isOnline = !driver.isOnline;
        driver.isAvailable = driver.isOnline;
        
        const drivers = getDrivers();
        const index = drivers.findIndex(d => d.id === driver.id);
        if (index !== -1) {
            drivers[index] = driver;
            saveDrivers(drivers);
        }
        
        setCurrentUser(getCurrentUser());
        return driver.isOnline;
    }
    return false;
}

function updateDriverLocation(lat, lng) {
    const driver = getCurrentDriver();
    if (driver) {
        driver.currentLocation = { lat, lng };
        const drivers = getDrivers();
        const index = drivers.findIndex(d => d.id === driver.id);
        if (index !== -1) {
            drivers[index] = driver;
            saveDrivers(drivers);
        }
    }
}

function getAvailableRides() {
    const bookings = getBookings();
    return bookings.filter(b => b.status === 'Pending' && !b.driverId);
}

function acceptRide(bookingId) {
    const driver = getCurrentDriver();
    if (!driver) return false;

    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'Pending') {
        booking.driverId = driver.id;
        booking.driverUserId = driver.userId;
        
        const user = getCurrentUser();
        booking.driverName = user.firstName + ' ' + user.lastName;
        booking.driverPhone = user.phone;
        booking.driverVehicle = driver.vehicleModel;
        booking.driverPlate = driver.plateNumber;
        booking.status = 'Accepted';
        booking.updatedAt = new Date().toISOString();

        // Update driver stats
        driver.isAvailable = false;
        const drivers = getDrivers();
        const index = drivers.findIndex(d => d.id === driver.id);
        if (index !== -1) {
            drivers[index] = driver;
            saveDrivers(drivers);
        }

        saveBookings(bookings);
        addSecurityLog('ride_accepted', user.id, 'Ride ' + bookingId + ' accepted');
        return true;
    }
    return false;
}

function startRide(bookingId) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'Accepted') {
        booking.status = 'InProgress';
        booking.updatedAt = new Date().toISOString();
        saveBookings(bookings);
        return true;
    }
    return false;
}

function completeRide(bookingId) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && booking.status === 'InProgress') {
        booking.status = 'Completed';
        booking.paymentStatus = 'Paid';
        booking.updatedAt = new Date().toISOString();

        // Update driver earnings
        const drivers = getDrivers();
        const driver = drivers.find(d => d.id === booking.driverId);
        if (driver) {
            driver.totalRides += 1;
            driver.totalEarnings += booking.fare;
            driver.isAvailable = true;
            const index = drivers.findIndex(d => d.id === driver.id);
            if (index !== -1) {
                drivers[index] = driver;
                saveDrivers(drivers);
            }
        }

        // Update passenger points
        const passengers = getPassengers();
        const passenger = passengers.find(p => p.id === booking.passengerId);
        if (passenger) {
            passenger.loyaltyPoints += Math.floor(booking.fare);
            const index = passengers.findIndex(p => p.id === passenger.id);
            if (index !== -1) {
                passengers[index] = passenger;
                savePassengers(passengers);
            }
        }

        saveBookings(bookings);
        addSecurityLog('ride_completed', booking.driverUserId, 'Ride ' + bookingId + ' completed');
        return true;
    }
    return false;
}

function cancelRide(bookingId) {
    const bookings = getBookings();
    const booking = bookings.find(b => b.id === bookingId);
    if (booking && (booking.status === 'Pending' || booking.status === 'Accepted')) {
        booking.status = 'Cancelled';
        booking.updatedAt = new Date().toISOString();

        if (booking.driverId) {
            const drivers = getDrivers();
            const driver = drivers.find(d => d.id === booking.driverId);
            if (driver) {
                driver.isAvailable = true;
                const index = drivers.findIndex(d => d.id === driver.id);
                if (index !== -1) {
                    drivers[index] = driver;
                    saveDrivers(drivers);
                }
            }
        }

        saveBookings(bookings);
        return true;
    }
    return false;
}

// ==================== ADMIN FUNCTIONS ====================
function getStats() {
    const users = getUsers();
    const drivers = getDrivers();
    const passengers = getPassengers();
    const bookings = getBookings();
    
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.fare, 0);
    
    const activeRides = bookings.filter(b => b.status === 'Accepted' || b.status === 'InProgress').length;
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const completedRides = completedBookings.length;
    const cancelledRides = bookings.filter(b => b.status === 'Cancelled').length;
    
    const onlineDrivers = drivers.filter(d => d.isOnline).length;
    
    return {
        totalRevenue: totalRevenue.toFixed(2),
        activeRides,
        pendingBookings,
        completedRides,
        cancelledRides,
        totalDrivers: drivers.length,
        onlineDrivers,
        totalPassengers: passengers.length,
        totalUsers: users.length,
        totalBookings: bookings.length
    };
}

function getRevenueByPeriod(period) {
    const bookings = getBookings().filter(b => b.status === 'Completed');
    const now = new Date();
    let filtered = [];

    switch(period) {
        case 'today':
            filtered = bookings.filter(b => {
                const bookingDate = new Date(b.date);
                return bookingDate.toDateString() === now.toDateString();
            });
            break;
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = bookings.filter(b => new Date(b.date) >= weekAgo);
            break;
        case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filtered = bookings.filter(b => new Date(b.date) >= monthAgo);
            break;
        case 'year':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filtered = bookings.filter(b => new Date(b.date) >= yearAgo);
            break;
        default:
            filtered = bookings;
    }

    const revenue = filtered.reduce((sum, b) => sum + b.fare, 0);
    const count = filtered.length;
    const avgFare = count > 0 ? revenue / count : 0;

    return { revenue: revenue.toFixed(2), count, avgFare: avgFare.toFixed(2) };
}

function getMonthlyRevenue() {
    const bookings = getBookings().filter(b => b.status === 'Completed');
    const monthlyData = {};

    bookings.forEach(b => {
        const date = new Date(b.date);
        const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        if (!monthlyData[key]) {
            monthlyData[key] = 0;
        }
        monthlyData[key] += b.fare;
    });

    return Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue: revenue.toFixed(2)
    }));
}

// ==================== SECURITY FUNCTIONS ====================
function getSecurityLogs() {
    return JSON.parse(localStorage.getItem('securityLogs') || '[]');
}

function addSecurityLog(type, userId, message) {
    const logs = getSecurityLogs();
    logs.push({
        id: logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1,
        type,
        userId,
        message,
        timestamp: new Date().toISOString(),
        ip: '192.168.1.' + Math.floor(Math.random() * 255)
    });
    localStorage.setItem('securityLogs', JSON.stringify(logs));
}

// ==================== VALIDATION HELPERS ====================
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^[\d\s\-\+\(\)]{10,}$/;
    return re.test(phone);
}

// ==================== UI HELPERS ====================
function showMessage(message, type = 'info') {
    const existing = document.querySelector('.message-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'message-toast ' + type;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        ${type === 'error' ? 'background-color: #f44336;' : 
          type === 'success' ? 'background-color: #4CAF50;' : 
          'background-color: #2196F3;'}
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateNavigation() {
    const user = getCurrentUser();
    const navBtns = document.querySelectorAll('.nav-btn');
    
    if (user) {
        navBtns.forEach(btn => {
            if (btn.textContent === 'Login' || btn.textContent === 'Register') {
                btn.textContent = 'Logout';
                btn.href = '#';
                btn.onclick = function(e) {
                    e.preventDefault();
                    logout();
                };
            }
        });
    }
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount || 0).toFixed(2);
}

function formatDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
