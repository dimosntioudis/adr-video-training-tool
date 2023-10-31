document.getElementById("registrationForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission

  // Gather user input data
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Define the API endpoint URL
  const apiUrl = "http://localhost:8080/api/auth/signup"; // Replace with your API endpoint URL

  // Prepare the request data
  const requestData = {
    username: username,
    email: email,
    password: password,
    roles: ["trainer"], // You can set the role as needed
  };

  // Send a POST request to the API
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  })
  .then((response) => {
    if (response.ok) {
      alert("Registration successful!");
      // Redirect to the login page or any other appropriate page
      window.location.href = "login.html";
    } else {
      alert("Registration failed. Please try again.");
    }
  })
  .catch((error) => {
    console.error("Error:", error);
  });
});