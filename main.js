document.addEventListener('DOMContentLoaded', () => {
  const upcomingReviewsTbody = document.querySelectorAll('.layout-content-container table tbody')[0];
  const overdueReviewsTbody = document.querySelectorAll('.layout-content-container table tbody')[1];

  async function fetchAndPopulateReviews() {
    try {
      const response = await fetch('data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Clear existing rows
      upcomingReviewsTbody.innerHTML = '';
      overdueReviewsTbody.innerHTML = '';

      populateTable(upcomingReviewsTbody, data.upcoming_reviews);
      populateTable(overdueReviewsTbody, data.overdue_reviews);

    } catch (error) {
      console.error('Error fetching or processing review data:', error);
      // Optionally, display a user-friendly error message in the UI
      if (upcomingReviewsTbody) {
        upcomingReviewsTbody.innerHTML = '<tr><td colspan="4" class="text-center text-red-500 py-4">Error loading upcoming reviews.</td></tr>';
      }
      if (overdueReviewsTbody) {
        overdueReviewsTbody.innerHTML = '<tr><td colspan="4" class="text-center text-red-500 py-4">Error loading overdue reviews.</td></tr>';
      }
    }
  }

  function populateTable(tableBody, reviews) {
    if (!tableBody) {
      console.error('Table body not found for populating reviews.');
      return;
    }
    if (!reviews || reviews.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500 py-4">No reviews to display.</td></tr>';
      return;
    }

    reviews.forEach(review => {
      const row = document.createElement('tr');
      row.className = 'border-t border-t-[#cde9df]';

      // Document Title
      const titleCell = document.createElement('td');
      titleCell.className = 'h-[72px] px-4 py-2 w-[400px] text-[#0c1c17] text-sm font-normal leading-normal';
      titleCell.textContent = review.title;
      row.appendChild(titleCell);

      // Reviewer
      const reviewerCell = document.createElement('td');
      reviewerCell.className = 'h-[72px] px-4 py-2 w-[400px] text-[#46a080] text-sm font-normal leading-normal';
      reviewerCell.textContent = review.reviewer;
      row.appendChild(reviewerCell);

      // Due Date
      const dueDateCell = document.createElement('td');
      dueDateCell.className = 'h-[72px] px-4 py-2 w-[400px] text-[#46a080] text-sm font-normal leading-normal';
      dueDateCell.textContent = review.dueDate;
      row.appendChild(dueDateCell);

      // Status
      const statusCell = document.createElement('td');
      statusCell.className = 'h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal';
      const statusButton = document.createElement('button');
      statusButton.className = 'flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-[#e6f4ef] text-[#0c1c17] text-sm font-medium leading-normal w-full';
      const statusSpan = document.createElement('span');
      statusSpan.className = 'truncate';
      statusSpan.textContent = review.status;
      statusButton.appendChild(statusSpan);
      statusCell.appendChild(statusButton);
      row.appendChild(statusCell);

      tableBody.appendChild(row);
    });
  }

  fetchAndPopulateReviews();
});
