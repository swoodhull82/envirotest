document.addEventListener('DOMContentLoaded', () => {
    // Existing DOM elements
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const monthYearDisplay = document.getElementById('monthYearDisplay'); 
    const calendarGrid = document.getElementById('calendarGrid');
    const tasksForSelectedDayContainer = document.getElementById('tasksForSelectedDayContainer');
    const tasksForSelectedDayHeading = document.getElementById('tasksForSelectedDayHeading');
    const taskListUL = document.getElementById('taskList'); 

    // View switching DOM elements
    const monthViewBtn = document.getElementById('monthViewBtn');
    const weekViewBtn = document.getElementById('weekViewBtn'); 
    const agendaViewBtn = document.getElementById('agendaViewBtn');
    
    const agendaViewContainer = document.getElementById('agendaViewContainer');
    const agendaListUL = document.getElementById('agendaList'); 
    const agendaViewHeading = document.getElementById('agendaViewHeading');
    
    const weekViewContainer = document.getElementById('weekViewContainer'); 
    const weekViewHeadingEl = document.getElementById('weekViewHeading'); // Renamed for clarity

    // Null checks
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

    let allTasks = []; 
    let previouslySelectedCell = null; 

    const activeViewClasses = ['bg-teal-500', 'text-white'];
    const inactiveViewClasses = ['bg-gray-200', 'text-gray-700', 'hover:bg-gray-300'];
    
    const viewButtons = [monthViewBtn, weekViewBtn, agendaViewBtn].filter(btn => btn != null);

    function initializeCurrentWeekStartDate() {
        const today = new Date();
        currentWeekStartDate = new Date(today.setDate(today.getDate() - today.getDay()));
        currentWeekStartDate.setHours(0,0,0,0);
    }

    async function fetchAndProcessTasks() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json(); 

            if (!data.users || !Array.isArray(data.users) || !data.documents || !Array.isArray(data.documents)) {
                console.error('Invalid data structure from data.json');
                allTasks = []; return;
            }

            const processedTasks = data.documents.map(doc => {
                let reviewerName = "Unassigned";
                if (doc.assignedToUserId) {
                    const assignedUser = data.users.find(user => user.id === doc.assignedToUserId);
                    if (assignedUser) reviewerName = assignedUser.name;
                }
                return {
                    date: doc.dueDate, 
                    startDate: doc.startDate,
                    completionDate: doc.completionDate,
                    title: doc.title,
                    employeeName: reviewerName,
                    status: doc.status,
                    id: doc.id               
                };
            });
            allTasks = processedTasks.filter(task => task.status !== 'Completed');

        } catch (error) {
            console.error('Error fetching or processing tasks:', error);
            allTasks = []; 
        }
    }

    function renderCalendar() {
        if (!calendarGrid || !monthYearDisplay) return;
        calendarGrid.innerHTML = ''; 
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(day => {
            const dayCell = document.createElement('div');
            dayCell.className = 'text-center text-sm font-medium text-gray-700 border border-gray-300 p-2'; // Refined day header
            dayCell.textContent = day;
            calendarGrid.appendChild(dayCell);
        });

        monthYearDisplay.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'border border-gray-300 p-2 h-24'; 
            calendarGrid.appendChild(emptyCell);
        }

        const todayDateStr = new Date().toISOString().split('T')[0];

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'border border-gray-300 p-2 h-24 relative cursor-pointer hover:bg-gray-100 flex flex-col items-center justify-center'; 
            
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.textContent = day;
            dayNumberSpan.className = 'calendar-day-number inline-block w-7 h-7 leading-7 text-center rounded-full'; 

            const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = cellDateStr;
            
            if (cellDateStr === todayDateStr) dayCell.classList.add('today'); 
            
            const tasksForDay = allTasks.filter(task => task.date === cellDateStr);
            if (tasksForDay.length > 0) dayCell.classList.add('has-due-date'); 
            
            dayCell.appendChild(dayNumberSpan); 
            dayCell.addEventListener('click', (event) => {
                if (previouslySelectedCell) {
                    previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
                }
                const clickedCell = event.currentTarget; 
                clickedCell.classList.add('ring-2', 'ring-teal-500', 'bg-gray-100');
                previouslySelectedCell = clickedCell;
                if(tasksForSelectedDayContainer) displayTasksForDay(cellDateStr);
            });
            calendarGrid.appendChild(dayCell);
        }
    }

    function getStatusColorClass(status) {
        if (status === 'Overdue') return 'text-red-700';
        if (status === 'In Progress') return 'text-yellow-700';
        if (status === 'Not Started') return 'text-blue-700';
        return 'text-gray-700'; 
    }

    function displayTasksForDay(dateStr) {
        if (!tasksForSelectedDayHeading || !taskListUL || !tasksForSelectedDayContainer) return;
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
            const statusColor = getStatusColorClass(task.status);
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
            li.className = 'mb-3 p-3 border border-gray-200 rounded-md shadow-sm bg-white'; // Added border-gray-200
            const titleP = document.createElement('p');
            titleP.className = 'font-semibold text-gray-800 mb-1'; 
            titleP.textContent = task.title;
            li.appendChild(titleP);
            const reviewerP = document.createElement('p');
            reviewerP.className = 'text-sm text-gray-600 mb-1'; 
            reviewerP.textContent = `Reviewer: ${task.employeeName}`;
            li.appendChild(reviewerP);
            const statusP = document.createElement('p');
            statusP.className = `text-sm ${getStatusColorClass(task.status)}`; 
            statusP.textContent = `Status: ${task.status}`;
            li.appendChild(statusP);
            agendaListUL.appendChild(li);
        });
    }

    function renderWeekView() {
        if (!weekViewContainer || !monthYearDisplay) return; // weekViewHeadingEl removed as it's not used for main date range

        if (!currentWeekStartDate) {
            initializeCurrentWeekStartDate();
        }

        weekViewContainer.innerHTML = ''; // Clear previous content
        
        // Re-add the static heading if it was cleared by innerHTML='', or manage it separately
        const heading = document.createElement('h3');
        heading.id = 'weekViewHeading'; // Ensure it has the ID if other code relies on it
        heading.className = 'text-lg font-semibold mb-2 text-center'; // Centered heading
        // weekViewContainer.appendChild(heading); // Appended later after date range text

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStartDate);
            date.setDate(currentWeekStartDate.getDate() + i);
            weekDates.push(date);
        }

        const firstDayOfWeekStr = weekDates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const lastDayOfWeekStr = weekDates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        // Update the main monthYearDisplay for week view context
        monthYearDisplay.textContent = `Week: ${firstDayOfWeekStr} - ${lastDayOfWeekStr}`;
        // The h3#weekViewHeading in calendar.html is static "Week View", so no need to update it here.
        // If weekViewHeadingEl was intended for the date range, this would be:
        // if (weekViewHeadingEl) weekViewHeadingEl.textContent = `Week of ${firstDayOfWeekStr} - ${lastDayOfWeekStr}`;


        const dayHeaderRow = document.createElement('div');
        dayHeaderRow.className = 'grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-700';
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        daysOfWeek.forEach(dayName => {
            const headerCell = document.createElement('div');
            headerCell.className = 'p-2 border-b border-gray-300'; // Refined header cell
            headerCell.textContent = dayName;
            dayHeaderRow.appendChild(headerCell);
        });
        weekViewContainer.appendChild(dayHeaderRow);

        const weekGrid = document.createElement('div');
        weekGrid.className = 'grid grid-cols-7 gap-1 h-[calc(100vh-280px)]'; // Adjusted height slightly
        weekViewContainer.appendChild(weekGrid);

        const today = new Date();
        today.setHours(0,0,0,0);

        weekDates.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayColumn = document.createElement('div');
            dayColumn.className = 'border border-gray-300 p-2 overflow-y-auto min-h-[120px]'; // Refined day column
            if (date.getTime() === today.getTime()) {
                dayColumn.classList.add('bg-teal-50'); 
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'text-center text-sm font-semibold mb-2 text-gray-700'; // Refined day number
            dayNumber.textContent = date.getDate();
            dayColumn.appendChild(dayNumber);

            const tasksForThisDay = allTasks.filter(task => {
                const taskStart = new Date(task.startDate);
                taskStart.setHours(0,0,0,0);
                // If completionDate is null, use dueDate as the end for active range checking
                const taskEnd = task.completionDate ? new Date(task.completionDate) : new Date(task.dueDate);
                taskEnd.setHours(0,0,0,0);
                return date >= taskStart && date <= taskEnd;
            });

            if (tasksForThisDay.length > 0) {
                tasksForThisDay.forEach(task => {
                    const taskElement = document.createElement('div');
                    // Refined task bar styling
                    taskElement.className = `p-1 mb-1 rounded shadow-sm text-xs ${getStatusBackgroundColor(task.status)} text-white truncate`; 
                    taskElement.textContent = task.title;
                    dayColumn.appendChild(taskElement);
                });
            }
            weekGrid.appendChild(dayColumn);
        });
        // console.log('renderWeekView called for week starting:', currentWeekStartDate.toISOString().split('T')[0]);
    }
    
    function getStatusBackgroundColor(status) { 
        if (status === 'Overdue') return 'bg-red-500 hover:bg-red-600';
        if (status === 'In Progress') return 'bg-yellow-500 hover:bg-yellow-600';
        if (status === 'Not Started') return 'bg-blue-500 hover:bg-blue-600';
        return 'bg-gray-400 hover:bg-gray-500'; 
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
            currentMonth = new Date(currentYear, currentMonth).getMonth(); // Preserve current month if already set by week view
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
        await fetchAndProcessTasks(); 
        renderCalendar(); 
        if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden'); 
        if (calendarGrid) calendarGrid.classList.remove('hidden'); 
        if (agendaViewContainer) agendaViewContainer.classList.add('hidden');
        if (weekViewContainer) weekViewContainer.classList.add('hidden'); 
        updateButtonStyles('monthViewBtn'); 
    }

    initCalendar();
});
