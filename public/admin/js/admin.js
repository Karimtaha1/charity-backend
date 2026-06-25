// Admin Dashboard JavaScript
const originalAddEventListener = window.addEventListener;
window.addEventListener = function(type, listener, options) {
    if (type === 'unload') {
        console.warn('Replaced deprecated unload with pagehide');
        return originalAddEventListener.call(this, 'pagehide', listener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
};
const API_BASE_URL = '/api';
let currentLang = localStorage.getItem('adminLang') || 'ar';
let authToken = localStorage.getItem('adminToken');
let currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

// Charts instances
let donationsChartInstance = null;
let projectsChartInstance = null;

// ============================================
// AUTHENTICATION
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    showLoading(true);

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminUser', JSON.stringify(currentUser));
            showApp();
            showToast(currentLang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful', 'success');
            
        } else {
            showToast(data.message?.[currentLang] || data.message, 'error');
        }
    } catch (error) {
        showToast(currentLang === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
        showLoading(false);
    }
}

function logout() {
    authToken = null;
    currentUser = {};
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    showLogin();
    showToast(currentLang === 'ar' ? 'تم تسجيل الخروج' : 'Logged out', 'success');
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showLogin();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentUser = data.user;
                showApp();
                loadDashboard();
            } else {
                showLogin();
            }
        } else {
            // Token invalid
            localStorage.removeItem('token');
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLogin();
    }
}

function showLogin() {

    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
}

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.fullName || 'Admin';
    document.getElementById('userRole').textContent = currentUser.role || 'Admin';
    loadAdminSettings();
    loadDashboard();
}

async function loadAdminSettings() {
    try {
        const data = await apiGet('/settings');
        if (data.success && data.settings) {
            const s = data.settings;
            if (s.siteNameAr && document.getElementById('sidebarTitle')) {
                document.getElementById('sidebarTitle').textContent = s.siteNameAr;
            }
        }
    } catch (error) {
        console.log('Settings load error (non-critical):', error);
    }
}

// Check auth on load

// ============================================
// LANGUAGE
// ============================================

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('adminLang', lang);

    // Update document direction
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update sidebar width based on direction
    const sidebar = document.getElementById('sidebar');
    if (lang === 'en') {
        sidebar.style.right = 'auto';
        sidebar.style.left = '0';
        document.querySelector('.main-content').style.marginRight = '0';
        document.querySelector('.main-content').style.marginLeft = 'var(--sidebar-width)';
    } else {
        sidebar.style.left = 'auto';
        sidebar.style.right = '0';
        document.querySelector('.main-content').style.marginLeft = '0';
        document.querySelector('.main-content').style.marginRight = 'var(--sidebar-width)';
    }

    // Update all elements with data attributes
    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
        el.textContent = el.getAttribute(`data-${lang}`);
    });

    // Update lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(lang === 'ar' ? 'عرب' : 'engl'));
    });

    // Refresh page title
    updatePageTitle();
}

// ============================================
// SIDEBAR
// ============================================

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    document.getElementById(`page-${pageName}`).classList.add('active');

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    // Update page title
    const titles = {
        dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
        donations: { ar: 'التبرعات', en: 'Donations' },
        projects: { ar: 'المشروعات', en: 'Projects' },
        volunteers: { ar: 'المتطوعين', en: 'Volunteers' },
        messages: { ar: 'الرسائل', en: 'Messages' },
        stories: { ar: 'قصص النجاح', en: 'Success Stories' },
        news: { ar: 'الأخبار', en: 'News' },
        partners: { ar: 'الشركاء', en: 'Partners' },
        settings: { ar: 'الإعدادات', en: 'Settings' }
    };

    document.getElementById('pageTitle').textContent = titles[pageName][currentLang];

    // Load page data
    switch(pageName) {
        case 'dashboard': loadDashboard(); break;
        case 'donations': loadDonations(); break;
        case 'projects': loadProjects(); break;
        case 'volunteers': loadVolunteers(); break;
        case 'messages': loadMessages(); break;
        case 'stories': loadStories(); break;
        case 'news': loadNews(); break;
        case 'partners': loadPartners(); break;
        case 'settings': loadSettings(); break;
    }
}

function updatePageTitle() {
    const activePage = document.querySelector('.page-section.active');
    if (activePage) {
        const pageId = activePage.id.replace('page-', '');
        const titles = {
            dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
            donations: { ar: 'التبرعات', en: 'Donations' },
            projects: { ar: 'المشروعات', en: 'Projects' },
            volunteers: { ar: 'المتطوعين', en: 'Volunteers' },
            messages: { ar: 'الرسائل', en: 'Messages' },
            stories: { ar: 'قصص النجاح', en: 'Success Stories' },
            news: { ar: 'الأخبار', en: 'News' },
            partners: { ar: 'الشركاء', en: 'Partners' },
            settings: { ar: 'الإعدادات', en: 'Settings' }
        };
        document.getElementById('pageTitle').textContent = titles[pageId]?.[currentLang] || '';
    }
}

