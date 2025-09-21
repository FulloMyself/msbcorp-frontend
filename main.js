const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const showRegister = document.getElementById('showRegister');
const closeButtons = document.querySelectorAll('.close');

// Show login modal
loginBtn.onclick = () => loginModal.style.display = 'flex';

// Show registration modal from login modal
showRegister.onclick = () => {
  loginModal.style.display = 'none';
  registerModal.style.display = 'flex';
};

// Close modals
closeButtons.forEach(btn => {
  btn.onclick = () => btn.closest('.modal').style.display = 'none';
});

// Backend API URL
const API = 'https://msb-backend-5km0.onrender.com/api';

// ---------------- REGISTER ----------------
document.getElementById('registerSubmit').onclick = async () => {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const contact = document.getElementById('registerContact').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  if (!name || !email || !contact || !password || !confirmPassword) {
    return alert('All fields are required');
  }

  // Password confirmation
  if (password !== confirmPassword) {
    return alert('Passwords do not match!');
  }

  // South African phone number validation
  const saPhoneRegex = /^(?:\+27|0)\d{9}$/;
  if (!saPhoneRegex.test(contact)) {
    return alert('Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)');
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, contact, password })
    });

    const data = await res.json();

    if (data.token) {
      alert('Registration successful');
      registerModal.style.display = 'none';
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      window.location.href = data.user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
};

// ---------------- LOGIN ----------------
document.getElementById('loginSubmit').onclick = async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) return alert('Email and password are required');

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.token) {
      alert('Login successful');
      loginModal.style.display = 'none';
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      window.location.href = data.user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Server error');
  }
};
