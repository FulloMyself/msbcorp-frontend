const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const LOCAL = window.location.hostname === 'localhost';
const API = LOCAL
  ? 'http://localhost:5000/api'
  : 'https://msbcorp-backend.onrender.com/api';

// ===== Logout =====
document.getElementById('logoutBtn').onclick = () => {
  localStorage.clear();
  window.location.href = 'index.html';
};

// ===== Elements =====
const applyLoanBtn = document.getElementById('applyLoanBtn');
const bankModal = document.getElementById('bankModal');
const closeModal = document.getElementById('closeBankModal');
const submitBankBtn = document.getElementById('submitBankDetailsBtn');

// ===== Modal Logic =====
applyLoanBtn.onclick = () => bankModal.style.display = 'block';
closeModal.onclick = () => bankModal.style.display = 'none';
window.onclick = (e) => { if (e.target === bankModal) bankModal.style.display = 'none'; };

// ===== Utility: Fetch Wrapper =====
async function apiFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (!options.headers['Authorization']) options.headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, options);

    // handle non-JSON responses (like 404 returning HTML)
    const contentType = res.headers.get('content-type');
    const data = contentType && contentType.includes('application/json')
      ? await res.json()
      : null;

    if (!res.ok) {
      const message = data?.message || `Request failed with status ${res.status}`;
      throw new Error(message);
    }

    return data;
  } catch (err) {
    console.error(err);
    alert(err.message);
    throw err;
  }
}

// ===== Submit Loan Application =====
submitBankBtn.onclick = async () => {
  const amountInput = document.getElementById('loanAmount');
  const amount = parseFloat(amountInput.value.trim());

  const bankDetails = {
    bankName: document.getElementById('bankName').value.trim(),
    accountNumber: document.getElementById('accountNumber').value.trim(),
    branchCode: document.getElementById('branchCode').value.trim(),
    accountHolder: document.getElementById('accountHolder').value.trim()
  };

  // Validation
  if (!amount || amount < 300 || amount > 4000) {
    return alert('Enter a valid amount (R300-R4000)');
  }
  if (!Object.values(bankDetails).every(v => v)) {
    return alert('Please fill in all bank details');
  }

  // Disable button to prevent multiple submissions
  submitBankBtn.disabled = true;
  submitBankBtn.textContent = 'Submitting...';

  try {
    const response = await apiFetch(`${API}/user/apply-loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, bankDetails })
    });

    alert(response.message || 'Loan applied successfully');
    bankModal.style.display = 'none';
    amountInput.value = '';
    Object.keys(bankDetails).forEach(key => document.getElementById(key).value = '');
    await refreshAll();

  } catch (err) {
    console.error(err);
    // Error alert handled inside apiFetch
  } finally {
    // Re-enable button
    submitBankBtn.disabled = false;
    submitBankBtn.textContent = 'Submit Loan';
  }
};



// ===== Upload Document =====
document.getElementById('uploadDocBtn').onclick = async () => {
  const fileInput = document.getElementById('docFile');
  if (!fileInput.files.length) return alert('Select a file');

  const formData = new FormData();
  formData.append('document', fileInput.files[0]);

  try {
    await apiFetch(`${API}/user/upload-document`, { method: 'POST', body: formData });
    alert('Document uploaded successfully');
    await refreshAll();
  } catch (err) {
    // handled
  }
};

// ===== Load Loans =====
async function loadLoans() {
  const loans = await apiFetch(`${API}/user/loans`);
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
}

// ===== Load Documents =====
async function loadDocs() {
  const docs = await apiFetch(`${API}/user/documents`);
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

  tbody.querySelectorAll('.openDocBtn').forEach(btn => btn.onclick = async () => {
    const data = await apiFetch(`${API}/user/documents/${btn.dataset.id}/download`);
    window.open(data.url, '_blank');
  });

  tbody.querySelectorAll('.deleteDocBtn').forEach(btn => btn.onclick = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    await apiFetch(`${API}/user/documents/${btn.dataset.id}`, { method: 'DELETE' });
    await refreshAll();
  });
}

// ===== Load Stats =====
async function loadStats() {
  const [loans, docs] = await Promise.all([
    apiFetch(`${API}/user/loans`),
    apiFetch(`${API}/user/documents`)
  ]);

  document.getElementById('totalLoans').textContent = loans.length;
  document.getElementById('totalLoanAmount').textContent = `R${loans.reduce((sum, l) => sum + l.amount, 0)}`;
  document.getElementById('totalDocs').textContent = docs.length;
}

// ===== Refresh All =====
async function refreshAll() {
  await Promise.all([loadLoans(), loadDocs(), loadStats()]);
}

// ===== Initial Load =====
refreshAll();
