document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    const fetchWeatherButton = document.getElementById('fetchWeatherButton');
    const weatherDisplay = document.getElementById('weatherDisplay');
    const weatherLoading = document.getElementById('weatherLoading');
    const weatherCity = document.getElementById('weatherCity');
    const weatherTemp = document.getElementById('weatherTemp');
    const weatherCondition = document.getElementById('weatherCondition');
    const weatherHumidity = document.getElementById('weatherHumidity');
    const weatherWind = document.getElementById('weatherWind');

    // --- Logout Logic ---
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            logoutButton.disabled = true;
            logoutButton.textContent = 'Logging out...';

            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Add page exit animation class before redirect
                    document.body.classList.add('page-exit');
                    setTimeout(() => {
                        window.location.href = '/login'; // Redirect to login after successful logout
                    }, 500); // Wait for animation to complete
                } else {
                    alert(result.message || 'Logout failed. Please try again.');
                    logoutButton.disabled = false;
                    logoutButton.textContent = 'Logout';
                }
            } catch (error) {
                console.error('Error during logout:', error);
                alert('Network error during logout. Please try again.');
                logoutButton.disabled = false;
                logoutButton.textContent = 'Logout';
            }
        });
    }

    // --- Fetch Weather Logic (External API Integration) ---
    if (fetchWeatherButton) {
        fetchWeatherButton.addEventListener('click', async () => {
            fetchWeatherButton.disabled = true;
            fetchWeatherButton.textContent = 'Fetching...';
            weatherLoading.style.display = 'block'; // Show loading indicator
            clearWeatherDisplay(); // Clear previous data

            try {
                const response = await fetch('/api/user-weather'); // Call your protected API endpoint
                const result = await response.json();

                if (response.ok && result.success) {
                    const weather = result.weather;
                    weatherCity.textContent = `City: ${weather.city}`;
                    weatherTemp.textContent = `Temperature: ${weather.temperature}`;
                    weatherCondition.textContent = `Condition: ${weather.condition}`;
                    weatherHumidity.textContent = `Humidity: ${weather.humidity}`;
                    weatherWind.textContent = `Wind: ${weather.windSpeed}`;
                } else {
                    weatherDisplay.innerHTML = `<p style="color: red;">Error: ${result.message || 'Failed to fetch weather data.'}</p>`;
                }
            } catch (error) {
                console.error('Error fetching weather:', error);
                weatherDisplay.innerHTML = `<p style="color: red;">Network error fetching weather. Please try again.</p>`;
            } finally {
                weatherLoading.style.display = 'none'; // Hide loading indicator
                fetchWeatherButton.disabled = false;
                fetchWeatherButton.textContent = 'Fetch Weather';
            }
        });
    }

    function clearWeatherDisplay() {
        weatherCity.textContent = '';
        weatherTemp.textContent = '';
        weatherCondition.textContent = '';
        weatherHumidity.textContent = '';
        weatherWind.textContent = '';
    }
});