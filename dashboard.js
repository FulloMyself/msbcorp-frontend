document.addEventListener("DOMContentLoaded", () => {
  // --------------------
  // Auth check
  // --------------------
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "index.html");

  const LOCAL = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const API = LOCAL ? "http://localhost:5000/api" : "https://msbcorp-backend.onrender.com/api";

  // --------------------
  // Utility: API fetch
  // --------------------
  async function apiFetch(url, options = {}) {
    options.headers = options.headers || {};
    if (!options.headers["Authorization"]) options.headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(url, options);
      const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : null;
      if (!res.ok) throw new Error(data?.message || `Request failed with status ${res.status}`);
      return data;
    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred");
      throw err;
    }
  }

  // --------------------
  // Logout
  // --------------------
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
  });

  // --------------------
  // Change Details Modal
  // --------------------
  const changeBtn = document.getElementById("changeDetailsBtn");
  const changeModal = document.getElementById("changeDetailsModal");
  const changeForm = document.getElementById("changeDetailsForm");
  const closeChangeModal = changeModal?.querySelector(".close");

  if (changeBtn && changeModal && changeForm) {
    changeBtn.addEventListener("click", async () => {
      changeModal.style.display = "flex";
      try {
        const data = await apiFetch(`${API}/user/me`);
        document.getElementById("fullName").value = data.name;
        document.getElementById("contact").value = data.contact || "";
      } catch (err) {
        console.error("Failed to load user details", err);
      }
    });

    closeChangeModal?.addEventListener("click", () => (changeModal.style.display = "none"));

    changeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const contact = document.getElementById("contact").value.trim();
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmNewPassword").value;

      if (newPassword && newPassword !== confirmPassword) return alert("New password does not match");

      try {
        const res = await apiFetch(`${API}/user/update-details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact, currentPassword, newPassword }),
        });
        alert(res.message || "Details updated successfully");
        changeModal.style.display = "none";
        changeForm.reset();
      } catch (err) {
        console.error("Update failed", err);
      }
    });
  }

  // --------------------
  // Apply Loan
  // --------------------
  const applyLoanBtn = document.getElementById("applyLoanBtn");
  const bankModal = document.getElementById("bankModal");
  const closeBankModal = document.getElementById("closeBankModal");
  const submitLoanBtn = document.getElementById("submitBankDetailsBtn");

  if (applyLoanBtn && bankModal && closeBankModal && submitLoanBtn) {
    // Open bank modal only if amount is valid
    applyLoanBtn.addEventListener("click", () => {
      const amountInput = Number(document.getElementById("loanAmount").value.trim());
      if (!amountInput || amountInput < 300 || amountInput > 4000) {
        return alert("Enter a valid loan amount between R300 and R4000");
      }
      bankModal.dataset.amount = amountInput; // store amount
      bankModal.style.display = "block";
    });

    // Close modal
    closeBankModal.addEventListener("click", () => (bankModal.style.display = "none"));
    window.addEventListener("click", (e) => e.target === bankModal && (bankModal.style.display = "none"));

    // Submit loan
    submitLoanBtn.addEventListener("click", async () => {
      const amount = Number(document.getElementById("loanAmount").value.trim());
      if (!amount || amount < 300 || amount > 4000) return alert("Enter a valid amount (R300-R4000)");

      const bankFields = ["bankName", "accountNumber", "branchCode", "accountHolder"];
      const bankDetails = {};
      for (const id of bankFields) {
        const val = document.getElementById(id).value.trim();
        if (!val) return alert("Fill all bank details");
        bankDetails[id] = val;
      }

      const term = 12;
      submitLoanBtn.disabled = true;
      submitLoanBtn.textContent = "Submitting...";

      try {
        const res = await apiFetch(`${API}/user/apply-loan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, bankDetails, term }),
        });

        alert(res.message || "Loan applied successfully");
        bankModal.style.display = "none";
        document.getElementById("loanAmount").value = "";
        bankFields.forEach((id) => (document.getElementById(id).value = ""));
        await refreshAll();
      } catch (err) {
        console.error("Loan application failed", err);
        alert(err.message || "Failed to apply loan");
      } finally {
        submitLoanBtn.disabled = false;
        submitLoanBtn.textContent = "Submit";
      }
    });
  }

  // --------------------
  // Upload Document
  // --------------------
  document.getElementById("uploadDocBtn")?.addEventListener("click", async () => {
    const fileInput = document.getElementById("docFile");
    if (!fileInput?.files?.length) return alert("Select a file");

    const formData = new FormData();
    formData.append("document", fileInput.files[0]);

    try {
      await apiFetch(`${API}/user/upload-document`, { method: "POST", body: formData });
      alert("Document uploaded successfully");
      await refreshAll();
    } catch (err) {
      console.error("Upload failed", err);
    }
  });

  // --------------------
  // Load Loans
  // --------------------
  async function loadLoans() {
    const loansTable = document.querySelector("#loansTable tbody");
    if (!loansTable) return;

    const loans = await apiFetch(`${API}/user/loans`);
    loansTable.innerHTML = loans
      .map((l) => `<tr>
          <td>R${l.amount}</td>
          <td>${l.status || "Pending"}</td>
          <td>${new Date(l.createdAt).toLocaleString()}</td>
        </tr>`)
      .join("");
  }

  // --------------------
  // Load Documents
  // --------------------
  async function loadDocs() {
    const docsTable = document.querySelector("#docsTable tbody");
    if (!docsTable) return;

    const docs = await apiFetch(`${API}/user/documents`);
    docsTable.innerHTML = docs
      .map((d) => `<tr>
          <td>${d.fileName}</td>
          <td>${d.status || "Pending"}</td>
          <td>${new Date(d.createdAt).toLocaleString()}</td>
          <td>
            <button class="openDocBtn" data-url="${d.signedUrl}">Open</button>
            <button class="deleteDocBtn" data-id="${d._id}">Delete</button>
          </td>
        </tr>`)
      .join("");

    docsTable.querySelectorAll(".openDocBtn").forEach((btn) => {
      btn.onclick = () => window.open(btn.dataset.url, "_blank");
    });
    docsTable.querySelectorAll(".deleteDocBtn").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Are you sure you want to delete this document?")) return;
        await apiFetch(`${API}/user/documents/${btn.dataset.id}`, { method: "DELETE" });
        await refreshAll();
      };
    });
  }

  // --------------------
  // Load Stats
  // --------------------
  async function loadStats() {
    const totalLoansEl = document.getElementById("totalLoans");
    const totalLoanAmountEl = document.getElementById("totalLoanAmount");
    const totalDocsEl = document.getElementById("totalDocs");

    const [loans, docs] = await Promise.all([apiFetch(`${API}/user/loans`), apiFetch(`${API}/user/documents`)]);
    totalLoansEl && (totalLoansEl.textContent = loans.length);
    totalLoanAmountEl && (totalLoanAmountEl.textContent = `R${loans.reduce((sum, l) => sum + l.amount, 0)}`);
    totalDocsEl && (totalDocsEl.textContent = docs.length);
  }

  // --------------------
  // Refresh All
  // --------------------
  async function refreshAll() {
    await Promise.all([loadLoans(), loadDocs(), loadStats()]);
  }

  // --------------------
  // Initial load
  // --------------------
  refreshAll();
});
