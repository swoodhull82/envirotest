// tests.js

// --- Test Utilities ---

/**
 * Basic assertion function.
 * @param {boolean} condition - The condition to test.
 * @param {string} message - Message to display on success or failure.
 */
function assert(condition, message) {
  if (!condition) {
    console.error('Assertion Failed:', message);
    // In a more robust test runner, you might throw an error or collect failures.
    // For this environment, console.error is the primary feedback.
    throw new Error(`Assertion Failed: ${message || 'Unnamed assertion'}`);
  } else {
    console.log('Assertion Passed:', message);
  }
}

/**
 * Runs all defined test functions and logs a summary.
 */
function runAllTests() {
  console.log('--- Starting All Tests ---');
  let testsPassed = 0;
  let testsFailed = 0;
  const testFunctions = [
    testTaskCategorization,
    testCalendarDateLogic,
    testEmployeeAndTaskManagement
    // Add more test functions here as they are created
  ];

  testFunctions.forEach(testFunc => {
    try {
      console.log(`\n--- Running Test: ${testFunc.name} ---`);
      testFunc();
      testsPassed++;
      console.log(`--- Test Passed: ${testFunc.name} ---`);
    } catch (e) {
      testsFailed++;
      console.error(`--- Test FAILED: ${testFunc.name} ---`);
      console.error(e);
    }
  });

  console.log('\n--- Test Summary ---');
  console.log(`Total Tests: ${testFunctions.length}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log('--- All Tests Finished ---');
  
  if (testsFailed > 0) {
    console.error(`${testsFailed} test(s) failed. Check console for details.`);
  } else {
    console.log("All tests passed successfully!");
  }
}

// --- Calendar Logic Helper Functions (for testing calendar.js logic) ---

/**
 * Calculates the number of days in a given month and year.
 * @param {number} year - The full year.
 * @param {number} month - The month (0-indexed, 0 for January).
 * @returns {number} The number of days in the month.
 */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Gets the day of the week for the first day of a given month and year.
 * @param {number} year - The full year.
 * @param {number} month - The month (0-indexed, 0 for January).
 * @returns {number} The day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday).
 */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}


// --- Test Functions ---

/**
 * Tests the logic for categorizing tasks as upcoming or overdue.
 * This replicates the core date comparison and status check logic from main.js.
 */
function testTaskCategorization() {
  const today = new Date('2024-08-01T00:00:00Z'); // Fixed date for predictable tests (UTC for consistency)
  today.setHours(0,0,0,0); // Normalize to midnight

  const tasks = [
    { title: 'Overdue Task 1 (In Progress)', dueDate: '2024-07-20', status: 'In Progress' },
    { title: 'Overdue Task 2 (Not Started)', dueDate: '2024-07-31', status: 'Not Started' },
    { title: 'Upcoming Task 1 (Not Started)', dueDate: '2024-08-05', status: 'Not Started' },
    { title: 'Upcoming Task 2 (Today)', dueDate: '2024-08-01', status: 'In Progress' },
    { title: 'Upcoming Task 3 (Future)', dueDate: '2024-09-01', status: 'Not Started' },
    { title: 'Completed Task (Past)', dueDate: '2024-07-15', status: 'Completed' },
    { title: 'Completed Task (Future)', dueDate: '2024-08-15', status: 'Completed' }, // Should be ignored
    { title: 'Boundary: Yesterday Overdue', dueDate: '2024-07-31', status: 'In Progress'}, // Same as task 2 but for boundary check
    { title: 'Boundary: Today Upcoming', dueDate: '2024-08-01', status: 'Not Started'}, // Same as task 4
  ];

  const categorized = {
    upcoming: [],
    overdue: []
  };

  tasks.forEach(task => {
    if (task.status === 'Completed') {
      return; // Skip completed tasks
    }
    const dueDate = new Date(task.dueDate + 'T00:00:00Z'); // Assume dates are Z or treat as local but normalize
    dueDate.setHours(0,0,0,0); // Normalize to midnight

    if (dueDate < today) {
      categorized.overdue.push(task);
    } else {
      categorized.upcoming.push(task);
    }
  });

  assert(categorized.overdue.length === 3, 'Should be 3 overdue tasks (Overdue Task 1, Overdue Task 2, Boundary: Yesterday Overdue)');
  assert(categorized.upcoming.length === 3, 'Should be 3 upcoming tasks (Upcoming Task 1, Upcoming Task 2 (Today), Upcoming Task 3 (Future), Boundary: Today Upcoming)');
  assert(categorized.overdue.some(t => t.title === 'Overdue Task 1 (In Progress)'), 'Overdue Task 1 correctly categorized');
  assert(categorized.upcoming.some(t => t.title === 'Upcoming Task 1 (Not Started)'), 'Upcoming Task 1 correctly categorized');
  assert(!categorized.overdue.some(t => t.status === 'Completed'), 'No completed tasks should be in overdue');
  assert(!categorized.upcoming.some(t => t.status === 'Completed'), 'No completed tasks should be in upcoming');
}

/**
 * Tests calendar-related date calculations.
 */
function testCalendarDateLogic() {
  // Test getDaysInMonth
  assert(getDaysInMonth(2024, 0) === 31, 'Jan 2024 has 31 days');
  assert(getDaysInMonth(2024, 1) === 29, 'Feb 2024 has 29 days (leap year)');
  assert(getDaysInMonth(2023, 1) === 28, 'Feb 2023 has 28 days');
  assert(getDaysInMonth(2024, 3) === 30, 'Apr 2024 has 30 days');
  assert(getDaysInMonth(2024, 11) === 31, 'Dec 2024 has 31 days');

  // Test getFirstDayOfMonth (0=Sun, 1=Mon, ..., 6=Sat)
  // Jan 1, 2024 was a Monday
  assert(getFirstDayOfMonth(2024, 0) === 1, 'Jan 1, 2024 is a Monday (1)');
  // Feb 1, 2024 was a Thursday
  assert(getFirstDayOfMonth(2024, 1) === 4, 'Feb 1, 2024 is a Thursday (4)');
  // Mar 1, 2023 was a Wednesday
  assert(getFirstDayOfMonth(2023, 2) === 3, 'Mar 1, 2023 is a Wednesday (3)');
  // Sep 1, 2024 is a Sunday
  assert(getFirstDayOfMonth(2024, 8) === 0, 'Sep 1, 2024 is a Sunday (0)');
}

/**
 * Tests basic employee and task addition logic (simulating main.js appData manipulation).
 */
function testEmployeeAndTaskManagement() {
  const appData = { employees: [] };

  // Test adding an employee
  const newEmp = { id: 'empTest1', name: 'Test Employee 1', assigned_tasks: [] };
  appData.employees.push(newEmp);
  assert(appData.employees.length === 1, 'Employee should be added, length is 1');
  assert(appData.employees[0].id === 'empTest1', 'Employee ID should match empTest1');
  assert(appData.employees[0].name === 'Test Employee 1', 'Employee name should match Test Employee 1');
  assert(appData.employees[0].assigned_tasks.length === 0, 'New employee should have 0 tasks');

  // Test assigning a task to the employee
  const newTask1 = { task_id: 'taskTest1', title: 'Test Task 1', type: 'iDOC', dueDate: '2024-12-01', status: 'Not Started' };
  appData.employees[0].assigned_tasks.push(newTask1);
  assert(appData.employees[0].assigned_tasks.length === 1, 'Task should be assigned, tasks length is 1');
  assert(appData.employees[0].assigned_tasks[0].task_id === 'taskTest1', 'Task ID should match taskTest1');
  assert(appData.employees[0].assigned_tasks[0].title === 'Test Task 1', 'Task title should match Test Task 1');

  // Test adding another employee
  const newEmp2 = { id: 'empTest2', name: 'Test Employee 2', assigned_tasks: [] };
  appData.employees.push(newEmp2);
  assert(appData.employees.length === 2, 'Second employee should be added, length is 2');
  
  // Test assigning a task to the second employee
  const newTask2 = { task_id: 'taskTest2', title: 'Test Task 2', type: 'SOP Review', dueDate: '2024-11-15', status: 'In Progress' };
  appData.employees[1].assigned_tasks.push(newTask2);
  assert(appData.employees[1].assigned_tasks.length === 1, 'Task should be assigned to second employee, tasks length is 1');
  assert(appData.employees[1].assigned_tasks[0].title === 'Test Task 2', 'Task title for second employee should match');
  assert(appData.employees[0].assigned_tasks.length === 1, 'First employee task list should remain unchanged');
}


// Example of how to run (e.g., in browser console or a test runner HTML):
// runAllTests();
// If you want to run automatically when the script is loaded in a test HTML:
// window.onload = runAllTests;
// Or, if no other window.onload is used:
// runAllTests(); // Call directly if this is the only script or loaded last in a test page.
// For this subtask, creating the file is the main goal.
// The user will be responsible for how they execute runAllTests().
