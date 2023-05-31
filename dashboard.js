document.addEventListener('DOMContentLoaded', () => {
  const videoListElement = document.getElementById('video-list');
  const searchBar = document.getElementById('search-bar');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const uploadButton = document.getElementById('upload-button');
  const uploadPopup = document.getElementById('upload-popup');
  const logoutLink = document.getElementById('logout-link');
  const closeButton = document.getElementById('close-button');

  // For drawing
  const videoPlayer = document.getElementById('video-player');
  const annotationCanvas = document.getElementById('annotation-canvas');
  const drawRectangleBtn = document.getElementById('draw-rectangle-btn');
  let isDrawing = false;
  let startX, startY, endX, endY;

  // Video control
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const progressBarContainer = document.getElementById('progress-bar-container');
  const progressBar = document.getElementById('progress-bar');

  // Set the canvas dimensions to match the video player dimensions
  annotationCanvas.width = videoPlayer.clientWidth;
  annotationCanvas.height = videoPlayer.clientHeight;

  // For annotation
  const annotationPopup = document.getElementById('annotation-popup');
  const annotationDescription = document.getElementById(
      'annotation-description');
  const annotationDropdown = document.getElementById('annotation-dropdown');
  const saveAnnotationBtn = document.getElementById('save-annotation-btn');

  // Retrieve the logged-in user from local storage
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

  // Check if the user is logged in
  if (loggedInUser) {
    // DRAWING SECTION
    // Add event listeners to the draw rectangle button
    drawRectangleBtn.addEventListener('click', () => {
      // Pause video playback
      videoPlayer.pause();
      isDrawing = true;
    });

    // Handle mouse down event on the annotation canvas
    annotationCanvas.addEventListener('mousedown', (event) => {
      if (!isDrawing) {
        return;
      }
      const rect = annotationCanvas.getBoundingClientRect();
      startX = event.clientX - rect.left;
      startY = event.clientY - rect.top;
      console.log(startX);
      console.log(startY);
    });

    // Handle mouse up event on the annotation canvas
    annotationCanvas.addEventListener('mouseup', (event) => {
      if (!isDrawing) {
        return;
      }
      const rect = annotationCanvas.getBoundingClientRect();
      endX = event.clientX - rect.left;
      endY = event.clientY - rect.top;
      console.log(endX);
      console.log(endY);
      drawRectangle(startX, startY, endX, endY);
      showAnnotationPopup();
      isDrawing = false;
    });

    // Function to draw a rectangle on the canvas
    function drawRectangle(x1, y1, x2, y2) {
      const ctx = annotationCanvas.getContext('2d');
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      ctx.stroke();
    }

    // Function to show the annotation popup
    function showAnnotationPopup() {
      annotationPopup.classList.remove('hidden');
    }

    // Function to hide the annotation popup
    function hideAnnotationPopup() {
      annotationPopup.classList.add('hidden');
    }

    // Event listener for the "Save" button
    saveAnnotationBtn.addEventListener('click', () => {
      // Perform save operation or any desired action
      hideAnnotationPopup();

      // Reset the form fields
      resetForm();
    });

    function resetForm() {
      const annotationDescription = document.getElementById('annotation-description');
      const annotationDropdown = document.getElementById('annotation-dropdown');

      // Reset the form fields to their initial values
      annotationDescription.value = '';
      annotationDropdown.selectedIndex = 0;
    }

    // PERSONAL INFO SECTION
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

    // UPLOAD SECTION
    uploadButton.addEventListener('click', () => {
      uploadPopup.style.display = 'block';
    });

    closeButton.addEventListener('click', () => {
      uploadPopup.style.display = 'none';
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

        uploadPopup.remove();

        // Fetch and display the updated video list
        await fetchVideoList();
      } else {
        // Handle error and display an error message to the user
        console.error('Failed to upload video:', response.status);
      }
    });

    // LOGOUT BUTTON
    logoutLink.addEventListener('click', () => {
      // Clear the logged-in user from local storage
      localStorage.removeItem('loggedInUser');
      // Redirect to the login page
      window.location.href = '/login.html';
    });

    // VIDEO REVIEW SECTION
    // Fetch and display the video list
    fetchVideoList();

    // SEARCH BAR
    // Handle search bar input
    searchBar.addEventListener('keyup', () => {
      const searchQuery = searchBar.value;
      debounceSearch(searchQuery);
    });

    // VIDEO SECTION
    playBtn.addEventListener('click', () => {
      clearCanvas();
      videoPlayer.play();
    });

    pauseBtn.addEventListener('click', () => {
      videoPlayer.pause();
    });

    progressBarContainer.addEventListener('click', (event) => {
      const clickX = event.offsetX;
      const progressBarWidth = progressBarContainer.offsetWidth;
      const seekTime = (clickX / progressBarWidth) * videoPlayer.duration;
      videoPlayer.currentTime = seekTime;
    });

    videoPlayer.addEventListener('timeupdate', () => {
      const currentTime = videoPlayer.currentTime;
      const duration = videoPlayer.duration;
      const progress = (currentTime / duration) * 100;
      progressBar.style.width = `${progress}%`;
    });
  } else {
    // User is not logged in, redirect to the login page
    window.location.href = '/login.html';
  }
  // Function to clear the canvas
  function clearCanvas() {
    const ctx = annotationCanvas.getContext('2d');
    ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
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
        videoItem.classList.add('swiper-slide'); // Add the swiper-slide class
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

  // Function to play the video
  function playVideo(videoId) {
    // Retrieve the video based on the videoId
    fetch(`http://localhost:3000/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loggedInUser.token}`,
        'Content-Type': 'application/json'
      }
    })
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
});
