document.getElementById("registrationForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the default form submission

  // Gather user input data
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const firstname = document.getElementById("firstname").value;
  const lastname = document.getElementById("lastname").value;

  // Access the radio button inputs
  const trainerRadio = document.getElementById('check-trainer');
  const traineeRadio = document.getElementById('check-trainee');

  // Get the selected country from the dropdown
  const selectedCountry = document.getElementById('countrySelection').value;

  // Define the API endpoint URL
  const apiUrl = "http://localhost:8080/api/auth/signup"; // Replace with your API endpoint URL

  let role;
  if (trainerRadio.checked) {
    role = 'trainer';
  } else if (traineeRadio.checked) {
    role = 'trainee';
  }

  // Prepare the request data
  const requestData = {
    firstname: firstname,
    lastname: lastname,
    username: username,
    email: email,
    password: password,
    roles: [role], // You can set the role as needed
    country: selectedCountry
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