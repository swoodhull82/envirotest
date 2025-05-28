document.addEventListener('DOMContentLoaded', () => {
  const assignmentsTableContainer = document.getElementById('assignmentsTableContainer');

  if (!assignmentsTableContainer) {
    console.error('Assignments table container (assignmentsTableContainer) not found!');
    return;
  }

  async function fetchAndDisplayAssignments() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.employees || !Array.isArray(data.employees)) {
        console.error('Invalid data structure: employees array not found.');
        assignmentsTableContainer.innerHTML = '<p class="text-red-500 p-4">Error: Employee data is missing or invalid.</p>';
        return;
      }

      const allAssignedTasks = [];
      data.employees.forEach(employee => {
        if (employee.assigned_tasks && Array.isArray(employee.assigned_tasks)) {
          employee.assigned_tasks.forEach(task => {
            allAssignedTasks.push({
              title: task.title,
              employeeName: employee.name,
              type: task.type,
              dueDate: task.dueDate,
              status: task.status
            });
          });
        }
      });

      renderAssignmentsTable(allAssignedTasks);

    } catch (error) {
      console.error('Error fetching assignment data:', error);
      assignmentsTableContainer.innerHTML = '<p class="text-red-500 p-4">Error loading assignment data. Please try again later.</p>';
    }
  }

  function renderAssignmentsTable(tasks) {
    assignmentsTableContainer.innerHTML = ''; // Clear previous content

    if (!tasks || tasks.length === 0) {
      const noTasksMessage = document.createElement('p');
      noTasksMessage.textContent = 'No assignments found.';
      noTasksMessage.className = 'text-gray-500 p-4';
      assignmentsTableContainer.appendChild(noTasksMessage);
      return;
    }

    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-300 border border-gray-300 bg-white shadow-sm rounded-lg';

    // Table Header
    const thead = document.createElement('thead');
    thead.className = 'bg-[#e6f4ef]'; // Light green background for header
    const headerRow = document.createElement('tr');
    const headers = ['Task Title', 'Assigned To', 'Type', 'Due Date', 'Status'];
    headers.forEach(headerText => {
      const th = document.createElement('th');
      th.textContent = headerText;
      th.className = 'px-4 py-3 text-left text-xs font-medium text-[#0c1c17] uppercase tracking-wider';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Table Body
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    tasks.forEach(task => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50'; // Hover effect for rows

      const titleCell = document.createElement('td');
      titleCell.textContent = task.title;
      titleCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-gray-700';
      row.appendChild(titleCell);

      const employeeCell = document.createElement('td');
      employeeCell.textContent = task.employeeName;
      employeeCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-[#46a080]'; // Greenish text for employee
      row.appendChild(employeeCell);

      const typeCell = document.createElement('td');
      typeCell.textContent = task.type;
      typeCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-gray-500';
      row.appendChild(typeCell);

      const dueDateCell = document.createElement('td');
      dueDateCell.textContent = task.dueDate;
      dueDateCell.className = 'px-4 py-3 whitespace-nowrap text-sm text-gray-500';
      row.appendChild(dueDateCell);

      const statusCell = document.createElement('td');
      const statusSpan = document.createElement('span');
      statusSpan.textContent = task.status;
      statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';

      // Conditional styling for status (similar to dashboard/reminders)
      if (task.status === 'Overdue' || (new Date(task.dueDate) < new Date() && task.status !== 'Completed')) {
        statusSpan.classList.add('bg-red-100', 'text-red-800');
      } else if (task.status === 'In Progress') {
        statusSpan.classList.add('bg-yellow-100', 'text-yellow-800');
      } else if (task.status === 'Completed') {
        statusSpan.classList.add('bg-green-100', 'text-green-800');
      } else { // Not Started or other statuses
        statusSpan.classList.add('bg-blue-100', 'text-blue-800');
      }
      statusCell.appendChild(statusSpan);
      statusCell.className = 'px-4 py-3 whitespace-nowrap text-sm';
      row.appendChild(statusCell);

      tbody.appendChild(row);
    });
    table.appendChild(tbody);

    assignmentsTableContainer.appendChild(table);
  }

  // Initial call to fetch and display data
  fetchAndDisplayAssignments();
});
