document.addEventListener('DOMContentLoaded', () => {
  // Function to retrieve and populate the annotation list
  function retrieveAndPopulateSubmissions() {
    fetch(apiUrl + `api/test/submissions`, {
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
    <td>${status}</td>
    <td>${evaluation}</td>
    <td>
      <div class="user-button-container">
        <i data-submission-id="${id}" class="fas fa-trash delete-user-btn"></i>
      </div>
    </td>
  `;
    return row;
  }

  // Function to retrieve and populate the annotation list
  function retrieveAndPopulateUserProfiles() {
    fetch(apiUrl + 'api/test/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: "include"
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch user profiles');
      }

      // Check if the response has no content (empty)
      if (response.status === 204) {
        return [];
      }

      return response.json();
    })
    .then(data => {
      // Populate the annotation list
      populateUserList(data);
    })
    .catch(error => {
      console.error('Failed to retrieve user profiles:', error);
    });
  }

  // Function to populate the annotation list
  function populateUserList(users) {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    users.forEach(user => {
      const item = createUserItem(user);
      userList.appendChild(item);
    });
  }

  // Function to generate an annotation row in the table
  function createUserItem(user) {
    const {
      id,
      username,
      firstname,
      lastname,
      email,
      country,
      roles
    } = user;

    const roleNames = roles.map(role => role.name);
    const rolesString = roleNames.join(', ');

    const row = document.createElement('tr');
    row.classList.add('user-row');
    row.setAttribute('data-user-id', id);
    row.innerHTML = `
    <td>${username}</td>
    <td>${rolesString}</td>
    <td>${firstname}</td>
    <td>${lastname}</td>
    <td>${email}</td>
    <td>${country}</td>
    <td>
      <div class="user-button-container">
        <i data-submission-id="${id}" class="fas fa-trash delete-user-btn"></i>
      </div>
    </td>
  `;
    return row;
  }

  retrieveAndPopulateSubmissions();
  retrieveAndPopulateUserProfiles();
});