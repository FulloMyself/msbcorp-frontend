const token = localStorage.getItem('token'); 
if(!token) window.location.href = 'index.html';

const LOCAL = window.location.hostname === 'localhost';
const API = LOCAL ? 'http://localhost:5000/api' : 'https://msb-backend-5km0.onrender.com/api';

document.getElementById('logoutBtn').onclick = ()=>{
  localStorage.clear();
  window.location.href = 'index.html';
};

// Load all users
async function loadUsers(){
  try {
    const res = await fetch(`${API}/admin/users`, { headers:{ 'Authorization': `Bearer ${token}` } });
    const users = await res.json();
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML='';
    users.forEach(u=>{
      const tr = document.createElement('tr');
      tr.innerHTML=`<td>${u.name}</td><td>${u.email}</td>`;
      tbody.appendChild(tr);
    });
  } catch(err){
    alert('Failed to load users');
  }
}

// Load all loans
async function loadLoans(){
  try {
    const res = await fetch(`${API}/admin/loans`, { headers:{ 'Authorization': `Bearer ${token}` } });
    const loans = await res.json();
    const tbody = document.querySelector('#loansTable tbody');
    tbody.innerHTML='';
    loans.forEach(l=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${l.user.name}</td><td>R${l.amount}</td><td>${l.status}</td>
                      <td>
                        <button onclick="updateLoan('${l._id}','Approved')">Approve</button>
                        <button onclick="updateLoan('${l._id}','Rejected')">Reject</button>
                      </td>`;
      tbody.appendChild(tr);
    });
  } catch(err){
    alert('Failed to load loans');
  }
}

// Load all documents
async function loadDocs(){
  try {
    const res = await fetch(`${API}/admin/documents`, { headers:{ 'Authorization': `Bearer ${token}` } });
    const docs = await res.json();
    const tbody = document.querySelector('#docsTable tbody');
    tbody.innerHTML='';
    docs.forEach(d=>{
      const tr = document.createElement('tr');
      tr.innerHTML=`<td>${d.user.name}</td>
                    <td><a href="${API.replace('/api','')}/uploads/${d.fileName}" target="_blank">${d.fileName}</a></td>
                    <td>${d.status}</td>
                    <td>
                      <button onclick="updateDoc('${d._id}','Approved')">Approve</button>
                      <button onclick="updateDoc('${d._id}','Rejected')">Reject</button>
                    </td>`;
      tbody.appendChild(tr);
    });
  } catch(err){
    alert('Failed to load documents');
  }
}

// Update Loan
async function updateLoan(id,status){
  try {
    await fetch(`${API}/admin/loans/${id}`,{
      method:'PATCH',
      headers:{ 'Content-Type':'application/json','Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    loadLoans();
  } catch(err){
    alert('Failed to update loan status');
  }
}

// Update Document
async function updateDoc(id,status){
  try {
    await fetch(`${API}/admin/documents/${id}`,{
      method:'PATCH',
      headers:{ 'Content-Type':'application/json','Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    loadDocs();
  } catch(err){
    alert('Failed to update document status');
  }
}

// Initial load
loadUsers();
loadLoans();
loadDocs();
