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
        
        // Get minPrice and maxPrice values from the input fields
        const minPrice = parseInt(minPriceInput.value) || 0;
        const maxPrice = parseInt(maxPriceInput.value) || Number.MAX_SAFE_INTEGER;

        // Check if the inputs are valid
        if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0 || minPrice > maxPrice) {
            errorMessage.style.display = 'block';
            hostelsDiv.style.display = 'none'; // Hide hostels section in case of error
            return;
        } else {
            errorMessage.style.display = 'none';
        }

        // Call the function to fetch hostels based on price range
        fetchHostels(minPrice, maxPrice);
    });

    // Function to fetch hostels from the server
    function fetchHostels(minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER) {
        // Show loading message while fetching data
        loadingMessage.style.display = 'block';
        hostelsDiv.innerHTML = ''; // Clear previous results

        // Fetch hostels data based on the price range
        fetch(`http://localhost:3000/hostels/search?minPrice=${minPrice}&maxPrice=${maxPrice}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                return response.json();
            })
            .then((data) => {
                hostelsDiv.innerHTML = ''; // Clear previous results

                // Check if no hostels are found
                if (data.length === 0) {
                    hostelsDiv.innerHTML = '<p>No hostels found within the specified price range.</p>';
                } else {
                    data.forEach((hostel) => {
                        const hostelDiv = document.createElement('div');
                        hostelDiv.className = 'hostel';

                        // Hostel image
                        if (hostel.image) {
                            const image = document.createElement('img');
                            image.src = hostel.image; // Use the full image URL returned from the backend
                            image.alt = hostel.name;
                            image.style.width = '100%'; // Adjust styling as needed
                            image.style.borderRadius = '10px';
                            hostelDiv.appendChild(image);
                        }

                        // Hostel name
                        const name = document.createElement('h2');
                        name.textContent = hostel.name;
                        hostelDiv.appendChild(name);

                        // Hostel location
                        const location = document.createElement('p');
                        location.textContent = `Location: ${hostel.location}`;
                        hostelDiv.appendChild(location);

                        // Hostel price
                        const price = document.createElement('p');
                        price.textContent = `Price: ₹${hostel.price}`;
                        hostelDiv.appendChild(price);

                        // Hostel amenities
                        const amenities = document.createElement('p');
                        amenities.textContent = `Amenities: ${hostel.amenities.join(', ')}`;
                        hostelDiv.appendChild(amenities);

                        // Hostel rating
                        const rating = document.createElement('p');
                        rating.textContent = `Rating: ${hostel.rating} ⭐`;
                        hostelDiv.appendChild(rating);

                        // Append hostel info to the container
                        hostelsDiv.appendChild(hostelDiv);
                    });
                }

                // Hide loading message and show the hostels div
                loadingMessage.style.display = 'none';
                hostelsDiv.style.display = 'block';
            })
            .catch((error) => {
                console.error('Error fetching hostels:', error);
                hostelsDiv.innerHTML = '<p>Error fetching data. Please try again later.</p>';
                loadingMessage.style.display = 'none'; // Hide loading message on error
                hostelsDiv.style.display = 'block'; // Show error message
            });
    }
});
