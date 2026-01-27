// storageService.ts

// Adding timeoutFetch helper function
const timeoutFetch = (url, options = {}, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Request timed out')), timeout);
        fetch(url, options)
            .then(response => {
                clearTimeout(timer);
                resolve(response);
            })
            .catch(error => {
                clearTimeout(timer);
                reject(error);
            });
    });
};

// Update storageService
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
if (!GOOGLE_SCRIPT_URL) {
    // Fallback to localStorage
    console.error('GOOGLE_SCRIPT_URL not configured, falling back to localStorage.');
    // Logic to handle localStorage
} else {
    // Code that uses timeoutFetch where originally used mode: no-cors
    const requestOptions = { method: 'GET', headers: { 'Content-Type': 'application/json' }};
    timeoutFetch(GOOGLE_SCRIPT_URL, requestOptions)
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching data:', error);
            // Improved error handling logic can go here
        });
}

export { timeoutFetch };