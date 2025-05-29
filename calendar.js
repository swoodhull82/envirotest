document.addEventListener('DOMContentLoaded', () => {
    // Existing DOM elements
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const monthYearDisplay = document.getElementById('monthYearDisplay');
    const calendarGrid = document.getElementById('calendarGrid');
    const tasksForSelectedDayContainer = document.getElementById('tasksForSelectedDayContainer');
    const tasksForSelectedDayHeading = document.getElementById('tasksForSelectedDayHeading');
    const taskListUL = document.getElementById('taskList'); 

    // New DOM elements for view switching
    const monthViewBtn = document.getElementById('monthViewBtn');
    const agendaViewBtn = document.getElementById('agendaViewBtn');
    const agendaViewContainer = document.getElementById('agendaViewContainer');
    const agendaListUL = document.getElementById('agendaList'); 
    const agendaViewHeading = document.getElementById('agendaViewHeading');

    // Null checks
    if (!calendarGrid) console.error('Calendar Grid (calendarGrid) not found!');
    if (!tasksForSelectedDayContainer) console.error('Tasks For Selected Day Container not found!');
    if (!monthViewBtn) console.error('Month View Button (monthViewBtn) not found!');
    if (!agendaViewBtn) console.error('Agenda View Button (agendaViewBtn) not found!');
    if (!agendaViewContainer) console.error('Agenda View Container (agendaViewContainer) not found!');
    if (!agendaListUL) console.error('Agenda List UL (agendaList) not found!');
    if (!agendaViewHeading) console.error('Agenda View Heading (agendaViewHeading) not found!');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let allTasks = []; 
    let previouslySelectedCell = null; 

    const activeViewClasses = ['bg-teal-500', 'text-white'];
    const inactiveViewClasses = ['bg-gray-200', 'text-gray-700', 'hover:bg-gray-300'];

    async function fetchAndProcessTasks() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json(); 

            if (!data.users || !Array.isArray(data.users) || !data.documents || !Array.isArray(data.documents)) {
                console.error('Invalid data structure from data.json');
                allTasks = [];
                return;
            }

            const processedTasks = [];
            data.documents.forEach(doc => {
                if (doc.status === 'Completed') {
                    return; 
                }
                let reviewerName = "Unassigned";
                if (doc.assignedToUserId) {
                    const assignedUser = data.users.find(user => user.id === doc.assignedToUserId);
                    if (assignedUser) {
                        reviewerName = assignedUser.name;
                    }
                }
                processedTasks.push({
                    date: doc.dueDate,       
                    title: doc.title,
                    employeeName: reviewerName,
                    status: doc.status,
                    id: doc.id               
                });
            });
            allTasks = processedTasks;
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
            dayCell.className = 'text-center text-sm font-medium text-[#0c1c17] border p-2';
            dayCell.textContent = day;
            calendarGrid.appendChild(dayCell);
        });

        monthYearDisplay.textContent = `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'border p-2 h-24'; 
            calendarGrid.appendChild(emptyCell);
        }

        const todayDateStr = new Date().toISOString().split('T')[0];

        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'border p-2 h-24 relative cursor-pointer hover:bg-gray-100 flex flex-col items-center justify-center'; 
            
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.textContent = day;
            dayNumberSpan.className = 'calendar-day-number inline-block w-7 h-7 leading-7 text-center rounded-full'; 

            const cellDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dayCell.dataset.date = cellDateStr;
            
            if (cellDateStr === todayDateStr) {
                dayCell.classList.add('today'); 
            }

            const tasksForDay = allTasks.filter(task => task.date === cellDateStr);
            if (tasksForDay.length > 0) {
                dayCell.classList.add('has-due-date'); 
            }
            
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
        if (status === 'Overdue') {
            return 'text-red-700';
        } else if (status === 'In Progress') {
            return 'text-yellow-700';
        } else if (status === 'Not Started') {
            return 'text-blue-700';
        }
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
                // Applied new classes to the li containing the date heading
                dateHeadingLi.className = 'mt-4 mb-2 pt-2 border-t border-gray-300'; 
                const h4 = document.createElement('h4');
                // Changed font-semibold to font-bold for h4
                h4.className = 'text-md font-bold text-gray-700'; 
                h4.textContent = task.date;
                dateHeadingLi.appendChild(h4);
                agendaListUL.appendChild(dateHeadingLi);
                lastDate = task.date;
            }

            const li = document.createElement('li');
            li.className = 'mb-3 p-3 border rounded-md shadow-sm bg-white';
            
            const titleP = document.createElement('p');
            // Added mb-1
            titleP.className = 'font-semibold text-gray-800 mb-1'; 
            titleP.textContent = task.title;
            li.appendChild(titleP);

            const reviewerP = document.createElement('p');
            // Added mb-1
            reviewerP.className = 'text-sm text-gray-600 mb-1'; 
            reviewerP.textContent = `Reviewer: ${task.employeeName}`;
            li.appendChild(reviewerP);

            const statusP = document.createElement('p');
            // No mb-1 as it's the last item
            statusP.className = `text-sm ${getStatusColorClass(task.status)}`; 
            statusP.textContent = `Status: ${task.status}`;
            li.appendChild(statusP);
            
            agendaListUL.appendChild(li);
        });
    }


    function updateButtonStyles(activeBtn, inactiveBtn) {
        if (activeBtn) {
            activeBtn.classList.remove(...inactiveViewClasses);
            activeBtn.classList.add(...activeViewClasses);
        }
        if (inactiveBtn) {
            inactiveBtn.classList.remove(...activeViewClasses);
            inactiveBtn.classList.add(...inactiveViewClasses);
        }
    }

    if (monthViewBtn) {
        monthViewBtn.addEventListener('click', () => {
            if (calendarGrid) calendarGrid.classList.remove('hidden');
            if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden');
            if (agendaViewContainer) agendaViewContainer.classList.add('hidden');
            
            updateButtonStyles(monthViewBtn, agendaViewBtn);
            if (previouslySelectedCell) { 
                previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
                previouslySelectedCell = null;
            }
            renderCalendar(); 
        });
    }

    if (agendaViewBtn) {
        agendaViewBtn.addEventListener('click', () => {
            if (calendarGrid) calendarGrid.classList.add('hidden');
            if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden');
            if (agendaViewContainer) agendaViewContainer.classList.remove('hidden');

            updateButtonStyles(agendaViewBtn, monthViewBtn);
            renderAgendaView();
        });
    }
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            if (previouslySelectedCell) { 
                previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
                previouslySelectedCell = null;
            }
            if (calendarGrid && !calendarGrid.classList.contains('hidden') && tasksForSelectedDayContainer) {
                 tasksForSelectedDayContainer.classList.add('hidden'); 
            }
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            if (previouslySelectedCell) { 
                previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
                previouslySelectedCell = null;
            }
            if (calendarGrid && !calendarGrid.classList.contains('hidden') && tasksForSelectedDayContainer) {
                 tasksForSelectedDayContainer.classList.add('hidden'); 
            }
            renderCalendar();
        });
    }

    async function initCalendar() {
        await fetchAndProcessTasks(); 
        renderCalendar(); 
        if (tasksForSelectedDayContainer) tasksForSelectedDayContainer.classList.add('hidden'); 
        if (calendarGrid) calendarGrid.classList.remove('hidden'); 
        if (agendaViewContainer) agendaViewContainer.classList.add('hidden');
        updateButtonStyles(monthViewBtn, agendaViewBtn); 
    }

    initCalendar();
});
