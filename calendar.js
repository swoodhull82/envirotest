document.addEventListener('DOMContentLoaded', () => {
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const monthYearDisplay = document.getElementById('monthYearDisplay');
    const calendarGrid = document.getElementById('calendarGrid');
    const tasksForSelectedDayContainer = document.getElementById('tasksForSelectedDayContainer');
    const tasksForSelectedDayHeading = document.getElementById('tasksForSelectedDayHeading');
    const taskListUL = document.getElementById('taskList'); 

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let allTasks = []; 
    let previouslySelectedCell = null; 

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

                displayTasksForDay(cellDateStr);
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
        const tasks = allTasks.filter(task => task.date === dateStr);
        tasksForSelectedDayHeading.textContent = `Tasks for ${dateStr}:`;
        taskListUL.innerHTML = ''; 

        if (tasks.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No tasks for this day.';
            li.className = 'text-gray-500 p-2'; // Added some padding
            taskListUL.appendChild(li);
            tasksForSelectedDayContainer.classList.remove('hidden');
            return;
        }

        tasks.forEach(task => {
            const li = document.createElement('li');
            // Refined li styling for consistency
            li.className = 'mb-2 p-2 border-b border-gray-200 text-sm'; 
            const statusColor = getStatusColorClass(task.status);
            li.innerHTML = `<span class="font-medium">${task.title}</span> - ${task.employeeName} (<span class="${statusColor} italic">${task.status}</span>)`;
            taskListUL.appendChild(li);
        });
        tasksForSelectedDayContainer.classList.remove('hidden'); 
    }
    

    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        if (previouslySelectedCell) { 
            previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
            previouslySelectedCell = null;
            tasksForSelectedDayContainer.classList.add('hidden'); 
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        if (previouslySelectedCell) { 
            previouslySelectedCell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100');
            previouslySelectedCell = null;
            tasksForSelectedDayContainer.classList.add('hidden'); 
        }
        renderCalendar();
    });

    async function initCalendar() {
        await fetchAndProcessTasks(); 
        renderCalendar(); 
        tasksForSelectedDayContainer.classList.add('hidden'); 
    }

    initCalendar();
});
