document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const hostelsDiv = document.getElementById('hostels');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const errorMessage = document.getElementById('errorMessage');
    const loadingMessage = document.getElementById('loadingMessage');

    // Initially hide the hostels div
    hostelsDiv.style.display = 'none';

    // Event listener for the search form submission
    searchForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const minPrice = parseInt(minPriceInput.value) || 0;
        const maxPrice = parseInt(maxPriceInput.value) || Number.MAX_SAFE_INTEGER;

        // Validate input
        if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
            errorMessage.style.display = 'block';
            hostelsDiv.style.display = 'none';
            return;
        } else {
            errorMessage.style.display = 'none';
        }

        // Fetch hostels
        fetchHostels(minPrice, maxPrice);
    });

    // Function to check database status
    function checkDatabaseStatus() {
        return fetch('http://localhost:3000/api/status')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Database status check failed');
                }
                return response.json();
            })
            .then(data => {
                console.log('Database status:', data);
                if (data.hostelsCount === 0) {
                    // If no hostels in database, seed it
                    return seedDatabase();
                }
                return data;
            })
            .catch(error => {
                console.error('Database status check error:', error);
                errorMessage.textContent = 'Database connection error. Please check if MongoDB is running.';
                errorMessage.style.display = 'block';
                throw error;
            });
    }

    // Function to seed the database
    function seedDatabase() {
        return fetch('http://localhost:3000/seed-database', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to seed database');
            }
            return response.json();
        })
        .then(data => {
            console.log('Database seeded:', data);
            return data;
        })
        .catch(error => {
            console.error('Error seeding database:', error);
            throw error;
        });
    }

    // Function to fetch hostels
    function fetchHostels(minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER) {
        loadingMessage.style.display = 'block';
        hostelsDiv.innerHTML = '';
        errorMessage.style.display = 'none';

        // First check database status
        checkDatabaseStatus()
            .then(() => {
                // Then fetch hostels
                return fetch(`http://localhost:3000/hostels/search?minPrice=${minPrice}&maxPrice=${maxPrice}`);
            })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                return response.json();
            })
            .then((data) => {
                console.log('Fetched data:', data);

                hostelsDiv.innerHTML = ''; // Clear previous results

                if (!Array.isArray(data)) {
                    throw new Error('Invalid data format received');
                }

                if (data.length === 0) {
                    hostelsDiv.innerHTML = '<p>No hostels found within the specified price range.</p>';
                } else {
                    data.forEach((hostel) => {
                        if (!hostel || typeof hostel !== 'object') {
                            console.error('Invalid hostel data:', hostel);
                            return;
                        }

                        const hostelDiv = document.createElement('div');
                        hostelDiv.className = 'hostel';

                        if (hostel.image) {
                            const image = document.createElement('img');
                            image.src = hostel.image;
                            image.alt = hostel.name || 'Hostel image';
                            image.style.width = '100%';
                            image.style.borderRadius = '10px';
                            image.onerror = function() {
                                this.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                            };
                            hostelDiv.appendChild(image);
                        }

                        const name = document.createElement('h2');
                        name.textContent = hostel.name || 'Unknown Hostel';
                        hostelDiv.appendChild(name);

                        const location = document.createElement('p');
                        location.textContent = `Location: ${hostel.location || 'Not specified'}`;
                        hostelDiv.appendChild(location);

                        const price = document.createElement('p');
                        price.textContent = `Price: ₹${hostel.price || 'Not specified'}`;
                        hostelDiv.appendChild(price);

                        const amenities = document.createElement('p');
                        amenities.textContent = `Amenities: ${Array.isArray(hostel.amenities) ? hostel.amenities.join(', ') : 'None listed'}`;
                        hostelDiv.appendChild(amenities);

                        const rating = document.createElement('p');
                        rating.textContent = `Rating: ${hostel.rating || 'Not rated'} ⭐`;
                        hostelDiv.appendChild(rating);

                        hostelsDiv.appendChild(hostelDiv);
                    });
                }

                loadingMessage.style.display = 'none';
                hostelsDiv.style.display = 'block';
            })
            .catch((error) => {
                console.error('Error fetching hostels:', error);
                hostelsDiv.innerHTML = `<p>Error fetching data: ${error.message}. Please try again later.</p>`;
                loadingMessage.style.display = 'none';
                hostelsDiv.style.display = 'block';
            });
    }
});
