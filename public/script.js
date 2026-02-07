const API_URL = '/api/scorecards';
let allReports = []; // Store data globally so we can access it easily

document.addEventListener('DOMContentLoaded', loadData);
document.getElementById('refreshBtn').addEventListener('click', loadData);

async function loadData() {
    const tbody = document.getElementById('tableBody');
    const loading = document.getElementById('loading');
    
    tbody.innerHTML = '';
    loading.style.display = 'flex';

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        // Save to global variable
        allReports = data;

        await new Promise(r => setTimeout(r, 500));
        loading.style.display = 'none';

        // Update Stats
        animateValue("totalCount", 0, data.length, 1000);
        const uniqueStations = new Set(data.map(item => item.stationName));
        animateValue("stationCount", 0, uniqueStations.size, 1000);

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No inspections submitted yet.</td></tr>';
            return;
        }

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
                    <button class="btn-view" onclick="openModal(${index})">
                        View Report
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error:", error);
        loading.innerHTML = '<span style="color: red;">Failed to connect to server.</span>';
    }
}

// --- NEW MODAL FUNCTIONS ---

function openModal(index) {
    const report = allReports[index];
    const modal = document.getElementById('reportModal');
    const modalBody = document.getElementById('modalBody');
    const modalDate = document.getElementById('modalDate');

    // 1. Set Header Info
    const dateStr = new Date(report.inspectionDate).toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    modalDate.innerText = `Inspection Date: ${dateStr} | Station: ${report.stationName}`;

    // 2. Build the Score Table HTML
    let tableHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Activity / Area</th>
                    <th style="width: 15%;">Score</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Loop through scores
    const scores = report.scores || {};
    const remarks = report.remarks || {};

    for (const [activity, scoreList] of Object.entries(scores)) {
        // Handle if score is array or number (safety check)
        const scoreVal = Array.isArray(scoreList) ? scoreList[0] : scoreList;
        const remarkVal = remarks[activity] || "-";

        // Color code the score
        let badgeClass = "score-low";
        if (scoreVal >= 8) badgeClass = "score-high";
        else if (scoreVal >= 5) badgeClass = "score-mid";

        tableHTML += `
            <tr>
                <td style="font-weight:500;">${activity}</td>
                <td><span class="score-badge ${badgeClass}">${scoreVal}</span></td>
                <td style="color:#666; font-size:14px;">${remarkVal}</td>
            </tr>
        `;
    }

    tableHTML += `</tbody></table>`;
    
    // 3. Inject and Show
    modalBody.innerHTML = tableHTML;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('reportModal');
    modal.classList.remove('show');
}

// Close modal if clicking outside the card
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target === modal) {
        closeModal();
    }
}

function animateValue(id, start, end, duration) { /* ... keep existing ... */ 
    const obj = document.getElementById(id);
    if (!obj) return;
    if(start === end) { obj.innerHTML = end; return; }
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}