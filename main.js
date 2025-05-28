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
  let currentTitleFilter = 'All'; 
  let currentReviewerFilter = 'All'; 
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
  
  let appData = { users: [], documents: [] }; 

  function populateTitleFilterDropdown(docs) { 
    if (!filterTitleSelect) return;
    const firstOption = filterTitleSelect.options[0]; 
    filterTitleSelect.innerHTML = '';
    filterTitleSelect.appendChild(firstOption);

    const uniqueTitles = new Set();
    if (docs && Array.isArray(docs)) {
      docs.forEach(doc => { 
        if (doc.title) uniqueTitles.add(doc.title);
      });
    }
    uniqueTitles.forEach(title => {
      const option = document.createElement('option');
      option.value = title;
      option.textContent = title;
      filterTitleSelect.appendChild(option);
    });
  }

  function populateReviewerFilterDropdown(users) { 
    if (!filterReviewerSelect) return; 
    const firstOption = filterReviewerSelect.options[0]; 
    filterReviewerSelect.innerHTML = '';
    filterReviewerSelect.appendChild(firstOption);

    const uniqueReviewers = new Set();
    if (users && Array.isArray(users)) {
      users.forEach(user => { 
        if (user.name) uniqueReviewers.add(user.name);
      });
    }
    uniqueReviewers.forEach(name => {
      const option = document.createElement('option');
      option.value = name; 
      option.textContent = name;
      filterReviewerSelect.appendChild(option);
    });
    
    if (!uniqueReviewers.has("Unassigned")) {
      const unassignedOption = document.createElement('option');
      unassignedOption.value = "Unassigned";
      unassignedOption.textContent = "Unassigned";
      filterReviewerSelect.appendChild(unassignedOption);
    }
  }

  function populateNewDocReviewerSelect(users) { 
    if (!newDocReviewerSelect) return;
    const firstOption = newDocReviewerSelect.options[0]; 
    newDocReviewerSelect.innerHTML = '';
    newDocReviewerSelect.appendChild(firstOption);

    const unassignedOption = document.createElement('option');
    unassignedOption.value = ""; 
    unassignedOption.textContent = "Unassigned";
    newDocReviewerSelect.appendChild(unassignedOption);

    if (users && Array.isArray(users)) {
      users.forEach(user => { 
        if (user.name && user.id) {
          const option = document.createElement('option');
          option.value = user.id; 
          option.textContent = user.name;
          newDocReviewerSelect.appendChild(option);
        }
      });
    }
  }

  function populateRemoveReviewerSelect(users) { 
    if (!removeReviewerSelect) return;
    const firstOption = removeReviewerSelect.options[0]; 
    removeReviewerSelect.innerHTML = '';
    removeReviewerSelect.appendChild(firstOption);

    if (users && Array.isArray(users)) {
      users.forEach(user => { 
        if (user.name && user.id) {
          const option = document.createElement('option');
          option.value = user.id; 
          option.textContent = user.name;
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

      if (!appData.users || !Array.isArray(appData.users) || !appData.documents || !Array.isArray(appData.documents)) {
        console.error('Data found is not in the expected format (users and documents arrays).');
        displayErrorMessageInTables('Error: Data is not in the expected format.');
        appData = { users: [], documents: [] }; 
      }
      
      populateTitleFilterDropdown(appData.documents); 
      populateReviewerFilterDropdown(appData.users);
      populateNewDocReviewerSelect(appData.users); 
      populateRemoveReviewerSelect(appData.users); 

      processAndDisplayReviews(appData); 

    } catch (error) {
      console.error('Error fetching or processing review data:', error);
      displayErrorMessageInTables('Error loading review data.');
      appData = { users: [], documents: [] }; 
      
      populateTitleFilterDropdown(appData.documents);
      populateReviewerFilterDropdown(appData.users);
      populateNewDocReviewerSelect(appData.users);
      populateRemoveReviewerSelect(appData.users);
    }
  }

  function processAndDisplayReviews(data) { 
    const { users, documents } = data; 

    const allUpcomingTasks = [];
    const allOverdueTasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!users || !Array.isArray(users) || !documents || !Array.isArray(documents)) {
      console.warn('processAndDisplayReviews called with invalid data structure (users/documents).');
      displayErrorMessageInTables('Error: Invalid data structure.');
      return;
    }

    documents.forEach(doc => {
      if (doc.status === 'Completed') return; 

      let reviewerName = "Unassigned";
      if (doc.assignedToUserId) {
        const assignedUser = users.find(user => user.id === doc.assignedToUserId);
        if (assignedUser) {
          reviewerName = assignedUser.name;
        } 
      }

      // Apply filters
      if (currentTitleFilter !== 'All' && doc.title !== currentTitleFilter) {
        return;
      }
      if (currentReviewerFilter !== 'All' && reviewerName !== currentReviewerFilter) {
        return;
      }
      if (currentStatusFilter !== 'All' && doc.status !== currentStatusFilter) {
        return;
      }
      
      const taskForTable = {
        task_id: doc.id, 
        title: doc.title,
        reviewer: reviewerName,
        dueDate: doc.dueDate,
        status: doc.status,
      };
      
      const dueDate = new Date(taskForTable.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate < today) allOverdueTasks.push(taskForTable);
      else allUpcomingTasks.push(taskForTable);
    });

    if (upcomingReviewsTbody) upcomingReviewsTbody.innerHTML = '';
    if (overdueReviewsTbody) overdueReviewsTbody.innerHTML = '';
    
    populateTable(upcomingReviewsTbody, allUpcomingTasks);
    populateTable(overdueReviewsTbody, allOverdueTasks);
  }
  
  function displayErrorMessageInTables(message) {
    const errorRow = `<tr><td colspan="5" class="text-center text-red-500 py-4">${message}</td></tr>`; 
    if (upcomingReviewsTbody) upcomingReviewsTbody.innerHTML = errorRow;
    if (overdueReviewsTbody) overdueReviewsTbody.innerHTML = errorRow;
  }

  function populateTable(tableBody, reviews) {
    if (!tableBody) return;
    tableBody.innerHTML = ''; 
    if (!reviews || reviews.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-4">No reviews to display.</td></tr>';
      return;
    }
    reviews.forEach(review => {
      const row = document.createElement('tr');
      row.className = 'border-t border-t-[#cde9df]';
      
      const titleCell = document.createElement('td');
      titleCell.className = 'h-[72px] px-4 py-2 w-[350px] text-[#0c1c17] text-sm font-normal leading-normal';
      titleCell.textContent = review.title;
      row.appendChild(titleCell);

      const reviewerCell = document.createElement('td');
      reviewerCell.className = 'h-[72px] px-4 py-2 w-[350px] text-[#46a080] text-sm font-normal leading-normal';
      reviewerCell.textContent = review.reviewer;
      row.appendChild(reviewerCell);

      const dueDateCell = document.createElement('td');
      dueDateCell.className = 'h-[72px] px-4 py-2 w-[300px] text-[#46a080] text-sm font-normal leading-normal';
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

      const actionsCell = document.createElement('td');
      actionsCell.className = 'h-[72px] px-4 py-2 w-40 text-sm font-normal leading-normal text-center';
      const removeButton = document.createElement('button');
      removeButton.className = 'remove-review-btn text-red-500 hover:text-red-700 font-medium';
      removeButton.textContent = 'Remove';
      removeButton.dataset.taskId = review.task_id; 
      actionsCell.appendChild(removeButton);
      row.appendChild(actionsCell);
      
      tableBody.appendChild(row);
    });
  }

  // Event Listeners for new filter dropdowns
  if (filterTitleSelect) {
    filterTitleSelect.addEventListener('change', (event) => { 
      currentTitleFilter = event.target.value; 
      processAndDisplayReviews(appData);
    });
  }

  if (filterReviewerSelect) {
    filterReviewerSelect.addEventListener('change', (event) => { 
      currentReviewerFilter = event.target.value; 
      processAndDisplayReviews(appData);
    });
  }

  if (filterStatusSelect) {
    filterStatusSelect.addEventListener('change', () => {
      currentStatusFilter = filterStatusSelect.value;
      processAndDisplayReviews(appData);
    });
  }

  // Event Listener for "Add New Review Document" form
  if (addDocumentForm) {
    addDocumentForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const newDocTitle = newDocTitleInput.value.trim();
      const selectedReviewerId = newDocReviewerSelect.value; 
      const newDocDueDate = newDocDueDateInput.value;

      if (!newDocTitle) { alert('Please enter a document title.'); return; }
      if (newDocReviewerSelect.value === "" && !selectedReviewerId && newDocReviewerSelect.options[newDocReviewerSelect.selectedIndex].text !== "Unassigned") { 
         alert('Please select a reviewer or "Unassigned".'); return;
      }
      if (!newDocDueDate) { alert('Please select a due date.'); return; }

      const newDocument = {
        id: 'doc' + Date.now(), 
        title: newDocTitle,
        type: "General", 
        dueDate: newDocDueDate,
        status: "Not Started",
        assignedToUserId: selectedReviewerId === "" ? null : selectedReviewerId 
      };

      if (!appData.documents) appData.documents = [];
      appData.documents.push(newDocument);
      
      const reviewer = appData.users.find(u => u.id === selectedReviewerId);
      const reviewerName = reviewer ? reviewer.name : "Unassigned";
      console.log(`New document "${newDocTitle}" assigned to ${reviewerName}. AppData:`, appData);

      processAndDisplayReviews(appData);
      populateTitleFilterDropdown(appData.documents); 
      populateReviewerFilterDropdown(appData.users); 

      addDocumentForm.reset();
      newDocReviewerSelect.value = ""; 
    });
  }

  // Event Delegation for Remove Buttons in tables
  function handleRemoveTask(event) {
    if (event.target.classList.contains('remove-review-btn')) {
      const button = event.target;
      const documentIdToRemove = button.dataset.taskId; 

      if (!documentIdToRemove) {
        console.error('Remove button is missing document ID.');
        return;
      }

      const docIndex = appData.documents.findIndex(doc => doc.id === documentIdToRemove);

      if (docIndex === -1) {
        console.error(`Document with ID ${documentIdToRemove} not found.`);
        return;
      }
      
      const removedDocument = appData.documents.splice(docIndex, 1)[0];
      console.log(`Removed document "${removedDocument.title}". AppData:`, appData);

      processAndDisplayReviews(appData);
      populateTitleFilterDropdown(appData.documents); 
      populateReviewerFilterDropdown(appData.users); 
    }
  }

  if (upcomingReviewsTbody) {
    upcomingReviewsTbody.addEventListener('click', handleRemoveTask);
  }
  if (overdueReviewsTbody) {
    overdueReviewsTbody.addEventListener('click', handleRemoveTask);
  }

  // Event Listener for "Add New Reviewer" form
  if (addReviewerForm) {
    addReviewerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const newReviewerName = newReviewerNameInput.value.trim();
      if (!newReviewerName) { alert('Please enter a reviewer name.'); return; }
      const nameExists = appData.users.some(user => user.name.toLowerCase() === newReviewerName.toLowerCase());
      if (nameExists) { alert('A reviewer with this name already exists.'); return; }

      const newUser = {
        id: 'user' + Date.now(), // Changed prefix to 'user'
        name: newReviewerName
      };

      if (!appData.users) appData.users = [];
      appData.users.push(newUser);
      console.log(`New reviewer "${newReviewerName}" added. AppData:`, appData);

      populateReviewerFilterDropdown(appData.users);
      populateNewDocReviewerSelect(appData.users);
      populateRemoveReviewerSelect(appData.users); 

      addReviewerForm.reset();
    });
  }

  // Event Listener for "Remove Reviewer" button
  if (removeReviewerButton) {
    removeReviewerButton.addEventListener('click', () => {
      const reviewerIdToRemove = removeReviewerSelect.value;
      if (!reviewerIdToRemove) { alert('Please select a reviewer to remove.'); return; }

      const userIndex = appData.users.findIndex(user => user.id === reviewerIdToRemove);
      if (userIndex === -1) { alert('Reviewer not found. Please refresh the list.'); return; }
      
      const removedUser = appData.users.splice(userIndex, 1)[0];
      console.log(`Removed reviewer "${removedUser.name}". AppData:`, appData);

      appData.documents.forEach(doc => {
        if (doc.assignedToUserId === reviewerIdToRemove) {
          doc.assignedToUserId = null; 
        }
      });

      processAndDisplayReviews(appData);
      populateTitleFilterDropdown(appData.documents);
      populateReviewerFilterDropdown(appData.users);
      populateNewDocReviewerSelect(appData.users);
      populateRemoveReviewerSelect(appData.users); 

      removeReviewerSelect.value = ""; 
    });
  }

  initialFetchAndDisplay();
});
