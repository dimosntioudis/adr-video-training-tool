document.addEventListener('DOMContentLoaded', () => {
  const videoListElement = document.getElementById('video-list');
  const searchBar = document.getElementById('search-bar');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const uploadButton = document.getElementById('upload-button');
  const uploadPopup = document.getElementById('upload-popup');
  const logoutLink = document.getElementById('logout-link');
  const closeButton = document.getElementById('close-button');

  const uploadLink = document.getElementById('upload-link');
  const placeholderPlayButton = document.getElementById('placeholder-play-button');
  const placeholderMessage = document.getElementById('placeholder-message');

  // For drawing
  const videoPlayer = document.getElementById('video-player');
  const annotationCanvas = document.getElementById('annotation-canvas');
  const drawRectangleBtn = document.getElementById('draw-rectangle-btn');
  let isDrawing = false;
  let startX, startY, endX, endY, width, height;

  // Video control
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const progressBarContainer = document.getElementById(
      'progress-bar-container');
  const progressBar = document.getElementById('progress-bar');
  const timeDisplay = document.getElementById('time-display');
  let videoId;
  let annotations = [];

  const zoomButtonPlus = document.getElementById('zoom-btn-plus');
  const zoomButtonMinus = document.getElementById('zoom-btn-minus');

  // Set initial zoom level
  let zoomLevel = 1;

  // Variable to store the drawn annotations
  const drawnAnnotations = new Set();

  // Keep track of the currently highlighted annotation item
  let highlightedAnnotationItems = [];

  // Set the canvas dimensions to match the video player dimensions
  annotationCanvas.width = videoPlayer.clientWidth;
  annotationCanvas.height = videoPlayer.clientHeight;

  // For annotation
  const annotationPopup = document.getElementById('annotation-popup');
  const annotationDescription = document.getElementById(
      'annotation-description');
  const annotationDropdown = document.getElementById('annotation-dropdown');
  const saveAnnotationBtn = document.getElementById('save-annotation-btn');
  const errorMessage = document.getElementById('error-message');
  // Retrieve the close button element
  const closePopupBtn = document.getElementById('close-popup-btn');

  // Retrieve the logged-in user from local storage
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));

  const seekBackwardBtn = document.getElementById('seek-backward-btn');
  const seekForwardBtn = document.getElementById('seek-forward-btn');

  // Check if the user is logged in
  if (loggedInUser) {
    seekBackwardBtn.addEventListener('click', () => {
      // Perform seeking backward logic (e.g., adjust video playback time by -5 seconds)
      videoPlayer.currentTime -= 5;
      videoPlayer.play();
    });

    seekForwardBtn.addEventListener('click', () => {
      // Perform seeking forward logic (e.g., adjust video playback time by +5 seconds)
      videoPlayer.currentTime += 5;
      videoPlayer.play();
    });

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
    });

    // Handle mouse up event on the annotation canvas
    annotationCanvas.addEventListener('mouseup', (event) => {
      if (!isDrawing) {
        return;
      }
      const rect = annotationCanvas.getBoundingClientRect();
      endX = event.clientX - rect.left;
      endY = event.clientY - rect.top;
      width = endX - startX;
      height = endY - startY;
      drawRectangle(startX, startY, width, height);
      showAnnotationPopup();
      isDrawing = false;
    });

    videoPlayer.addEventListener('seeked', () => {
      // Remove highlight from the previous annotation item
      if (highlightedAnnotationItems.length > 0) {
        // Clear highlight for previously highlighted items
        highlightedAnnotationItems.forEach(item => {
          item.classList.remove('highlight');
          item.style.backgroundColor = '';
          item.style.color = '#333';
        });
      }

      clearCanvas();

      drawnAnnotations.clear();
    });

    // Function to draw a rectangle on the canvas
    function drawRectangle(x1, y1, width, height) {
      const ctx = annotationCanvas.getContext('2d');
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(x1 / zoomLevel, y1 / zoomLevel, width / zoomLevel, height / zoomLevel);
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

    // Event listener for the close button
    closePopupBtn.addEventListener('click', () => {
      hideAnnotationPopup();
      clearCanvas();
      errorMessage.classList.add('hidden');
    });

    saveAnnotationBtn.addEventListener('click', () => {
      // Get the annotation data
      const second = videoPlayer.currentTime; // Retrieve the annotation second value

      const frameRate = 30;
      const frameNumber = Math.floor(second * frameRate);

      const rectangle = {
        x: startX, // Retrieve the rectangle x value,
        y: startY, // Retrieve the rectangle y value,
        width: width, // Retrieve the rectangle width value,
        height: height, // Retrieve the rectangle height value,
      };
      const description = annotationDescription.value; // Retrieve the annotation description value

      if (description === '') {
        // Show the error message
        errorMessage.classList.remove('hidden');
      } else {
        const dropdownValue = annotationDropdown.value; // Retrieve the dropdown value

        // Create the annotation object
        const annotation = {
          frameNumber,
          second,
          rectangle,
          description,
          dropdownValue,
        };

        // Send a POST request to save the annotation
        const id = videoId; // Replace 'videoId' with the actual video ID
        fetch(`http://localhost:3001/videos/${id}/annotations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loggedInUser.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(annotation),
        })
        .then((response) => {
          if (response.ok) {
            // Annotation saved successfully
            console.log('Annotation saved successfully');
          } else {
            // Failed to save the annotation
            console.error('Failed to save the annotation');
          }
        })
        .catch((error) => {
          console.error('An error occurred while saving the annotation:',
              error);
        });

        // Hide the annotation popup
        hideAnnotationPopup();

        // Reset the form fields
        resetForm();

        // Retrieve and populate the updated annotation list
        retrieveAndPopulateAnnotations();

        errorMessage.classList.add('hidden');
      }
    });

    function resetForm() {
      const annotationDescription = document.getElementById(
          'annotation-description');
      const annotationDropdown = document.getElementById('annotation-dropdown');

      // Reset the form fields to their initial values
      annotationDescription.value = '';
      annotationDropdown.selectedIndex = 0;
    }

    // PERSONAL INFO SECTION
    // Make a request to the server to fetch the user information
    fetch('http://localhost:3001/dashboard', {
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
      // const personalInfoElement = document.getElementById('personal-info');
      // personalInfoElement.innerHTML = `
      //   <p>Username: ${user.username}</p>
      // `;

      // Update the "Welcome to the Dashboard" message with the username
      const welcomeMessageElement = document.getElementById('welcome-message');
      welcomeMessageElement.innerHTML = `
        <h3>Welcome to the Dashboard ${user.username}!</h3>
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

    uploadLink.addEventListener('click', (event) => {
      event.preventDefault(); // Prevent the default behavior of the link
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

      const response = await fetch('http://localhost:3001/upload', {
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

        videoListElement.innerHTML = '';

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
      window.location.href = '/video-player/login.html';
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

      // Remove highlight from the previous annotation item
      if (highlightedAnnotationItems.length > 0) {
        // Clear highlight for previously highlighted items
        highlightedAnnotationItems.forEach(item => {
          item.classList.remove('highlight');
          item.style.backgroundColor = '';
          item.style.color = "#333";
        });
      }

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

      // Update the time display
      const currentTimeInSeconds = Math.floor(currentTime);
      const durationInSeconds = Math.floor(duration);
      timeDisplay.textContent = `${formatTime(currentTimeInSeconds)} / ${formatTime(durationInSeconds)}`;

      // Redraw the annotations based on the current time
      redrawAnnotations(currentTime);
    });

    function formatTime(timeInSeconds) {
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      const milliseconds = Math.floor((timeInSeconds % 1) * 1000);

      const formattedHours = String(hours).padStart(2, '0');
      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = String(seconds).padStart(2, '0');
      const formattedMilliseconds = String(milliseconds).padStart(2, '0');

      if (hours > 0) {
        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`;
      } else {
        return `${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`;
      }
    }

    // Function to pad single digits with leading zero
    function padZero(number) {
      return number.toString().padStart(2, '0');
    }

    // ANNOTATION CONTROLS
    // Event listener for the delete annotation button
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-annotation-btn')) {
        const annotationId = event.target.dataset.annotationId;
        deleteAnnotation(annotationId);
      }
    });

    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('jump-to-btn')) {
        const annotationId = event.target.dataset.annotationId;

        // Retrieve the annotation details using the ID and perform the jump-to operation
        const annotation = getAnnotationById(annotationId);
        if (annotation) {
          const jumpToSecond = annotation.second;
          videoPlayer.currentTime = jumpToSecond;
          videoPlayer.play();
        }
      }
    });

    // Add event listener to zoom button
    zoomButtonPlus.addEventListener('click', handleZoomPlus);
    zoomButtonMinus.addEventListener('click', handleZoomMinus);

    // Function to handle zoom
    function handleZoomPlus() {
      // Increase zoom level by 0.1
      zoomLevel += 0.1;

      if (zoomLevel > 2.0) {
        zoomLevel = 2.0;
      }

      // Apply zoom to video player
      videoPlayer.style.transform = `scale(${zoomLevel})`;
      annotationCanvas.style.transform = `scale(${zoomLevel})`;
    }

    // Function to handle zoom
    function handleZoomMinus() {
      // Decrease zoom level by 0.1
      zoomLevel -= 0.1;

      if (zoomLevel < 1.0) {
        zoomLevel = 1.0;
      }

      // Apply zoom to video player
      videoPlayer.style.transform = `scale(${zoomLevel})`;
      annotationCanvas.style.transform = `scale(${zoomLevel})`;
    }

    function updateCanvasSize() {
      // Set canvas dimensions to match video player dimensions
      annotationCanvas.width = videoPlayer.clientWidth;
      annotationCanvas.height = videoPlayer.clientHeight;
    }

    // Update canvas size on initial page load
    updateCanvasSize();

    // Update canvas size on window resize
    window.addEventListener('resize', updateCanvasSize);
  } else {
    // User is not logged in, redirect to the login page
    window.location.href = '/login.html';
  }

  // Function to redraw the annotations based on the current time
  function redrawAnnotations(currentTime) {
    // // Clear the canvas before redrawing the annotations
    // clearCanvas();

    drawAnnotation(annotations, currentTime);
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
      fetch(`http://localhost:3001/search?title=${searchQuery}`, {
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
            videoId = button.dataset.videoId;

            clearCanvas();

            // Call a function to play the selected video using the videoId
            playVideo(videoId);

            // Retrieve and populate the updated annotation list
            retrieveAndPopulateAnnotations();
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
    fetch('http://localhost:3001/videos', {
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
<!--          <p>Id: ${video._id}</p>-->
<!--          <p>Path: ${video.path}</p>-->
          <button class="play-button" data-video-id="${video._id}">Play</button>
          <button class="delete-button" data-video-id="${video._id}">Delete</button>
        `;
        videoListElement.appendChild(videoItem);
      });

      // Attach event listeners to the play buttons
      const playButtons = document.querySelectorAll('.play-button');
      playButtons.forEach(button => {
        button.addEventListener('click', () => {
          videoId = button.dataset.videoId;

          clearCanvas();

          // Call a function to play the selected video using the videoId
          playVideo(videoId);

          // Retrieve and populate the updated annotation list
          retrieveAndPopulateAnnotations();
        });
      });

      // Attach event listeners to the delete buttons
      const deleteButtons = document.querySelectorAll('.delete-button');
      deleteButtons.forEach(button => {
        button.addEventListener('click', async () => {
          const videoId = button.dataset.videoId;

          try {
            // Send a DELETE request to the server to delete the video
            const response = await fetch(`http://localhost:3001/video/${videoId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${loggedInUser.token}`,
              },
            });

            if (response.ok) {
              // Video deleted successfully
              // Reload the page or update the video list as needed
              location.reload();
            } else {
              // Error occurred while deleting the video
              console.error('Failed to delete video');
            }
          } catch (error) {
            console.error(error);
          }
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
    fetch(`http://localhost:3001/videos/${videoId}`, {
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
      const videoURL = `http://localhost:3001/${videoPath}`;

      // Set the src attribute of the video player to the videoURL
      videoPlayer.src = videoURL;

      placeholderPlayButton.style.display = 'none';
      placeholderMessage.style.display = 'none';

      // Play the video
      videoPlayer.play();

      // // Draw the annotations on the canvas
      // annotations.forEach(annotation => {
      //   drawAnnotation(annotation);
      // });
    })
    .catch(error => {
      console.error('Error fetching video:', error);
    });
  }

  // // Function to generate an annotation item HTML
  // function createAnnotationItem(annotation) {
  //   const {second, description, dropdownValue, _id} = annotation;
  //   const item = document.createElement('li');
  //   item.classList.add('annotation-item');
  //   item.setAttribute('data-annotation-id', _id);
  //   item.innerHTML = `
  //   <span>${second}s</span>
  //   <span>${description}</span>
  //   <span>${dropdownValue}</span>
  //   <button data-annotation-id="${_id}" class="delete-annotation-btn">Delete</button>
  // `;
  //   return item;
  // }

  // Function to generate an annotation row in the table
  function createAnnotationItem(annotation) {
    const { second, description, dropdownValue, _id } = annotation;
    const row = document.createElement('tr');
    row.classList.add('annotation-row');
    row.setAttribute('data-annotation-id', _id);
    row.innerHTML = `
    <td>${second}s</td>
    <td>${description}</td>
    <td>${dropdownValue}</td>
    <td>
      <div class="annotation-button-container">
        <i data-annotation-id="${_id}" class="fas fa-edit edit-annotation-btn"></i>
        <i data-annotation-id="${_id}" class="fas fa-trash delete-annotation-btn"></i>
        <i data-annotation-id="${_id}" class="fas fa-eye jump-to-btn"></i>
      </div>
    </td>
  `;
    return row;
  }

  // Function to populate the annotation list
  function populateAnnotationList(annotations) {
    const annotationList = document.getElementById('annotation-list');
    annotationList.innerHTML = '';

    // Sort the annotations based on the `second` property
    annotations.sort((a, b) => a.second - b.second);

    annotations.forEach(annotation => {
      const item = createAnnotationItem(annotation);
      annotationList.appendChild(item);
    });
  }

  // Function to retrieve and populate the annotation list
  function retrieveAndPopulateAnnotations() {
    fetch(`http://localhost:3001/videos/${videoId}/annotations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loggedInUser.token}`
      },
    })
    .then(response => response.json())
    .then(data => {
      annotations = data;

      // Populate the annotation list
      populateAnnotationList(data);
    })
    .catch(error => {
      console.error('Failed to retrieve annotations:', error);
    });
  }

  // Function to draw an annotation rectangle on the canvas
  function drawAnnotation(annotations, currentTime) {
    // Draw the filtered annotations on the canvas
    for (const annotation of annotations) {
      const {second, rectangle} = annotation;
      const {x, y, width, height} = rectangle;

      // Calculate the time in the video corresponding to the annotation's second
      const timeInSeconds = second;

      if (Math.floor(timeInSeconds) === Math.floor(currentTime)
          && !drawnAnnotations.has(annotation)) {
        // Add the annotation to the drawn annotations set
        drawnAnnotations.add(annotation);
        videoPlayer.pause();
        drawRectangle(x, y, width, height);

        // Find the corresponding annotation item
        const annotationId = annotation._id; // Replace '_id' with the actual identifier of the annotation
        const annotationItem = document.querySelector(`tr[data-annotation-id="${annotationId}"]`);

        // Apply a CSS class or inline styling to highlight the annotation item
        annotationItem.classList.add('highlight'); // Add a CSS class
        // OR
        annotationItem.style.backgroundColor = '#4CAF50'; // Apply inline styling
        annotationItem.style.color = 'white';

        // Set the currently highlighted item to the new annotation item
        highlightedAnnotationItems.push(annotationItem);
      }
    }
  }

  function getAnnotationById(annotationId) {
    const annotationTable = document.getElementById('annotation-table');

    if (annotationTable) {
      // Find the annotation row with the specified ID
      const annotationRow = annotationTable.querySelector(`tr[data-annotation-id="${annotationId}"]`);

      if (annotationRow) {
        // Extract the annotation data from the row cells
        const cells = annotationRow.cells;

        // Get the text content from the cells
        const second = cells[0].textContent.replace('s', '');
        const description = cells[1].textContent;
        const category = cells[2].textContent;

        // Return an object with the annotation data
        return {
          id: annotationId,
          second: parseInt(second),
          description: description,
          category: category
        };
      }
    }

    // Return null if the annotation was not found
    return null;
  }

  // Function to delete an annotation
  function deleteAnnotation(annotationId) {
    fetch(`http://localhost:3001/videos/${videoId}/annotations/${annotationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${loggedInUser.token}`,
          },
        })
    .then(response => {
      if (response.ok) {
        // Annotation deleted successfully
        console.log('Annotation deleted successfully');

        clearCanvas();

        // Retrieve and populate the updated annotation list
        retrieveAndPopulateAnnotations();
      } else {
        // Failed to delete the annotation
        console.error('Failed to delete the annotation');
      }
    })
    .catch(error => {
      console.error('Failed to delete the annotation:', error);
    });
  }
});
