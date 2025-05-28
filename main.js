document.addEventListener('DOMContentLoaded', () => {
  // Table bodies
  const upcomingReviewsTbody = document.querySelectorAll('.layout-content-container table tbody')[0];
  const overdueReviewsTbody = document.querySelectorAll('.layout-content-container table tbody')[1];
  
  // Add Employee Form elements
  const addEmployeeForm = document.getElementById('addEmployeeForm');
  const employeeNameInput = document.getElementById('employeeName');
  const employeeListUL = document.getElementById('employeeList');

  // Assign Task Form elements
  const assignTaskForm = document.getElementById('assignTaskForm');
  const employeeSelectForTask = document.getElementById('employeeSelectForTask');
  const taskTitleInput = document.getElementById('taskTitle');
  const taskTypeSelect = document.getElementById('taskType');
  const taskDueDateInput = document.getElementById('taskDueDate');

  // Basic null checks for critical elements
  if (!employeeListUL) console.error('Employee list UL element (employeeList) not found!');
  if (!addEmployeeForm) console.error('Add Employee Form (addEmployeeForm) not found!');
  if (!assignTaskForm) console.error('Assign Task Form (assignTaskForm) not found!');
  if (!employeeSelectForTask) console.error('Employee Select for Task (employeeSelectForTask) not found!');
  if (!taskTitleInput) console.error('Task Title Input (taskTitle) not found!');
  if (!taskTypeSelect) console.error('Task Type Select (taskType) not found!');
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
        return;
      }
      processAndDisplayReviews(appData.employees);
      if (employeeListUL) displayEmployees(appData.employees);
      if (employeeSelectForTask) populateEmployeeSelect(appData.employees);
    } catch (error) {
      console.error('Error fetching or processing review data:', error);
      displayErrorMessageInTables('Error loading review data.');
      if (employeeListUL) displayEmployees([]);
      if (employeeSelectForTask) populateEmployeeSelect([]);
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
    employeeSelectForTask.innerHTML = ''; // Clear existing options

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select an employee";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    employeeSelectForTask.appendChild(defaultOption);

    if (employeesData && employeesData.length > 0) {
      employeesData.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.id;
        option.textContent = employee.name;
        employeeSelectForTask.appendChild(option);
      });
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
      statusButton.className = 'flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#e6f4ef] text-[#0c1c17] text-sm font-medium leading-normal w-full';
      
      statusButton.classList.remove('bg-[#e6f4ef]', 'bg-red-200', 'text-red-700', 'bg-yellow-100', 'text-yellow-700');
      statusButton.classList.add('bg-[#e6f4ef]', 'text-[#0c1c17]'); // Reset to default

      if (review.status === 'Overdue') {
        statusButton.classList.remove('bg-[#e6f4ef]');
        statusButton.classList.add('bg-red-200', 'text-red-700');
      } else if (review.status === 'In Progress') {
        statusButton.classList.remove('bg-[#e6f4ef]');
        statusButton.classList.add('bg-yellow-100', 'text-yellow-700');
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
      processAndDisplayReviews(appData.employees); 
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
      const taskType = taskTypeSelect.value;
      const taskDueDate = taskDueDateInput.value;

      if (!selectedEmployeeId) { alert('Please select an employee.'); return; }
      if (!taskTitle) { alert('Please enter a task title.'); return; }
      if (!taskType) { alert('Please select a task type.'); return; }
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
        processAndDisplayReviews(appData.employees);
        // No need to call displayEmployees here unless task assignment affects employee list display
        assignTaskForm.reset(); // Reset form fields
        // Ensure the dropdown is reset to the default placeholder
        employeeSelectForTask.value = ""; 
      } else {
        console.error('Selected employee not found in appData.');
        alert('Error: Selected employee not found. Please refresh.');
      }
    });
  }

  initialFetchAndDisplay();
});
