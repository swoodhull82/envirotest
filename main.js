import * as dataService from './dataService.js';
import { getElement, getElements, qs, qsa, getStatusClasses, populateSelectWithOptions, createOptionElement as createOptionElementFromUtils } from './utils.js'; // Ensure populateSelectWithOptions is imported

document.addEventListener('DOMContentLoaded', async () => {
  // Table bodies
  const reviewTableBodies = qsa('.layout-content-container table tbody');
  const upcomingReviewsTbody = reviewTableBodies[0];
  const overdueReviewsTbody = reviewTableBodies[1];

  // Variables for new filter inputs (ID names match the <select> elements)
  const filterTitleSelect = getElement('filterTitle');
  const filterReviewerSelect = getElement('filterReviewer');
  const filterStatusSelect = getElement('filterStatus');

  // Null checks for new filter elements - getElement handles null return if not found
  if (!filterTitleSelect) console.error('Filter Title Select element (filterTitle) not found!');
  if (!filterReviewerSelect) console.error('Filter Reviewer Select element (filterReviewer) not found!');
  if (!filterStatusSelect) console.error('Filter Status Select element (filterStatus) not found!');

  // Global variables to store current filter values
  let currentTitleFilter = 'All';
  let currentReviewerFilter = 'All';
  let currentStatusFilter = 'All';

  // DOM elements for "Add New Review Document" form - ENTIRELY REMOVED
  // Null checks for new document form elements - ENTIRELY REMOVED

  // DOM elements for "Add New Reviewer" form
  // const addReviewerForm = getElement('addReviewerForm'); // Removed
  // const newReviewerNameInput = getElement('newReviewerName'); // Removed

  // Null checks for new reviewer form elements
  // if (!addReviewerForm) console.error('Add Reviewer Form (addReviewerForm) not found!'); // Removed
  // if (!newReviewerNameInput) console.error('New Reviewer Name Input (newReviewerName) not found!'); // Removed

  // DOM elements for "Remove Reviewer" section
  // const removeReviewerSelect = getElement('removeReviewerSelect'); // Removed
  // const removeReviewerButton = getElement('removeReviewerButton'); // Removed

  // Null checks for remove reviewer elements
  // if (!removeReviewerSelect) console.error('Remove Reviewer Select (removeReviewerSelect) not found!'); // Removed
  // if (!removeReviewerButton) console.error('Remove Reviewer Button (removeReviewerButton) not found!'); // Removed

  // createOptionElement and populateSelectWithOptions are now imported from utils.js
  // The local definitions of these functions have been removed.

  async function populateAllDropdowns() {
    try {
      const users = await dataService.getUsers();
      const documents = await dataService.getDocuments();
      populateTitleFilterDropdown(documents);
      populateReviewerFilterDropdown(users);
      populateNewDocReviewerSelect(users);
      // populateRemoveReviewerSelect(users); // Removed
    } catch (error) {
      console.error('Error populating dropdowns:', error);
      // Potentially display an error message to the user
    }
  }

  function populateTitleFilterDropdown(docs) {
    if (!filterTitleSelect) return;
    populateSelectWithOptions(filterTitleSelect, docs, {
      valueKey: 'title',
      textKey: 'title',
      placeholder: { value: "All", text: "All Titles" }
    });
  }

  function populateReviewerFilterDropdown(users) {
    if (!filterReviewerSelect) return;
    // For reviewer filter, we are filtering by name, which is what reviewerName on document provides.
    // So, we extract unique names from users.
    const reviewerNames = users.map(u => u.name).filter(name => name); // Get names, filter out undefined/empty
    const uniqueReviewerItems = Array.from(new Set(reviewerNames)).map(name => ({ name: name }));

    populateSelectWithOptions(filterReviewerSelect, uniqueReviewerItems, {
      valueKey: 'name', // The value for the option will be the name itself
      textKey: 'name',  // The text displayed will be the name
      placeholder: { value: "All", text: "All Reviewers" },
      includeUnassigned: true, // This will add an "Unassigned" option by name
      unassignedValue: "Unassigned", // Value for the unassigned option
      unassignedText: "Unassigned"
    });
  }

  function populateNewDocReviewerSelect(users) {
    if (!newDocReviewerSelect) return;
    populateSelectWithOptions(newDocReviewerSelect, users, {
      valueKey: 'id',
      textKey: 'name',
      placeholder: { value: "", text: "Select Reviewer", disabled: true },
      includeUnassigned: true, // Adds an "Unassigned" option with value ""
      unassignedValue: "", // Value for unassigned (null user ID)
      unassignedText: "Unassigned"
    });
    // Ensure the "Select Reviewer" (disabled placeholder) is selected by default if no other value.
    if (!newDocReviewerSelect.value && newDocReviewerSelect.options.length > 0 && newDocReviewerSelect.options[0].disabled) {
      newDocReviewerSelect.options[0].selected = true;
    }
  }

  // function populateRemoveReviewerSelect(users) { // Removed
  //   if (!removeReviewerSelect) return;
  //   populateSelectWithOptions(removeReviewerSelect, users, {
  //     valueKey: 'id',
  //     textKey: 'name',
  //     placeholder: { value: "", text: "Select Reviewer", disabled: true }
  //   });
  //    // Ensure the "Select Reviewer" (disabled placeholder) is selected by default if no other value.
  //   if (!removeReviewerSelect.value && removeReviewerSelect.options.length > 0 && removeReviewerSelect.options[0].disabled) {
  //     removeReviewerSelect.options[0].selected = true;
  //   }
  // }

  async function initialFetchAndDisplay() {
    try {
      await dataService.fetchData();
      await refreshAllDataAndDisplays();
    } catch (error) {
      console.error('Error fetching initial data:', error);
      displayErrorMessageInTables('Error loading review data. Please try refreshing the page.');
      // Attempt to populate dropdowns with empty data to avoid breaking UI
      populateTitleFilterDropdown([]);
      populateReviewerFilterDropdown([]);
      populateNewDocReviewerSelect([]);
      // populateRemoveReviewerSelect([]); // Removed
    }
  }

  async function refreshAllDataAndDisplays() {
    try {
      const documents = await dataService.getDocuments();
      const users = await dataService.getUsers();
      processAndDisplayReviews(documents, users); // users might not be strictly needed if reviewerName is on docs
      await populateAllDropdowns(); // This will fetch users and documents again, can be optimized
    } catch (error) {
      console.error('Error refreshing data and displays:', error);
      displayErrorMessageInTables('Error refreshing review data.');
    }
  }


  async function processAndDisplayReviews(documents, users) { // users param might be redundant
    const allUpcomingTasks = [];
    const allOverdueTasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!Array.isArray(documents)) {
      console.warn('processAndDisplayReviews called with invalid documents data.');
      displayErrorMessageInTables('Error: Invalid document data structure.');
      return;
    }

    documents.forEach(doc => {
      if (doc.status === 'Completed') return;

      // reviewerName should be directly on the document object from dataService
      const reviewerName = doc.reviewerName || "Unassigned";

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

  /**
   * Creates a table cell element.
   * @param {string} text - The text content for the cell.
   * @param {string} className - The CSS class(es) for the cell.
   * @returns {HTMLTableCellElement} The created table cell element.
   */
  function createTableCell(text, className) {
    const cell = document.createElement('td');
    cell.className = className;
    cell.textContent = text;
    return cell;
  }

  /**
   * Creates a status button element for a review task.
   * @param {Object} review - The review task object.
   * @returns {HTMLButtonElement} The created status button.
   */
  function createStatusButtonElement(review) {
    const statusButton = document.createElement('button');
    statusButton.className = 'flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 text-sm font-medium leading-normal w-full';

    // Remove all possible old status classes before adding new ones
    // Use a comprehensive list of statuses that might have been applied
    const allPossibleStatuses = ["Overdue", "In Progress", "Not Started", "Completed", "Other"]; // "Other" for default
    allPossibleStatuses.forEach(s => {
        const classesToRemove = getStatusClasses(s).full;
        if (classesToRemove && classesToRemove.length > 0) {
            statusButton.classList.remove(...classesToRemove);
        }
    });
    // Also remove the base default classes explicitly if they are different or added separately
    const defaultClasses = getStatusClasses("").full; // Assuming "" gives default
    statusButton.classList.remove(...defaultClasses);


    const statusStyle = getStatusClasses(review.status);
    statusButton.classList.add(...statusStyle.full);
    statusButton.innerHTML = `<span class="truncate">${review.status}</span>`;
    return statusButton;
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
      
      row.appendChild(createTableCell(review.title, 'h-[72px] px-4 py-2 w-[350px] text-[#0c1c17] text-sm font-normal leading-normal'));
      row.appendChild(createTableCell(review.reviewer, 'h-[72px] px-4 py-2 w-[350px] text-[#46a080] text-sm font-normal leading-normal'));
      row.appendChild(createTableCell(review.dueDate, 'h-[72px] px-4 py-2 w-[300px] text-[#46a080] text-sm font-normal leading-normal'));

      const statusCell = createTableCell('', 'h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal');
      statusCell.appendChild(createStatusButtonElement(review));
      row.appendChild(statusCell);

      const actionsCell = createTableCell('', 'h-[72px] px-4 py-2 w-40 text-sm font-normal leading-normal text-center');
      const removeReviewButton = document.createElement('button');
      removeReviewButton.className = 'remove-review-btn text-red-500 hover:text-red-700 font-medium';
      removeReviewButton.textContent = 'Remove';
      removeReviewButton.dataset.taskId = review.task_id;
      actionsCell.appendChild(removeReviewButton);
      row.appendChild(actionsCell);
      
      tableBody.appendChild(row);
    });
  }

