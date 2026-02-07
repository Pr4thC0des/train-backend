const API_URL = '/api/scorecards';

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadData);

// Attach event listener to refresh button
document.getElementById('refreshBtn').addEventListener('click', loadData);

async function loadData() {
    const tbody = document.getElementById('tableBody');
    const loading = document.getElementById('loading');
    
    // Reset View
    tbody.innerHTML = '';
    loading.style.display = 'flex';

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        // Small delay to make animation smoother (Optional)
        await new Promise(r => setTimeout(r, 500));

        loading.style.display = 'none';

        // Update Stats
        animateValue("totalCount", 0, data.length, 1000);
        const uniqueStations = new Set(data.map(item => item.stationName));
        animateValue("stationCount", 0, uniqueStations.size, 1000);

        // Check for empty data
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No inspections submitted yet.</td></tr>';
            return;
        }

        // Render Table Rows with Staggered Animation
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.classList.add('row-animate');
            tr.style.animationDelay = `${index * 0.1}s`;

            const inspectDate = new Date(row.inspectionDate).toLocaleDateString();
            const submitDate = new Date(row.submittedAt).toLocaleString();

            tr.innerHTML = `
                <td style="font-weight: 600; color: var(--primary);">
                    <i class="fas fa-subway" style="margin-right:8px; opacity:0.6;"></i> ${row.stationName}
                </td>
                <td>${inspectDate}</td>
                <td style="color: var(--text-light); font-size: 13px;">${submitDate}</td>
                <td><span class="badge">Completed</span></td>
                <td>
                    <button class="btn-view" onclick='showDetails(${JSON.stringify(row)})'>
                        View Report
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error:", error);
        loading.innerHTML = '<span style="color: red;"><i class="fas fa-exclamation-circle"></i> Failed to connect to server.</span>';
    }
}

// Function to show details in an alert
function showDetails(row) {
    const scores = row.scores || {};
    let scoreText = '';
    for (const [key, val] of Object.entries(scores)) {
        scoreText += `• ${key}: ${val}\n`;
    }
    alert(`Station: ${row.stationName}\n\nSCORES:\n${scoreText}`);
}

// Animation function for numbers
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    if(start === end) { obj.innerHTML = end; return; }
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}