document.addEventListener('DOMContentLoaded', () => {
  let appEmployees = []; // To store employee data locally

  async function fetchRemindersData() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.employees || !Array.isArray(data.employees)) {
        console.error('Invalid data structure: employees array not found.');
        displayErrorMessage('Failed to load employee data.');
        return;
      }
      appEmployees = data.employees;
      console.log('Employee data loaded:', appEmployees);
      processTasksForReminders();
    } catch (error) {
      console.error('Error fetching reminder data:', error);
      displayErrorMessage('Error loading reminder data. Please try again later.');
    }
  }

  function processTasksForReminders() {
    if (!appEmployees || appEmployees.length === 0) {
      displayErrorMessage('No employee data available to process tasks.');
      return;
    }

    const overdueTasks = [];
    const dueSoonTasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to midnight

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7); // Inclusive of today, so up to 7 days ahead

    appEmployees.forEach(employee => {
      if (employee.assigned_tasks && Array.isArray(employee.assigned_tasks)) {
        employee.assigned_tasks.forEach(task => {
          if (task.status === 'Completed') {
            return; // Ignore completed tasks
          }

          const taskWithReviewer = { ...task, reviewer: employee.name };
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0); // Normalize due date to midnight

          if (dueDate < today) {
            overdueTasks.push(taskWithReviewer);
          } else if (dueDate >= today && dueDate <= sevenDaysFromNow) {
            // Due today or within the next 7 days
            dueSoonTasks.push(taskWithReviewer);
          }
        });
      }
    });

    console.log('Overdue Tasks:', overdueTasks);
    console.log('Due Soon Tasks:', dueSoonTasks);
    
    // Call display functions (to be fully implemented)
    displayReminderTasks('overdueTasksContainer', 'Overdue Tasks', overdueTasks);
    displayReminderTasks('dueSoonTasksContainer', 'Tasks Due Soon (next 7 days)', dueSoonTasks);
  }

  function displayReminderTasks(containerId, title, tasks) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID '${containerId}' not found.`);
      return;
    }
    container.innerHTML = ''; // Clear previous content

    const heading = document.createElement('h2');
    heading.textContent = title;
    heading.className = 'text-xl font-semibold text-[#0c1c17] mb-3'; // Tailwind classes
    container.appendChild(heading);

    if (!tasks || tasks.length === 0) {
      const noTasksMessage = document.createElement('p');
      noTasksMessage.textContent = 'No tasks in this category.';
      noTasksMessage.className = 'text-gray-500';
      container.appendChild(noTasksMessage);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'space-y-3'; // Tailwind classes for spacing between list items
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'p-3 border border-gray-300 rounded-lg shadow-sm bg-white'; // Tailwind classes for card-like items
      
      let statusColorClass = 'text-gray-600';
      if (task.status === 'Overdue' || new Date(task.dueDate) < new Date()) {
         statusColorClass = 'text-red-600 font-semibold';
      } else if (task.status === 'In Progress') {
         statusColorClass = 'text-yellow-600 font-semibold';
      } else if (task.status === 'Not Started') {
         statusColorClass = 'text-blue-600';
      }


      li.innerHTML = `
        <h3 class="text-lg font-medium text-[#0c1c17]">${task.title}</h3>
        <p class="text-sm text-gray-600">Assigned to: <span class="font-medium text-[#46a080]">${task.reviewer}</span></p>
        <p class="text-sm text-gray-600">Due Date: <span class="font-medium">${task.dueDate}</span></p>
        <p class="text-sm">Status: <span class="${statusColorClass}">${task.status}</span></p>
      `;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  function displayErrorMessage(message) {
    // This function could display the error message in a designated area on reminders.html
    // For now, it will log to console and potentially update a general error div if it exists.
    console.error(message);
    const errorContainer = document.getElementById('remindersErrorContainer'); // Assuming such a div might exist
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.className = 'text-red-500 p-4 text-center';
    } else {
        // If no specific error container, perhaps create one in a default location or just log.
        // For this task, we'll ensure the containers for tasks show an error or empty state.
        const overdueContainer = document.getElementById('overdueTasksContainer');
        const dueSoonContainer = document.getElementById('dueSoonTasksContainer');
        if(overdueContainer) overdueContainer.innerHTML = `<p class="text-red-500">${message}</p>`;
        if(dueSoonContainer) dueSoonContainer.innerHTML = ''; // Clear other container
    }
  }

  fetchRemindersData();
});
