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
