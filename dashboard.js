const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const LOCAL = window.location.hostname === 'localhost';
const API = LOCAL ? 'http://localhost:5000/api' : 'https://msbcorp-backend.onrender.com/api';

document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    window.location.href = 'index.html';
};

// Apply Loan
document.getElementById('applyLoanBtn').onclick = async () => {
    const amount = parseFloat(document.getElementById('loanAmount').value);
    if (!amount || amount < 300 || amount > 4000) return alert('Enter a valid amount (R300-R4000)');

    try {
        const res = await fetch(`${API}/user/apply-loan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });

        const data = await res.json();
        if (res.ok) {
            alert('Loan applied successfully');
            // Refresh both the loans table and stats
            await loadLoans();
            await loadStats(); // <-- Add this line to update stats dynamically
        } else alert(data.message || 'Failed to apply loan');
    } catch (err) {
        console.error(err);
        alert('Error applying loan');
    }
};


// Upload Document
document.getElementById('uploadDocBtn').onclick = async () => {
    const fileInput = document.getElementById('docFile');
    if (fileInput.files.length === 0) return alert('Select a file');

    const formData = new FormData();
    formData.append('document', fileInput.files[0]);

    try {
        const res = await fetch(`${API}/user/upload-document`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            alert('Document uploaded successfully');
            loadDocs();
            await loadStats();
        } else alert(data.message || 'Upload failed');
    } catch (err) {
        console.error(err);
        alert('Error uploading document');
    }
};

// Load Loans
async function loadLoans() {
    try {
        const res = await fetch(`${API}/user/loans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const loans = await res.json();
        const tbody = document.querySelector('#loansTable tbody');
        tbody.innerHTML = '';

        loans.forEach(l => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>R${l.amount}</td>
        <td>${l.status || 'Pending'}</td>
        <td>${new Date(l.createdAt).toLocaleString()}</td>
      `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error(err);
        alert('Failed to load loans');
    }
}

// Load Documents
async function loadDocs() {
  try {
    const res = await fetch(`${API}/user/documents`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const docs = await res.json();
    const tbody = document.querySelector('#docsTable tbody');
    tbody.innerHTML = '';

    docs.forEach(d => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.fileName}</td>
        <td>${d.status || 'Pending'}</td>
        <td>${new Date(d.createdAt).toLocaleString()}</td>
        <td>
          <button class="openDocBtn" data-id="${d._id}">Open</button>
          <button class="deleteDocBtn" data-id="${d._id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach Open handlers
    document.querySelectorAll('.openDocBtn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const res = await fetch(`${API}/user/documents/${id}/download`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) window.open(data.url, '_blank');
        else alert(data.message);
      };
    });

    // Attach Delete handlers
    document.querySelectorAll('.deleteDocBtn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Are you sure you want to delete this document?')) return;
        const id = btn.dataset.id;
        const res = await fetch(`${API}/user/documents/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          alert('Document deleted');
          loadDocs();
          await loadStats();
        } else alert(data.message);
      };
    });

  } catch (err) {
    console.error(err);
    alert('Failed to load documents');
  }
}

async function loadStats() {
  try {
    const resLoans = await fetch(`${API}/user/loans`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const loans = await resLoans.json();

    const totalLoans = loans.length;
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);

    const resDocs = await fetch(`${API}/user/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const docs = await resDocs.json();
    const totalDocs = docs.length;

    document.getElementById('totalLoans').textContent = totalLoans;
    document.getElementById('totalLoanAmount').textContent = `R${totalLoanAmount}`;
    document.getElementById('totalDocs').textContent = totalDocs;
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}



// Initial load
loadLoans();
loadDocs();
loadStats();