document.addEventListener('DOMContentLoaded', () => {
  let currentDate = new Date();
  let allTasks = []; // To store all processed tasks

  const calendarHeader = document.getElementById('calendarHeader');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const monthYearDisplay = document.getElementById('monthYearDisplay');
  const nextMonthBtn = document.getElementById('nextMonthBtn');
  const calendarGrid = document.getElementById('calendarGrid');
  const tasksForSelectedDayContainer = document.getElementById('tasksForSelectedDay');
  const taskListUL = document.getElementById('taskList');
  const tasksForSelectedDayHeading = tasksForSelectedDayContainer ? tasksForSelectedDayContainer.querySelector('h3') : null;


  // Check if all elements are present
  if (!calendarHeader || !prevMonthBtn || !monthYearDisplay || !nextMonthBtn || !calendarGrid || !tasksForSelectedDayContainer || !taskListUL || !tasksForSelectedDayHeading) {
    console.error('One or more calendar DOM elements are missing. Please check calendar.html.');
    if(tasksForSelectedDayContainer) tasksForSelectedDayContainer.innerHTML = "<p class='text-red-500 p-4'>Error: Calendar HTML structure incomplete.</p>";
    return;
  }
  
  async function fetchAndProcessTasks() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!data.employees || !Array.isArray(data.employees)) {
        console.error('Invalid data structure: employees array not found.');
        allTasks = []; // Ensure allTasks is empty on error
        renderCalendar(currentDate); // Render calendar, it will show no tasks
        return;
      }

      const processedTasks = [];
      data.employees.forEach(employee => {
        if (employee.assigned_tasks && Array.isArray(employee.assigned_tasks)) {
          employee.assigned_tasks.forEach(task => {
            // Only include tasks that are not completed for calendar marking and display
            if (task.status !== 'Completed') {
              processedTasks.push({
                date: task.dueDate, // Keep as YYYY-MM-DD string
                title: task.title,
                employeeName: employee.name,
                status: task.status
              });
            }
          });
        }
      });
      allTasks = processedTasks;
      console.log('All non-completed tasks processed:', allTasks);
    } catch (error) {
      console.error('Error fetching or processing task data:', error);
      allTasks = []; // Ensure allTasks is empty on error
      // Optionally display an error message on the page
      if(tasksForSelectedDayHeading) tasksForSelectedDayHeading.textContent = 'Error loading task data.';
      taskListUL.innerHTML = `<li class='text-red-500'>Could not load tasks.</li>`;
    } finally {
      renderCalendar(currentDate); // Render calendar after fetch attempt (success or fail)
    }
  }


  function renderCalendar(date) {
    calendarGrid.innerHTML = ''; 
    
    const year = date.getFullYear();
    const month = date.getMonth(); 

    monthYearDisplay.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    daysOfWeek.forEach(day => {
      const dayHeaderCell = document.createElement('div');
      dayHeaderCell.textContent = day;
      dayHeaderCell.className = 'p-2 bg-[#e6f4ef] font-medium text-[#0c1c17]';
      calendarGrid.appendChild(dayHeaderCell);
    });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'p-2 h-20 bg-gray-100 border border-gray-200';
      calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement('div');
      const dayNumberSpan = document.createElement('span');
      dayNumberSpan.textContent = day;
      dayCell.appendChild(dayNumberSpan);
      
      dayCell.className = 'p-2 h-20 bg-white hover:bg-gray-100 cursor-pointer border border-gray-200 flex flex-col items-center justify-start relative text-sm';
      
      const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dayCell.dataset.date = cellDateStr;

      const tasksOnThisDay = allTasks.filter(task => task.date === cellDateStr && task.status !== 'Completed');
      if (tasksOnThisDay.length > 0) {
        const taskMarker = document.createElement('div');
        taskMarker.className = 'w-2 h-2 bg-teal-500 rounded-full mt-1 absolute bottom-2 left-1/2 transform -translate-x-1/2';
        dayCell.appendChild(taskMarker);
      }

      const today = new Date();
      if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
        dayNumberSpan.classList.add('bg-teal-500', 'text-white', 'rounded-full', 'p-1', 'w-6', 'h-6', 'flex', 'items-center', 'justify-center');
      } else {
        dayNumberSpan.classList.add('p-1');
      }
      
      dayCell.addEventListener('click', () => {
        const clickedDate = dayCell.dataset.date;
        if(tasksForSelectedDayHeading) tasksForSelectedDayHeading.textContent = `Tasks for ${clickedDate}:`;
        taskListUL.innerHTML = ''; // Clear previous tasks

        const tasksForDay = allTasks.filter(task => task.date === clickedDate && task.status !== 'Completed');

        if (tasksForDay.length > 0) {
          tasksForDay.forEach(task => {
            const li = document.createElement('li');
            li.className = 'mb-1 p-2 border-b border-gray-200 text-sm';
            
            let statusColorClass = 'text-gray-600';
            if (task.status === 'Overdue' || (new Date(task.date) < new Date() && task.status !== 'Completed')) {
               statusColorClass = 'text-red-600 font-semibold';
            } else if (task.status === 'In Progress') {
               statusColorClass = 'text-yellow-600 font-semibold';
            } else if (task.status === 'Not Started') {
               statusColorClass = 'text-blue-600';
            }
            
            li.innerHTML = `<span class="font-medium">${task.title}</span> - ${task.employeeName} (<span class="${statusColorClass}">${task.status}</span>)`;
            taskListUL.appendChild(li);
          });
        } else {
          const li = document.createElement('li');
          li.textContent = 'No tasks for this day.';
          li.className = 'text-gray-500';
          taskListUL.appendChild(li);
        }
        
        document.querySelectorAll('#calendarGrid > div[data-date]').forEach(cell => cell.classList.remove('ring-2', 'ring-teal-500', 'bg-gray-100'));
        dayCell.classList.add('ring-2', 'ring-teal-500', 'bg-gray-100');
      });
      
      calendarGrid.appendChild(dayCell);
    }
  }

  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });

  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  fetchAndProcessTasks(); // Fetch data and then do the initial render
});
