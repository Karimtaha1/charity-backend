CREATE DATABASE karim;
GO

USE karim;
GO

-- =============================================
-- 1. USERS TABLE (Admin, Staff, Volunteers)
-- =============================================
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fullName NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    phone NVARCHAR(20),
    passwordHash NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) DEFAULT 'volunteer' CHECK (role IN ('superadmin', 'admin', 'staff', 'volunteer')),
    avatar NVARCHAR(255),
    isActive BIT DEFAULT 1,
    lastLogin DATETIME2,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 2. VOLUNTEERS TABLE
-- =============================================
CREATE TABLE Volunteers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fullName NVARCHAR(100) NOT NULL,
    email NVARCHAR(100),
    phone NVARCHAR(20) NOT NULL,
    governorate NVARCHAR(50),
    field NVARCHAR(50) NOT NULL,
    skills NVARCHAR(500),
    status NVARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'inactive')),
    hoursLogged INT DEFAULT 0,
    joinedAt DATETIME2 DEFAULT GETDATE(),
    notes NVARCHAR(500),
    createdAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 3. PROJECTS TABLE
-- =============================================
CREATE TABLE Projects (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titleAr NVARCHAR(200) NOT NULL,
    titleEn NVARCHAR(200) NOT NULL,
    descriptionAr NVARCHAR(MAX),
    descriptionEn NVARCHAR(MAX),
    category NVARCHAR(50) NOT NULL CHECK (category IN ('education', 'health', 'women', 'families', 'water', 'training', 'sustainable')),
    goalAmount DECIMAL(18,2) NOT NULL,
    raisedAmount DECIMAL(18,2) DEFAULT 0,
    beneficiariesCount INT DEFAULT 0,
    location NVARCHAR(100),
    image NVARCHAR(255),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'pending', 'cancelled')),
    startDate DATE,
    endDate DATE,
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 4. DONATIONS TABLE
-- =============================================
CREATE TABLE Donations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    donorName NVARCHAR(100) NOT NULL,
    donorEmail NVARCHAR(100),
    donorPhone NVARCHAR(20),
    amount DECIMAL(18,2) NOT NULL,
    currency NVARCHAR(3) DEFAULT 'EGP',
    donationType NVARCHAR(20) DEFAULT 'one-time' CHECK (donationType IN ('one-time', 'monthly', 'sponsorship', 'zakat', 'sadaqah')),
    projectId INT,
    paymentMethod NVARCHAR(30) NOT NULL CHECK (paymentMethod IN ('vodafone_cash', 'credit_card', 'bank_transfer', 'fawry', 'cash')),
    transactionId NVARCHAR(100),
    paymentStatus NVARCHAR(20) DEFAULT 'pending' CHECK (paymentStatus IN ('pending', 'completed', 'failed', 'refunded')),
    isAnonymous BIT DEFAULT 0,
    message NVARCHAR(500),
    createdAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (projectId) REFERENCES Projects(id)
);

-- =============================================
-- 5. BENEFICIARIES TABLE
-- =============================================
CREATE TABLE Beneficiaries (
    id INT IDENTITY(1,1) PRIMARY KEY,
    fullName NVARCHAR(100) NOT NULL,
    nationalId NVARCHAR(20),
    phone NVARCHAR(20),
    governorate NVARCHAR(50),
    address NVARCHAR(200),
    familySize INT DEFAULT 1,
    category NVARCHAR(30) CHECK (category IN ('orphan', 'widow', 'elderly', 'disabled', 'poor', 'student', 'patient')),
    needsDescription NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sponsored', 'completed', 'on_hold')),
    sponsorId INT,
    monthlySupport DECIMAL(18,2),
    createdAt DATETIME2 DEFAULT GETDATE(),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 6. SUCCESS STORIES TABLE
-- =============================================
CREATE TABLE SuccessStories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titleAr NVARCHAR(200) NOT NULL,
    titleEn NVARCHAR(200) NOT NULL,
    contentAr NVARCHAR(MAX),
    contentEn NVARCHAR(MAX),
    beneficiaryName NVARCHAR(100),
    category NVARCHAR(50),
    image NVARCHAR(255),
    videoUrl NVARCHAR(255),
    isFeatured BIT DEFAULT 0,
    viewsCount INT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 7. NEWS & EVENTS TABLE
-- =============================================
CREATE TABLE NewsEvents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titleAr NVARCHAR(200) NOT NULL,
    titleEn NVARCHAR(200) NOT NULL,
    contentAr NVARCHAR(MAX),
    contentEn NVARCHAR(MAX),
    type NVARCHAR(20) DEFAULT 'news' CHECK (type IN ('news', 'event', 'campaign', 'announcement')),
    image NVARCHAR(255),
    eventDate DATETIME2,
    location NVARCHAR(100),
    isFeatured BIT DEFAULT 0,
    viewsCount INT DEFAULT 0,
    createdAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 8. CONTACT MESSAGES TABLE
-- =============================================
CREATE TABLE ContactMessages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20),
    subject NVARCHAR(100),
    message NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    createdAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 9. PARTNERS TABLE
