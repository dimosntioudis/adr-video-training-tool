const logoutLink = document.getElementById('logout-link');

logoutLink.addEventListener('click', () => {
  // Send a POST request to the API
  fetch(apiUrl + 'api/auth/signout', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include"
  })
  .then((response) => {
    if (response.ok) {
      // Redirect to the login page or any other appropriate page
      window.location.href = "login.html";
    }
  })
  .catch((error) => {
    console.error("Error:", error);
  });
});