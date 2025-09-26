// -------------------------------
// Admin Dashboard Script
// -------------------------------

// -------------------------------
// Token and API config
// -------------------------------
const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

const API = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:5000/api"
  : "https://msbcorp-backend.onrender.com/api";

// -------------------------------
// Logout
// -------------------------------
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = "index.html";
  };
}

// -------------------------------
// Load all users
// -------------------------------
async function loadUsers() {
  try {
    const res = await fetch(`${API}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await res.json();
    const tbody = document.querySelector("#usersTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    users.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load users", err);
  }
}

// -------------------------------
// Load all loans
// -------------------------------
async function loadLoans() {
  try {
    const res = await fetch(`${API}/admin/loans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const loans = await res.json();
    const tbody = document.querySelector("#loansTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    loans.forEach((l) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.user?.name || "N/A"}</td>
        <td>R${l.amount}</td>
        <td>${l.status}</td>
        <td>
          <button onclick="updateLoan('${l._id}','Approved')">Approve</button>
          <button onclick="updateLoan('${l._id}','Rejected')">Reject</button>
        </td>`;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Failed to load loans", err);
  }
}

// -------------------------------
// Load all documents
// -------------------------------
async function loadDocs() {
  try {
    const res = await fetch(`${API}/admin/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const docs = await res.json();
    const tbody = document.querySelector("#docsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    docs.forEach((d) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.user?.name || "N/A"}</td>
        <td>${d.fileName}</td>
        <td>${d.status}</td>
        <td>
          <button onclick="updateDoc('${d._id}','Approved')">Approve</button>
          <button onclick="updateDoc('${d._id}','Rejected')">Reject</button>
        </td>
        <td>
          <button class="openDocBtn" data-id="${d._id}">Open</button>
          <button class="delete-btn" data-id="${d._id}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });

    // Open handlers
    document.querySelectorAll(".openDocBtn").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`${API}/admin/documents/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) window.open(data.url, "_blank");
          else alert(data.error || data.message || "Unable to open document");
        } catch (err) {
          console.error("Open document error:", err);
          alert("Error opening document");
        }
      };
    });

    // Delete handlers
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (!confirm("Are you sure you want to delete this document?")) return;

        try {
          const res = await fetch(`${API}/admin/documents/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            alert("Document deleted.");
            loadDocs();
          } else {
            const err = await res.json();
            alert(err.error || "Failed to delete document");
          }
        } catch (err) {
          console.error("Delete error", err);
        }
      });
    });
  } catch (err) {
    console.error("Error loading documents", err);
  }
}

// -------------------------------
// Update Loan
// -------------------------------
async function updateLoan(id, status) {
  try {
    const res = await fetch(`${API}/admin/loans/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Failed to update loan");
      return;
    }
    loadLoans();
  } catch (err) {
    console.error("Update loan error:", err);
    alert("Failed to update loan status");
  }
}

// -------------------------------
// Update Document
// -------------------------------
async function updateDoc(id, status) {
  try {
    const res = await fetch(`${API}/admin/documents/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Failed to update document");
      return;
    }
    loadDocs();
  } catch (err) {
    console.error("Update document error:", err);
    alert("Failed to update document status");
  }
}

// -------------------------------
// Load Admin Stats
// -------------------------------
async function loadAdminStats() {
  try {
    const [resUsers, resLoans] = await Promise.all([
      fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/admin/loans`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const users = await resUsers.json();
    const loans = await resLoans.json();

    const totalUsers = users.length;
    const totalLoans = loans.length;
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);

    const usersEl = document.getElementById("totalUsers");
    const loansEl = document.getElementById("adminTotalLoans");
    const amountEl = document.getElementById("adminTotalLoanAmount");

    if (usersEl) usersEl.textContent = totalUsers;
    if (loansEl) loansEl.textContent = totalLoans;
    if (amountEl) amountEl.textContent = `R${totalLoanAmount}`;
  } catch (err) {
    console.error("Error loading admin stats:", err);
  }
}

// -------------------------------
// Change Details Modal
// -------------------------------
const changeBtn = document.getElementById("changeDetailsBtn");
const modal = document.getElementById("changeDetailsModal");
const form = document.getElementById("changeDetailsForm");
const closeChangeDetailsModal = document.getElementById("closeChangeDetailsModal");

if (changeBtn && modal && form) {
  // Open modal
  changeBtn.addEventListener("click", async () => {
    modal.style.display = "flex";
    try {
      const res = await fetch(`${API}/user/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      document.getElementById("fullName").value = data.name || "";
      document.getElementById("email").value = data.email || "";
    } catch (err) {
      console.error("Failed to load user details", err);
    }
  });

  // Close modal
  closeChangeDetailsModal?.addEventListener("click", () => {
    modal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmNewPassword").value.trim();

    // Validate password change
    if (newPassword || confirmPassword) {
      if (!currentPassword) return alert("Enter your current password to change password");
      if (newPassword.length < 6) return alert("New password must be at least 6 characters");
      if (newPassword !== confirmPassword) return alert("New password and confirm password do not match");
    }

    try {
      const res = await fetch(`${API}/user/update-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      alert(data.message || "Details updated successfully");
      modal.style.display = "none";
      form.reset();
    } catch (err) {
      console.error("Update error:", err);
      alert(err.message || "Failed to update details");
    }
  });
}

// -------------------------------
// Initial Load
// -------------------------------
loadUsers();
loadLoans();
loadDocs();
loadAdminStats();
