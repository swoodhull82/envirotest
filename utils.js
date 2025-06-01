/**
 * DOM Selection Utilities
 */

/**
 * Gets an element by its ID.
 * @param {string} id - The ID of the element.
 * @returns {HTMLElement|null} The element, or null if not found.
 */
export function getElement(id) {
  return document.getElementById(id);
}

/**
 * Gets all elements matching a CSS selector.
 * @param {string} selector - The CSS selector.
 * @returns {NodeListOf<Element>} A NodeList of elements.
 */
export function getElements(selector) {
  return document.querySelectorAll(selector);
}

/**
 * Gets the first element matching a CSS selector within an optional parent.
 * @param {string} selector - The CSS selector.
 * @param {Element|Document} [parent=document] - The parent element to search within.
 * @returns {Element|null} The first matching element, or null if not found.
 */
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Gets all elements matching a CSS selector within an optional parent.
 * @param {string} selector - The CSS selector.
 * @param {Element|Document} [parent=document] - The parent element to search within.
 * @returns {NodeListOf<Element>} A NodeList of elements.
 */
export function qsa(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * Status Styling Utility
 */

const defaultStatusClasses = ['bg-[#e6f4ef]', 'text-[#0c1c17]']; // Default background and text
const statusClassMap = {
  "Overdue": {
    text: 'text-red-700', // For general text
    bg: 'bg-red-200',     // For backgrounds like buttons/badges
    full: ['bg-red-200', 'text-red-700'] // For elements needing both
  },
  "In Progress": {
    text: 'text-yellow-700',
    bg: 'bg-yellow-100',
    full: ['bg-yellow-100', 'text-yellow-700']
  },
  "Not Started": {
    text: 'text-blue-700',
    bg: 'bg-blue-100',
    full: ['bg-blue-100', 'text-blue-700']
  },
  "Completed": {
    text: 'text-green-700',
    bg: 'bg-green-100',
    full: ['bg-green-100', 'text-green-700']
  }
};

/**
 * Gets an object containing CSS classes for a given status.
 * The object has properties:
 * - `text`: Class for text color (e.g., 'text-red-700')
 * - `bg`: Class for background color (e.g., 'bg-red-200')
 * - `full`: Array of classes for both background and text (e.g., ['bg-red-200', 'text-red-700'])
 *
 * @param {string} status - The status string (e.g., "Overdue", "In Progress").
 * @returns {{text: string, bg: string, full: string[]}} An object with text, bg, and full class arrays.
 */
export function getStatusClasses(status) {
  const statusConfig = statusClassMap[status];
  if (statusConfig) {
    return statusConfig;
  }
  // Return default if status is not in map
  return {
    text: defaultStatusClasses[1], // text color is the second element
    bg: defaultStatusClasses[0],   // bg color is the first element
    full: [...defaultStatusClasses]
  };
}

/**
 * Creates an option element.
 * @param {string} value - The value for the option.
 * @param {string} text - The text content for the option.
 * @param {boolean} [disabled=false] - Whether the option should be disabled.
 * @param {boolean} [selected=false] - Whether the option should be selected.
 * @returns {HTMLOptionElement} The created option element.
 */
export function createOptionElement(value, text, disabled = false, selected = false) {
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
 * @param {Object} [config.initialUnselected] - Optional initial unselected, disabled option.
 * @param {string} config.initialUnselected.value - Value for this initial option (usually "").
 * @param {string} config.initialUnselected.text - Text for this initial option (e.g., "Select Reviewer").
 * @param {boolean} [config.includeUnassigned=false] - Whether to include a generic "Unassigned" option.
 * @param {string} [config.unassignedValue=""] - Value for the "Unassigned" option.
 * @param {string} [config.unassignedText="Unassigned"] - Text for the "Unassigned" option.
 * @param {string} [config.currentValue] - The current value that should be selected if present.
 */
export function populateSelectWithOptions(selectElement, config) {
  if (!selectElement) return;

  const currentSelectedValue = config.currentValue !== undefined ? config.currentValue : selectElement.value;
  selectElement.innerHTML = ''; // Clear existing options

  // Add initial unselected, disabled option if configured
  if (config.initialUnselected) {
    selectElement.appendChild(
      createOptionElement(config.initialUnselected.value, config.initialUnselected.text, true, false) // disabled, not selected by default here
    );
  }

  // Add placeholder if configured (often used as the "All" or default filter option)
  if (config.placeholder) {
    selectElement.appendChild(
      createOptionElement(config.placeholder.value, config.placeholder.text, config.placeholder.disabled || false)
    );
  }

  // Add "Unassigned" option if configured
  if (config.includeUnassigned) {
      selectElement.appendChild(
          createOptionElement(config.unassignedValue !== undefined ? config.unassignedValue : "", config.unassignedText || "Unassigned")
      );
  }

  const uniqueOptions = new Map();

  if (config.items && Array.isArray(config.items)) {
    config.items.forEach(item => {
      const value = typeof config.valueField === 'function' ? config.valueField(item) : item[config.valueField];
      const text = typeof config.textField === 'function' ? config.textField(item) : item[config.textField];
      if (value !== undefined && text !== undefined) {
          if(!uniqueOptions.has(value)){
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
  } else if (config.initialUnselected && config.initialUnselected.value === "") {
    // If there was an initial unselected option like "Select Reviewer" and no other value matches, select it.
    selectElement.value = config.initialUnselected.value;
  } else if (config.placeholder) {
    selectElement.value = config.placeholder.value;
  } else if (selectElement.options.length > 0) {
    selectElement.value = selectElement.options[0].value;
  }

  // Ensure the initialUnselected (disabled) option is selected if it's the intended default
  if (config.initialUnselected && selectElement.value === config.initialUnselected.value) {
      const initialOpt = Array.from(selectElement.options).find(opt => opt.value === config.initialUnselected.value && opt.disabled);
      if (initialOpt) initialOpt.selected = true;
  }
}
