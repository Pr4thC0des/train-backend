const API_URL = '/api/scorecards';
let allReports = []; 

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
        allReports = data;

        await new Promise(r => setTimeout(r, 500));
        loading.style.display = 'none';

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
                    <button class="btn-view" onclick="openModal(${index})">View</button>
                    <button class="btn-delete" onclick="deleteReport('${row._id}')">
                        <i class="fas fa-trash-alt"></i>
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

async function deleteReport(id) {
    if (!confirm("Are you sure you want to permanently delete this report?")) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const result = await res.json();
        
        if (result.success) {
            loadData(); // Refresh table
        } else {
            alert("Failed to delete report.");
        }
    } catch (error) {
        console.error("Delete Error:", error);
        alert("Error connecting to server.");
    }
}

function openModal(index) {
    const report = allReports[index];
    const modal = document.getElementById('reportModal');
    const modalBody = document.getElementById('modalBody');
    const modalDate = document.getElementById('modalDate');

    const dateStr = new Date(report.inspectionDate).toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    modalDate.innerText = `Inspection Date: ${dateStr} | Station: ${report.stationName}`;

    let tableHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40%;">Activity / Area</th>
                    <th style="width: 15%;">Score</th>
                    <th>Remarks & Media</th>
                </tr>
            </thead>
            <tbody>
    `;

    const scores = report.scores || {};
    const remarks = report.remarks || {};
    const images = report.images || {}; // Fetch images

    for (const [activity, scoreList] of Object.entries(scores)) {
        const scoreVal = Array.isArray(scoreList) ? scoreList[0] : scoreList;
        const remarkVal = remarks[activity] || "-";
        const imgBase64 = images[activity]; // Check if image exists for this activity

        let badgeClass = "score-low";
        if (scoreVal >= 4) badgeClass = "score-high"; 
        else if (scoreVal == 3) badgeClass = "score-mid";

        let imgHTML = "";
        if (imgBase64) {
            // Embeds thumbnail, opens full image in new tab when clicked
            imgHTML = `<div style="margin-top: 10px;">
                          <img src="data:image/jpeg;base64,${imgBase64}" 
                               style="max-height: 70px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); cursor: zoom-in;" 
                               onclick="window.open(this.src, '_blank')" 
                               title="Click to view image">
                       </div>`;
        }

        tableHTML += `
            <tr>
                <td style="font-weight:500;">${activity}</td>
                <td><span class="score-badge ${badgeClass}">${scoreVal}</span></td>
                <td style="color:#666; font-size:14px;">${remarkVal} ${imgHTML}</td>
            </tr>
        `;
    }

    tableHTML += `</tbody></table>`;
    modalBody.innerHTML = tableHTML;
    modal.classList.add('show');
}

function closeModal() {
    document.getElementById('reportModal').classList.remove('show');
}

window.onclick = function(event) {
    if (event.target === document.getElementById('reportModal')) closeModal();
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}