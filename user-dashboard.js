(function () {
  // User Dashboard script (self-contained to avoid global collisions)
  const token = localStorage.getItem('token');
  if (!token) {
    localStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  const hostname = window.location.hostname;
  let apiBase = '';
  if (["localhost", "127.0.0.1"].includes(hostname)) {
    apiBase = 'http://localhost:5000/api';
  } else if (hostname === 'msbfinance.co.za') {
    apiBase = 'https://msbcorp-backend.onrender.com/api';
  } else {
    apiBase = 'https://msbcorp-backend.onrender.com/api';
  }

  async function loadUserStats() {
  try {
    const [resLoans, resDocs] = await Promise.all([
      fetch(`${apiBase}/user/loans`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${apiBase}/user/documents`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (!resLoans.ok || !resDocs.ok) {
      if (resLoans.status === 401 || resLoans.status === 403 || resDocs.status === 401 || resDocs.status === 403) {
        localStorage.clear();
        window.location.href = 'index.html';
        return;
      }
      const errBody = await (resLoans.ok ? resDocs.json().catch(() => ({})) : resLoans.json().catch(() => ({})));
      throw new Error(errBody.message || 'Failed to load user stats');
    }

    const loans = await resLoans.json();
    const docs = await resDocs.json();

    const totalLoans = Array.isArray(loans) ? loans.length : 0;
    const totalDocs = Array.isArray(docs) ? docs.length : 0;
    const totalLoanAmount = Array.isArray(loans) ? loans.reduce((s, l) => s + (l.amount || 0), 0) : 0;

    const loansEl = document.getElementById('totalLoans');
    const docsEl = document.getElementById('totalDocs');
    const amountEl = document.getElementById('totalLoanAmount');

    if (loansEl) loansEl.textContent = totalLoans;
    if (docsEl) docsEl.textContent = totalDocs;
    if (amountEl) amountEl.textContent = `R${totalLoanAmount}`;

    // Populate loans table
    const loansTbody = document.querySelector('#loansTable tbody');
    if (loansTbody && Array.isArray(loans)) {
      loansTbody.innerHTML = '';
      loans.forEach(l => {
        const tr = document.createElement('tr');
        const appliedOn = new Date(l.createdAt).toLocaleDateString();
        tr.innerHTML = `<td>R${l.amount}</td><td>${l.status}</td><td>${appliedOn}</td>`;
        loansTbody.appendChild(tr);
      });
    }

    // Populate docs table
    const docsTbody = document.querySelector('#docsTable tbody');
    if (docsTbody && Array.isArray(docs)) {
      docsTbody.innerHTML = '';
      docs.forEach(d => {
        const tr = document.createElement('tr');
        const uploadedOn = new Date(d.createdAt).toLocaleDateString();
        tr.innerHTML = `<td>${d.fileName}</td><td>${d.status || 'Pending'}</td><td>${uploadedOn}</td><td><a href="${d.signedUrl}" target="_blank">Open</a> <button data-id="${d._id}" class="delete-doc">Delete</button></td>`;
        docsTbody.appendChild(tr);
      });

      // Delete handlers
      document.querySelectorAll('.delete-doc').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (!confirm('Delete this document?')) return;
          try {
            const res = await fetch(`${apiBase}/user/documents/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              loadUserStats();
            } else {
              const err = await res.json().catch(() => ({}));
              alert(err.message || 'Failed to delete document');
            }
          } catch (err) {
            console.error('Delete doc error', err);
            alert('Failed to delete document');
          }
        });
      });
    }

    } catch (err) {
      console.error('Failed to load user stats', err);
    }
  }

  // Initial load
  loadUserStats();
  
  // ----- Apply Loan / Bank Modal -----
  const applyLoanBtn = document.getElementById('applyLoanBtn');
  const bankModal = document.getElementById('bankModal');
  const closeBankModal = document.getElementById('closeBankModal');
  const submitBankDetailsBtn = document.getElementById('submitBankDetailsBtn');
  const loanAmountInput = document.getElementById('loanAmount');

  if (applyLoanBtn && bankModal) {
    applyLoanBtn.addEventListener('click', () => {
      bankModal.style.display = 'flex';
    });
  }
  if (closeBankModal && bankModal) closeBankModal.addEventListener('click', () => { bankModal.style.display = 'none'; });

  if (submitBankDetailsBtn) {
    submitBankDetailsBtn.addEventListener('click', async () => {
      const amount = parseInt(loanAmountInput?.value || 0);
      const bankName = document.getElementById('bankName')?.value?.trim();
      const accountNumber = document.getElementById('accountNumber')?.value?.trim();
      const branchCode = document.getElementById('branchCode')?.value?.trim();
      const accountHolder = document.getElementById('accountHolder')?.value?.trim();

      if (!amount || amount < 300 || amount > 4000) return alert('Enter a loan amount between R300 and R4000');
      if (!bankName || !accountNumber || !branchCode || !accountHolder) return alert('Enter all bank details');

      try {
        const res = await fetch(`${apiBase}/user/apply-loan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount, bankDetails: { bankName, accountNumber, branchCode, accountHolder } })
        });

        const data = await res.json();
        if (res.ok) {
          alert(data.message || 'Loan application submitted');
          if (bankModal) bankModal.style.display = 'none';
          loadUserStats();
        } else {
          alert(data.message || 'Failed to apply for loan');
        }
      } catch (err) {
        console.error('Apply loan error', err);
        alert('Server error');
      }
    });
  }

  // ----- Upload Document -----
  const uploadBtn = document.getElementById('uploadDocBtn');
  const docFileInput = document.getElementById('docFile');
  if (uploadBtn && docFileInput) {
    uploadBtn.addEventListener('click', async () => {
      const file = docFileInput.files && docFileInput.files[0];
      if (!file) return alert('Select a file to upload');

      const form = new FormData();
      form.append('document', file, file.name);

      try {
        const res = await fetch(`${apiBase}/user/upload-document`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form
        });
        const data = await res.json();
        if (res.ok) {
          alert('Document uploaded');
          docFileInput.value = null;
          loadUserStats();
        } else {
          alert(data.message || 'Failed to upload document');
        }
      } catch (err) {
        console.error('Upload error', err);
        alert('Upload failed');
      }
    });
  }

  // ----- Change Details Modal -----
  const changeBtn = document.getElementById('changeDetailsBtn');
  const changeModal = document.getElementById('changeDetailsModal');
  const changeForm = document.getElementById('changeDetailsForm');
  const closeChangeModal = document.getElementById('closeChangeDetailsModal');

  if (changeBtn && changeModal && changeForm) {
    changeBtn.addEventListener('click', async () => {
      changeModal.style.display = 'flex';
      try {
        const res = await fetch(`${apiBase}/user/me`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        document.getElementById('fullName').value = data.name || '';
        document.getElementById('email').value = data.email || '';
      } catch (err) {
        console.error('Failed to load user details', err);
      }
    });

    if (closeChangeModal) closeChangeModal.addEventListener('click', () => { changeModal.style.display = 'none'; });

    changeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value?.trim();
      const currentPassword = document.getElementById('currentPassword')?.value?.trim();
      const newPassword = document.getElementById('newPassword')?.value?.trim();
      const confirmPassword = document.getElementById('confirmNewPassword')?.value?.trim();

      if (!email && !newPassword) return alert('Enter new details to update.');
      if ((newPassword || confirmPassword) && !currentPassword) return alert('Enter your current password to change password.');
      if (newPassword && newPassword.length < 6) return alert('New password must be at least 6 characters.');
      if (newPassword !== confirmPassword) return alert('New password and confirmation do not match.');

      try {
        const res = await fetch(`${apiBase}/user/update-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ email, currentPassword, newPassword, confirmNewPassword: confirmPassword })
        });

        const data = await res.json();
        if (res.ok) {
          alert(data.message || 'Details updated successfully');
          changeModal.style.display = 'none';
          changeForm.reset();
        } else {
          alert(data.message || 'Failed to update details');
        }
      } catch (err) {
        console.error('Update failed', err);
        alert('Server error');
      }
    });
  }
})();
