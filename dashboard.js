document.addEventListener('DOMContentLoaded', () => {
  const userInfoElement = document.getElementById('personal-info');
  const uploadForm = document.getElementById('upload-form');
  const videoListElement = document.getElementById('video-list');
  const searchBar = document.getElementById('search-bar');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const uploadButton = document.getElementById('upload-button');
  const uploadPopup = document.getElementById('upload-popup');

  // Retrieve the logged-in user from local storage
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

  // Check if the user is logged in
  if (loggedInUser) {
    // Display the username
    document.getElementById('username').textContent = loggedInUser.username;

    // Make a request to the server to fetch the user information
    fetch('http://localhost:3000/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loggedInUser.token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      // Display the user information in the Personal Information section
      const {user} = data;
      const personalInfoElement = document.getElementById('personal-info');
      personalInfoElement.innerHTML = `
        <p>Username: ${user.username}</p>
      `;
    })
    .catch(error => {
      console.error('Failed to fetch user information:', error);
      // Handle error and display an error message to the user
    });

    uploadButton.addEventListener('click', () => {
      uploadPopup.style.display = 'block';
    });

    // Handle video upload form submission
    uploadPopup.addEventListener('submit', async (event) => {
      event.preventDefault();

      const videoFile = document.getElementById('video-file').files[0];
      const videoTitle = document.getElementById('video-title').value;
      const videoDescription = document.getElementById(
          'video-description').value;

      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', videoTitle);
      formData.append('description', videoDescription);

      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loggedInUser.token}`
        },
        body: formData
      });

      if (response.ok) {
        // Video uploaded successfully
        // Clear the form fields
        document.getElementById('video-file').value = '';
        document.getElementById('video-title').value = '';
        document.getElementById('video-description').value = '';

        // Fetch and display the updated video list
        fetchVideoList();
      } else {
        // Handle error and display an error message to the user
        console.error('Failed to upload video:', response.status);
      }
    });

    // Fetch and display the video list
    fetchVideoList();

    // Handle search bar input
    searchBar.addEventListener('keyup', () => {
      const searchQuery = searchBar.value;
      debounceSearch(searchQuery);
    });
  } else {
    // User is not logged in, redirect to the login page
    window.location.href = '/login.html';
  }

  // Debounce function from Lodash (import it if you haven't already)
  const debounceSearch = _.debounce((searchQuery) => {
    if (searchQuery.trim() !== '') {
      // Make a request to the server to fetch search suggestions based on the search query
      fetch(`http://localhost:3000/search?title=${searchQuery}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loggedInUser.token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        const {videos} = data;
        // Clear the suggestions container after each keystroke
        suggestionsContainer.innerHTML = '';

        videos.forEach(video => {
          const videoItem = document.createElement('div');
          videoItem.classList.add('video-item');
          videoItem.innerHTML = `
              <p>Title: ${video.title}</p>
              <button class="play-button" data-video-id="${video._id}">Play</button>
            `;
          suggestionsContainer.appendChild(videoItem);
        });

        // Attach event listeners to the play buttons
        const playButtons = document.querySelectorAll('.play-button');
        playButtons.forEach(button => {
          button.addEventListener('click', () => {
            const videoId = button.dataset.videoId;
            // Call a function to play the selected video using the videoId
            playVideo(videoId);
          });
        });
      })
      .catch(error => {
        console.error('Failed to fetch search suggestions:', error);
        // Handle error and display an error message to the user
      });
    } else {
      // Clear the suggestions container if the search query is empty
      suggestionsContainer.innerHTML = '';
    }
  }, 300); // Adjust the debounce delay as needed (e.g., 300 milliseconds)

  // Function to fetch and display the video list
  async function fetchVideoList() {
    // Make a request to the server to fetch the user's videos
    fetch('http://localhost:3000/videos', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loggedInUser.token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      // Display the user's videos in the video list
      const {videos} = data;
      videos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.classList.add('video-item');
        videoItem.innerHTML = `
          <p>Title: ${video.title}</p>
          <p>Id: ${video._id}</p>
          <p>Path: ${video.path}</p>
          <button class="play-button" data-video-id="${video._id}">Play</button>
        `;
        videoListElement.appendChild(videoItem);
      });

      // Attach event listeners to the play buttons
      const playButtons = document.querySelectorAll('.play-button');
      playButtons.forEach(button => {
        button.addEventListener('click', () => {
          const videoId = button.dataset.videoId;
          // Call a function to play the selected video using the videoId
          playVideo(videoId);
        });
      });
    })
    .catch(error => {
      console.error('Failed to fetch user videos:', error);
      // Handle error and display an error message to the user
    });
  }

  function playVideo(videoId) {
    // Retrieve the video based on the videoId
    fetch(`http://localhost:3000/videos/${videoId}`)
    .then(response => response.json())
    .then(video => {
      const videoPlayer = document.getElementById('video-player');
      const videoPath = video.path;

      // Construct the URL to the video file
      const videoURL = `http://localhost:3000/${videoPath}`;

      // Set the src attribute of the video player to the videoURL
      videoPlayer.src = videoURL;

      // Play the video
      videoPlayer.play();
    })
    .catch(error => {
      console.error('Error fetching video:', error);
    });
  }

  async function fetchVideosByTitle(title) {
    // Make a request to the server to fetch videos by title
    fetch(`http://localhost:3000/videos/search?title=${title}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loggedInUser.token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      const {videos} = data;
      videoListElement.innerHTML = '';

      videos.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.classList.add('video-item');
        videoItem.innerHTML = `
          <p>Title: ${video.title}</p>
          <p>Id: ${video._id}</p>
          <p>Path: ${video.path}</p>
          <button class="play-button" data-video-id="${video._id}">Play</button>
        `;
        videoListElement.appendChild(videoItem);
      });

      // Attach event listeners to the play buttons
      const playButtons = document.querySelectorAll('.play-button');
      playButtons.forEach(button => {
        button.addEventListener('click', () => {
          const videoId = button.dataset.videoId;
          // Call a function to play the selected video using the videoId
          playVideo(videoId);
        });
      });
    })
    .catch(error => {
      console.error('Failed to fetch videos by title:', error);
      // Handle error and display an error message to the user
    });
  }
});
