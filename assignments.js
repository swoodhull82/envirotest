import * as dataService from './dataService.js';
import { getElement, getStatusClasses } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const assignmentsTableContainer = getElement('assignmentsTableContainer');

  if (!assignmentsTableContainer) {
    console.error('Assignments table container (assignmentsTableContainer) not found!');
    return;
  }

  async function fetchAndDisplayAssignments() {
    try {
      await dataService.fetchData(); // Ensure data is loaded
      const documents = await dataService.getDocuments();

      if (!Array.isArray(documents)) {
        console.error('Invalid data structure: documents is not an array.');
        assignmentsTableContainer.innerHTML = '<p class="text-red-500 p-4">Error: Document data is missing or invalid.</p>';
        return;
      }

      // Transform documents to the structure expected by renderAssignmentsTable
      // Documents already have reviewerName, title, dueDate, status, type
      const tasksForTable = documents.map(doc => ({
        title: doc.title,
        employeeName: doc.reviewerName || "Unassigned", // Use reviewerName from document
        type: doc.type || "General", // Assuming a default type if not present
        dueDate: doc.dueDate,
        status: doc.status
      }));

      renderAssignmentsTable(tasksForTable);

    } catch (error) {
      console.error('Error fetching assignment data via dataService:', error);
      assignmentsTableContainer.innerHTML = '<p class="text-red-500 p-4">Error loading assignment data. Please try again later.</p>';
    }
  }

  /**
   * Creates a table row element for an assignment task.
   * @param {Object} task - The task object containing details like title, employeeName, type, dueDate, and status.
   * @returns {HTMLTableRowElement} The created table row element.
   */
  function createAssignmentRow(task) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50'; // Hover effect for rows

    // Helper to create a td cell
    const createCell = (text, className) => {
      const cell = document.createElement('td');
      cell.textContent = text;
      cell.className = `px-4 py-3 whitespace-nowrap text-sm ${className}`;
      return cell;
    };

    row.appendChild(createCell(task.title, 'text-gray-700'));
    row.appendChild(createCell(task.employeeName, 'text-[#46a080]')); // Greenish text for employee
    row.appendChild(createCell(task.type, 'text-gray-500'));
    row.appendChild(createCell(task.dueDate, 'text-gray-500'));

    // Status cell
    const statusCell = document.createElement('td');
    statusCell.className = 'px-4 py-3 whitespace-nowrap text-sm';
    const statusSpan = document.createElement('span');
    statusSpan.className = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    let effectiveStatus = task.status;
    if (task.status !== 'Completed' && dueDate < today) {
      effectiveStatus = 'Overdue';
    }

    const statusStyle = getStatusClasses(effectiveStatus);
    statusSpan.classList.add(...statusStyle.full);
    statusSpan.textContent = effectiveStatus; // Always display the effective status

    statusCell.appendChild(statusSpan);
    row.appendChild(statusCell);

    return row;
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
    thead.className = 'bg-[#e6f4ef]';
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
      tbody.appendChild(createAssignmentRow(task)); // Use helper to create and append row
    });
    table.appendChild(tbody);

    assignmentsTableContainer.appendChild(table);
  }

  // Initial call to fetch and display data
  fetchAndDisplayAssignments();
});
