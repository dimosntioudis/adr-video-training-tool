document.addEventListener('DOMContentLoaded', async () => {

  // Function to get the parameter from the URL
  function getParameterByName(name) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(name);
  }

  // Retrieve the ID parameter value
  const parameterId = getParameterByName("id");

  async function retrieveAndPopulateSubmissionsForTrainer(parameterId) {
    try {
      const response = await fetch(
          `http://localhost:8080/api/test/submissions/${parameterId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: "include"
          })

      if (!response.ok) {
        throw new Error('Failed to fetch user submissions');
      }

      // Check if the response has no content (empty)
      if (response.status === 204) {
        return [];
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to retrieve submissions:', error);
      throw error; // Re-throw the error to propagate it
    }
  }

  const videoListElement = document.getElementById('video-list');

  let videoId;
  let annotationId;

  // Function to fetch and display the video list
  async function fetchVideoList(submissionVideo, userId) {
    // Make a request to the server to fetch the user's videos
    let url;
    if (submissionVideo) {
      url = 'http://localhost:8080/api/test/videos/' + submissionVideo;
    } else {
      url = 'http://localhost:8080/api/test/videos';
    }
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch user videos');
      }
      return response.json();
    })
    .then(data => {
      if (submissionVideo) {
        videoId = submissionVideo;

        clearCanvas();

        // Call a function to play the selected video using the videoId
        playVideo(videoId);

        // Retrieve and populate the updated annotation list
        retrieveAndPopulateAnnotations(submissionVideo, userId);
      } else {
        data.forEach(video => {
          const videoItem = document.createElement('div');
          videoItem.classList.add('video-item');
          videoItem.classList.add('swiper-slide'); // Add the swiper-slide class
          videoItem.innerHTML = `
          <p>${video.title}</p>
          <button class="play-button" data-video-id="${video.id}">Play</button>
          <button class="submit-button" data-video-id="${video.id}">Submit</button>
        `;
          videoListElement.appendChild(videoItem);
        });

        const submitButtons = document.querySelectorAll('.submit-button');
        submitButtons.forEach(button => {
          button.addEventListener('click', () => {
            videoId = button.dataset.videoId;

            // Submit the annotation for the specific video
            submitAnnotation(videoId);
          });
        })

        // Attach event listeners to the play buttons
        const playButtons = document.querySelectorAll('.play-button');
        playButtons.forEach(button => {
          button.addEventListener('click', () => {
            videoId = button.dataset.videoId;

            clearCanvas();

            // Call a function to play the selected video using the videoId
            playVideo(videoId);

            // Retrieve and populate the updated annotation list
            retrieveAndPopulateAnnotations(videoId, userId);
          });
        });
      }
    })
    .catch(error => {
      console.error('Failed to fetch user videos:', error);
    });
  }

  function submitAnnotation(videoId) {
    const annotationData = {
      videoId: videoId,
    };

    try {
      fetch('http://localhost:8080/api/test/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(annotationData),
        credentials: "include",
      })
      .then((response) => {
        if (response.ok) {
          alert("Annotations submitted successfully!");
        } else {
          alert("Failed to submit annotations. Please try again.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const annotationCanvas = document.getElementById('annotation-canvas');
  const placeholderPlayButton = document.getElementById(
      'placeholder-play-button');
  const placeholderMessage = document.getElementById('placeholder-message');
  const videoPlayer = document.getElementById('video-player');

  let isPaused = false; // Flag to keep track of whether the video is paused by the pause button

  // Function to play the video
  function playVideo(videoId) {
    // Retrieve the video based on the videoId
    fetch(`http://localhost:8080/api/test/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch user video');
      }
      return response.json();
    })
    .then(video => {
      // Set the src attribute of the video player to the videoURL
      videoPlayer.src = '../' + video.path;

      // Wait for metadata to load
      videoPlayer.addEventListener('loadedmetadata', function () {
        // Get the original video width and height
        const originalWidth = videoPlayer.videoWidth;
        const originalHeight = videoPlayer.videoHeight;

        // Set the player's dimensions to match the original video
        videoPlayer.style.width = originalWidth + 'px';
        videoPlayer.style.height = originalHeight + 'px';

        // Set the canvas dimensions to match the video player dimensions
        annotationCanvas.style.width = originalWidth + 'px';
        annotationCanvas.style.height = originalHeight + 'px';
      });

      placeholderPlayButton.style.display = 'none';
      placeholderMessage.style.display = 'none';

      // Play the video
      videoPlayer.currentTime = 0;
      isPaused = false;
      playVideoFrameByFrame(videoPlayer.currentTime);
    })
    .catch(error => {
      console.error('Error fetching video:', error);
    });
  }

  const progressBarContainer = document.getElementById(
      'progress-bar-container');
  const seekBackwardBtn = document.getElementById('seek-backward-btn');
  const seekForwardBtn = document.getElementById('seek-forward-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const drawRectangleBtn = document.getElementById('draw-rectangle-btn');

  let animationFrameId; // Variable to keep track of the requestAnimationFrame ID
  let highlightedAnnotationItems = []; // Keep track of the currently highlighted annotation item
  let isDrawing = false;
  let fps = 30;
  let currentFrameNumber = 0;
  let annotations = [];
  let speed = 1;
  let frameDuration = 1000 / (fps * speed);

  function playVideoFrameByFrame() {
    function handlePauseButtonClick() {
      if (isPaused) {
        isPaused = false;
        playFrame(videoPlayer.currentTime); // Continue frame-by-frame playback
      } else {
        isPaused = true;
        videoPlayer.pause();
        cancelAnimationFrame(animationFrameId); // Stop the frame-by-frame playback
      }
    }

    playBtn.addEventListener('click', handlePlayButtonClick);

    function handlePlayButtonClick() {
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

      isPaused = false;
      const nextTime = videoPlayer.currentTime + frameDuration / 1000;
      animationFrameId = requestAnimationFrame(() => playFrame(nextTime));
    }

    refreshBtn.addEventListener('click', handleRefreshButtonClick);

    function handleRefreshButtonClick() {
      // Remove highlight from the previous annotation item
      if (highlightedAnnotationItems.length > 0) {
        // Clear highlight for previously highlighted items
        highlightedAnnotationItems.forEach(item => {
          item.classList.remove('highlight');
          item.style.backgroundColor = '';
          item.style.color = "#333";
        });
      }

      clearCanvas();
      videoPlayer.currentTime = 0;
      isPaused = false;
      playVideoFrameByFrame(videoPlayer.currentTime);
    }

    seekBackwardBtn.addEventListener('click', () => {
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

      const frameRate = fps; // Replace with the actual frame rate of your video
      const currentTime = videoPlayer.currentTime;
      const targetTime = currentTime - (10 / frameRate);
      videoPlayer.currentTime = targetTime >= 0 ? targetTime : 0;
      playFrame(videoPlayer.currentTime);
    });

    seekForwardBtn.addEventListener('click', () => {
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

      const frameRate = fps; // Replace with the actual frame rate of your video
      const currentTime = videoPlayer.currentTime;
      const targetTime = currentTime + (10 / frameRate);
      const videoDuration = videoPlayer.duration;
      videoPlayer.currentTime = targetTime <= videoDuration ? targetTime
          : videoDuration;
      playFrame(videoPlayer.currentTime);
    });

    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('jump-to-btn')) {
        const annotationId = event.target.dataset.annotationId;

        // Retrieve the annotation details using the ID and perform the jump-to operation
        const annotation = getAnnotationById(annotationId);

        if (annotation) {
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

          videoPlayer.currentTime = annotation.second;
          isPaused = false;
          playVideoFrameByFrame(videoPlayer.currentTime);
        }
      }
    });

    function playFrame(currentTime) {
      if (!isPaused) {
        videoPlayer.currentTime = currentTime;
        currentFrameNumber = Math.floor(currentTime * fps);

        // Find if any rectangle exists for the currentFrameNumber
        // Initialize an object to store annotations by frame number
        const annotationsByFrame = {};

        // Loop through your annotations and organize them by frame number
        annotations.forEach(annotation => {
          const frameNumber = annotation.frameNumber;
          if (!annotationsByFrame[frameNumber]) {
            annotationsByFrame[frameNumber] = [];
          }
          annotationsByFrame[frameNumber].push(annotation);
        });

        // Later in your code, when you want to retrieve annotations for the current frame:
        const targetRectangleData = annotationsByFrame[currentFrameNumber];

        if (targetRectangleData && targetRectangleData.length > 0) {
          isPaused = true;
          videoPlayer.pause();

          // You can also highlight all the corresponding annotation items
          targetRectangleData.forEach(annotationData => {
            console.log(annotationData)
            const {x, y, width, height} = annotationData.rectangle;
            const {color} = annotationData;

            drawRectangle(x, y, width, height, color);

            const annotationId = annotationData.id; // Replace '' with the actual identifier of the annotation
            const annotationItem = document.querySelector(`tr[data-annotation-id="${annotationId}"]`);
            if (annotationItem) {
              annotationItem.classList.add('highlight'); // Add a CSS class
              // OR
              annotationItem.style.backgroundColor = '#3BCC8E'; // Apply inline styling
              annotationItem.style.color = 'white';
              highlightedAnnotationItems.push(annotationItem);
            }
          });

          cancelAnimationFrame(animationFrameId); // Stop the frame-by-frame playback
        } else {
          const nextTime = currentTime + frameDuration / 1000;
          animationFrameId = requestAnimationFrame(() => playFrame(nextTime));
        }
      }
    }

    pauseBtn.addEventListener('click', handlePauseButtonClick);

    drawRectangleBtn.addEventListener('click', handleDrawButtonClick);

    function handleDrawButtonClick() {
      isPaused = true;
      videoPlayer.pause();
      cancelAnimationFrame(animationFrameId); // Stop the frame-by-frame playback
      isDrawing = true;
    }

    progressBarContainer.addEventListener('click', (event) => {
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

      const clickX = event.offsetX;
      const progressBarWidth = progressBarContainer.offsetWidth;
      videoPlayer.currentTime = (clickX / progressBarWidth)
          * videoPlayer.duration;
      playFrame(videoPlayer.currentTime); // Continue frame-by-frame playback
    });

    // Start the frame-by-frame playback immediately when playVideoFrameByFrame is called
    playFrame(videoPlayer.currentTime);
  }

  // Set initial zoom level
  let zoomLevel = 1;

  // Function to draw a rectangle on the canvas
  function drawRectangle(x1, y1, width, height, color) {
    const ctx = annotationCanvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x1 / zoomLevel, y1 / zoomLevel, width / zoomLevel,
        height / zoomLevel);
    ctx.stroke();
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
          second: parseFloat(second),
          description: description,
          category: category
        };
      }
    }

    // Return null if the annotation was not found
    return null;
  }

  // Function to clear the canvas
  function clearCanvas() {
    const ctx = annotationCanvas.getContext('2d');
    ctx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
  }

  refreshBtn.addEventListener('click', () => {
    videoPlayer.currentTime = 0;
    isPaused = false;
    playVideoFrameByFrame(videoPlayer.currentTime);
  });

  let startX, startY, endX, endY, width, height;

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
    if (parameterId) {
      drawRectangle(startX, startY, width, height, 'blue');
    } else {
      drawRectangle(startX, startY, width, height, 'red');
    }
    showAnnotationPopup();
    isDrawing = false;
  });

  const annotationPopup = document.getElementById('annotation-popup');

  // Function to show the annotation popup
  function showAnnotationPopup() {
    annotationPopup.classList.remove('hidden');
  }

  // Function to hide the annotation popup
  function hideAnnotationPopup() {
    annotationPopup.classList.add('hidden');
  }

  const errorMessage = document.getElementById('error-message');
  const closePopupBtn = document.getElementById('close-popup-btn');

  // Event listener for the close button
  closePopupBtn.addEventListener('click', () => {
    hideAnnotationPopup();
    clearCanvas();
    errorMessage.classList.add('hidden');
  });

  const progressBar = document.getElementById('progress-bar');
  const timeDisplay = document.getElementById('time-display');

  videoPlayer.addEventListener('timeupdate', () => {
    const currentTime = videoPlayer.currentTime;
    const duration = videoPlayer.duration;
    const progress = (currentTime / duration) * 100;
    progressBar.style.width = `${progress}%`;

    // Update the time display
    const currentTimeInSeconds = Math.floor(currentTime);
    const durationInSeconds = Math.floor(duration);
    timeDisplay.textContent = `${formatTime(
        currentTimeInSeconds)} / ${formatTime(durationInSeconds)}`;
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

  function updateCanvasSize() {
    // Set canvas dimensions to match video player dimensions
    annotationCanvas.width = videoPlayer.clientWidth;
    annotationCanvas.height = videoPlayer.clientHeight;
  }

  // Update canvas size on window resize
  window.addEventListener('resize', updateCanvasSize);

  let isMoving = false;
  let startPanOffsetX = 0;
  let startPanOffsetY = 0;
  let panOffsetX = 0;
  let panOffsetY = 0;

  // Function to handle mousedown event to start dragging
  function handleMouseDown(event) {
    if (!isDrawing && zoomLevel > 1) {
      isMoving = true;
      startX = event.clientX;
      startY = event.clientY;
      startPanOffsetX = panOffsetX;
      startPanOffsetY = panOffsetY;
    }
  }

  // Function to handle mousemove event during dragging
  function handleMouseMove(event) {
    if (isMoving) {
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      // Calculate the new pan offsets based on the drag distance
      panOffsetX = startPanOffsetX + deltaX;
      panOffsetY = startPanOffsetY + deltaY;

      // Apply the new pan offsets to the video player's transform style
      videoPlayer.style.transform = `scale(${zoomLevel}) translate(${panOffsetX}px, ${panOffsetY}px)`;
      annotationCanvas.style.transform = `scale(${zoomLevel}) translate(${panOffsetX}px, ${panOffsetY}px)`;
    }
  }

  // Function to handle mouseup event to stop dragging
  function handleMouseUp() {
    isMoving = false;
  }

  // Add event listeners for click-and-drag panning
  annotationCanvas.addEventListener('mousedown', handleMouseDown);
  annotationCanvas.addEventListener('mousemove', handleMouseMove);
  annotationCanvas.addEventListener('mouseup', handleMouseUp);

  // SPEED OPTIONS
  const speedBtn = document.getElementById('speed-btn');
  const speedOptions = document.getElementById('speed-options');

  speedBtn.addEventListener('click', () => {
    speedOptions.style.display = speedOptions.style.display === 'block'
        ? 'none' : 'block';
  });

  const speedOptionsButtons = document.querySelectorAll('.speed-option');

  speedOptionsButtons.forEach(button => {
    button.addEventListener('click', () => {
      const speed = button.dataset.speed;
      frameDuration = 1000 / (fps * parseFloat(speed));
      speedOptionsButtons.forEach(btn => btn.classList.remove('selected')); // Remove 'selected' class from all buttons
      button.classList.add('selected'); // Add 'selected' class to the clicked button
    });
  });

  const zoomButtonPlus = document.getElementById('zoom-btn-plus');
  const zoomButtonMinus = document.getElementById('zoom-btn-minus');
  const videoContainer = document.getElementById('video-player-section');

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

    const containerRect = videoContainer.getBoundingClientRect();
    const containerTop = containerRect.top;

    const videoRect = videoPlayer.getBoundingClientRect();
    const videoTop = videoRect.top;

    // Apply zoom to video player with the transform-origin set to the center
    const videoCenterX = videoPlayer.clientWidth / 2;
    const videoCenterY = videoPlayer.clientHeight / 2;
    videoPlayer.style.transform = `scale(${zoomLevel})`;
    videoPlayer.style.transformOrigin = `${videoCenterX}px ${videoCenterY}px`;

    // Apply zoom to annotation canvas with the transform-origin set to the center
    const canvasCenterX = annotationCanvas.width / 2;
    const canvasCenterY = annotationCanvas.height / 2;
    annotationCanvas.style.transform = `scale(${zoomLevel})`;
    annotationCanvas.style.transformOrigin = `${canvasCenterX}px ${canvasCenterY}px`;
  }

  // Function to handle zoom
  function handleZoomMinus() {
    // Decrease zoom level by 0.1
    zoomLevel -= 0.1;

    if (zoomLevel < 1.0) {
      zoomLevel = 1.0;
    }

    // Apply zoom to video player with the transform-origin set to the center
    const videoCenterX = videoPlayer.clientWidth / 2;
    const videoCenterY = videoPlayer.clientHeight / 2;
    videoPlayer.style.transform = `scale(${zoomLevel})`;
    videoPlayer.style.transformOrigin = `${videoCenterX}px ${videoCenterY}px`;

    // Apply zoom to annotation canvas with the transform-origin set to the center
    const canvasCenterX = annotationCanvas.width / 2;
    const canvasCenterY = annotationCanvas.height / 2;
    annotationCanvas.style.transform = `scale(${zoomLevel})`;
    annotationCanvas.style.transformOrigin = `${canvasCenterX}px ${canvasCenterY}px`;
  }

  let annotationsMap = [];

  // Function to retrieve and populate the annotation list
  function retrieveAndPopulateAnnotations(submissionVideo, userId) {
    let url;
    if (submissionVideo && userId) {
      url = 'http://localhost:8080/api/test/annotations?videoId='
          + submissionVideo + '&id=' + userId;
    } else {
      url = 'http://localhost:8080/api/test/annotations?videoId=' + videoId;
    }
    fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: "include"
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch user videos');
      }

      // Check if the response has no content (empty)
      if (response.status === 204) {
        return [];
      }

      return response.json();
    })
    .then(data => {
      annotations = data;

      annotationsMap = data.map(annotation => {
        const {
          frameNumber,
          second,
          rectangle,
          comment,
          evaluation,
          color
        } = annotation;
        const {x, y, width, height} = rectangle;

        // Return a new object with the desired properties
        return {frameNumber, second, x, y, width, height, comment, evaluation, color};
      });

      // Populate the annotation list
      populateAnnotationList(data);
    })
    .catch(error => {
      console.error('Failed to retrieve annotations:', error);
    });
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

    // Add change event listener to all checkboxes
    const checkboxes = document.querySelectorAll('.annotation-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function () {
        const annotationId = this.id.split('_')[1];
        const annotation = annotations.find(a => a.id === annotationId);

        if (annotation) {
          annotation.evaluation = this.checked;
        }
      });
    });
  }

  // Assuming 'parentContainer' is the parent container of your table
  const parentContainer = document.getElementById("annotation-section");

  // Function to generate an annotation row in the table
  function createAnnotationItem(annotation) {
    const {
      second,
      frameNumber,
      description,
      dropdownValue,
      id,
      evaluation,
      color
    } = annotation;
    const row = document.createElement('tr');
    row.classList.add('annotation-row');
    row.setAttribute('data-annotation-id', id);
    if (parameterId) {
      row.innerHTML = `
        <td>${second.toFixed(3)}s</td>
        <td>${frameNumber}</td>
        <td>${description}</td>
        <td>${dropdownValue}</td>
        <td>        
        <!-- Checkbox with a label for styling purposes -->
        <div class="annotation-checkbox-container">
            <input type="checkbox" id="checkbox_${id}" class="annotation-checkbox" ${evaluation
          ? 'checked' : ''}>
            <label for="checkbox_${id}"></label>
        </div>
        </td>
        <td>
          <div class="annotation-button-container">
            <i data-annotation-id="${id}" class="fas fa-edit edit-annotation-btn"></i>
            <i data-annotation-id="${id}" class="fas fa-trash delete-annotation-btn"></i>
            <i data-annotation-id="${id}" class="fas fa-eye jump-to-btn"></i>
            <i data-annotation-id="${id}" class="fas fa-comment feedback-btn"></i>
          </div>
        </td>
      `;
    } else {
      row.innerHTML = `
        <td>${second.toFixed(3)}s</td>
        <td>${frameNumber}</td>
        <td>${description}</td>
        <td>${dropdownValue}</td>
        <td>        
        <!-- Checkbox with a label for styling purposes -->
        <div class="annotation-checkbox-container">
          <div id="checkbox_${id}" class="annotation-checkbox-disabled" style="color: ${evaluation ? 'green' : 'red'}"> 
            ${evaluation ? '✔' : '✘'} 
          </div>
        </div>
        </td>
        <td>
          <div class="annotation-button-container">
            <i data-annotation-id="${id}" class="fas fa-edit edit-annotation-btn"></i>
            <i data-annotation-id="${id}" class="fas fa-trash delete-annotation-btn"></i>
            <i data-annotation-id="${id}" class="fas fa-eye jump-to-btn"></i>
            <i data-annotation-id="${id}" class="fas fa-comment feedback-btn"></i>
          </div>
        </td>
      `;
    }

    return row;
  }

  // Attach a single event listener to the parent container
  parentContainer.addEventListener("click", function (event) {
    const target = event.target;

    // Check if a button with a specific class was clicked
    if (target.classList.contains("save-btn")) {
      saveAnnotations();
      updateSubmissionStatusTrainer(parameterId, 'In Progress');
    } else if (target.classList.contains("submit-btn")) {
      saveAnnotations();
      updateSubmissionStatusTrainer(parameterId, 'Completed');
    }
  });

  // Function to update the submission status through a PUT request
  function updateSubmissionStatusTrainer(submissionId, newStatus) {
    // Make a PUT request to update the status for the submission
    fetch(`http://localhost:8080/api/test/submissions/${submissionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
      credentials: "include",
    })
    .then((response) => {
      if (response.ok) {
        if (newStatus == 'In Progress') {
          // Status updated successfully
          showNotificationMessage('Evaluation saved successfully', 'success');
        } else {
          // Status updated successfully
          showNotificationMessage('Evaluation submitted successfully', 'success');
        }
      } else {
        if (newStatus == 'In Progress') {
          // Handle errors if the request fails
          showNotificationMessage('Failed to save evaluation', 'error');
        } else {
          showNotificationMessage('Failed to submit evaluation', 'error');
        }
      }
    })
    .catch((error) => {
      // Handle network or other errors here
      console.error(`An error occurred while updating the status for submission with ID ${submissionId}:`, error);
    });
  }

  // Additional JavaScript code for handling Save and Submit actions
  function saveAnnotations() {
    const putRequests = annotations.map(annotation => {
      fetch(`http://localhost:8080/api/test/annotations/${annotation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(annotation),
        credentials: "include",
      })
    });

    return Promise.all(putRequests);
  }

  function submitAnnotations() {
    // Perform actions to submit annotations
    console.log('Annotations submitted!');
    // You can add additional logic here based on your requirements
  }

  // Variable to store the drawn annotations
  const drawnAnnotations = new Set();

  // Function to redraw the annotations based on the current time
  function redrawAnnotations(currentTime) {
    drawAnnotation(annotations, currentTime);
  }

  // Function to draw an annotation rectangle on the canvas
  function drawAnnotation(annotations, currentTime) {
    // Draw the filtered annotations on the canvas
    for (const annotation of annotations) {
      const {second, rectangle, color} = annotation;
      const {x, y, width, height} = rectangle;

      // Calculate the time in the video corresponding to the annotation's second
      const timeInSeconds = second;

      if (Math.floor(timeInSeconds) === Math.floor(currentTime)
          && !drawnAnnotations.has(annotation)) {
        // Add the annotation to the drawn annotations set
        drawnAnnotations.add(annotation);
        videoPlayer.pause();
        drawRectangle(x, y, width, height, color);

        // Find the corresponding annotation item
        const annotationId = annotation.id; // Replace 'id' with the actual identifier of the annotation
        const annotationItem = document.querySelector(`tr[data-annotation-id="${annotationId}"]`);

        // Apply a CSS class or inline styling to highlight the annotation item
        annotationItem.classList.add('highlight'); // Add a CSS class
        // OR
        annotationItem.style.backgroundColor = '#3BCC8E'; // Apply inline styling
        annotationItem.style.color = 'white';

        // Set the currently highlighted item to the new annotation item
        highlightedAnnotationItems.push(annotationItem);
      }
    }
  }

  const annotationDropdown = document.getElementById('annotation-dropdown');
  const annotationDescription = document.getElementById(
      'annotation-description');
  const saveAnnotationBtn = document.getElementById('save-annotation-btn');

  saveAnnotationBtn.addEventListener('click', () => {

    if (isUpdatingAnnotation) {
      const description = annotationDescription.value;
      const dropdownValue = annotationDropdown.value;

      // Create the annotation object
      const annotation = {
        description,
        dropdownValue,
      };

      // Send a PUT request to update the annotation
      fetch(`http://localhost:8080/api/test/annotations/${annotationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(annotation),
        credentials: "include",
      })
      .then((response) => {
        if (response.ok) {
          // Annotation saved successfully
          console.log('Annotation updated successfully');

          // Hide the annotation popup
          hideAnnotationPopup();

          // Reset the form fields
          resetForm();

          // Retrieve and populate the updated annotation list
          if (_userId) {
            retrieveAndPopulateAnnotations(videoId, _userId);
          } else {
            retrieveAndPopulateAnnotations();
          }

          isUpdatingAnnotation = false;

          errorMessage.classList.add('hidden');
        } else {
          // Failed to save the annotation
          console.error('Failed to update the annotation');
        }
      })
      .catch((error) => {
        console.error('An error occurred while updating the annotation:',
            error);
      });
    } else {
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

        let color;
        if (parameterId) {
          color = 'blue';
        } else {
          color = 'red';
        }

        // Create the annotation object
        const annotation = [{
          frameNumber,
          second,
          rectangle,
          description,
          dropdownValue,
          videoId,
          color
        }];

        // Send a POST request to save the annotation
        let URL;
        if (parameterId) {
          URL = 'http://localhost:8080/api/test/annotations?id=' + _userId;
        } else {
          URL = 'http://localhost:8080/api/test/annotations';
        }

        fetch(URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(annotation),
          credentials: "include",
        })
        .then((response) => {
          if (response.ok) {
            // Annotation saved successfully
            console.log('Annotation saved successfully');

            // Hide the annotation popup
            hideAnnotationPopup();

            // Reset the form fields
            resetForm();

            // Retrieve and populate the updated annotation list
            if (parameterId) {
              retrieveAndPopulateAnnotations(videoId, _userId);
            } else {
              retrieveAndPopulateAnnotations();
            }

            errorMessage.classList.add('hidden');
          } else {
            // Failed to save the annotation
            console.error('Failed to save the annotation');
          }
        })
        .catch((error) => {
          console.error('An error occurred while saving the annotation:',
              error);
        });
      }
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

  // Event listener for the delete annotation button
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-annotation-btn')) {
      const annotationId = event.target.dataset.annotationId;
      deleteAnnotation(annotationId);
    }
  });

  let isUpdatingAnnotation;

  // Event listener for the delete annotation button
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-annotation-btn')) {
      annotationId = event.target.dataset.annotationId;

      // Find the object with the matching ID
      const foundObject = annotations.find(function (obj) {
        return obj.id === annotationId;
      });

      if (foundObject) {
        // Set custom values to the fields
        annotationDescription.value = foundObject.description;
        annotationDropdown.value = foundObject.dropdownValue;
      }

      isUpdatingAnnotation = true;
      showAnnotationPopup();
    }
  });

  // Function to delete an annotation
  function deleteAnnotation(annotationId) {
    fetch(`http://localhost:8080/api/test/annotations/${annotationId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: "include",
        })
    .then(response => {
      if (response.ok) {
        // Annotation deleted successfully
        console.log('Annotation deleted successfully');

        clearCanvas();

        // Retrieve and populate the updated annotation list
        if (parameterId) {
          retrieveAndPopulateAnnotations(videoId, _userId);
        } else {
          retrieveAndPopulateAnnotations();
        }

      } else {
        // Failed to delete the annotation
        console.error('Failed to delete the annotation');
      }
    })
    .catch(error => {
      console.error('Failed to delete the annotation:', error);
    });
  }

  let _userId;
  if (parameterId) {
    // Example usage:
    const data = await retrieveAndPopulateSubmissionsForTrainer(parameterId);

    const {videoId, userId} = data;
    _userId = userId;

    fetchVideoList(videoId, _userId).then();

    // Update canvas size on initial page load
    updateCanvasSize();

    if (parameterId) {
      // Create a new div for the buttons
      const buttonsContainer = document.createElement("div");
      buttonsContainer.classList.add("centered-buttons-container");

      // Set the HTML content of the buttons container
      buttonsContainer.innerHTML = `
        <button class="annotation-button save-btn">Save</button>
        <button class="annotation-button submit-btn">Submit</button>
      `;

      // Append the buttons container below the table
      parentContainer.appendChild(buttonsContainer);
    }

  } else {
    // Fetch and display the video list
    fetchVideoList().then();

    // Update canvas size on initial page load
    updateCanvasSize();
  }

  function showNotificationMessage(message, type) {
    const notification = document.getElementById('custom-notification');
    notification.textContent = ''; // Clear any previous content

    // Add Font Awesome icon
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle';
    notification.appendChild(icon);

    // Add a space between the icon and text
    notification.appendChild(document.createTextNode(' '));

    // Add the notification message
    const textNode = document.createTextNode(message);
    notification.appendChild(textNode);

    // Set styles
    notification.className = 'notification'; // Reset the class to remove previous styles
    notification.classList.add(type);

    // Show the notification
    notification.style.display = 'block';

    // Remove the notification after a few seconds (adjust the timeout as needed)
    setTimeout(() => {
      notification.textContent = '';
      notification.style.display = 'none'; // Hide the notification
    }, 3000);
  }
});
