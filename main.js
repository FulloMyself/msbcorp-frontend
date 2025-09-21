const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const showRegister = document.getElementById('showRegister');
const closeButtons = document.querySelectorAll('.close');

// Show/Hide modals
loginBtn.onclick = ()=> loginModal.style.display='flex';
showRegister.onclick = ()=>{
  loginModal.style.display='none';
  registerModal.style.display='flex';
};
closeButtons.forEach(btn => btn.onclick = ()=> { btn.parentElement.parentElement.style.display='none'; });

// Backend API URL
const API = 'https://msb-backend-5km0.onrender.com/api';

// Register
document.getElementById('registerSubmit').onclick = async ()=>{
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  const res = await fetch(`${API}/auth/register`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ name,email,password })
  });
  const data = await res.json();
  if(data.token){
    alert('Registration successful');
    registerModal.style.display='none';
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    window.location.href = data.user.role==='admin' ? 'admin-dashboard.html' : 'dashboard.html';
  } else alert(data.message);
};

// Login
document.getElementById('loginSubmit').onclick = async ()=>{
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch(`${API}/auth/login`,{
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ email,password })
  });
  const data = await res.json();
  if(data.token){
    alert('Login successful');
    loginModal.style.display='none';
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    window.location.href = data.user.role==='admin' ? 'admin-dashboard.html' : 'dashboard.html';
  } else alert(data.message);
};