// ============================================
// API HELPERS
// ============================================
// apiGet:
async function apiGet(endpoint) {
    const token = authToken || localStorage.getItem('adminToken') || '';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': currentLang
        }
    });
    return response.json();
}

// apiPost:
async function apiPost(endpoint, data) {
    const token = authToken || localStorage.getItem('adminToken') || '';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept-Language': currentLang
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

// apiPut:
async function apiPut(endpoint, data) {
    const token = authToken || localStorage.getItem('adminToken') || '';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept-Language': currentLang
        },
        body: JSON.stringify(data)
    });
    return response.json();
}

// apiDelete:
async function apiDelete(endpoint) {
    const token = authToken || localStorage.getItem('adminToken') || '';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': currentLang
        }
    });
    return response.json();
}

// apiPostFormData:
async function apiPostFormData(endpoint, formData) {
    const token = authToken || localStorage.getItem('adminToken') || '';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': currentLang
        },
        body: formData
    });
    return response.json();
}

// apiPutFormData:
async function apiPutFormData(endpoint, formData) {
    const token = authToken || localStorage.getItem('adminToken') || '';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept-Language': currentLang
        },
        body: formData
    });
    return response.json();
}
// ============================================
// DASHBOARD
// ============================================

async function loadDashboard() {
    showLoading(true);
    try {
        const data = await apiGet('/dashboard/stats');
        if (data.success) {
            updateDashboardStats(data.stats || {});
            renderDonationsChart(data.charts?.donationsByMonth || []);
            renderProjectsChart(data.charts?.projectsByCategory || []);
            renderRecentDonations(data.recent?.donations || []);
            updateBadges(data.stats || {});
        } else {
            showToast(data.message?.[currentLang] || data.message, 'error');
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast(currentLang === 'ar' ? 'خطأ في تحميل لوحة التحكم' : 'Dashboard load error', 'error');
    } finally {
        showLoading(false);
    }
}

function updateDashboardStats(stats) {
    // Handle undefined stats
    if (!stats) stats = {};
    
    animateNumber('statDonations', stats.totalDonations || 0, 'EGP');
    animateNumber('statBeneficiaries', stats.totalBeneficiaries || 0, '');
    animateNumber('statProjects', stats.activeProjects || 0, '');
    animateNumber('statVolunteers', stats.totalVolunteers || 0, '');

    // Update change percentages dynamically
    updateStatChange('statChangeDonations', stats.donationChange, stats.donationChangeDirection);
    updateStatChange('statChangeBeneficiaries', stats.beneficiariesChange, stats.beneficiariesChangeDirection);
    updateStatChange('statChangeProjects', stats.projectsChange, stats.projectsChangeDirection);
    updateStatChange('statChangeVolunteers', stats.volunteersChange, stats.volunteersChangeDirection);
}

function updateStatChange(elementId, value, direction) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (value === undefined || value === null) {
        el.style.display = 'none';
        return;
    }
    el.style.display = 'inline-flex';
    const isUp = direction !== 'down';
    el.className = isUp ? 'stat-change up' : 'stat-change down';
    el.innerHTML = `<i class="fas fa-arrow-${isUp ? 'up' : 'down'}"></i> ${value > 0 ? '+' : ''}${value}${typeof value === 'number' && value < 100 ? '%' : ''}`;
}

function animateNumber(elementId, target, prefix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1500;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeProgress);

        let formatted = current.toLocaleString();
        if (target >= 1000000) {
            formatted = (current / 1000000).toFixed(1) + 'M';
        } else if (target >= 1000) {
            formatted = (current / 1000).toFixed(0) + 'K';
        }

        element.textContent = prefix ? prefix + ' ' + formatted : formatted;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateBadges(stats) {
    const volunteerBadge = document.getElementById('volunteerBadge');
    const messageBadge = document.getElementById('messageBadge');

    if (volunteerBadge && stats.pendingVolunteers > 0) {
        volunteerBadge.textContent = stats.pendingVolunteers;
        volunteerBadge.style.display = 'inline-block';
    } else if (volunteerBadge) {
        volunteerBadge.style.display = 'none';
    }

    if (messageBadge && stats.unreadMessages > 0) {
        messageBadge.textContent = stats.unreadMessages;
        messageBadge.style.display = 'inline-block';
    } else if (messageBadge) {
        messageBadge.style.display = 'none';
    }
}

