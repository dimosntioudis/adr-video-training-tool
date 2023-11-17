document.addEventListener('DOMContentLoaded', () => {
  // Function to retrieve and populate the annotation list
  function retrieveAndPopulateSubmissions(status) {
    fetch(apiUrl + `api/test/submissions?status=${status}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: "include"
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch user submissions');
      }

      // Check if the response has no content (empty)
      if (response.status === 204) {
        return [];
      }

      return response.json();
    })
    .then(data => {
      // Populate the annotation list
      populateSubmissionList(status, data);
    })
    .catch(error => {
      console.error('Failed to retrieve submissions:', error);
    });
  }

  // Function to populate the annotation list
  function populateSubmissionList(status, submissions) {
    if (status == 'Submitted') {
      const submissionList = document.getElementById('submission-list');
      submissionList.innerHTML = '';

      submissions.forEach(submission => {
        const item = createSubmissionItem(submission);
        submissionList.appendChild(item);
      });
    }

    if (status == 'In Progress') {
      const submissionReviewedList = document.getElementById(
          'submission-reviewed-list');
      submissionReviewedList.innerHTML = '';

      submissions.forEach(submission => {
        const item = createSubmissionItem(submission);
        submissionReviewedList.appendChild(item);
      });
    }

    if (status == 'Completed') {
      const submissionCompletedList = document.getElementById(
          'submission-completed-list');
      submissionCompletedList.innerHTML = '';

      submissions.forEach(submission => {
        const item = createSubmissionItem(submission);
        submissionCompletedList.appendChild(item);
      });
    }

    if (status == '') {
      const submissionCompletedList = document.getElementById(
          'submission-list');
      submissionCompletedList.innerHTML = '';

      submissions.forEach(submission => {
        const item = createSubmissionItem(submission);
        submissionCompletedList.appendChild(item);
      });
    }
  }

  // Function to generate an annotation row in the table
  function createSubmissionItem(submission) {
    const {
      firstName,
      lastName,
      videoTitle,
      status,
      id,
      evaluation,
      annotationIds
    } = submission;
    const annotationCount = annotationIds.length;
    const row = document.createElement('tr');
    row.classList.add('submission-row');
    row.setAttribute('data-submission-id', id);
    row.innerHTML = `
    <td>${firstName}</td>
    <td>${lastName}</td>
    <td>${videoTitle}</td>
    <td>${annotationCount}</td>
    <td>
      <select class="status-select" data-submission-id="${id}">
        <option value="Submitted" ${status === 'Submitted' ? 'selected' : ''}>Submitted</option>
        <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
      </select>
    </td>
    <td>${evaluation}</td>
    <td>
      <div class="submission-button-container">
        <i data-submission-id="${id}" class="fas fa-floppy-disk update-submission-btn"></i>
        <i data-annotation-id="${id}" class="fas fa-eye evaluate-submission-btn"></i>
      </div>
    </td>
  `;
    return row;
  }

  // Event listener for the delete annotation button
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('evaluate-submission-btn')) {
      const id = event.target.dataset.annotationId;
      window.location.href = "../main/evaluation.html?id=" + encodeURIComponent(id);
    }
  });

  retrieveAndPopulateSubmissions('Submitted');
  retrieveAndPopulateSubmissions('In Progress');
  retrieveAndPopulateSubmissions('Completed');


  // Add an event listener to the update-submission-btn elements to handle updates
  document.addEventListener('click', function (event) {
    if (event.target.classList.contains('update-submission-btn')) {
      const submissionId = event.target.getAttribute('data-submission-id');
      const selectElement = document.querySelector(`.status-select[data-submission-id="${submissionId}"]`);
      const newStatus = selectElement.value;

      // Make a PUT request to update the status for the submission
      updateSubmissionStatus(submissionId, newStatus);

      retrieveAndPopulateSubmissions('Submitted');
      retrieveAndPopulateSubmissions('In Progress');
      retrieveAndPopulateSubmissions('Completed');
    }
  });

  // Function to update the submission status through a PUT request
  function updateSubmissionStatus(submissionId, newStatus) {
    // Make a PUT request to update the status for the submission
    fetch(apiUrl + `api/test/submissions/${submissionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
      credentials: "include",
    })
    .then((response) => {
      if (response.ok) {
        // Status updated successfully
        showNotification('Status updated successfully', 'success');
        console.log(`Status for submission with ID ${submissionId} updated to ${newStatus}`);
      } else {
        // Handle errors if the request fails
        showNotification('Failed to update status', 'error');
        console.error(`Failed to update the status for submission with ID ${submissionId}`);
      }
    })
    .catch((error) => {
      // Handle network or other errors here
      console.error(`An error occurred while updating the status for submission with ID ${submissionId}:`, error);
    });
  }
});