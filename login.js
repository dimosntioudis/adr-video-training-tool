document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      // Login successful
      const userData = await response.json();
      localStorage.setItem('loggedInUser', JSON.stringify(userData));
      window.location.href = '/video-player/dashboard.html'; // Redirect to dashboard page
    } else {
      // Login failed
      const errorData = await response.json();
      console.error('Login failed:', errorData.error);
      // Display an error message to the user
      // Example: document.getElementById('error-message').textContent = errorData.error;
    }
  });
});
