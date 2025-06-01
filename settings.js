import * as dataService from './dataService.js';
import { getElement, populateSelectWithOptions } from './utils.js'; // Assuming populateSelectWithOptions is in utils.js

document.addEventListener('DOMContentLoaded', async () => {
  // Existing settings elements
  const emailNotificationsCheckbox = getElement('emailNotifications');
  const defaultViewSelect = getElement('defaultView');
  const saveSettingsBtn = getElement('saveSettingsBtn');
  // const settingsForm = getElement('settingsForm'); // Not strictly used by event listeners directly

  // Check if original setting elements are present
  if (!emailNotificationsCheckbox) {
    console.error('Email notifications checkbox (emailNotifications) not found!');
  }
  if (!defaultViewSelect) {
    console.error('Default view select (defaultView) not found!');
  }
  if (!saveSettingsBtn) {
    console.error('Save settings button (saveSettingsBtn) not found!');
  }

  // Reviewer Management DOM Elements
  const addReviewerForm = getElement('addReviewerForm');
  const newReviewerNameInput = getElement('newReviewerName');
  const removeReviewerSelect = getElement('removeReviewerSelect');
  const removeReviewerButton = getElement('removeReviewerButton');
  const addReviewerMessage = getElement('addReviewerMessage');
  const removeReviewerMessage = getElement('removeReviewerMessage');

  // Null checks for reviewer management elements
  if (!addReviewerForm) console.error('Add Reviewer Form (addReviewerForm) not found!');
  if (!newReviewerNameInput) console.error('New Reviewer Name Input (newReviewerName) not found!');
  if (!removeReviewerSelect) console.error('Remove Reviewer Select (removeReviewerSelect) not found!');
  if (!removeReviewerButton) console.error('Remove Reviewer Button (removeReviewerButton) not found!');
  if (!addReviewerMessage) console.error('Add Reviewer Message area (addReviewerMessage) not found!');
  if (!removeReviewerMessage) console.error('Remove Reviewer Message area (removeReviewerMessage) not found!');

  // Function to load existing settings (placeholder - sets default values)
  function loadSettings() {
    if (emailNotificationsCheckbox) {
      emailNotificationsCheckbox.checked = true;
    }
    if (defaultViewSelect) {
      defaultViewSelect.value = 'compact';
    }
    // console.log('Default settings loaded into UI.'); // Removed for cleanup
  }

  // Event listener for the original save settings button
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const currentSettings = {};
      if (emailNotificationsCheckbox) {
        currentSettings.email = emailNotificationsCheckbox.checked;
      }
      if (defaultViewSelect) {
        currentSettings.view = defaultViewSelect.value;
      }
      // console.log('Saving settings:', currentSettings); // Removed for cleanup
      alert('Settings saved (logged to console)!');
    });
  }
  
  // --- Reviewer Management Logic ---

  async function populateRemoveReviewerDropdown() {
    if (!removeReviewerSelect) return;
    try {
        const users = await dataService.getUsers();
        // Configure populateSelectWithOptions for users
        // The `items` key in the config object should be the array of users.
        // `valueField` and `textField` tell the function which properties of each user object to use.
        // `initialUnselectedText` provides the text for the first, disabled option.
        populateSelectWithOptions(removeReviewerSelect, {
            items: users,
            valueField: 'id', // Assumes user objects have an 'id' property
            textField: 'name', // Assumes user objects have a 'name' property
            initialUnselected: { value: "", text: "Select Reviewer" } // Creates a disabled "Select Reviewer" option
        });
        if (removeReviewerMessage) removeReviewerMessage.textContent = '';
    } catch (error) {
        console.error('Error populating remove reviewer dropdown:', error);
        if (removeReviewerMessage) {
            removeReviewerMessage.textContent = 'Error loading reviewers.';
            removeReviewerMessage.className = 'text-red-500 text-sm mt-2';
        }
    }
  }

  if (addReviewerForm) {
    addReviewerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!newReviewerNameInput || !addReviewerMessage) return;

        const newReviewerName = newReviewerNameInput.value.trim();
        if (!newReviewerName) {
            addReviewerMessage.textContent = 'Please enter a reviewer name.';
            addReviewerMessage.className = 'text-red-500 text-sm mt-2';
            return;
        }

        try {
            const existingUsers = await dataService.getUsers();
            if (existingUsers.some(user => user.name.toLowerCase() === newReviewerName.toLowerCase())) {
                addReviewerMessage.textContent = 'A reviewer with this name already exists.';
                addReviewerMessage.className = 'text-red-500 text-sm mt-2';
                return;
            }

            await dataService.addUser({ name: newReviewerName });
            addReviewerMessage.textContent = `Reviewer "${newReviewerName}" added successfully.`;
            addReviewerMessage.className = 'text-green-500 text-sm mt-2';
            newReviewerNameInput.value = ''; // Clear input field
            await populateRemoveReviewerDropdown();
        } catch (error) {
            console.error('Error adding reviewer:', error);
            addReviewerMessage.textContent = 'Failed to add reviewer.';
            addReviewerMessage.className = 'text-red-500 text-sm mt-2';
        }
    });
  }

  if (removeReviewerButton) {
    removeReviewerButton.addEventListener('click', async () => {
        if (!removeReviewerSelect || !removeReviewerMessage) return;

        const reviewerIdToRemove = removeReviewerSelect.value;
        if (!reviewerIdToRemove) {
            removeReviewerMessage.textContent = 'Please select a reviewer to remove.';
            removeReviewerMessage.className = 'text-red-500 text-sm mt-2';
            return;
        }

        // Optional: Add a confirmation dialog
        if (!confirm(`Are you sure you want to remove reviewer "${removeReviewerSelect.options[removeReviewerSelect.selectedIndex].text}"? This will also unassign them from any documents.`)) {
            return;
        }

        try {
            const removedUser = await dataService.removeUser(reviewerIdToRemove);
            if (removedUser) {
                removeReviewerMessage.textContent = `Reviewer "${removedUser.name}" removed successfully.`;
                removeReviewerMessage.className = 'text-green-500 text-sm mt-2';
            } else {
                removeReviewerMessage.textContent = 'Reviewer not found or already removed.';
                removeReviewerMessage.className = 'text-yellow-500 text-sm mt-2';
            }
            await populateRemoveReviewerDropdown();
        } catch (error) {
            console.error('Error removing reviewer:', error);
            removeReviewerMessage.textContent = 'Failed to remove reviewer.';
            removeReviewerMessage.className = 'text-red-500 text-sm mt-2';
        }
    });
  }
    }
  }
});
