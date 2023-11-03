document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission

  // Gather user input data
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Define the API endpoint URL
  const apiUrl = "http://localhost:8080/api/auth/signin"; // Replace with your API endpoint URL

  // Prepare the request data
  const requestData = {
    username: username,
    password: password
  };

  // Send a POST request to the API
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
    credentials: "include"
  })
  .then((response) => {
    if (response.ok) {
      alert("Login successful!");
      // Redirect to the login page or any other appropriate page
      return response.json();
    } else {
      alert("Login failed. Please try again.");
    }
  })
  .then(data => {
      const {roles} = data;
      if(roles.includes("TRAINER")) {
        window.location.href = "dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
  })
  .catch((error) => {
    console.error("Error:", error);
  });
});