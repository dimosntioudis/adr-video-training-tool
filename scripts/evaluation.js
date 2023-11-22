document.addEventListener('DOMContentLoaded', async () => {

  const evaluationPopup = document.getElementById('evaluation-popup');
  let annotationId;
  let comment;

  // Event listener for the delete annotation button
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('feedback-btn')) {
      annotationId = event.target.dataset.annotationId;
      comment = event.target.dataset.comment;
      evaluationDescription.value = comment;

      showEvaluationPopup();
    }
  });

  // Function to show the annotation popup
  function showEvaluationPopup() {
    evaluationPopup.classList.remove('hidden');
  }


  function hideEvaluationPopup() {
    evaluationPopup.classList.add('hidden');
  }

  const closeEvalBtn = document.getElementById('close-evaluation-popup-btn');

  // Event listener for the close button
  closeEvalBtn.addEventListener('click', () => {
    hideEvaluationPopup();
  });

  const saveEvalBtn = document.getElementById('save-evaluation-btn');
  const evaluationDescription = document.getElementById(
      'evaluation-description');

  saveEvalBtn.addEventListener('click', () => {
    const comment = evaluationDescription.value;

    // Create the annotation object
    const annotation = {
      comment
    };

    // Send a PUT request to update the annotation
    fetch(apiUrl + `api/test/annotations/${annotationId}`, {
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
        hideEvaluationPopup();

        // Reset the form fields
        resetEvalForm();
      } else {
        // Failed to save the annotation
        console.error('Failed to update the annotation');
      }
    })
    .catch((error) => {
      console.error('An error occurred while updating the annotation:',
          error);
    });
  });

  function resetEvalForm() {
    const evaluationDescription = document.getElementById(
        'evaluation-description');

    // Reset the form fields to their initial values
    evaluationDescription.value = '';
  }
});