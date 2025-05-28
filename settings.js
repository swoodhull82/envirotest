document.addEventListener('DOMContentLoaded', () => {
  const emailNotificationsCheckbox = document.getElementById('emailNotifications');
  const defaultViewSelect = document.getElementById('defaultView');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const settingsForm = document.getElementById('settingsForm'); // Get the form

  // Check if all elements are present
  if (!settingsForm) {
    console.error('Settings form (settingsForm) not found!');
    return;
  }
  if (!emailNotificationsCheckbox) {
    console.error('Email notifications checkbox (emailNotifications) not found!');
    // Optionally, disable parts of the script or show a general error message
  }
  if (!defaultViewSelect) {
    console.error('Default view select (defaultView) not found!');
  }
  if (!saveSettingsBtn) {
    console.error('Save settings button (saveSettingsBtn) not found!');
  }

  // Function to load settings (placeholder - sets default values)
  function loadSettings() {
    if (emailNotificationsCheckbox) {
      emailNotificationsCheckbox.checked = true; // Default: email notifications enabled
    }
    if (defaultViewSelect) {
      defaultViewSelect.value = 'compact'; // Default: compact view
    }
    console.log('Default settings loaded into UI.');
  }

  // Event listener for the save settings button
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      // In a real form, you'd likely preventDefault if the button was type="submit"
      // For a type="button", it's not strictly necessary but good practice if it were part of a form submission.

      const currentSettings = {};
      if (emailNotificationsCheckbox) {
        currentSettings.email = emailNotificationsCheckbox.checked;
      }
      if (defaultViewSelect) {
        currentSettings.view = defaultViewSelect.value;
      }

      console.log('Saving settings:', currentSettings);
      alert('Settings saved (logged to console)!');
      
      // In a real application, you would save these settings to localStorage or a backend.
      // localStorage.setItem('userSettings', JSON.stringify(currentSettings));
    });
  }
  
  // Call loadSettings on DOM load
  loadSettings();
});
