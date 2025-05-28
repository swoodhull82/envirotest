document.addEventListener('DOMContentLoaded', () => {
  // Table bodies
  const upcomingReviewsTbody = document.querySelectorAll('.layout-content-container table tbody')[0];
  const overdueReviewsTbody = document.querySelectorAll('.layout-content-container table tbody')[1];
  
  // Variables for new filter inputs (ID names match the <select> elements)
  const filterTitleSelect = document.getElementById('filterTitle');
  const filterReviewerSelect = document.getElementById('filterReviewer');
  const filterStatusSelect = document.getElementById('filterStatus');

  // Null checks for new filter elements
  if (!filterTitleSelect) console.error('Filter Title Select element (filterTitle) not found!');
  if (!filterReviewerSelect) console.error('Filter Reviewer Select element (filterReviewer) not found!');
  if (!filterStatusSelect) console.error('Filter Status Select element (filterStatus) not found!');

  // Global variables to store current filter values
  let currentTitleFilter = 'All'; // Default to 'All' for select
  let currentReviewerFilter = 'All'; // Default to 'All' for select
  let currentStatusFilter = 'All';

  // DOM elements for "Add New Review Document" form
  const addDocumentForm = document.getElementById('addDocumentForm');
  const newDocTitleInput = document.getElementById('newDocTitle');
  const newDocReviewerSelect = document.getElementById('newDocReviewerSelect');
  const newDocDueDateInput = document.getElementById('newDocDueDate');

  // Null checks for new document form elements
  if (!addDocumentForm) console.error('Add Document Form (addDocumentForm) not found!');
  if (!newDocTitleInput) console.error('New Document Title Input (newDocTitle) not found!');
  if (!newDocReviewerSelect) console.error('New Document Reviewer Select (newDocReviewerSelect) not found!');
  if (!newDocDueDateInput) console.error('New Document Due Date Input (newDocDueDate) not found!');

  // DOM elements for "Add New Reviewer" form
  const addReviewerForm = document.getElementById('addReviewerForm');
  const newReviewerNameInput = document.getElementById('newReviewerName');
  
  // Null checks for new reviewer form elements
  if (!addReviewerForm) console.error('Add Reviewer Form (addReviewerForm) not found!');
  if (!newReviewerNameInput) console.error('New Reviewer Name Input (newReviewerName) not found!');

  // DOM elements for "Remove Reviewer" section
  const removeReviewerSelect = document.getElementById('removeReviewerSelect');
  const removeReviewerButton = document.getElementById('removeReviewerButton');

  // Null checks for remove reviewer elements
  if (!removeReviewerSelect) console.error('Remove Reviewer Select (removeReviewerSelect) not found!');
  if (!removeReviewerButton) console.error('Remove Reviewer Button (removeReviewerButton) not found!');
  
  let appData = { employees: [] }; // Global store for application data

  function populateTitleFilterDropdown(employees) {
    if (!filterTitleSelect) return;
    const firstOption = filterTitleSelect.options[0]; // Preserve "All Titles"
    filterTitleSelect.innerHTML = '';
    filterTitleSelect.appendChild(firstOption);

    const uniqueTitles = new Set();
    if (employees && Array.isArray(employees)) {
      employees.forEach(employee => {
        if (employee.assigned_tasks && Array.isArray(employee.assigned_tasks)) {
          employee.assigned_tasks.forEach(task => {
            if (task.title) uniqueTitles.add(task.title);
          });
        }
      });
    }
    uniqueTitles.forEach(title => {
      const option = document.createElement('option');
      option.value = title;
      option.textContent = title;
      filterTitleSelect.appendChild(option);
    });
  }

  function populateReviewerFilterDropdown(employees) {
    if (!filterReviewerSelect) return; // For the filter dropdown
    const firstOption = filterReviewerSelect.options[0]; // Preserve "All Reviewers"
    filterReviewerSelect.innerHTML = '';
    filterReviewerSelect.appendChild(firstOption);

    const uniqueReviewers = new Set();
    if (employees && Array.isArray(employees)) {
      employees.forEach(employee => {
        if (employee.name) uniqueReviewers.add(employee.name);
      });
    }
    uniqueReviewers.forEach(name => {
      const option = document.createElement('option');
      option.value = name; // Value is name for filter
      option.textContent = name;
      filterReviewerSelect.appendChild(option);
    });
  }

  function populateNewDocReviewerSelect(employees) {
    if (!newDocReviewerSelect) return;
    const firstOption = newDocReviewerSelect.options[0]; // Preserve "Select Reviewer"
    newDocReviewerSelect.innerHTML = '';
    newDocReviewerSelect.appendChild(firstOption);

    if (employees && Array.isArray(employees)) {
      employees.forEach(employee => {
        if (employee.name && employee.id) {
          const option = document.createElement('option');
          option.value = employee.id; // Value is ID for form submission
          option.textContent = employee.name;
          newDocReviewerSelect.appendChild(option);
        }
      });
    }
  }

  function populateRemoveReviewerSelect(employees) {
    if (!removeReviewerSelect) return;
    const firstOption = removeReviewerSelect.options[0]; // Preserve "Select Reviewer"
    removeReviewerSelect.innerHTML = '';
    removeReviewerSelect.appendChild(firstOption);

    if (employees && Array.isArray(employees)) {
      employees.forEach(employee => {
        if (employee.name && employee.id) {
          const option = document.createElement('option');
          option.value = employee.id; 
          option.textContent = employee.name;
          removeReviewerSelect.appendChild(option);
        }
      });
    }
  }

  async function initialFetchAndDisplay() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const jsonData = await response.json();
      appData = jsonData;

      if (!appData.employees || !Array.isArray(appData.employees)) {
        console.error('No employees data found or data is not in expected format.');
        displayErrorMessageInTables('Error: Employee data is missing or invalid.');
        appData.employees = []; 
      }
      
      populateTitleFilterDropdown(appData.employees);
      populateReviewerFilterDropdown(appData.employees); // For filter
      populateNewDocReviewerSelect(appData.employees); // For new document form
      populateRemoveReviewerSelect(appData.employees); // For remove reviewer form
      processAndDisplayReviews(appData.employees); 

    } catch (error) {
      console.error('Error fetching or processing review data:', error);
      displayErrorMessageInTables('Error loading review data.');
      appData.employees = []; 
      populateTitleFilterDropdown(appData.employees);
      populateReviewerFilterDropdown(appData.employees);
      populateNewDocReviewerSelect(appData.employees); 
      populateRemoveReviewerSelect(appData.employees); // Also populate in catch
    }
  }

  function processAndDisplayReviews(employees) { 
    const allUpcomingTasks = [];
    const allOverdueTasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!employees || !Array.isArray(employees)) {
      console.warn('processAndDisplayReviews called with invalid or empty employees array');
      displayErrorMessageInTables('No employee data to process.');
      return;
    }

    employees.forEach(employee => {
      if (employee.assigned_tasks && Array.isArray(employee.assigned_tasks)) {
        employee.assigned_tasks.forEach(task => {
          if (task.status === 'Completed') return; 

          if (currentTitleFilter !== 'All' && task.title !== currentTitleFilter) {
            return;
          }
          if (currentReviewerFilter !== 'All' && employee.name !== currentReviewerFilter) {
            return;
          }
          if (currentStatusFilter !== 'All' && task.status !== currentStatusFilter) {
            return;
          }
          
          // Include employeeId with the task details
          const taskDetail = { ...task, reviewer: employee.name, employeeId: employee.id };
          const dueDate = new Date(taskDetail.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate < today) allOverdueTasks.push(taskDetail);
          else allUpcomingTasks.push(taskDetail);
        });
      }
    });

    // Clear existing rows (excluding headers)
    if (upcomingReviewsTbody) upcomingReviewsTbody.innerHTML = '';
    if (overdueReviewsTbody) overdueReviewsTbody.innerHTML = '';
    
    // Note: The table headers (<thead>) in index.html would need an additional <th> for "Actions"
    // e.g. <th class="px-4 py-3 text-left text-[#0c1c17] w-40 text-sm font-medium leading-normal">Actions</th>

    populateTable(upcomingReviewsTbody, allUpcomingTasks);
    populateTable(overdueReviewsTbody, allOverdueTasks);
  }
  
  function displayErrorMessageInTables(message) {
    const errorRow = `<tr><td colspan="4" class="text-center text-red-500 py-4">${message}</td></tr>`;
    if (upcomingReviewsTbody) upcomingReviewsTbody.innerHTML = errorRow;
    if (overdueReviewsTbody) overdueReviewsTbody.innerHTML = errorRow;
  }

  function populateTable(tableBody, reviews) {
    if (!tableBody) return;
    tableBody.innerHTML = ''; 
    if (!reviews || reviews.length === 0) {
      // Adjusted colspan to 5 to account for the new "Actions" column
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No reviews to display.</td></tr>';
      return;
    }
    reviews.forEach(review => {
      const row = document.createElement('tr');
      row.className = 'border-t border-t-[#cde9df]';
      
      const titleCell = document.createElement('td');
      titleCell.className = 'h-[72px] px-4 py-2 w-[350px] text-[#0c1c17] text-sm font-normal leading-normal'; // Adjusted width
      titleCell.textContent = review.title;
      row.appendChild(titleCell);

      const reviewerCell = document.createElement('td');
      reviewerCell.className = 'h-[72px] px-4 py-2 w-[350px] text-[#46a080] text-sm font-normal leading-normal'; // Adjusted width
      reviewerCell.textContent = review.reviewer;
      row.appendChild(reviewerCell);

      const dueDateCell = document.createElement('td');
      dueDateCell.className = 'h-[72px] px-4 py-2 w-[300px] text-[#46a080] text-sm font-normal leading-normal'; // Adjusted width
      dueDateCell.textContent = review.dueDate;
      row.appendChild(dueDateCell);

      const statusCell = document.createElement('td');
      statusCell.className = 'h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal';
      const statusButton = document.createElement('button');
      statusButton.className = 'flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 text-sm font-medium leading-normal w-full';
      
      statusButton.classList.remove(
        'bg-[#e6f4ef]', 'text-[#0c1c17]', 
        'bg-red-200', 'text-red-700',     
        'bg-yellow-100', 'text-yellow-700', 
        'bg-blue-100', 'text-blue-700',    
        'bg-green-100', 'text-green-700'  
      );

      if (review.status === 'Overdue') {
        statusButton.classList.add('bg-red-200', 'text-red-700');
      } else if (review.status === 'In Progress') {
        statusButton.classList.add('bg-yellow-100', 'text-yellow-700');
      } else if (review.status === 'Not Started') {
        statusButton.classList.add('bg-blue-100', 'text-blue-700');
      } else if (review.status === 'Completed') {
        statusButton.classList.add('bg-green-100', 'text-green-700');
      } else {
        statusButton.classList.add('bg-[#e6f4ef]', 'text-[#0c1c17]');
      }
      const statusSpan = document.createElement('span');
      statusSpan.className = 'truncate';
      statusSpan.textContent = review.status;
      statusButton.appendChild(statusSpan);
      statusCell.appendChild(statusButton);
      row.appendChild(statusCell);

      // Add "Remove" button cell
      const actionsCell = document.createElement('td');
      actionsCell.className = 'h-[72px] px-4 py-2 w-40 text-sm font-normal leading-normal text-center'; // Added text-center
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-review-btn text-red-500 hover:text-red-700 font-medium';
      removeButton.textContent = 'Remove';
      removeButton.dataset.taskId = review.task_id;
      removeButton.dataset.employeeId = review.employeeId; // employeeId is now part of the review object
      actionsCell.appendChild(removeButton);
      row.appendChild(actionsCell);
      
      tableBody.appendChild(row);
    });
  }

  // Event Listeners for new filter dropdowns
  if (filterTitleSelect) {
    filterTitleSelect.addEventListener('change', (event) => {
      currentTitleFilter = event.target.value; 
      processAndDisplayReviews(appData.employees);
    });
  }

  if (filterReviewerSelect) {
    filterReviewerSelect.addEventListener('change', (event) => {
      currentReviewerFilter = event.target.value;
      processAndDisplayReviews(appData.employees);
    });
  }

  if (filterStatusSelect) {
    filterStatusSelect.addEventListener('change', () => {
      currentStatusFilter = filterStatusSelect.value;
      processAndDisplayReviews(appData.employees);
    });
  }

  // Event Listener for "Add New Review Document" form
  if (addDocumentForm) {
    addDocumentForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const newDocTitle = newDocTitleInput.value.trim();
      const selectedReviewerId = newDocReviewerSelect.value;
      const newDocDueDate = newDocDueDateInput.value;

      if (!newDocTitle) {
        alert('Please enter a document title.');
        return;
      }
      if (!selectedReviewerId) {
        alert('Please select a reviewer.');
        return;
      }
      if (!newDocDueDate) {
        alert('Please select a due date.');
        return;
      }

      const employee = appData.employees.find(emp => emp.id === selectedReviewerId);

      if (employee) {
        const newTask = {
          task_id: 'task' + Date.now(),
          title: newDocTitle,
          type: "General", // Default type
          dueDate: newDocDueDate,
          status: "Not Started"
        };

        if (!employee.assigned_tasks) {
          employee.assigned_tasks = [];
        }
        employee.assigned_tasks.push(newTask);
        
        console.log(`New document "${newDocTitle}" assigned to ${employee.name}. AppData:`, appData);

        processAndDisplayReviews(appData.employees);
        populateTitleFilterDropdown(appData.employees); // Update title filter dropdown

        addDocumentForm.reset();
        newDocReviewerSelect.value = ""; // Reset select to default placeholder
      } else {
        console.error('Selected reviewer (employee) not found. ID:', selectedReviewerId);
        alert('An error occurred: Selected reviewer not found.');
      }
    });
  }

  initialFetchAndDisplay();
});