function renderDonationsChart(data) {
    const ctx = document.getElementById('donationsChart');
    if (!ctx) return;

    if (donationsChartInstance) {
        donationsChartInstance.destroy();
    }

    const labels = data.map(d => d.month);
    const values = data.map(d => d.total);

    donationsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: currentLang === 'ar' ? 'التبرعات' : 'Donations',
                data: values,
                borderColor: '#1a5f4a',
                backgroundColor: 'rgba(26, 95, 74, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#e8b923',
                pointBorderColor: '#1a5f4a',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function renderProjectsChart(data) {
    const ctx = document.getElementById('projectsChart');
    if (!ctx) return;

    if (projectsChartInstance) {
        projectsChartInstance.destroy();
    }

    const labels = data.map(d => {
        const categories = {
            education: currentLang === 'ar' ? 'التعليم' : 'Education',
            health: currentLang === 'ar' ? 'الصحة' : 'Health',
            women: currentLang === 'ar' ? 'تمكين المرأة' : 'Women',
            families: currentLang === 'ar' ? 'الأسر' : 'Families',
            water: currentLang === 'ar' ? 'المياه' : 'Water',
            training: currentLang === 'ar' ? 'التدريب' : 'Training'
        };
        return categories[d.category] || d.category;
    });
    const values = data.map(d => d.count);

    projectsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#1a5f4a',
                    '#2d8a6e',
                    '#e8b923',
                    '#3b82f6',
                    '#ef4444',
                    '#8b5cf6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Cairo', size: 11 },
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderRecentDonations(donations) {
    const tbody = document.getElementById('recentDonationsTable');
    if (!tbody) return;

    tbody.innerHTML = donations.slice(0, 5).map(d => `
        <tr>
            <td>${d.donorName}</td>
            <td><strong>${d.amount.toLocaleString()} EGP</strong></td>
            <td>${getDonationTypeLabel(d.donationType)}</td>
            <td>${d.projectTitle || '-'}</td>
            <td><span class="status-badge status-${d.paymentStatus}">${getStatusLabel(d.paymentStatus)}</span></td>
            <td>${formatDate(d.createdAt)}</td>
        </tr>
    `).join('');
}

// ============================================
// DONATIONS
// ============================================

async function loadDonations() {
    showLoading(true);
    try {
        const data = await apiGet('/donations');
        if (data.success) {
            renderDonationsTable(data.donations);
        }
    } catch (error) {
        console.error('Donations load error:', error);
    } finally {
        showLoading(false);
    }
}

function renderDonationsTable(donations) {
    const tbody = document.getElementById('donationsTable');
    if (!tbody) return;

    tbody.innerHTML = donations.map((d, i) => `
        <tr>
            <td>${d.id}</td>
            <td>${d.donorName}</td>
            <td><strong>${d.amount.toLocaleString()} EGP</strong></td>
            <td>${getDonationTypeLabel(d.donationType)}</td>
            <td>${getPaymentMethodLabel(d.paymentMethod)}</td>
            <td><span class="status-badge status-${d.paymentStatus}">${getStatusLabel(d.paymentStatus)}</span></td>
            <td>${formatDate(d.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="updateDonationStatus(${d.id}, 'completed')" title="تأكيد"><i class="fas fa-check"></i></button>
                    <button class="action-btn delete" onclick="updateDonationStatus(${d.id}, 'failed')" title="رفض"><i class="fas fa-times"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function updateDonationStatus(id, status) {
    try {
        const data = await apiPut(`/donations/${id}/status`, { paymentStatus: status });
        if (data.success) {
            showToast(data.message?.[currentLang] || 'Updated', 'success');
            loadDonations();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

// ============================================
// PROJECTS
// ============================================

async function loadProjects() {
    showLoading(true);
    try {
        const data = await apiGet('/projects');
        if (data.success) {
            renderProjectsTable(data.projects);
        }
    } catch (error) {
        console.error('Projects load error:', error);
    } finally {
        showLoading(false);
    }
}

function renderProjectsTable(projects) {
    const tbody = document.getElementById('projectsTable');
    if (!tbody) return;

    tbody.innerHTML = projects.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.title}</td>
            <td>${getCategoryLabel(p.category)}</td>
            <td>${p.goalAmount.toLocaleString()} EGP</td>
            <td>${p.raisedAmount.toLocaleString()} EGP</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 6px; background: rgba(26,95,74,0.1); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${p.progress}%; height: 100%; background: linear-gradient(90deg, #1a5f4a, #e8b923); border-radius: 3px;"></div>
                    </div>
                    <span style="font-size: 0.8rem; font-weight: 700;">${p.progress}%</span>
                </div>
            </td>
            <td><span class="status-badge status-${p.status}">${getStatusLabel(p.status)}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editProject(${p.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteProject(${p.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleProjectSubmit(e) {
    e.preventDefault();
    showLoading(true);

    const formData = new FormData();
    formData.append('titleAr', document.getElementById('projectTitleAr').value);
    formData.append('titleEn', document.getElementById('projectTitleEn').value);
    formData.append('category', document.getElementById('projectCategory').value);
    formData.append('goalAmount', document.getElementById('projectGoal').value);
    formData.append('descriptionAr', document.getElementById('projectDescAr').value);
    formData.append('descriptionEn', document.getElementById('projectDescEn').value);
    formData.append('location', document.getElementById('projectLocation').value);
    formData.append('startDate', document.getElementById('projectStartDate').value);
    formData.append('endDate', document.getElementById('projectEndDate').value);

    const imageFile = document.getElementById('projectImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const projectId = e.target.dataset.projectId;

    try {
        let result;
        if (projectId) {
            result = await apiPutFormData(`/projects/${projectId}`, formData);
            if (result.success) {
                showToast(currentLang === 'ar' ? 'تم تحديث المشروع' : 'Project updated', 'success');
            }
        } else {
            result = await apiPostFormData('/projects', formData);
            if (result.success) {
                showToast(currentLang === 'ar' ? 'تم إضافة المشروع' : 'Project added', 'success');
            }
        }

        if (result.success) {
            closeModal('projectModal');
            loadProjects();
        } else {
            const errorMsg = result.message?.[currentLang] || result.message || 'Error';
            showToast(errorMsg, 'error');
            console.error('Server error:', result);
        }
    } catch (error) {
        console.error('Submit error:', error);
        showToast(currentLang === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
        showLoading(false);
    }
}

async function editProject(id) {
    try {
        const data = await apiGet(`/projects/${id}`);
        if (data.success) {
            const p = data.project;
            document.getElementById('projectTitleAr').value = p.titleAr || p.title || '';
            document.getElementById('projectTitleEn').value = p.titleEn || '';
            document.getElementById('projectCategory').value = p.category || 'education';
            document.getElementById('projectGoal').value = p.goalAmount || '';
            document.getElementById('projectDescAr').value = p.descriptionAr || p.description || '';
            document.getElementById('projectDescEn').value = p.descriptionEn || '';
            document.getElementById('projectLocation').value = p.location || '';
            document.getElementById('projectStartDate').value = p.startDate ? p.startDate.split('T')[0] : '';
            document.getElementById('projectEndDate').value = p.endDate ? p.endDate.split('T')[0] : '';

            document.getElementById('projectForm').dataset.projectId = id;
            document.querySelector('#projectModal .modal-title').textContent = currentLang === 'ar' ? 'تعديل مشروع' : 'Edit Project';

            openModal('projectModal');
        } else {
            showToast(data.message?.[currentLang] || 'Error loading project', 'error');
        }
    } catch (error) {
        console.error('Error fetching project:', error);
        showToast(currentLang === 'ar' ? 'خطأ في جلب بيانات المشروع' : 'Error fetching project', 'error');
    }
}

async function deleteProject(id) {
    if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;

    try {
        const data = await apiDelete(`/projects/${id}`);
        if (data.success) {
            showToast(data.message?.[currentLang] || 'Deleted', 'success');
            loadProjects();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

// ============================================
// VOLUNTEERS
// ============================================

async function loadVolunteers() {
    showLoading(true);
    try {
        const data = await apiGet('/volunteers');
        if (data.success) {
            renderVolunteersTable(data.volunteers);
        }
    } catch (error) {
        console.error('Volunteers load error:', error);
    } finally {
        showLoading(false);
    }
}

function renderVolunteersTable(volunteers) {
    const tbody = document.getElementById('volunteersTable');
    if (!tbody) return;

    tbody.innerHTML = volunteers.map(v => `
        <tr>
            <td>${v.id}</td>
            <td>${v.fullName}</td>
            <td>${v.phone}</td>
            <td>${v.governorate || '-'}</td>
            <td>${v.field}</td>
            <td><span class="status-badge status-${v.status}">${getStatusLabel(v.status)}</span></td>
            <td>${formatDate(v.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="updateVolunteerStatus(${v.id}, 'approved')" title="قبول"><i class="fas fa-check"></i></button>
                    <button class="action-btn delete" onclick="updateVolunteerStatus(${v.id}, 'rejected')" title="رفض"><i class="fas fa-times"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function updateVolunteerStatus(id, status) {
    try {
        const data = await apiPut(`/volunteers/${id}`, { status });
        if (data.success) {
            showToast(data.message?.[currentLang] || 'Updated', 'success');
            loadVolunteers();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

// ============================================
// MESSAGES
// ============================================

async function loadMessages() {
    showLoading(true);
    try {
        const data = await apiGet('/contact');
        if (data.success) {
            renderMessagesTable(data.messages);
        }
    } catch (error) {
        console.error('Messages load error:', error);
    } finally {
        showLoading(false);
    }
}

function renderMessagesTable(messages) {
    const tbody = document.getElementById('messagesTable');
    if (!tbody) return;

    tbody.innerHTML = messages.map(m => `
        <tr>
            <td>${m.id}</td>
            <td>${m.name}</td>
            <td>${m.email}</td>
            <td>${m.subject || '-'}</td>
            <td>${m.message.substring(0, 50)}...</td>
            <td><span class="status-badge status-${m.status === 'unread' ? 'pending' : 'completed'}">${getStatusLabel(m.status)}</span></td>
            <td>${formatDate(m.createdAt)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="updateMessageStatus(${m.id}, 'read')" title="قراءة"><i class="fas fa-envelope-open"></i></button>
                    <button class="action-btn delete" onclick="deleteMessage(${m.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function updateMessageStatus(id, status) {
    try {
        const data = await apiPut(`/contact/${id}/status`, { status });
        if (data.success) {
            showToast(data.message?.[currentLang] || 'Updated', 'success');
            loadMessages();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

async function deleteMessage(id) {
    if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;

    try {
        const data = await apiDelete(`/contact/${id}`);
        if (data.success) {
            showToast(data.message?.[currentLang] || 'Deleted', 'success');
            loadMessages();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

// ============================================
// STORIES
// ============================================

async function loadStories() {
    showLoading(true);
    try {
        const data = await apiGet('/stories');
        if (data.success) {
            renderStoriesTable(data.stories);
        }
    } catch (error) {
        console.error('Stories load error:', error);
    } finally {
        showLoading(false);
    }
}

function renderStoriesTable(stories) {
    const tbody = document.getElementById('storiesTable');
    if (!tbody) return;

    tbody.innerHTML = stories.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.title}</td>
            <td>${s.beneficiaryName || '-'}</td>
            <td>${s.category || '-'}</td>
            <td>${s.isFeatured ? '✅' : '❌'}</td>
            <td>${s.viewsCount}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editStory(${s.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteStory(${s.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleStorySubmit(e) {
    e.preventDefault();
    showLoading(true);

    const formData = new FormData();
    formData.append('titleAr', document.getElementById('storyTitleAr').value);
    formData.append('titleEn', document.getElementById('storyTitleEn').value);
    formData.append('contentAr', document.getElementById('storyContentAr').value);
    formData.append('contentEn', document.getElementById('storyContentEn').value);
    formData.append('beneficiaryName', document.getElementById('storyBeneficiary').value);
    formData.append('category', document.getElementById('storyCategory').value);
    formData.append('isFeatured', document.getElementById('storyFeatured').checked ? 'true' : 'false');

    const imageFile = document.getElementById('storyImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const storyId = e.target.dataset.storyId;

    try {
        let result;
        if (storyId) {
            result = await apiPutFormData(`/stories/${storyId}`, formData);
            if (result.success) {
                showToast(currentLang === 'ar' ? 'تم تحديث القصة' : 'Story updated', 'success');
            }
        } else {
            result = await apiPostFormData('/stories', formData);
            if (result.success) {
                showToast(currentLang === 'ar' ? 'تم إضافة القصة' : 'Story added', 'success');
            }
        }

        if (result.success) {
            closeModal('storyModal');
            loadStories();
        } else {
            const errorMsg = result.message?.[currentLang] || result.message || 'Error';
            showToast(errorMsg, 'error');
            console.error('Server error:', result);
        }
    } catch (error) {
        console.error('Submit error:', error);
        showToast(currentLang === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
        showLoading(false);
    }
}

async function editStory(id) {
    try {
        const data = await apiGet(`/stories/${id}`);
        if (data.success) {
            const s = data.story;
            document.getElementById('storyTitleAr').value = s.titleAr || '';
            document.getElementById('storyTitleEn').value = s.titleEn || '';
            document.getElementById('storyContentAr').value = s.contentAr || '';
            document.getElementById('storyContentEn').value = s.contentEn || '';
            document.getElementById('storyBeneficiary').value = s.beneficiaryName || '';
            document.getElementById('storyCategory').value = s.category || 'education';
            document.getElementById('storyFeatured').checked = s.isFeatured || false;

            document.getElementById('storyForm').dataset.storyId = id;
            document.querySelector('#storyModal .modal-title').textContent = currentLang === 'ar' ? 'تعديل قصة' : 'Edit Story';

            openModal('storyModal');
        }
    } catch (error) {
        console.error('Error fetching story:', error);
    }
}

async function deleteStory(id) {
    if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;

    try {
        const data = await apiDelete(`/stories/${id}`);
        if (data.success) {
            showToast(data.message?.[currentLang] || 'Deleted', 'success');
            loadStories();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

// ============================================
// NEWS
// ============================================

async function loadNews() {
    showLoading(true);
    try {
        const data = await apiGet('/news');
        if (data.success) {
            renderNewsTable(data.news);
        }
    } catch (error) {
        console.error('News load error:', error);
    } finally {
        showLoading(false);
    }
}

function renderNewsTable(news) {
    const tbody = document.getElementById('newsTable');
    if (!tbody) return;

    tbody.innerHTML = news.map(n => `
        <tr>
            <td>${n.id}</td>
            <td>${n.title}</td>
            <td>${getNewsTypeLabel(n.type)}</td>
            <td>${formatDate(n.createdAt)}</td>
            <td>${n.isFeatured ? '✅' : '❌'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editNews(${n.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deleteNews(${n.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handleNewsSubmit(e) {
    e.preventDefault();
    showLoading(true);

    const newsId = e.target.dataset.newsId;
    const isEdit = !!newsId;

    const formData = new FormData();
    formData.append('titleAr', document.getElementById('newsTitleAr').value.trim());
    formData.append('titleEn', document.getElementById('newsTitleEn').value.trim());
    formData.append('contentAr', document.getElementById('newsContentAr').value.trim());
    formData.append('contentEn', document.getElementById('newsContentEn').value.trim());
    formData.append('type', document.getElementById('newsType').value);

    // Handle eventDate - if empty, don't send it
    const eventDate = document.getElementById('newsEventDate').value;
    if (eventDate) {
        formData.append('eventDate', eventDate);
    }

    const location = document.getElementById('newsLocation').value;
    if (location && location.trim()) {
        formData.append('location', location.trim());
    }

    // Send as string "true"/"false" for boolean
    formData.append('isFeatured', document.getElementById('newsFeatured').checked ? "true" : "false");

    const imageFile = document.getElementById('newsImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        let result;
        if (isEdit) {
            result = await apiPutFormData(`/news/${newsId}`, formData);
        } else {
            result = await apiPostFormData('/news', formData);
        }

        if (result.success) {
            const msg = isEdit 
                ? (currentLang === 'ar' ? 'تم تحديث الخبر بنجاح' : 'News updated successfully')
                : (currentLang === 'ar' ? 'تم إضافة الخبر بنجاح' : 'News added successfully');
            showToast(msg, 'success');
            closeModal('newsModal');
            loadNews();
        } else {
            // Show the actual error message from server
            const errorMsg = result.message?.[currentLang] || result.message || (currentLang === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving news');
            showToast(errorMsg, 'error');
            console.error('Server error:', result);
        }
    } catch (error) {
        console.error('Network/Error:', error);
        showToast(currentLang === 'ar' ? 'خطأ في الاتصال بالخادم' : 'Server connection error', 'error');
    } finally {
        showLoading(false);
    }
}

async function editNews(id) {
    try {
        const data = await apiGet(`/news/${id}`);
        if (data.success) {
            const n = data.news;
            document.getElementById('newsTitleAr').value = n.titleAr || '';
            document.getElementById('newsTitleEn').value = n.titleEn || '';
            document.getElementById('newsContentAr').value = n.contentAr || '';
            document.getElementById('newsContentEn').value = n.contentEn || '';
            document.getElementById('newsType').value = n.type || 'news';
            document.getElementById('newsEventDate').value = n.eventDate ? n.eventDate.replace(' ', 'T') : '';
            document.getElementById('newsLocation').value = n.location || '';
            document.getElementById('newsFeatured').checked = n.isFeatured || false;

            document.getElementById('newsForm').dataset.newsId = id;
            document.querySelector('#newsModal .modal-title').textContent = currentLang === 'ar' ? 'تعديل خبر' : 'Edit News';

            openModal('newsModal');
        } else {
            showToast(currentLang === 'ar' ? 'لم يتم العثور على الخبر' : 'News not found', 'error');
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        showToast(currentLang === 'ar' ? 'خطأ في جلب بيانات الخبر' : 'Error fetching news data', 'error');
    }
}

async function deleteNews(id) {
    if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;

    try {
        const data = await apiDelete(`/news/${id}`);
        if (data.success) {
            showToast(data.message?.[currentLang] || 'Deleted', 'success');
            loadNews();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

// ============================================
// PARTNERS
// ============================================

async function loadPartners() {
    showLoading(true);
    try {
        const data = await apiGet('/partners');
        if (data.success) {
            renderPartnersTable(data.partners);
        }
    } catch (error) {
        console.error('Partners load error:', error);
    } finally {
        showLoading(false);
    }
}

function renderPartnersTable(partners) {
    const tbody = document.getElementById('partnersTable');
    if (!tbody) return;

    tbody.innerHTML = partners.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${currentLang === 'ar' ? p.nameAr : p.nameEn}</td>
            <td>${getPartnerTypeLabel(p.type)}</td>
            <td>${p.website ? `<a href="${p.website}" target="_blank">${p.website}</a>` : '-'}</td>
            <td>${p.isActive ? '✅' : '❌'}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="editPartner(${p.id})" title="تعديل"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="deletePartner(${p.id})" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function handlePartnerSubmit(e) {
    e.preventDefault();
    showLoading(true);

    const formData = new FormData();
    formData.append('nameAr', document.getElementById('partnerNameAr').value);
    formData.append('nameEn', document.getElementById('partnerNameEn').value);
    formData.append('type', document.getElementById('partnerType').value);
    formData.append('website', document.getElementById('partnerWebsite').value);
    formData.append('description', document.getElementById('partnerDescription').value);

    const logoFile = document.getElementById('partnerLogo').files[0];
    if (logoFile) {
        formData.append('logo', logoFile);
    }

    const partnerId = e.target.dataset.partnerId;

    try {
        let result;
        if (partnerId) {
            result = await apiPutFormData(`/partners/${partnerId}`, formData);
            if (result.success) {
                showToast(currentLang === 'ar' ? 'تم تحديث الشريك' : 'Partner updated', 'success');
            }
        } else {
            result = await apiPostFormData('/partners', formData);
            if (result.success) {
                showToast(currentLang === 'ar' ? 'تم إضافة الشريك' : 'Partner added', 'success');
            }
        }

        if (result.success) {
            closeModal('partnerModal');
            loadPartners();
        } else {
            const errorMsg = result.message?.[currentLang] || result.message || 'Error';
            showToast(errorMsg, 'error');
            console.error('Server error:', result);
        }
    } catch (error) {
        console.error('Submit error:', error);
        showToast(currentLang === 'ar' ? 'خطأ في الاتصال' : 'Connection error', 'error');
    } finally {
        showLoading(false);
    }
}

async function editPartner(id) {
    try {
        const data = await apiGet(`/partners/${id}`);
        if (data.success) {
            const p = data.partner;
            document.getElementById('partnerNameAr').value = p.nameAr || '';
            document.getElementById('partnerNameEn').value = p.nameEn || '';
            document.getElementById('partnerType').value = p.type || 'company';
            document.getElementById('partnerWebsite').value = p.website || '';
            document.getElementById('partnerDescription').value = p.description || '';

            document.getElementById('partnerForm').dataset.partnerId = id;
            document.querySelector('#partnerModal .modal-title').textContent = currentLang === 'ar' ? 'تعديل شريك' : 'Edit Partner';

            openModal('partnerModal');
        }
    } catch (error) {
        console.error('Error fetching partner:', error);
    }
}

async function deletePartner(id) {
    if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;

    try {
        const data = await apiDelete(`/partners/${id}`);
        if (data.success) {
            showToast(data.message?.[currentLang] || 'Deleted', 'success');
            loadPartners();
        }
    } catch (error) {
        showToast('Error', 'error');
    }
}

// ============================================
// SETTINGS
// ============================================


// Load donation stats from API
async function loadDonationStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/donation-stats`);
        const result = await response.json();

        if (result.success && result.stats) {
            const stats = result.stats;
            const totalEl = document.getElementById('totalDonations');
            const monthlyEl = document.getElementById('monthlyDonations');
            const yearlyEl = document.getElementById('yearlyDonations');

            if (totalEl) totalEl.value = stats.totalDonations || '0';
            if (monthlyEl) monthlyEl.value = stats.monthlyDonations || '0';
            if (yearlyEl) yearlyEl.value = stats.yearlyDonations || '0';

            console.log('Donation stats loaded:', stats);
        }
    } catch (error) {
        console.error('Error loading donation stats:', error);
    }
}

// Save donation stats to API
async function saveDonationStats() {
    try {
        const token = localStorage.getItem('adminToken');
        const totalEl = document.getElementById('totalDonations');
        const monthlyEl = document.getElementById('monthlyDonations');
        const yearlyEl = document.getElementById('yearlyDonations');

        const donationData = {
            totalDonations: totalEl ? totalEl.value || 0 : 0,
            monthlyDonations: monthlyEl ? monthlyEl.value || 0 : 0,
            yearlyDonations: yearlyEl ? yearlyEl.value || 0 : 0
        };

        console.log('Saving donation stats:', donationData);

        const response = await fetch(`${API_BASE_URL}/donation-stats`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept-Language': currentLang
            },
            body: JSON.stringify(donationData)
        });

        const result = await response.json();
        if (result.success) {
            console.log('Donation stats saved:', result.message);
            return true;
        } else {
            console.error('Failed to save donation stats:', result.message);
            return false;
        }
    } catch (error) {
        console.error('Error saving donation stats:', error);
        return false;
    }
}

async function loadSettings() {
    showLoading(true);
    try {
        const data = await apiGet('/settings');
        if (data.success) {
            const s = data.settings;
            document.getElementById('siteNameAr').value = s.siteNameAr || '';
            document.getElementById('siteNameEn').value = s.siteNameEn || '';
            document.getElementById('contactEmail').value = s.contactEmail || '';
            document.getElementById('contactPhone').value = s.contactPhone || '';
            document.getElementById('contactAddress').value = s.contactAddress || '';
            document.getElementById('facebookUrl').value = s.facebookUrl || '';
            document.getElementById('twitterUrl').value = s.twitterUrl || '';
            document.getElementById('instagramUrl').value = s.instagramUrl || '';
            document.getElementById('youtubeUrl').value = s.youtubeUrl || '';
            // New fields
            document.getElementById('heroTitle').value = s.heroTitle || '';
            document.getElementById('heroDescription').value = s.heroDescription || '';
            document.getElementById('heroBadge').value = s.heroBadge || '';
            document.getElementById('foundingYear').value = s.foundingYear || '';
            document.getElementById('aboutTitle').value = s.aboutTitle || '';
            document.getElementById('aboutDescription').value = s.aboutDescription || '';
            document.getElementById('mission').value = s.mission || '';
            // Donation stats fields
            document.getElementById('totalDonations').value = s.totalDonations || '0';
            document.getElementById('monthlyDonations').value = s.monthlyDonations || '0';
            document.getElementById('yearlyDonations').value = s.yearlyDonations || '0';
            document.getElementById('vision').value = s.vision || '';
            document.getElementById('footerAbout').value = s.footerAbout || '';
            document.getElementById('copyright').value = s.copyright || '';
            document.getElementById('workingHours').value = s.workingHours || '';
            // Load donation stats from separate API
            await loadDonationStats();
        }
    } catch (error) {
        console.error('Settings load error:', error);
    } finally {
        showLoading(false);
    }
}

async function saveSettings() {
    showLoading(true);

    const data = {
        siteNameAr: document.getElementById('siteNameAr').value,
        siteNameEn: document.getElementById('siteNameEn').value,
        contactEmail: document.getElementById('contactEmail').value,
        contactPhone: document.getElementById('contactPhone').value,
        contactAddress: document.getElementById('contactAddress').value,
        facebookUrl: document.getElementById('facebookUrl').value,
        twitterUrl: document.getElementById('twitterUrl').value,
        instagramUrl: document.getElementById('instagramUrl').value,
        youtubeUrl: document.getElementById('youtubeUrl').value,
        // New fields
        heroTitle: document.getElementById('heroTitle').value,
        heroDescription: document.getElementById('heroDescription').value,
        heroBadge: document.getElementById('heroBadge').value,
        foundingYear: document.getElementById('foundingYear').value,
        aboutTitle: document.getElementById('aboutTitle').value,
        aboutDescription: document.getElementById('aboutDescription').value,
        mission: document.getElementById('mission').value,
        vision: document.getElementById('vision').value,
        footerAbout: document.getElementById('footerAbout').value,
        copyright: document.getElementById('copyright').value,
        workingHours: document.getElementById('workingHours').value,
    };

    try {
        const result = await apiPut('/settings', data);
        if (result.success) {
            showToast(result.message?.[currentLang] || 'Saved', 'success');
              await saveDonationStats();
        }
    } catch (error) {
        showToast('Error', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// HELPERS
// ============================================

function getDonationTypeLabel(type) {
    const labels = {
        ar: { 'one-time': 'مرة واحدة', 'monthly': 'شهري', 'sponsorship': 'كفالة', 'zakat': 'زكاة', 'sadaqah': 'صدقة' },
        en: { 'one-time': 'One-time', 'monthly': 'Monthly', 'sponsorship': 'Sponsorship', 'zakat': 'Zakat', 'sadaqah': 'Sadaqah' }
    };
    return labels[currentLang][type] || type;
}

function getPaymentMethodLabel(method) {
    const labels = {
        ar: { 'vodafone_cash': 'فودافون كاش', 'credit_card': 'بطاقة', 'bank_transfer': 'تحويل بنكي', 'fawry': 'فوري', 'cash': 'نقدي' },
        en: { 'vodafone_cash': 'Vodafone Cash', 'credit_card': 'Credit Card', 'bank_transfer': 'Bank Transfer', 'fawry': 'Fawry', 'cash': 'Cash' }
    };
    return labels[currentLang][method] || method;
}

function getStatusLabel(status) {
    const labels = {
        ar: { 'completed': 'مكتمل', 'pending': 'معلق', 'active': 'نشط', 'rejected': 'مرفوض', 'failed': 'فاشل', 'unread': 'غير مقروء', 'read': 'مقروء' },
        en: { 'completed': 'Completed', 'pending': 'Pending', 'active': 'Active', 'rejected': 'Rejected', 'failed': 'Failed', 'unread': 'Unread', 'read': 'Read' }
    };
    return labels[currentLang][status] || status;
}

function getCategoryLabel(cat) {
    const labels = {
        ar: { 'education': 'التعليم', 'health': 'الصحة', 'women': 'تمكين المرأة', 'families': 'الأسر', 'water': 'المياه', 'training': 'التدريب', 'sustainable': 'مستدام' },
        en: { 'education': 'Education', 'health': 'Health', 'women': 'Women', 'families': 'Families', 'water': 'Water', 'training': 'Training', 'sustainable': 'Sustainable' }
    };
    return labels[currentLang][cat] || cat;
}

function getNewsTypeLabel(type) {
    const labels = {
        ar: { 'news': 'خبر', 'event': 'فعالية', 'campaign': 'حملة', 'announcement': 'إعلان' },
        en: { 'news': 'News', 'event': 'Event', 'campaign': 'Campaign', 'announcement': 'Announcement' }
    };
    return labels[currentLang][type] || type;
}

function getPartnerTypeLabel(type) {
    const labels = {
        ar: { 'company': 'شركة', 'government': 'حكومة', 'ngo': 'منظمة', 'individual': 'فرد' },
        en: { 'company': 'Company', 'government': 'Government', 'ngo': 'NGO', 'individual': 'Individual' }
    };
    return labels[currentLang][type] || type;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLang === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ============================================
// UI HELPERS
// ============================================

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('active', show);
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    // Reset form if exists
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
        delete form.dataset.projectId;
        delete form.dataset.storyId;
        delete form.dataset.newsId;
        delete form.dataset.partnerId;
    }
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// ============================================
// INIT
// ============================================
// Check authentication on load
async function checkAuth() {
    const token = authToken || localStorage.getItem('adminToken');
    
    if (!token) {
        showLogin();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept-Language': currentLang
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentUser = data.user;
                authToken = token;
                showApp();
                loadDashboard();
            } else {
                localStorage.removeItem('adminToken');
                authToken = null;
                showLogin();
            }
        } else {
            localStorage.removeItem('adminToken');
            authToken = null;
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLogin();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    checkAuth();
    setLang(currentLang);
});