import * as dataService from './dataService.js';
import { getElement, getStatusClasses } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Existing DOM elements
    const prevMonthBtn = getElement('prevMonthBtn');
    const nextMonthBtn = getElement('nextMonthBtn');
    const monthYearDisplay = getElement('monthYearDisplay');
    const calendarGrid = getElement('calendarGrid');
    const tasksForSelectedDayContainer = getElement('tasksForSelectedDayContainer');
    const tasksForSelectedDayHeading = getElement('tasksForSelectedDayHeading');
    const taskListUL = getElement('taskList');

    // View switching DOM elements
    const monthViewBtn = getElement('monthViewBtn');
    const weekViewBtn = getElement('weekViewBtn');
    const agendaViewBtn = getElement('agendaViewBtn');

    const agendaViewContainer = getElement('agendaViewContainer');
    const agendaListUL = getElement('agendaList');
    const agendaViewHeading = getElement('agendaViewHeading');

    const weekViewContainer = getElement('weekViewContainer');
    const weekViewHeadingEl = getElement('weekViewHeading'); // Renamed for clarity

    // Null checks (getElement returns null if not found, so subsequent checks are useful)
    if (!prevMonthBtn || !nextMonthBtn || !monthYearDisplay) console.error("Month/Week navigation controls missing!");
    if (!calendarGrid) console.error('Calendar Grid (calendarGrid) not found!');
    if (!tasksForSelectedDayContainer) console.error('Tasks For Selected Day Container not found!');
    if (!monthViewBtn) console.error('Month View Button (monthViewBtn) not found!');
    if (!weekViewBtn) console.error('Week View Button (weekViewBtn) not found!');
    if (!agendaViewBtn) console.error('Agenda View Button (agendaViewBtn) not found!');
    if (!agendaViewContainer) console.error('Agenda View Container (agendaViewContainer) not found!');
    if (!agendaListUL) console.error('Agenda List UL (agendaList) not found!');
    if (!agendaViewHeading) console.error('Agenda View Heading (agendaViewHeading) not found!');
    if (!weekViewContainer) console.error('Week View Container (weekViewContainer) not found!');
    if (!weekViewHeadingEl) console.error('Week View Heading (weekViewHeadingEl) not found!');


    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let currentWeekStartDate = null;

    let allTasks = []; // This will store documents from dataService
    let previouslySelectedCell = null;

    const activeViewClasses = ['bg-teal-500', 'text-white'];
    const inactiveViewClasses = ['bg-gray-200', 'text-gray-700', 'hover:bg-gray-300'];

    const viewButtons = [monthViewBtn, weekViewBtn, agendaViewBtn].filter(btn => btn != null);

    function initializeCurrentWeekStartDate() {
        const today = new Date();
        currentWeekStartDate = new Date(today.setDate(today.getDate() - today.getDay()));
        currentWeekStartDate.setHours(0, 0, 0, 0);
    }

    async function fetchAndProcessTasks() {
        try {
            // Documents are fetched with reviewerName already by dataService
            const documents = await dataService.getDocuments();
            // Transform documents to the structure expected by calendar functions
            allTasks = documents
                .filter(doc => doc.status !== 'Completed')
                .map(doc => ({
                    date: doc.dueDate, // Used for month view highlighting and daily task list
                    startDate: doc.startDate, // Used for week view range
                    completionDate: doc.completionDate, // Used for week view range
                    title: doc.title,
                    employeeName: doc.reviewerName || "Unassigned", // reviewerName is from dataService
                    status: doc.status,
                    id: doc.id
                }));
        } catch (error) {
            console.error('Error fetching or processing tasks via dataService:', error);
            allTasks = [];
            // Display an error message to the user in the calendar views
            if (calendarGrid) calendarGrid.innerHTML = '<p class="text-red-500 text-center col-span-full">Error loading tasks. Please try again.</p>';
            if (agendaListUL) agendaListUL.innerHTML = '<li class="text-red-500">Error loading tasks.</li>';
            if (weekViewContainer) weekViewContainer.innerHTML = '<p class="text-red-500 text-center col-span-full">Error loading tasks.</p>';
        }
    }

    /**
     * Appends a specified number of empty cells to a parent element.
     * @param {HTMLElement} parentElement - The parent element to append cells to.
     * @param {number} count - The number of empty cells to append.
     */
    function appendEmptyCells(parentElement, count) {
        for (let i = 0; i < count; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'border border-gray-300 p-2 h-24'; // Style for empty cells
            parentElement.appendChild(emptyCell);
        }
    }

    /**
     * Creates a single day cell element for the calendar month view.
     * @param {number} day - The day number.
     * @param {number} currentYear - The current year being rendered.
     * @param {number} currentMonth - The current month being rendered (0-indexed).
     * @param {Array<Object>} tasks - All tasks to check against for due dates.
     * @returns {HTMLDivElement} The created day cell element.
     */
    function createCalendarDayCell(day, currentYear, currentMonth, tasks) {
        const dayCell = document.createElement('div');
        dayCell.className = 'border border-gray-300 p-2 h-24 relative cursor-pointer hover:bg-gray-100 flex flex-col items-center justify-center';

        const dayNumberSpan = document.createElement('span');
        dayNumberSpan.textContent = day;
        dayNumberSpan.className = 'calendar-day-number inline-block w-7 h-7 leading-7 text-center rounded-full';
        dayCell.appendChild(dayNumberSpan);

        const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayCell.dataset.date = cellDateStr;

        if (cellDateStr === new Date().toISOString().split('T')[0]) {
            dayCell.classList.add('today');
        }

        const tasksForDay = tasks.filter(task => task.date === cellDateStr);
        if (tasksForDay.length > 0) {
            dayCell.classList.add('has-due-date');
        }

        dayCell.addEventListener('click', (event) => {
            if (previouslySelectedCell) {
                previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
            }
            const clickedCell = event.currentTarget;
            clickedCell.classList.add('ring-2', 'ring-teal-500', 'bg-gray-100');
            previouslySelectedCell = clickedCell;
            if (tasksForSelectedDayContainer) displayTasksForDay(cellDateStr); // Ensure tasksForSelectedDayContainer is accessible
        });
        return dayCell;
    }


    function renderCalendar() {
        if (!calendarGrid || !monthYearDisplay) return;
        calendarGrid.innerHTML = '';
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(dayName => { // Corrected variable name from day to dayName
            const dayHeaderCell = document.createElement('div'); // Corrected variable name
            dayHeaderCell.className = 'text-center text-sm font-medium text-gray-700 border border-gray-300 p-2';
            dayHeaderCell.textContent = dayName; // Corrected variable name
            calendarGrid.appendChild(dayHeaderCell); // Corrected variable name
        });

        monthYearDisplay.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        appendEmptyCells(calendarGrid, firstDayOfMonth); // Use helper

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = createCalendarDayCell(day, currentYear, currentMonth, allTasks); // Use helper
            calendarGrid.appendChild(dayCell);
        }
    }

    /**
     * Creates a list item element for a task.
     * @param {Object} task - The task object.
     * @param {boolean} isAgendaStyle - True if styling for agenda view, false for daily task list.
     * @returns {HTMLLIElement} The created list item element.
     */
    function createTaskListItemElement(task, isAgendaStyle = false) {
        const li = document.createElement('li');
        if (isAgendaStyle) {
            li.className = 'mb-3 p-3 border border-gray-200 rounded-md shadow-sm bg-white';
            const titleP = document.createElement('p');
            titleP.className = 'font-semibold text-gray-800 mb-1';
            titleP.textContent = task.title;
            li.appendChild(titleP);

            const reviewerP = document.createElement('p');
            reviewerP.className = 'text-sm text-gray-600 mb-1';
            reviewerP.textContent = `Reviewer: ${task.employeeName}`;
            li.appendChild(reviewerP);

            const statusP = document.createElement('p');
            statusP.className = `text-sm ${getStatusClasses(task.status).text}`;
            statusP.textContent = `Status: ${task.status}`;
            li.appendChild(statusP);
        } else {
            li.className = 'mb-2 p-2 border-b border-gray-200 text-sm';
            const statusColor = getStatusClasses(task.status).text;
            li.innerHTML = `<span class="font-medium">${task.title}</span> - ${task.employeeName} (<span class="${statusColor} italic">${task.status}</span>)`;
        }
        return li;
    }

    function displayTasksForDay(dateStr) {
        if (!tasksForSelectedDayHeading || !taskListUL || !tasksForSelectedDayContainer) return;
        // Uses 'date' which is doc.dueDate
        const tasks = allTasks.filter(task => task.date === dateStr);
        tasksForSelectedDayHeading.textContent = `Tasks for ${dateStr}:`;
        taskListUL.innerHTML = '';

        if (tasks.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No tasks for this day.';
            li.className = 'text-gray-500 p-2';
            taskListUL.appendChild(li);
            tasksForSelectedDayContainer.classList.remove('hidden');
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'mb-2 p-2 border-b border-gray-200 text-sm';
            const statusColor = getStatusClasses(task.status).text; // Use text color from utils
            li.innerHTML = `<span class="font-medium">${task.title}</span> - ${task.employeeName} (<span class="${statusColor} italic">${task.status}</span>)`;
            taskListUL.appendChild(li);
        });
        tasksForSelectedDayContainer.classList.remove('hidden');
    }

    function renderAgendaView() {
        if (!agendaViewContainer || !agendaListUL || !agendaViewHeading) {
            console.error("Agenda view containers not found!");
            return;
        }
        agendaViewHeading.textContent = 'Upcoming Reviews';
        agendaListUL.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Uses 'date' which is doc.dueDate
        const upcomingTasks = allTasks.filter(task => new Date(task.date) >= today);
        upcomingTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingTasks.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No upcoming reviews.';
            li.className = 'text-gray-500 p-2';
            agendaListUL.appendChild(li);
            return;
        }
        let lastDate = null;
        upcomingTasks.forEach(task => {
            if (task.date !== lastDate) {
                const dateHeadingLi = document.createElement('li');
                dateHeadingLi.className = 'mt-4 mb-2 pt-2 border-t border-gray-300';
                const h4 = document.createElement('h4');
                h4.className = 'text-md font-bold text-gray-700';
                h4.textContent = task.date;
                dateHeadingLi.appendChild(h4);
                agendaListUL.appendChild(dateHeadingLi);
                lastDate = task.date;
            }
            const li = document.createElement('li');
            li.className = 'mb-3 p-3 border border-gray-200 rounded-md shadow-sm bg-white';
            const titleP = document.createElement('p');
            titleP.className = 'font-semibold text-gray-800 mb-1';
            titleP.textContent = task.title;
            li.appendChild(titleP);
            const reviewerP = document.createElement('p');
            reviewerP.className = 'text-sm text-gray-600 mb-1';
            reviewerP.textContent = `Reviewer: ${task.employeeName}`;
            li.appendChild(reviewerP);
            const statusP = document.createElement('p');
            statusP.className = `text-sm ${getStatusClasses(task.status).text}`; // Use text color from utils
            statusP.textContent = `Status: ${task.status}`;
            li.appendChild(statusP);
            agendaListUL.appendChild(createTaskListItemElement(task, true));
        });
    }

    /**
     * Creates a task element for the week view.
     * @param {Object} task - The task object.
     * @returns {HTMLDivElement} The created task element.
     */
    function createWeekTaskElement(task) {
        const taskElement = document.createElement('div');
        // Uses background color from getStatusClasses and white text, truncated
        taskElement.className = `p-1 mb-1 rounded shadow-sm text-xs ${getStatusClasses(task.status).bg} text-white truncate`;
        taskElement.textContent = task.title;
        return taskElement;
    }

    /**
     * Creates and configures a single day column for the week view.
     * @param {Date} date - The date for this column.
     * @param {Array<Object>} tasks - All tasks to filter for this day.
     * @returns {HTMLDivElement} The created day column element.
     */
    function createWeekDayColumn(date, tasks) {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'border border-gray-300 p-2 overflow-y-auto min-h-[120px]';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date.getTime() === today.getTime()) {
            dayColumn.classList.add('bg-teal-50'); // Highlight today's column
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'text-center text-sm font-semibold mb-2 text-gray-700';
        dayNumber.textContent = date.getDate();
        dayColumn.appendChild(dayNumber);

        const tasksForThisDay = tasks.filter(task => {
            const taskStart = new Date(task.startDate);
            taskStart.setHours(0, 0, 0, 0);
            let taskEnd;
            if (task.completionDate) {
                taskEnd = new Date(task.completionDate);
            } else if (task.date) { // task.date is originally doc.dueDate
                taskEnd = new Date(task.date);
            } else {
                taskEnd = new Date(task.startDate); // Fallback if no end date
            }
            taskEnd.setHours(0, 0, 0, 0);
            return date >= taskStart && date <= taskEnd;
        });

        if (tasksForThisDay.length > 0) {
            tasksForThisDay.forEach(task => {
                dayColumn.appendChild(createWeekTaskElement(task));
            });
        }
        return dayColumn;
    }


    function renderWeekView() {
        if (!weekViewContainer || !monthYearDisplay) return;

        if (!currentWeekStartDate) {
            initializeCurrentWeekStartDate();
        }

        weekViewContainer.innerHTML = ''; // Clear previous content

        // const heading = document.createElement('h3'); // Original heading, if needed dynamically
        // heading.id = 'weekViewHeading';
        // heading.className = 'text-lg font-semibold mb-2 text-center';
        // weekViewContainer.appendChild(heading);


        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStartDate);
            date.setDate(currentWeekStartDate.getDate() + i);
            weekDates.push(date);
        }

        const firstDayOfWeekStr = weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const lastDayOfWeekStr = weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        if (monthYearDisplay) monthYearDisplay.textContent = `Week: ${firstDayOfWeekStr} - ${lastDayOfWeekStr}`;
        // HTML has a static "Week View" h3, so dynamic update of weekViewHeadingEl might not be needed unless design changes.
        // if (weekViewHeadingEl) weekViewHeadingEl.textContent = `Week of ${firstDayOfWeekStr} - ${lastDayOfWeekStr}`;


        const dayHeaderRow = document.createElement('div');
        dayHeaderRow.className = 'grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-700';
        const daysOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // Corrected variable name
        daysOfWeekNames.forEach(dayName => {
            const headerCell = document.createElement('div');
            headerCell.className = 'p-2 border-b border-gray-300';
            headerCell.textContent = dayName;
            dayHeaderRow.appendChild(headerCell);
        });
        weekViewContainer.appendChild(dayHeaderRow);

        const weekGrid = document.createElement('div');
        weekGrid.className = 'grid grid-cols-7 gap-1 h-[calc(100vh-280px)]'; // Consider dynamic height or CSS solution
        weekViewContainer.appendChild(weekGrid);

        weekDates.forEach(date => {
            const dayColumn = createWeekDayColumn(date, allTasks); // Use helper
            weekGrid.appendChild(dayColumn);
        });
    }

    function updateButtonStyles(activeButtonId) {
        viewButtons.forEach(button => {
            if (!button) return;
            if (button.id === activeButtonId) {
                button.classList.remove(...inactiveViewClasses);
                button.classList.add(...activeViewClasses);
            } else {
                button.classList.remove(...activeViewClasses);
                button.classList.add(...inactiveViewClasses);
            }
        });
    }

    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', () => {
            if (calendarGrid) calendarGrid.classList.remove('hidden');
            if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden');
            if (agendaViewContainer) agendaViewContainer.classList.add('hidden');
            if (weekViewContainer) weekViewContainer.classList.add('hidden');

            updateButtonStyles('monthViewBtn');
            if (previouslySelectedCell) {
                previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
                previouslySelectedCell = null;
            }
            currentMonth = new Date(currentYear, currentMonth).getMonth();
            currentYear = new Date(currentYear, currentMonth).getFullYear();
            renderCalendar();
        });
    }

    if (weekViewBtn) {
        weekViewBtn.addEventListener('click', () => {
            if (calendarGrid) calendarGrid.classList.add('hidden');
            if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden');
            if (agendaViewContainer) agendaViewContainer.classList.add('hidden');
            if (weekViewContainer) weekViewContainer.classList.remove('hidden');

            updateButtonStyles('weekViewBtn');
            if (!currentWeekStartDate) initializeCurrentWeekStartDate();
            renderWeekView();
        });
    }

    if (agendaViewBtn) {
        agendaViewBtn.addEventListener('click', () => {
            if (calendarGrid) calendarGrid.classList.add('hidden');
            if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden');
            if (weekViewContainer) weekViewContainer.classList.add('hidden');
            if (agendaViewContainer) agendaViewContainer.classList.remove('hidden');

            updateButtonStyles('agendaViewBtn');
            renderAgendaView();
        });
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (weekViewContainer && !weekViewContainer.classList.contains('hidden')) {
                if (!currentWeekStartDate) initializeCurrentWeekStartDate();
                currentWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);
                renderWeekView();
            } else {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                if (previouslySelectedCell) {
                    previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
                    previouslySelectedCell = null;
                }
                if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden');
                renderCalendar();
            }
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (weekViewContainer && !weekViewContainer.classList.contains('hidden')) {
                if (!currentWeekStartDate) initializeCurrentWeekStartDate();
                currentWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
                renderWeekView();
            } else {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                if (previouslySelectedCell) {
                    previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
                    previouslySelectedCell = null;
                }
                if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden');
                renderCalendar();
            }
        });
    }

    async function initCalendar() {
        if (!currentWeekStartDate) initializeCurrentWeekStartDate();
        try {
            await dataService.fetchData(); // Ensure data is loaded once
            await fetchAndProcessTasks(); // Process the loaded data

            // Initial view setup
            if (calendarGrid) calendarGrid.classList.remove('hidden');
            if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden');
            if (agendaViewContainer) agendaViewContainer.classList.add('hidden');
            if (weekViewContainer) weekViewContainer.classList.add('hidden');
            updateButtonStyles('monthViewBtn');
            renderCalendar(); // Render the default month view
        } catch (error) {
            console.error("Failed to initialize calendar:", error);
            if (monthYearDisplay) monthYearDisplay.textContent = "Error loading data";
            // Display a comprehensive error message in the main content area
            const mainContentArea = calendarGrid || weekViewContainer || agendaViewContainer;
            if (mainContentArea) {
                mainContentArea.innerHTML = `<p class="text-red-500 text-center p-4 col-span-full">Could not load calendar data. Please ensure 'data.json' is accessible or try refreshing the page.</p>`;
            }
        }
    }

    initCalendar();
});
