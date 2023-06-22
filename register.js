document.addEventListener('DOMContentLoaded', () => {
  const registrationForm = document.getElementById('registrationForm');

  registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      // Registration successful
      window.location.href = 'login.html'; // Redirect to login page
    } else {
      // Registration failed
      const errorData = await response.json();
      console.error('Registration failed:', errorData.error);
      // Display an error message to the user
      // Example: document.getElementById('error-message').textContent = errorData.error;
    }
  });
});
