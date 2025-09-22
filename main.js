// ---------------- MODAL ELEMENTS ----------------
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const applyNowBtn = document.getElementById('applyNowBtn');
const closeButtons = document.querySelectorAll('.close');
const termsBtn = document.getElementById('termsBtn');
const termsModal = document.getElementById('termsModal');
const faqBtn = document.getElementById('faqBtn');
const faqModal = document.getElementById('faqModal');
const loanSlider = document.getElementById('loanSlider');
const sliderAmount = document.getElementById('sliderAmount');
const displayAmount = document.getElementById('displayAmount');
const displayInterest = document.getElementById('displayInterest');
const displayTotal = document.getElementById('displayTotal');
const calcApplyBtn = document.getElementById('calcApplyBtn');

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0
  }).format(amount);
}

function updateCalculation() {
  const principal = parseInt(loanSlider.value);
  const interestRate = 0.30; // 30%
  const interest = Math.round(principal * interestRate);
  const total = principal + interest;

  sliderAmount.textContent = formatCurrency(principal);
  displayAmount.textContent = formatCurrency(principal);
  displayInterest.textContent = formatCurrency(interest);
  displayTotal.textContent = formatCurrency(total);
}

loanSlider.addEventListener('input', updateCalculation);

// Redirects to register modal when applying
calcApplyBtn.addEventListener('click', () => {
  document.getElementById('registerModal').style.display = 'flex';
});

// Initialize on load
updateCalculation();

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

// Close modals when clicking outside
window.addEventListener('click', e => {
  if (e.target === loginModal) loginModal.style.display = 'none';
  if (e.target === registerModal) registerModal.style.display = 'none';
  if (e.target === termsModal) termsModal.style.display = 'none';
  if (e.target === faqModal) faqModal.style.display = 'none';
});

// ---------------- TERMS & FAQ MODALS ----------------
termsBtn.addEventListener('click', () => {
  termsModal.style.display = 'flex';
});

termsModal.querySelector('.close').addEventListener('click', () => {
  termsModal.style.display = 'none';
});

faqBtn.addEventListener('click', () => {
  faqModal.style.display = 'flex';
});

faqModal.querySelector('.close').addEventListener('click', () => {
  faqModal.style.display = 'none';
});

// ---------------- FAQ ACCORDION ----------------
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const answer = question.nextElementSibling;
    const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';

    // Close all other answers
    document.querySelectorAll('.faq-answer').forEach(ans => {
      ans.style.maxHeight = null;
    });

    // Toggle current answer
    if (!isOpen) {
      answer.style.maxHeight = answer.scrollHeight + 'px';
    } else {
      answer.style.maxHeight = null;
    }
  });
});

// ---------------- SMOOTH SCROLL ----------------
document.querySelectorAll('.nav-links a').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
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
