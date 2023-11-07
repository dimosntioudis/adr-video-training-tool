function showNotification(message, type) {
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