import * as dataService from './dataService.js';
import { getElement, getElements, qs, qsa, getStatusClasses } from './utils.js';

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

  // DOM elements for "Add New Review Document" form
  const addDocumentForm = getElement('addDocumentForm');
  const newDocTitleInput = getElement('newDocTitle');
  const newDocReviewerSelect = getElement('newDocReviewerSelect');
  const newDocStartDateInput = getElement('newDocStartDate');
  const newDocDueDateInput = getElement('newDocDueDate');

  // Null checks for new document form elements
  if (!addDocumentForm) console.error('Add Document Form (addDocumentForm) not found!');
  if (!newDocTitleInput) console.error('New Document Title Input (newDocTitle) not found!');
  if (!newDocReviewerSelect) console.error('New Document Reviewer Select (newDocReviewerSelect) not found!');
  if (!newDocStartDateInput) console.error('New Document Start Date Input (newDocStartDate) not found!');
  if (!newDocDueDateInput) console.error('New Document Due Date Input (newDocDueDate) not found!');

  // DOM elements for "Add New Reviewer" form
  const addReviewerForm = getElement('addReviewerForm');
  const newReviewerNameInput = getElement('newReviewerName');

  // Null checks for new reviewer form elements
  if (!addReviewerForm) console.error('Add Reviewer Form (addReviewerForm) not found!');
  if (!newReviewerNameInput) console.error('New Reviewer Name Input (newReviewerName) not found!');

  // DOM elements for "Remove Reviewer" section
  const removeReviewerSelect = getElement('removeReviewerSelect');
  const removeReviewerButton = getElement('removeReviewerButton');

  // Null checks for remove reviewer elements
  if (!removeReviewerSelect) console.error('Remove Reviewer Select (removeReviewerSelect) not found!');
  if (!removeReviewerButton) console.error('Remove Reviewer Button (removeReviewerButton) not found!');

  /**
   * Creates an option element.
   * @param {string} value - The value for the option.
   * @param {string} text - The text content for the option.
   * @param {boolean} [disabled=false] - Whether the option should be disabled.
   * @param {boolean} [selected=false] - Whether the option should be selected.
   * @returns {HTMLOptionElement} The created option element.
   */
  function createOptionElement(value, text, disabled = false, selected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    option.disabled = disabled;
    option.selected = selected;
    return option;
  }

  /**
   * Populates a select element with options from a data array.
   * @param {HTMLSelectElement} selectElement - The select element to populate.
   * @param {Array<Object>} items - The array of data items.
   * @param {Object} config - Configuration object.
   * @param {string|Function} config.valueKey - Key or function to get option value from an item.
   * @param {string|Function} config.textKey - Key or function to get option text from an item.
   * @param {Object} [config.placeholder] - Optional placeholder.
   * @param {string} config.placeholder.value - Value for the placeholder.
   * @param {string} config.placeholder.text - Text for the placeholder.
   * @param {boolean} [config.placeholder.disabled=false] - If placeholder is disabled.
   * @param {boolean} [config.includeUnassigned=false] - Whether to include a generic "Unassigned" option (for user/reviewer selects).
   * @param {string} [config.unassignedValue=""] - Value for the "Unassigned" option.
   * @param {string} [config.unassignedText="Unassigned"] - Text for the "Unassigned" option.
   */
  function populateSelectWithOptions(selectElement, items, config) {
    if (!selectElement) return;

    const currentSelectedValue = selectElement.value;
    selectElement.innerHTML = ''; // Clear existing options

    // Add placeholder if configured
    if (config.placeholder) {
      selectElement.appendChild(
        createOptionElement(config.placeholder.value, config.placeholder.text, config.placeholder.disabled || false)
      );
    }
    
    // Add "Unassigned" option if configured (typically for reviewer selects)
    if (config.includeUnassigned) {
        selectElement.appendChild(
            createOptionElement(config.unassignedValue !== undefined ? config.unassignedValue : "", config.unassignedText || "Unassigned")
        );
    }

    const uniqueOptions = new Map(); // To handle cases where text or value might not be unique if derived

    if (items && Array.isArray(items)) {
      items.forEach(item => {
        const value = typeof config.valueKey === 'function' ? config.valueKey(item) : item[config.valueKey];
        const text = typeof config.textKey === 'function' ? config.textKey(item) : item[config.textKey];
        if (value !== undefined && text !== undefined) {
            if(!uniqueOptions.has(value)){ // Add only if value is unique to avoid duplicate value attributes
                uniqueOptions.set(value, text);
            }
        }
      });
    }
    
    uniqueOptions.forEach((text, value) => {
        selectElement.appendChild(createOptionElement(value, text));
    });


    // Attempt to restore selection or set to placeholder/default
    if (Array.from(selectElement.options).some(opt => opt.value === currentSelectedValue)) {
      selectElement.value = currentSelectedValue;
    } else if (config.placeholder) {
      selectElement.value = config.placeholder.value;
    } else if (config.includeUnassigned) {
      selectElement.value = config.unassignedValue !== undefined ? config.unassignedValue : "";
    } else if (selectElement.options.length > 0) {
      selectElement.value = selectElement.options[0].value; // Fallback to the first option
    }

    // Ensure the placeholder is selected if its value matches the final selectElement.value and it's disabled
     if (config.placeholder && selectElement.value === config.placeholder.value && config.placeholder.disabled) {
        const placeholderOption = Array.from(selectElement.options).find(opt => opt.value === config.placeholder.value);
        if (placeholderOption) placeholderOption.selected = true;
    }
  }


  async function populateAllDropdowns() {
    try {
      const users = await dataService.getUsers();
      const documents = await dataService.getDocuments();
      populateTitleFilterDropdown(documents);
      populateReviewerFilterDropdown(users);
      populateNewDocReviewerSelect(users);
      populateRemoveReviewerSelect(users);
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

  function populateRemoveReviewerSelect(users) {
    if (!removeReviewerSelect) return;
    populateSelectWithOptions(removeReviewerSelect, users, {
      valueKey: 'id',
      textKey: 'name',
      placeholder: { value: "", text: "Select Reviewer", disabled: true }
    });
     // Ensure the "Select Reviewer" (disabled placeholder) is selected by default if no other value.
    if (!removeReviewerSelect.value && removeReviewerSelect.options.length > 0 && removeReviewerSelect.options[0].disabled) {
      removeReviewerSelect.options[0].selected = true;
    }
  }

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
      populateRemoveReviewerSelect([]);
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

