document.addEventListener('DOMContentLoaded', () => {
  // Table bodies
  const upcomingReviewsTbody = document.querySelectorAll('.layout-content-container table tbody')[0];
  const overdueReviewsTbody = document.querySelectorAll('.layout-content-container table tbody')[1];
  
  // Add Employee Form elements
  const addEmployeeForm = document.getElementById('addEmployeeForm');
  const employeeNameInput = document.getElementById('employeeName');
  if (!employeeNameInput) console.error('Employee Name Input element (employeeName) not found!');
  const employeeListUL = document.getElementById('employeeList');

  // Assign Task Form elements
  const assignTaskForm = document.getElementById('assignTaskForm');
  const employeeSelectForTask = document.getElementById('employeeSelectForTask');
  const taskTitleInput = document.getElementById('taskTitle');
  // Corrected ID to match HTML
  const taskTypeSelect = document.getElementById('taskTypeSelect'); 
  const taskDueDateInput = document.getElementById('taskDueDate');
  let newReviewTypeInput = null; // To store the dynamically created input field
  let currentFilterType = "All"; // To store the current filter type

  // Filter buttons
  const filterButtons = document.querySelectorAll('.review-filter-btn');
  const clearFilterButton = document.getElementById('clearFilterBtn');

  // Basic null checks for critical elements
  if (!employeeListUL) console.error('Employee list UL element (employeeList) not found!');
  if (!addEmployeeForm) console.error('Add Employee Form (addEmployeeForm) not found!');
  if (!assignTaskForm) console.error('Assign Task Form (assignTaskForm) not found!');
  if (!employeeSelectForTask) console.error('Employee Select for Task (employeeSelectForTask) not found!');
  if (!taskTitleInput) console.error('Task Title Input (taskTitle) not found!');
  // Corrected ID in the error message as well
  if (!taskTypeSelect) console.error('Task Type Select (taskTypeSelect) not found!'); 
  if (!taskDueDateInput) console.error('Task Due Date Input (taskDueDate) not found!');


  let appData = { employees: [] }; // Global store for application data

  async function initialFetchAndDisplay() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const jsonData = await response.json();
      appData = jsonData;

      if (!appData.employees || !Array.isArray(appData.employees)) {
        console.error('No employees data found or data is not in expected format.');
        displayErrorMessageInTables('Error: Employee data is missing or invalid.');
        if (employeeListUL) displayEmployees([]);
        if (employeeSelectForTask) populateEmployeeSelect([]);
        // Ensure task type select is also handled in error case
        if (taskTypeSelect) populateTaskTypeSelect([]);
        return;
      }
      processAndDisplayReviews(appData.employees, currentFilterType); // Pass currentFilterType
      if (employeeListUL) displayEmployees(appData.employees);
      if (employeeSelectForTask) populateEmployeeSelect(appData.employees);
      // Populate task types dropdown
      if (taskTypeSelect) populateTaskTypeSelect(appData.employees);

    } catch (error) {
      console.error('Error fetching or processing review data:', error);
      displayErrorMessageInTables('Error loading review data.');
      if (employeeListUL) displayEmployees([]);
      if (employeeSelectForTask) populateEmployeeSelect([]);
      if (taskTypeSelect) populateTaskTypeSelect([]); // Also handle error case for task types
    }
  }

  function processAndDisplayReviews(employees, filterType = "All") {
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

          // Apply filter
          if (filterType !== "All" && task.type !== filterType) return;
          
          const taskWithReviewer = { ...task, reviewer: employee.name };
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate < today) allOverdueTasks.push(taskWithReviewer);
          else allUpcomingTasks.push(taskWithReviewer);
        });
      }
    });

    if (upcomingReviewsTbody) upcomingReviewsTbody.innerHTML = '';
    if (overdueReviewsTbody) overdueReviewsTbody.innerHTML = '';

    populateTable(upcomingReviewsTbody, allUpcomingTasks);
    populateTable(overdueReviewsTbody, allOverdueTasks);
  }
  
  function displayErrorMessageInTables(message) {
    const errorRow = `<tr><td colspan="4" class="text-center text-red-500 py-4">${message}</td></tr>`;
    if (upcomingReviewsTbody) upcomingReviewsTbody.innerHTML = errorRow;
    if (overdueReviewsTbody) overdueReviewsTbody.innerHTML = errorRow;
  }

  function displayEmployees(employeesData) {
    if (!employeeListUL) return;
    employeeListUL.innerHTML = '';
    if (!employeesData || employeesData.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No employees to display.';
      li.className = 'text-gray-500 p-1';
      employeeListUL.appendChild(li);
      return;
    }
    employeesData.forEach(employee => {
      const li = document.createElement('li');
      li.textContent = employee.name;
      li.className = 'mb-1 p-1 border-b border-gray-200 text-gray-700'; 
      employeeListUL.appendChild(li);
    });
  }

  function populateEmployeeSelect(employeesData) {
    if (!employeeSelectForTask) return;
    const currentValue = employeeSelectForTask.value; // Preserve current selection if possible
    employeeSelectForTask.innerHTML = ''; // Clear existing options

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select an employee";
    defaultOption.disabled = true;
    // Do not select it by default if there's a value to preserve, 
    // unless the value is no longer valid.
    defaultOption.selected = !currentValue; 
    employeeSelectForTask.appendChild(defaultOption);

    let valueExists = false;
    if (employeesData && employeesData.length > 0) {
      employeesData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelectForTask.appendChild(option);
        if (employee.id === currentValue) {
          valueExists = true;
        }
      });
    }
    // If the previously selected value still exists, re-select it.
    if (valueExists) {
      employeeSelectForTask.value = currentValue;
    } else {
        // If the previous value is no longer valid (e.g. employee deleted), select the default.
        employeeSelectForTask.value = ""; 
    }
  }

  function populateTaskTypeSelect(employeesData) {
    if (!taskTypeSelect) return;
    
    const existingOptionsFromHtml = Array.from(taskTypeSelect.querySelectorAll('option'))
                                      .filter(option => option.value && option.value !== "" && option.value !== "add_new_type")
                                      .map(option => option.value);

    let uniqueTaskTypes = new Set(existingOptionsFromHtml);

    if (employeesData && employeesData.length > 0) {
      employeesData.forEach(employee => {
        if (employee.assigned_tasks && Array.isArray(employee.assigned_tasks)) {
          employee.assigned_tasks.forEach(task => {
            if (task.type) {
              uniqueTaskTypes.add(task.type);
            }
          });
        }
      });
    }

    // Preserve current selection if possible
    const currentSelectedValue = taskTypeSelect.value; 

    // Clear existing options except the default "Select Review Type"
    while (taskTypeSelect.options.length > 1) {
        taskTypeSelect.remove(1);
    }
    
    uniqueTaskTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      taskTypeSelect.appendChild(option);
    });

    const addNewOption = document.createElement('option');
    addNewOption.value = "add_new_type";
    addNewOption.textContent = "Add New Type...";
    taskTypeSelect.appendChild(addNewOption);

    // Restore selection if possible
    if (Array.from(taskTypeSelect.options).some(opt => opt.value === currentSelectedValue)) {
        taskTypeSelect.value = currentSelectedValue;
    } else {
        taskTypeSelect.value = ""; // Default to "Select Review Type"
    }
  }


  function populateTable(tableBody, reviews) {
    if (!tableBody) return;
    tableBody.innerHTML = ''; // Clear existing rows
    if (!reviews || reviews.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-4">No reviews to display.</td></tr>';
      return;
    }
    reviews.forEach(review => {
      const row = document.createElement('tr');
      row.className = 'border-t border-t-[#cde9df]';
      // ... (rest of populateTable remains the same, cell creation logic) ...
            // Document Title
      const titleCell = document.createElement('td');
      titleCell.className = 'h-[72px] px-4 py-2 w-[400px] text-[#0c1c17] text-sm font-normal leading-normal';
      titleCell.textContent = review.title;
      row.appendChild(titleCell);

      // Reviewer
      const reviewerCell = document.createElement('td');
      reviewerCell.className = 'h-[72px] px-4 py-2 w-[400px] text-[#46a080] text-sm font-normal leading-normal';
      reviewerCell.textContent = review.reviewer;
      row.appendChild(reviewerCell);

      // Due Date
      const dueDateCell = document.createElement('td');
      dueDateCell.className = 'h-[72px] px-4 py-2 w-[400px] text-[#46a080] text-sm font-normal leading-normal';
      dueDateCell.textContent = review.dueDate;
      row.appendChild(dueDateCell);

      // Status
      const statusCell = document.createElement('td');
      statusCell.className = 'h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal';
      const statusButton = document.createElement('button');
      statusButton.className = 'flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 text-sm font-medium leading-normal w-full';
      
      // Comprehensive list of all status color classes to remove before applying new ones
      statusButton.classList.remove(
        'bg-[#e6f4ef]', 'text-[#0c1c17]', // Default
        'bg-red-200', 'text-red-700',     // Overdue
        'bg-yellow-100', 'text-yellow-700', // In Progress
        'bg-blue-100', 'text-blue-700',    // Not Started
        'bg-green-100', 'text-green-700'  // Completed
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
        // Apply default if status is none of the above or undefined
        statusButton.classList.add('bg-[#e6f4ef]', 'text-[#0c1c17]');
      }
      const statusSpan = document.createElement('span');
      statusSpan.className = 'truncate';
      statusSpan.textContent = review.status;
      statusButton.appendChild(statusSpan);
      statusCell.appendChild(statusButton);
      row.appendChild(statusCell);
      tableBody.appendChild(row);
    });
  }

  // Event listener for adding a new employee
  if (addEmployeeForm && employeeNameInput) {
    addEmployeeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const employeeName = employeeNameInput.value.trim();
      if (!employeeName) {
        alert('Employee name cannot be empty.');
        return;
      }
      const newEmployeeId = 'emp' + Date.now();
      const newEmployee = { id: newEmployeeId, name: employeeName, assigned_tasks: [] };
      if (!appData.employees) appData.employees = [];
      appData.employees.push(newEmployee);
      console.log('Simulated Save (Add Employee): Updated appData.employees:', appData.employees);
      processAndDisplayReviews(appData.employees, currentFilterType); 
      if (employeeListUL) displayEmployees(appData.employees);
      if (employeeSelectForTask) populateEmployeeSelect(appData.employees); // Update dropdown
      employeeNameInput.value = '';
    });
  }

  // Event listener for assigning a new task
  if (assignTaskForm && employeeSelectForTask && taskTitleInput && taskTypeSelect && taskDueDateInput) {
    assignTaskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const selectedEmployeeId = employeeSelectForTask.value;
      const taskTitle = taskTitleInput.value.trim();
      let taskType = taskTypeSelect.value;
      const taskDueDate = taskDueDateInput.value;

      if (!selectedEmployeeId) { alert('Please select an employee.'); return; }
      if (!taskTitle) { alert('Please enter a task title.'); return; }
      
      if (taskType === "add_new_type") {
        if (newReviewTypeInput && newReviewTypeInput.value.trim()) {
          taskType = newReviewTypeInput.value.trim();
          // Optionally, add this new type to the dropdown permanently
          const newOption = document.createElement('option');
          newOption.value = taskType;
          newOption.textContent = taskType;
          // Insert before the "Add New Type..." option
          taskTypeSelect.insertBefore(newOption, taskTypeSelect.options[taskTypeSelect.options.length - 1]);
          // And re-select it
          taskTypeSelect.value = taskType;
          if (newReviewTypeInput) newReviewTypeInput.style.display = 'none'; // Hide after use
        } else {
          alert('Please enter the new review type or select an existing one.');
          return;
        }
      } else if (!taskType) {
        alert('Please select a task type.'); return;
      }

      if (!taskDueDate) { alert('Please enter a due date.'); return; }

      const newTaskId = 'task' + Date.now();
      const newTask = {
        task_id: newTaskId,
        title: taskTitle,
        type: taskType,
        dueDate: taskDueDate,
        status: "Not Started"
      };

      const employee = appData.employees.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        if (!employee.assigned_tasks) employee.assigned_tasks = [];
        employee.assigned_tasks.push(newTask);
        console.log('Simulated Save (Assign Task): Updated appData:', appData);
        processAndDisplayReviews(appData.employees, currentFilterType);
        // No need to call displayEmployees here unless task assignment affects employee list display
        assignTaskForm.reset(); // Reset form fields
        // Ensure the dropdowns are reset to their default placeholder
        employeeSelectForTask.value = ""; 
        taskTypeSelect.value = "";
        if (newReviewTypeInput) { // Also clear and hide the dynamic input
            newReviewTypeInput.value = "";
            newReviewTypeInput.style.display = "none";
        }
      } else {
        console.error('Selected employee not found in appData.');
        alert('Error: Selected employee not found. Please refresh.');
      }
    });
  }

  // Event listener for task type select change
  if (taskTypeSelect) {
    taskTypeSelect.addEventListener('change', (event) => {
      if (event.target.value === 'add_new_type') {
        if (!newReviewTypeInput) {
          newReviewTypeInput = document.createElement('input');
          newReviewTypeInput.type = 'text';
          newReviewTypeInput.id = 'newReviewTypeInput';
          newReviewTypeInput.placeholder = 'Enter new review type';
          newReviewTypeInput.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-2';
          // Insert after the select element's parent or a more specific container if available
          taskTypeSelect.parentNode.insertBefore(newReviewTypeInput, taskTypeSelect.nextSibling);
        }
        newReviewTypeInput.style.display = 'block';
        newReviewTypeInput.focus();
      } else {
        if (newReviewTypeInput) {
          newReviewTypeInput.style.display = 'none';
        }
      }
    });
  }

  // Event listener for task type select change is already present above (around line 350-370 in the previous version)
  // The duplicate one that was here (around original lines 372-392) is now removed.

  // --- Filter Functionality ---
  function updateActiveFilterButtonUI(activeButton) {
    filterButtons.forEach(button => {
      button.classList.remove('bg-[#019863]', 'text-white'); // Active state classes
      button.classList.add('bg-[#e6f4ef]', 'text-[#0c1c17]'); // Default state classes
    });
    if (activeButton) {
      activeButton.classList.remove('bg-[#e6f4ef]', 'text-[#0c1c17]');
      activeButton.classList.add('bg-[#019863]', 'text-white');
    }
  }

  if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filterTextElement = button.querySelector('p');
        if (filterTextElement) {
          currentFilterType = filterTextElement.textContent.trim();
          processAndDisplayReviews(appData.employees, currentFilterType);
          updateActiveFilterButtonUI(button);
        } else {
          console.warn('Filter button does not have a <p> tag for text content.', button);
        }
      });
    });
  }

  if (clearFilterButton) {
    clearFilterButton.addEventListener('click', () => {
      currentFilterType = "All";
      processAndDisplayReviews(appData.employees, currentFilterType);
      updateActiveFilterButtonUI(null); // No button is active
    });
  }
  // --- End Filter Functionality ---

  initialFetchAndDisplay();
});
