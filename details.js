document.addEventListener('DOMContentLoaded', () => {
  const taskDetailsContainer = document.getElementById('taskDetailsContainer');

  if (!taskDetailsContainer) {
    console.error('Task details container (taskDetailsContainer) not found!');
    return;
  }

  function getTaskIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('taskId');
  }

  async function fetchAndDisplayTaskDetails() {
    const taskId = getTaskIdFromURL();

    if (!taskId) {
      taskDetailsContainer.innerHTML = '<p class="text-red-500 p-4">No task ID provided in URL. Please ensure the URL is in the format: document_review_details.html?taskId=YOUR_TASK_ID</p>';
      return;
    }

    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.employees || !Array.isArray(data.employees)) {
        console.error('Invalid data structure: employees array not found.');
        taskDetailsContainer.innerHTML = '<p class="text-red-500 p-4">Error: Invalid data structure in source file.</p>';
        return;
      }

      let foundTask = null;
      let assignedEmployeeName = '';

      for (const employee of data.employees) {
        if (employee.assigned_tasks && Array.isArray(employee.assigned_tasks)) {
          const task = employee.assigned_tasks.find(t => t.task_id === taskId);
          if (task) {
            foundTask = task;
            assignedEmployeeName = employee.name;
            break;
          }
        }
      }

      if (foundTask) {
        taskDetailsContainer.innerHTML = ''; // Clear previous content

        // Helper to create styled detail paragraphs
        const createDetailElement = (label, value, valueClasses = 'text-gray-700') => {
          const p = document.createElement('p');
          p.className = 'mb-2'; // Spacing between details
          const strong = document.createElement('strong');
          strong.className = 'text-[#0c1c17] font-semibold';
          strong.textContent = `${label}: `;
          p.appendChild(strong);
          
          const span = document.createElement('span');
          span.textContent = value;
          span.className = valueClasses;
          p.appendChild(span);
          
          taskDetailsContainer.appendChild(p);
        };
        
        // Determine status color
        let statusColorClass = 'text-gray-700';
        if (foundTask.status === 'Overdue' || (new Date(foundTask.dueDate) < new Date() && foundTask.status !== 'Completed')) {
            statusColorClass = 'text-red-600 font-semibold';
        } else if (foundTask.status === 'In Progress') {
            statusColorClass = 'text-yellow-600 font-semibold';
        } else if (foundTask.status === 'Completed') {
            statusColorClass = 'text-green-600 font-semibold';
        } else { // Not Started or other statuses
            statusColorClass = 'text-blue-600';
        }


        createDetailElement('Task Title', foundTask.title);
        createDetailElement('Assigned To', assignedEmployeeName, 'text-[#46a080] font-medium');
        createDetailElement('Type', foundTask.type);
        createDetailElement('Due Date', foundTask.dueDate);
        createDetailElement('Status', foundTask.status, statusColorClass);
        createDetailElement('Description', 'No description available for this task yet.', 'text-gray-500 italic'); // Placeholder

      } else {
        taskDetailsContainer.innerHTML = `<p class="text-orange-500 p-4">Task with ID "${taskId}" not found.</p>`;
      }

    } catch (error) {
      console.error('Error fetching task details:', error);
      taskDetailsContainer.innerHTML = '<p class="text-red-500 p-4">Error loading task details. Please try again later.</p>';
    }
  }

  // Initial call to fetch and display data
  fetchAndDisplayTaskDetails();
});
