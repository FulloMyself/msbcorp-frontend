// Get modal elements
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const applyNowBtn = document.getElementById('applyNowBtn');
const closeButtons = document.querySelectorAll('.close');
const termsBtn = document.getElementById('termsBtn');
const termsModal = document.getElementById('termsModal');

// ---------------- MODAL TOGGLE ----------------

// Show login modal from navbar
loginBtn.addEventListener('click', () => {
  loginModal.style.display = 'flex';
});

// Show registration modal from login modal
showRegister.addEventListener('click', () => {
  loginModal.style.display = 'none';
  registerModal.style.display = 'flex';
});

// Show login modal from registration modal
showLogin.addEventListener('click', () => {
  registerModal.style.display = 'none';
  loginModal.style.display = 'flex';
});

// Show registration modal from "Apply Now" button
applyNowBtn.addEventListener('click', () => {
  registerModal.style.display = 'flex';
});

// Close modal buttons
closeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').style.display = 'none';
  });
});

// Close modal when clicking outside
window.addEventListener('click', e => {
  if (e.target === loginModal) loginModal.style.display = 'none';
  if (e.target === registerModal) registerModal.style.display = 'none';
});

// Open modal
termsBtn.onclick = () => {
  termsModal.style.display = 'flex';
};

// Close modal (reusing existing close button code)
termsModal.querySelector('.close').onclick = () => {
  termsModal.style.display = 'none';
};

// Close modal when clicking outside content
window.onclick = (e) => {
  if (e.target === termsModal) {
    termsModal.style.display = 'none';
  }
};


// ---------------- SMOOTH SCROLL ----------------
document.querySelectorAll('.nav-links a').forEach(anchor => {
  anchor.addEventListener('click', function(e){
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ---------------- BACKEND API ----------------
const API = 'https://msbcorp-backend.onrender.com/api';

// ---------------- REGISTER ----------------
document.getElementById('registerSubmit').addEventListener('click', async () => {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const contact = document.getElementById('registerContact').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  if (!name || !email || !contact || !password || !confirmPassword) {
    return alert('All fields are required');
  }

  if (password !== confirmPassword) return alert('Passwords do not match!');

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
});

// ---------------- LOGIN ----------------
document.getElementById('loginSubmit').addEventListener('click', async () => {
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
});
