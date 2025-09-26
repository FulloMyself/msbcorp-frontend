// -------------------------------
// Admin Dashboard Script
// -------------------------------

// -------------------------------
// Close buttons
// -------------------------------
const closeBankModal = document.getElementById("closeBankModal"); // if you have bank modal
const closeChangeDetailsModal = document.getElementById("closeChangeDetailsModal"); // change details modal
const term = 12; // or get from a new input field

// -------------------------------
// Token and API config
// -------------------------------
const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

const API = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
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

if (changeBtn && modal && form) {
  changeBtn.addEventListener("click", async () => {
    modal.style.display = "flex";
    try {
      const res = await fetch(`${API}/user/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      document.getElementById("fullName").value = data.name;
      document.getElementById("contact").value = data.contact;
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  });

  if (closeChangeDetailsModal) {
    closeChangeDetailsModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const contact = document.getElementById("contact").value;
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;

    if (newPassword && newPassword !== confirmNewPassword) {
      alert("New password does not match confirmation");
      return;
    }

    try {
      const res = await fetch(`${API}/user/update-details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contact, currentPassword, newPassword }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Details updated successfully");
        modal.style.display = "none";
        form.reset();
      } else {
        alert(result.message || "Error updating details");
      }
    } catch (err) {
      console.error("Error updating details:", err);
    }
  });
}

// -------------------------------
// Initial load
// -------------------------------
loadUsers();
loadLoans();
loadDocs();
loadAdminStats();
