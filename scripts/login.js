document.getElementById("loginForm").addEventListener("submit",
    function (event) {
      event.preventDefault(); // Prevent the default form submission

      // Gather user input data
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      // Define the API endpoint URL
      const url = apiUrl + 'api/auth/signin'; // Replace with your API endpoint URL

      // Prepare the request data
      const requestData = {
        username: username,
        password: password
      };

      // Send a POST request to the API
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        credentials: "include"
      })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
      })
      .then(data => {
        const {roles} = data;
        if (roles.toString().includes("TRAINER")) {
          window.location.href = "overview.html";
        } else if (roles.toString().includes("ADMIN")) {
          window.location.href = "admin.html";
        } else {
          window.location.href = "dashboard.html";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    });