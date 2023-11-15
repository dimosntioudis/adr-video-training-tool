document.addEventListener('DOMContentLoaded', () => {
  // Function to retrieve and populate the annotation list
  function retrieveAndPopulateSubmissions() {
    fetch(`http://localhost:8080/api/test/submissions`, {
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
      populateSubmissionList(data);
    })
    .catch(error => {
      console.error('Failed to retrieve submissions:', error);
    });
  }

  // Function to populate the annotation list
  function populateSubmissionList(submissions) {
    const submissionList = document.getElementById('submission-list');
    submissionList.innerHTML = '';

    submissions.forEach(submission => {
      const item = createSubmissionItem(submission);
      submissionList.appendChild(item);
    });
  }

  // Function to generate an annotation row in the table
  function createSubmissionItem(submission) {
    const {videoTitle, status, id, evaluation, annotationIds} = submission;
    const annotationCount = annotationIds.length;
    const row = document.createElement('tr');
    row.classList.add('submission-row');
    row.setAttribute('data-submission-id', id);
    row.innerHTML = `
    <td>${videoTitle}</td>
    <td>${annotationCount}</td>
    <td>${status}</td>
    <td>${evaluation}</td>
    <td>
      <div class="submission-button-container">
        <i data-submission-id="${id}" class="fas fa-trash delete-submission-btn"></i>
        <i data-submission-id="${id}" class="fas fa-download export-submission-btn"></i>
      </div>
    </td>
  `;
    return row;
  }

  // Event listener for the delete annotation button
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-submission-btn')) {
      const submissionId = event.target.dataset.submissionId;
      deleteSubmission(submissionId);
    }
  });

  // Function to delete an annotation
  function deleteSubmission(submissionId) {
    fetch(`http://localhost:8080/api/test/submissions/${submissionId}`,
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
        console.log('Submission deleted successfully');
        retrieveAndPopulateSubmissions();
      } else {
        // Failed to delete the annotation
        console.error('Failed to delete the submission');
      }
    })
    .catch(error => {
      console.error('Failed to delete the submission:', error);
    });
  }

  // Function to get the parameter from the URL
  function getParameterByName(name) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(name);
  }

  // Retrieve the ID parameter value
  const id = getParameterByName("id");

  if (id) {

  } else {
    retrieveAndPopulateSubmissions();
  }
});