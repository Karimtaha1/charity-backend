// API Configuration
const API_BASE_URL = '/api';

// Helper function for API calls
async function apiGet(endpoint) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    return null;
  }
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0
  }).format(amount || 0);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
// Load Projects
async function loadProjects() {
  const result = await apiGet('/projects');
  if (!result || !result.success) return;

  const projects = result.projects || [];
  const container = document.getElementById('projectsGrid') || document.getElementById('projects-container');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = '<div class="text-center py-5"><p class="text-muted">لا توجد مشاريع حالياً</p></div>';
    return;
  }

  container.innerHTML = projects.map(project => {
    const title = project.titleAr || project.title || 'مشروع';
    const description = project.descriptionAr || project.description || '';
    const progress = project.goalAmount > 0 ? Math.min((project.raisedAmount / project.goalAmount) * 100, 100) : 0;

    return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="project-card h-100">
        <div class="project-image">
          <img src="${project.image || '/uploads/default-project.jpg'}" alt="${title}" loading="lazy">
          <div class="project-category">${project.category || 'عام'}</div>
        </div>
        <div class="project-content">
          <h3>${title}</h3>
          <p>${description ? description.substring(0, 120) + '...' : ''}</p>
          <div class="project-progress">
            <div class="progress">
              <div class="progress-bar" role="progressbar" style="width: ${progress}%"></div>
            </div>
            <div class="progress-info">
              <span>تم جمع: ${formatCurrency(project.raisedAmount)}</span>
              <span>الهدف: ${formatCurrency(project.goalAmount)}</span>
            </div>
          </div>
          <div class="project-location">
            <i class="fas fa-map-marker-alt"></i> ${project.location || 'مصر'}
          </div>
          <a href="#donate" class="btn btn-primary w-100 mt-3" onclick="selectProject(${project.id})">تبرع الآن</a>
        </div>
      </div>
    </div>
  `}).join('');
}
// Load News
async function loadNews() {
  const result = await apiGet('/news');
  if (!result || !result.success) return;

  const news = result.news || [];
  const container = document.getElementById('newsGrid') || document.getElementById('news-container');
  if (!container) return;

  if (news.length === 0) {
    container.innerHTML = '<div class="text-center py-5"><p class="text-muted">لا توجد أخبار حالياً</p></div>';
    return;
  }

  const featured = news[0];
  const rest = news.slice(1, 4);

  let html = '';
  if (featured) {
    const featuredTitle = featured.titleAr || featured.title || 'خبر';
    const featuredContent = featured.contentAr || featured.content || '';

    html += `
      <div class="col-lg-8 mb-4">
        <div class="news-featured">
          <img src="${featured.image || '/uploads/default-news.jpg'}" alt="${featuredTitle}" loading="lazy">
          <div class="news-content">
            <span class="news-date">${formatDate(featured.createdAt)}</span>
            <h3>${featuredTitle}</h3>
            <p>${featuredContent ? featuredContent.substring(0, 200) + '...' : ''}</p>
            <a href="#" class="read-more">اقرأ المزيد <i class="fas fa-arrow-left"></i></a>
          </div>
        </div>
      </div>
    `;
  }

  html += rest.map(item => {
    const itemTitle = item.titleAr || item.title || 'خبر';
    const itemContent = item.contentAr || item.content || '';

    return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="news-card">
        <img src="${item.image || '/uploads/default-news.jpg'}" alt="${itemTitle}" loading="lazy">
        <div class="news-content">
          <span class="news-date">${formatDate(item.createdAt)}</span>
          <h4>${itemTitle}</h4>
          <p>${itemContent ? itemContent.substring(0, 100) + '...' : ''}</p>
          <a href="#" class="read-more">اقرأ المزيد <i class="fas fa-arrow-left"></i></a>
        </div>
      </div>
    </div>
  `}).join('');

  container.innerHTML = html;
}
// Load Stories
async function loadStories() {
  const result = await apiGet('/stories');
  if (!result || !result.success) return;

  const stories = result.stories || [];
  const container = document.getElementById('storiesGrid') || document.getElementById('stories-container');
  if (!container) return;

  if (stories.length === 0) {
    container.innerHTML = '<div class="text-center py-5"><p class="text-muted">لا توجد قصص حالياً</p></div>';
    return;
  }

  container.innerHTML = stories.map(story => {
    const title = story.titleAr || story.title || 'قصة نجاح';
    const content = story.contentAr || story.content || '';
    const author = story.beneficiaryName || story.author || 'مستفيد';

    return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="story-card">
        <div class="story-image">
          <img src="${story.image || '/uploads/default-story.jpg'}" alt="${title}" loading="lazy">
        </div>
        <div class="story-content">
          <div class="story-quote">
            <i class="fas fa-quote-right"></i>
          </div>
          <p class="story-text">${content ? content.substring(0, 150) + '...' : ''}</p>
          <div class="story-author">
            <h5>${author}</h5>
            <span>${title}</span>
          </div>
        </div>
      </div>
    </div>
  `}).join('');
}

// Load Partners
async function loadPartners() {
  const result = await apiGet('/partners');
  if (!result || !result.success) return;

  const partners = result.partners || [];
  const container = document.getElementById('partnersGrid') || document.getElementById('partners-container');
  if (!container) return;

  if (partners.length === 0) {
    container.innerHTML = '<div class="text-center py-3"><p class="text-muted">لا يوجد شركاء حالياً</p></div>';
    return;
  }

  container.innerHTML = partners.map(partner => {
    const name = partner.nameAr || partner.name || 'شريك';

    return `
    <div class="partner-item">
      <img src="${partner.logo || '/uploads/default-partner.png'}" alt="${name}" loading="lazy">
      <span class="partner-name">${name}</span>
    </div>
  `}).join('');
}

// Load Statistics from APIs
async function loadStats() {
  // Get donation stats from donation-stats API (manual values)
  const donationResult = await apiGet('/donation-stats');
  let donationStats = {};
  if (donationResult && donationResult.success) {
    donationStats = donationResult.stats || {};
  }

  // Get other stats from dashboard
  const dashResult = await apiGet('/dashboard/public-stats');
  let stats = {};
  if (dashResult && dashResult.success) {
    stats = dashResult.stats || {};
  }

  // Use manual donation value from donation-stats API
  const manualDonations = parseInt(donationStats.totalDonations) || 0;
  const dashboardDonations = parseInt(stats.totalDonations) || 0;
  const totalDonations = manualDonations > 0 ? manualDonations : dashboardDonations;

  console.log('=== DONATION STATS DEBUG ===');
  console.log('Donation API result:', donationResult);
  console.log('Donation stats:', donationStats);
  console.log('Manual donations:', manualDonations);
  console.log('Dashboard donations:', dashboardDonations);
  console.log('Final donations:', totalDonations);
  console.log('===========================');

  // Hero section stats
  const heroStats = {
    'statTotalProjects': parseInt(stats.totalProjects) || 0,
    'statBeneficiaries': parseInt(stats.totalBeneficiaries) || 0,
    'statTotalDonations': totalDonations
  };

  for (const [id, value] of Object.entries(heroStats)) {
    const element = document.getElementById(id);
    console.log(`Checking element ${id}:`, element ? 'FOUND' : 'NOT FOUND', 'value:', value);
    if (element) {
      animateNumber(element, 0, value, 2000);
    } else {
      console.error(`Element ${id} not found!`);
    }
  }

  // Dashboard section stats
  const dashStats = {
    'dashProjects': parseInt(stats.totalProjects) || 0,
    'dashDonations': totalDonations
  };

  for (const [id, value] of Object.entries(dashStats)) {
    const element = document.getElementById(id);
    if (element) {
      animateNumber(element, 0, value, 2000);
    }
  }
}

// Animate number counting
function animateNumber(element, start, end, duration) {
  // Ensure end is not negative
  end = Math.max(0, parseInt(end) || 0);
  start = Math.max(0, parseInt(start) || 0);

  const range = end - start;
  if (range <= 0) {
    element.textContent = end.toLocaleString('ar-EG');
    return;
  }

  const steps = Math.min(range, 50); // Max 50 steps
  const increment = Math.ceil(range / steps);
  const stepTime = Math.floor(duration / steps);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= end) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = current.toLocaleString('ar-EG');
  }, Math.max(stepTime, 20));
}
// Load Settings (site info)
async function loadSettings() {
  const result = await apiGet('/settings');
  if (!result || !result.success) return;

  const settings = result.settings || {};

  // Update site name
  const siteNameElements = document.querySelectorAll('.site-name');
  siteNameElements.forEach(el => {
    if (settings.siteName) el.textContent = settings.siteName;
  });

  // Update contact info
  const phoneEl = document.getElementById('contact-phone');
  if (phoneEl && settings.contactPhone) phoneEl.textContent = settings.contactPhone;

  const emailEl = document.getElementById('contact-email');
  if (emailEl && settings.contactEmail) emailEl.textContent = settings.contactEmail;

  const addressEl = document.getElementById('contact-address');
  if (addressEl && settings.address) addressEl.textContent = settings.address;

  // Update social links
  const socialLinks = {
    'social-facebook': settings.facebook,
    'social-twitter': settings.twitter,
    'social-instagram': settings.instagram,
    'social-youtube': settings.youtube
  };

  for (const [id, url] of Object.entries(socialLinks)) {
    const el = document.getElementById(id);
    if (el && url) {
      el.href = url;
      el.style.display = 'inline-block';
    } else if (el) {
      el.style.display = 'none';
    }
  }
}

// Handle Contact Form Submission
async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري الإرسال...';

  const formData = {
    name: form.querySelector('[name="name"]').value,
    email: form.querySelector('[name="email"]').value,
    phone: form.querySelector('[name="phone"]')?.value || '',
    subject: form.querySelector('[name="subject"]').value,
    message: form.querySelector('[name="message"]').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      alert('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
      form.reset();
    } else {
      alert(result.message?.ar || 'حدث خطأ، يرجى المحاولة مرة أخرى.');
    }
  } catch (error) {
    console.error('Contact form error:', error);
    alert('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Handle Donation
async function handleDonationSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري المعالجة...';

  const formData = {
    donorName: form.querySelector('[name="donorName"]').value,
    email: form.querySelector('[name="email"]').value,
    phone: form.querySelector('[name="phone"]')?.value || '',
    amount: parseFloat(form.querySelector('[name="amount"]').value),
    projectId: parseInt(form.querySelector('[name="projectId"]')?.value) || null,
    paymentMethod: form.querySelector('[name="paymentMethod"]')?.value || 'cash',
    message: form.querySelector('[name="message"]')?.value || ''
  };

  try {
    const response = await fetch(`${API_BASE_URL}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      alert('شكراً لتبرعك! سيتم التواصل معك لإتمام الإجراءات.');
      form.reset();
      loadStats();
    } else {
      alert(result.message?.ar || 'حدث خطأ، يرجى المحاولة مرة أخرى.');
    }
  } catch (error) {
    console.error('Donation error:', error);
    alert('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Handle Volunteer Registration
async function handleVolunteerSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري الإرسال...';

  const formData = {
    fullName: form.querySelector('[name="fullName"]').value,
    email: form.querySelector('[name="email"]').value,
    phone: form.querySelector('[name="phone"]')?.value || '',
    governorate: form.querySelector('[name="governorate"]').value,
    field: form.querySelector('[name="field"]').value,
    skills: form.querySelector('[name="skills"]')?.value || ''
  };

  try {
    const response = await fetch(`${API_BASE_URL}/volunteers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (result.success) {
      alert('تم تسجيلك كمتطوع بنجاح! سنتواصل معك قريباً.');
      form.reset();
      loadStats();
    } else {
      alert(result.message?.ar || 'حدث خطأ، يرجى المحاولة مرة أخرى.');
    }
  } catch (error) {
    console.error('Volunteer error:', error);
    alert('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// Select project for donation
function selectProject(projectId) {
  const select = document.querySelector('[name="projectId"]');
  if (select) select.value = projectId;
}

// Initialize all dynamic content
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 Loading dynamic content...');

  loadSettings();
  loadStats();
  loadProjects();
  loadNews();
  loadStories();
  loadPartners();

  // Attach form handlers
  const contactForm = document.getElementById('contact-form');
  if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);

  const donationForm = document.getElementById('donation-form');
  if (donationForm) donationForm.addEventListener('submit', handleDonationSubmit);

  const volunteerForm = document.getElementById('volunteer-form');
  if (volunteerForm) volunteerForm.addEventListener('submit', handleVolunteerSubmit);
});