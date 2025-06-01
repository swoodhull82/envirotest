import * as dataService from './dataService.js';
import { getElement, getStatusClasses } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {

  async function fetchAndProcessReminders() {
    try {
      await dataService.fetchData(); // Ensure data is loaded
      const documents = await dataService.getDocuments();

      if (!Array.isArray(documents)) {
        console.error('Invalid data structure: documents is not an array.');
        displayErrorMessage('Failed to load document data for reminders.');
        return;
      }

      processDocumentsForReminders(documents);

    } catch (error) {
      console.error('Error fetching reminder data via dataService:', error);
      displayErrorMessage('Error loading reminder data. Please try again later.');
    }
  }

  function processDocumentsForReminders(docs) {
    if (!docs || docs.length === 0) {
      // Display no tasks if docs array is empty or undefined
      displayReminderTasks('overdueTasksContainer', 'Overdue Tasks', []);
      displayReminderTasks('dueSoonTasksContainer', 'Tasks Due Soon (next 7 days)', []);
      // Optionally, display a general "No documents to process" message
      // displayErrorMessage('No documents available to process for reminders.');
      return;
    }

    const overdueTasks = [];
    const dueSoonTasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7); // Inclusive of today, so up to 7 days ahead

    docs.forEach(doc => {
      if (doc.status === 'Completed') {
        return; // Ignore completed tasks
      }

      // Document object from dataService already contains title, reviewerName, dueDate, status
      const taskForReminder = {
        title: doc.title,
        reviewer: doc.reviewerName || "Unassigned",
        dueDate: doc.dueDate,
        status: doc.status,
        id: doc.id // Keep id if needed later
      };

      const dueDate = new Date(taskForReminder.dueDate);
      dueDate.setHours(0, 0, 0, 0); // Normalize due date to midnight

      if (dueDate < today) {
        overdueTasks.push(taskForReminder);
      } else if (dueDate >= today && dueDate <= sevenDaysFromNow) {
        dueSoonTasks.push(taskForReminder);
      }
    });

    // console.log('Overdue Tasks (from documents):', overdueTasks); // Removed for cleanup
    // console.log('Due Soon Tasks (from documents):', dueSoonTasks); // Removed for cleanup
    
    displayReminderTasks('overdueTasksContainer', 'Overdue Tasks', overdueTasks);
    displayReminderTasks('dueSoonTasksContainer', 'Tasks Due Soon (next 7 days)', dueSoonTasks);
  }

  /**
   * Creates a list item element for a reminder task.
   * @param {Object} task - The task object.
   * @returns {HTMLLIElement} The created list item element.
   */
  function createReminderListItem(task) {
    const li = document.createElement('li');
    li.className = 'p-3 border border-gray-300 rounded-lg shadow-sm bg-white';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    let effectiveStatus = task.status;
    if (task.status !== 'Completed' && dueDate < today) {
      effectiveStatus = 'Overdue';
    }

    const statusStyle = getStatusClasses(effectiveStatus);
    const statusColorClass = statusStyle.text + (effectiveStatus === 'Overdue' || effectiveStatus === 'In Progress' ? ' font-semibold' : '');

    li.innerHTML = `
      <h3 class="text-lg font-medium text-[#0c1c17]">${task.title}</h3>
      <p class="text-sm text-gray-600">Assigned to: <span class="font-medium text-[#46a080]">${task.reviewer}</span></p>
      <p class="text-sm text-gray-600">Due Date: <span class="font-medium">${task.dueDate}</span></p>
      <p class="text-sm">Status: <span class="${statusColorClass}">${effectiveStatus}</span></p>
    `;
    return li;
  }

  function displayReminderTasks(containerId, title, tasks) {
    const container = getElement(containerId); // Use getElement
    if (!container) {
      console.error(`Container with ID '${containerId}' not found.`);
      return;
    }
    container.innerHTML = ''; // Clear previous content

    const heading = document.createElement('h2');
    heading.textContent = title;
    heading.className = 'text-xl font-semibold text-[#0c1c17] mb-3';
    container.appendChild(heading);

    if (!tasks || tasks.length === 0) {
      const noTasksMessage = document.createElement('p');
      noTasksMessage.textContent = 'No tasks in this category.';
      noTasksMessage.className = 'text-gray-500';
      container.appendChild(noTasksMessage);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'space-y-3';
    tasks.forEach(task => {
      ul.appendChild(createReminderListItem(task)); // Use helper
    });
    container.appendChild(ul);
  }

  function displayErrorMessage(message) {
    // This function could display the error message in a designated area on reminders.html
    // For now, it will log to console and potentially update a general error div if it exists.
    console.error(message);
    const errorContainer = getElement('remindersErrorContainer'); // Use getElement
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.className = 'text-red-500 p-4 text-center';
    } else {
        // If no specific error container, perhaps create one in a default location or just log.
        // For this task, we'll ensure the containers for tasks show an error or empty state.
        const overdueContainer = getElement('overdueTasksContainer'); // Use getElement
        const dueSoonContainer = getElement('dueSoonTasksContainer'); // Use getElement
        if(overdueContainer) overdueContainer.innerHTML = `<h2 class="text-xl font-semibold text-[#0c1c17] mb-3">Overdue Tasks</h2><p class="text-red-500">${message}</p>`;
        if(dueSoonContainer) dueSoonContainer.innerHTML = `<h2 class="text-xl font-semibold text-[#0c1c17] mb-3">Tasks Due Soon (next 7 days)</h2><p class="text-red-500">${message}</p>`;
    }
  }

  fetchAndProcessReminders();
});