-- =============================================
CREATE TABLE Partners (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nameAr NVARCHAR(100) NOT NULL,
    nameEn NVARCHAR(100) NOT NULL,
    type NVARCHAR(30) CHECK (type IN ('company', 'government', 'ngo', 'individual')),
    logo NVARCHAR(255),
    website NVARCHAR(200),
    description NVARCHAR(500),
    isActive BIT DEFAULT 1,
    createdAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 10. FINANCIAL REPORTS TABLE
-- =============================================
CREATE TABLE FinancialReports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    titleAr NVARCHAR(200) NOT NULL,
    titleEn NVARCHAR(200) NOT NULL,
    year INT NOT NULL,
    quarter INT CHECK (quarter IN (1,2,3,4)),
    totalIncome DECIMAL(18,2) DEFAULT 0,
    totalExpenses DECIMAL(18,2) DEFAULT 0,
    fileUrl NVARCHAR(255),
    reportType NVARCHAR(20) DEFAULT 'annual' CHECK (reportType IN ('annual', 'quarterly', 'monthly')),
    createdAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 11. SITE SETTINGS TABLE
-- =============================================
CREATE TABLE SiteSettings (
    id INT PRIMARY KEY DEFAULT 1,
    siteNameAr NVARCHAR(100) DEFAULT N'مؤسسة الزند',
    siteNameEn NVARCHAR(100) DEFAULT 'Al-Zand Foundation',
    siteDescriptionAr NVARCHAR(500),
    siteDescriptionEn NVARCHAR(500),
    totalDonations DECIMAL(18,2) DEFAULT 0,
    totalBeneficiaries INT DEFAULT 0,
    totalProjects INT DEFAULT 0,
    totalVolunteers INT DEFAULT 0,
    sdgProgress INT DEFAULT 0,
    contactEmail NVARCHAR(100),
    contactPhone NVARCHAR(20),
    contactAddress NVARCHAR(200),
    facebookUrl NVARCHAR(200),
    twitterUrl NVARCHAR(200),
    instagramUrl NVARCHAR(200),
    youtubeUrl NVARCHAR(200),
    linkedinUrl NVARCHAR(200),
    updatedAt DATETIME2 DEFAULT GETDATE()
);

-- =============================================
-- 12. AUDIT LOG TABLE
-- =============================================
CREATE TABLE AuditLog (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT,
    action NVARCHAR(100) NOT NULL,
    tableName NVARCHAR(50),
    recordId INT,
    oldValues NVARCHAR(MAX),
    newValues NVARCHAR(MAX),
    ipAddress NVARCHAR(50),
    createdAt DATETIME2 DEFAULT GETDATE()
);

GO

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Default Admin User (password: Admin@123)
INSERT INTO Users (fullName, email, phone, passwordHash, role, isActive)
VALUES (N'مدير النظام', 'admin@alamal-charity.org', '01000000000', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin', 1);

-- Default Site Settings
INSERT INTO SiteSettings (siteNameAr, siteNameEn, siteDescriptionAr, siteDescriptionEn, totalDonations, totalBeneficiaries, totalProjects, totalVolunteers, sdgProgress, contactEmail, contactPhone, contactAddress)
VALUES (N'مؤسسة الزند', 'Al-Zand Foundation', 
        N'مؤسسة خيرية للتنمية المستدامة', 
        'Sustainable Development Charity Foundation',
        8500000, 12450, 156, 850, 87,
        'info@zand-charity.org', '19090', N'123 شارع التحرير، القاهرة، مصر');

-- Sample Projects
INSERT INTO Projects (titleAr, titleEn, descriptionAr, descriptionEn, category, goalAmount, raisedAmount, beneficiariesCount, location, status)
VALUES 
(N'مدارس الزند للتعليم الأساسي', 'Al-Zand Basic Education Schools', 
 N'بناء وتجهيز مدارس في المناطق النائية', 'Building and equipping schools in remote areas',
 'education', 2500000, 2125000, 3200, N'8 محافظات', 'active'),
(N'قافلة الزند الطبية المتنقلة', 'Al-Zand Mobile Medical Convoy',
 N'توفير الكشف الطبي المجاني', 'Providing free medical checkups',
 'health', 1800000, 1296000, 8500, N'15 قرية', 'active'),
(N'برنامج سيدات الزند', 'Al-Zand Women Empowerment Program',
 N'تدريب النساء على المهن الحرفية', 'Training women in vocational skills',
 'women', 1200000, 1080000, 1200, N'أسوان', 'active'),
(N'كفالة الأسر المحتاجة', 'Sponsorship for Needy Families',
 N'دعم شهري للأسر الفقيرة', 'Monthly support for poor families',
 'families', 3000000, 2850000, 2800, N'جميع المحافظات', 'active'),
(N'آبار المياه النقية', 'Clean Water Wells',
 N'حفر آبار مياه عميقة', 'Drilling deep water wells',
 'water', 4500000, 2700000, 12000, N'الصعيد', 'active');

-- Sample Partners
INSERT INTO Partners (nameAr, nameEn, type, isActive)
VALUES 
(N'وزارة التضامن الاجتماعي', 'Ministry of Social Solidarity', 'government', 1),
(N'البنك الأهلي المصري', 'National Bank of Egypt', 'company', 1),
(N'فودافون مصر', 'Vodafone Egypt', 'company', 1),
(N'اليونيسف', 'UNICEF', 'ngo', 1),
(N'مؤسسة مصر الخير', 'Misr El-Kheir Foundation', 'ngo', 1);

GO

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IX_Donations_CreatedAt ON Donations(createdAt DESC);
CREATE INDEX IX_Donations_PaymentStatus ON Donations(paymentStatus);
CREATE INDEX IX_Projects_Category ON Projects(category);
CREATE INDEX IX_Projects_Status ON Projects(status);
CREATE INDEX IX_Volunteers_Status ON Volunteers(status);
CREATE INDEX IX_Beneficiaries_Status ON Beneficiaries(status);
CREATE INDEX IX_NewsEvents_Type ON NewsEvents(type);
CREATE INDEX IX_ContactMessages_Status ON ContactMessages(status);

GO

ALTER TABLE SiteSettings ADD aboutTitle NVARCHAR(200);
ALTER TABLE SiteSettings ADD aboutDescription NVARCHAR(500);
ALTER TABLE SiteSettings ADD mission NVARCHAR(MAX);
ALTER TABLE SiteSettings ADD vision NVARCHAR(MAX);
ALTER TABLE SiteSettings ADD heroTitle NVARCHAR(200);
ALTER TABLE SiteSettings ADD heroDescription NVARCHAR(500);
ALTER TABLE SiteSettings ADD footerAbout NVARCHAR(500);
ALTER TABLE SiteSettings ADD copyright NVARCHAR(200);
ALTER TABLE SiteSettings ADD workingHours NVARCHAR(100);
ALTER TABLE SiteSettings ADD foundingYear INT DEFAULT 2010;
ALTER TABLE SiteSettings ADD heroBadge NVARCHAR(200);
ALTER TABLE SiteSettings ADD heroImage NVARCHAR(255);
ALTER TABLE SiteSettings ADD aboutImage NVARCHAR(255);

GO

-- Update default settings with new fields
UPDATE SiteSettings SET 
    aboutTitle = N'مؤسسة الزند للتنمية المستدامة',
    aboutDescription = N'نحن مؤسسة خيرية غير ربحية تأسست عام 2026 بهدف تمكين الأفراد وبناء مجتمعات مستدامة',
    mission = N'نؤمن بأن كل إنسان يستحق فرصة للحياة الكريمة. منذ تأسيسنا عام 2010، نعمل على تمكين الأفراد والمجتمعات من خلال برامج شاملة في التعليم والصحة والتدريب المهني ودعم الأسر المحتاجة.',
    vision = N'رؤيتنا هي مجتمع متكامل يتمتع فيه كل فرد بحقوقه الأساسية ويُسهم في التنمية المستدامة.',
    heroTitle = N'معاً نبني <span class="highlight">مستقبلاً</span> أفضل للجميع',
    heroDescription = N'نؤمن بأن التنمية المستدامة تبدأ بالإنسان. نعمل على تمكين الأفراد والمجتمعات من خلال التعليم والصحة ودعم الأسر المحتاجة',
    footerAbout = N'مؤسسة خيرية غير ربحية تأسست عام 2010 بهدف تمكين الأفراد وبناء مجتمعات مستدامة من خلال التعليم والصحة ودعم الأسر المحتاجة.',
    copyright = N'© 2026 مؤسسة الزند للتنمية المستدامة. جميع الحقوق محفوظة.',
    workingHours = N'جميع ايام الاسبوع',
    foundingYear = 2026,
    heroBadge = N'مؤسسة خيرية مرخصة منذ 2026'
WHERE id = 1;

GO

PRINT '✅ SiteSettings columns updated successfully!';
