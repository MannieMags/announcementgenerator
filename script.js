/*
 * ============================================================================
 * ANNOUNCEMENT GENERATOR FOR SADV & INFINIFI
 * ============================================================================
 * This script generates professional announcement images for network outages,
 * maintenance, and service restoration notifications. It supports two brands
 * (SADV and Infinifi) with automatic color/logo switching.
 * 
 * Output formats: PNG (1080x1080 Instagram square) and PDF (A4)
 * ============================================================================
 */

// ============================================================================
// BRAND CONFIGURATION
// ============================================================================
// Stores all brand-specific information including colors, contact details,
// and branding text. Adding a new brand requires adding a new object here.
const BRAND_COLORS = {
    // SADV Brand Configuration
    sadv: {
        primary: '#005EB8',      // SADV Blue - used for headers and accents
        secondary: '#FFC107',    // SADV Yellow/Gold - used for backgrounds
        accent: '#E91E63',       // SADV Pink/Magenta - used for highlights
        name: 'SADV',            // Display name
        tagline: 'Connecting you to what matters',  // Brand tagline
        website: 'www.sadv.co.za',                 // Website URL
        phone: '084 555 5585',                     // Contact number
        whatsapp: '+27 84 555 5585'                // WhatsApp number with country code
    },
    // Infinifi Brand Configuration
    infinifi: {
        primary: '#0b4e9b',      // Infinifi Dark Navy - headers, buttons, accents
        secondary: '#0b4e9b',    // Infinifi Deep Navy - header background (distinct from SADV yellow)
        accent: '#00BCD4',       // Infinifi Teal/Cyan - borders, highlights, badges
        name: 'Infinifi',        // Display name
        tagline: 'Unlimited Fibre. Unlike the promises you\'ve heard before',
        website: 'www.infinifi.co.za',
        phone: '084 555 8858',
        whatsapp: '+27 84 555 8858'
    }
};

// ============================================================================
// COMMON COLORS
// ============================================================================
// These colors are shared across all brands for consistent UI elements
// like text, backgrounds, and status indicators
const COLORS = {
    dark: '#1E293B',        // Dark gray for main text
    light: '#F8FAFC',       // Light gray for backgrounds
    lightPurple: '#E3F2FD', // Light blue for info boxes
    white: '#FFFFFF',       // Pure white for contrast
    text: '#334155',        // Medium gray for body text
    textLight: '#64748B',   // Light gray for secondary text
    warning: '#FFC107',     // Yellow for warnings and "In Progress" status
    danger: '#EF4444',      // Red for critical issues and "Investigating" status
    success: '#10B981'      // Green for resolved issues
};

// ============================================================================
// DOM ELEMENT REFERENCES
// ============================================================================
// Cache references to frequently accessed DOM elements for better performance
const form = document.getElementById('announcementForm');              // Main form element
const resetBtn = document.getElementById('resetBtn');                  // Reset form button
const previewSection = document.getElementById('previewSection');      // Preview container
const canvas = document.getElementById('announcementCanvas');          // HTML5 Canvas element
const ctx = canvas.getContext('2d');                                   // 2D drawing context
const downloadImageBtn = document.getElementById('downloadImage');     // PNG download button
const downloadPDFBtn = document.getElementById('downloadPDF');         // PDF download button
const logoUpload = document.getElementById('logoUpload');              // File upload input

// ============================================================================
// LOGO MANAGEMENT
// ============================================================================
// Handles both user-uploaded logos and default brand logos
let logoImage = null; // Stores user-uploaded custom logo (overrides brand logos)

// Object containing pre-loaded logo images for each brand
let brandLogos = {
    sadv: new Image(),      // SADV logo image object
    infinifi: new Image()   // Infinifi logo image object
};

// ============================================================================
// LOGO CACHE SYSTEM (localStorage-based, prevents canvas taint on file://)
// ============================================================================

/**
 * Save a brand logo to localStorage as a base64 data URL.
 * Data URLs are same-origin by definition so the canvas stays untainted.
 */
function saveBrandLogo(brand, file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem('brandLogo_' + brand, e.target.result);
        brandLogos[brand].src = e.target.result;
        console.log(brand + ' logo saved and loaded from cache');
        updateLogoSetupUI();
    };
    reader.readAsDataURL(file);
}

/**
 * Load both brand logos from localStorage cache on startup.
 * If a logo isn't cached yet the setup banner will prompt the user to pick the file.
 */
function loadBrandLogosFromCache() {
    const isServer = window.location.protocol === 'http:' || window.location.protocol === 'https:';

    ['sadv', 'infinifi'].forEach(function(brand) {
        const filename = brand === 'sadv' ? 'SADVLOGO.png' : 'INFINIFILOGO.png';

        if (isServer) {
            // On a live server the files are same-origin — load directly, no taint
            brandLogos[brand].onload = function() {
                console.log(brand + ' logo loaded from server');
                updateLogoSetupUI();
            };
            brandLogos[brand].onerror = function() {
                console.warn(brand + ' logo failed: ' + filename);
            };
            brandLogos[brand].src = filename + '?v=1';
        } else {
            // On file:// — use localStorage base64 cache to avoid canvas taint
            const cached = localStorage.getItem('brandLogo_' + brand);
            if (cached) {
                brandLogos[brand].src = cached;
                console.log(brand + ' logo loaded from cache');
            }
            updateLogoSetupUI();
        }
    });
}

function updateLogoSetupUI() {
    const isServer = window.location.protocol === 'http:' || window.location.protocol === 'https:';
    const banner   = document.getElementById('logoSetupBanner');

    if (isServer) {
        // On a live server logos load automatically — hide the setup banner entirely
        if (banner) banner.style.display = 'none';
        return;
    }

    // On file:// — show banner until both logos are cached
    const sadvCached  = !!localStorage.getItem('brandLogo_sadv');
    const infCached   = !!localStorage.getItem('brandLogo_infinifi');
    const sadvStatus  = document.getElementById('sadvLogoStatus');
    const infStatus   = document.getElementById('infinifiLogoStatus');
    if (banner)     { banner.style.display = (!sadvCached || !infCached) ? 'block' : 'none'; }
    if (sadvStatus) { sadvStatus.textContent  = sadvCached ? '✅ Logo cached & ready' : '⚠️ Not loaded'; sadvStatus.style.color = sadvCached ? '#10B981' : '#888'; }
    if (infStatus)  { infStatus.textContent   = infCached  ? '✅ Logo cached & ready' : '⚠️ Not loaded'; infStatus.style.color  = infCached  ? '#10B981' : '#888'; }
}

// Initialise logos from cache on page load
loadBrandLogosFromCache();

// ============================================================================
// CANVAS CONFIGURATION
// ============================================================================
// Canvas dimensions optimized for Instagram posts (1:1 square format)
const CANVAS_WIDTH = 1080;   // Width in pixels
let CANVAS_HEIGHT = 1080;    // Height — updated dynamically before each draw

// Apply initial canvas dimensions
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Enable high-quality text and image rendering on canvas
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// ============================================================================
// DYNAMIC CANVAS HEIGHT CALCULATOR
// ============================================================================
/**
 * Measures the total pixel height needed to display all content without clipping.
 * Called before each draw so canvas.height is set correctly first.
 */
function calculateCanvasHeight(data) {
    const isResolved = data.incidentStatus === 'Resolved';
    const isPlanned  = data.incidentType === 'Planned Maintenance' || data.incidentStatus === 'Scheduled';
    const hasEndTime = data.endDate && data.endTime;

    let h = 0;

    // Section 1: Header + gap
    h += 90 + 30;

    // Section 2: Badge (36px pill + 54px gap below) + time block
    h += 90; // badge section total
    if (hasEndTime && !isResolved) {
        // "SERVICE RETURNS AT" label + 65px gap + 72px time + 45px gap + 24px date + 5px gap
        h += 30 + 65 + 72 + 45 + 30 + 5;
    } else if (isResolved) {
        h += 60 + 40; // 60px RESTORED heading + gap
        if (data.endTime) h += 30;
        h += 30 + 10; // reassurance line + gap
    } else {
        // WE'RE ON IT block
        h += 64 + 65 + 30 + 40 + 30 + 25;
    }
    h += 25; // gap to apology box

    // Section 3: Apology box (dynamic — depends on wrap)
    ctx.font = '15px Arial';
    const apologyMsg = isResolved
        ? 'We apologize for the inconvenience caused by this service disruption. Your connection has now been fully restored. Thank you for your patience and continued support.'
        : 'We sincerely apologize for this disruption to your service. Our technical team is actively on-site and working to restore your connectivity as a matter of priority. We will keep you informed as the situation progresses.';
    const apologyLines = wrapText(ctx, apologyMsg, CANVAS_WIDTH - 300);
    h += 22 + 26 + 14 + (apologyLines.length * 23) + 22; // box height
    h += 20; // gap after apology

    // Section 4: Area box (dynamic — depends on number of areas)
    ctx.font = 'bold 26px Arial';
    const areaLinesCalc = wrapText(ctx, data.affectedAreas || '—', CANVAS_WIDTH - 180);
    h += 28 + (areaLinesCalc.length * 32) + 16 + 20;

    // Section 5: Incident details box
    let numDetails = 0;
    if (data.startDate && data.startTime) numDetails++;
    if (hasEndTime) { numDetails++; if (!isResolved) numDetails++; } // end + duration
    else if (!isResolved) numDetails++; // "to be confirmed"
    numDetails++; // reason/cause
    if (data.impact && data.impact.trim()) numDetails++;

    let detailsH = 35 + 25; // title bar + inner top padding
    detailsH += numDetails * 35;
    // Add extra height for long wrapped values
    ctx.font = 'bold 13px Arial';
    [data.description, data.impact].forEach(function(val) {
        if (!val || !val.trim()) return;
        const lines = wrapText(ctx, val, CANVAS_WIDTH - 120 - 200);
        if (lines.length > 1) detailsH += (lines.length - 1) * 20;
    });
    h += detailsH + 22;

    // Section 6: Latest Update (optional)
    if (data.updates && data.updates.trim()) {
        ctx.font = '14px Arial';
        const updateLines = wrapText(ctx, data.updates, CANVAS_WIDTH - 220);
        h += 18 + 24 + 12 + (updateLines.length * 22) + 18; // updateBoxH
        h += 20;
    }

    // Section 7: gap + contact box + gap + footer
    h += 20 + 126 + 14 + 42;

    return Math.max(1080, h + 30); // minimum 1080, plus safety padding
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================
// Set up event handlers for user interactions

// Handle form submission - Generate announcement when user clicks "Generate"
form.addEventListener('submit', function(e) {
    e.preventDefault();  // Prevent page reload on form submit
    console.log('Form submitted');
    generateAnnouncement();  // Generate the announcement image
});

// Handle reset button - Clear form and hide preview
resetBtn.addEventListener('click', function() {
    form.reset();                           // Reset all form fields to defaults
    logoImage = null;                       // Clear any uploaded custom logo
    previewSection.classList.add('hidden'); // Hide the preview section
});

// Handle logo upload - Process user-uploaded custom logo file
logoUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];  // Get the selected file
    if (file) {
        const reader = new FileReader();  // Create file reader to process image
        
        // When file is successfully read
        reader.onload = function(event) {
            const img = new Image();  // Create new image object
            
            // When image loads successfully
            img.onload = function() {
                logoImage = img;  // Store the loaded image for use in announcements
                console.log('Custom logo loaded successfully');
            };
            
            // If image fails to load
            img.onerror = function() {
                console.error('Failed to load custom logo');
                alert('Failed to load logo image');
            };
            
            img.src = event.target.result;  // Set image source to file data
        };
        
        reader.readAsDataURL(file);  // Read file as Data URL
    }
});

// Handle download button clicks
downloadImageBtn.addEventListener('click', downloadAsImage);  // Download as PNG
downloadPDFBtn.addEventListener('click', downloadAsPDF);      // Download as PDF

// Handle one-time brand logo setup file inputs
document.addEventListener('DOMContentLoaded', function() {
    const sadvSetup = document.getElementById('sadvLogoSetup');
    const infSetup  = document.getElementById('infinifiLogoSetup');
    if (sadvSetup) {
        sadvSetup.addEventListener('change', function(e) {
            if (e.target.files[0]) { saveBrandLogo('sadv', e.target.files[0]); }
        });
    }
    if (infSetup) {
        infSetup.addEventListener('change', function(e) {
            if (e.target.files[0]) { saveBrandLogo('infinifi', e.target.files[0]); }
        });
    }
});

// ============================================================================
// HELPER FUNCTIONS - BRAND MANAGEMENT
// ============================================================================

/**
 * Get the currently selected brand from the dropdown
 * @returns {string} Brand key ('sadv' or 'infinifi'), defaults to 'sadv'
 */
function getSelectedBrand() {
    const brandSelect = document.getElementById('brandSelect');
    return brandSelect ? brandSelect.value : 'sadv';  // Default to SADV if not found
}

/**
 * Get the color scheme for the currently selected brand
 * @returns {object} Brand color configuration object with primary, secondary, accent colors
 */
function getBrandColors() {
    const brand = getSelectedBrand();
    return BRAND_COLORS[brand];  // Return the brand-specific color object
}

// ============================================================================
// MAIN ANNOUNCEMENT GENERATION FUNCTION
// ============================================================================

/**
 * Primary function that orchestrates the entire announcement generation process.
 * Collects form data, determines which template to use, and triggers the rendering.
 * 
 * Flow:
 * 1. Get selected brand and its configuration
 * 2. Collect all form data into a data object
 * 3. Choose template (regular or restoration)
 * 4. Render announcement on canvas
 * 5. Display preview and scroll to it
 */
function generateAnnouncement() {
    try {
        console.log('Generating announcement...');
        
        // Get brand selection and load brand-specific configuration
        const brand = getSelectedBrand();
        const brandInfo = BRAND_COLORS[brand];
        
        // Collect all form data into a single object for easy access
        const data = {
            // Brand information
            brand: brand,                          // Brand key (sadv/infinifi)
            brandName: brandInfo.name,             // Display name (SADV/Infinifi)
            brandTagline: brandInfo.tagline,       // Brand tagline text
            brandWebsite: brandInfo.website,       // Website URL
            brandPhone: brandInfo.phone,           // Phone number
            brandWhatsApp: brandInfo.whatsapp,     // WhatsApp number
            
            // Incident details from form
            incidentType: document.getElementById('incidentType').value,       // Type of incident
            incidentStatus: document.getElementById('incidentStatus').value,   // Current status
            title: document.getElementById('title').value,                     // Announcement title
            affectedAreas: document.getElementById('affectedAreas').value,     // Affected locations
            startDate: document.getElementById('startDate').value,             // Start date
            startTime: document.getElementById('startTime').value,             // Start time
            endDate: document.getElementById('endDate').value,                 // End date (optional)
            endTime: document.getElementById('endTime').value,                 // End time (optional)
            description: document.getElementById('description').value,         // Detailed description
            impact: document.getElementById('impact').value,                   // Expected impact
            updates: document.getElementById('updates').value,                 // Latest updates
            contactInfo: document.getElementById('contactInfo').value,         // Contact information
            reference: document.getElementById('reference').value,             // Reference number
            useRestorationTemplate: document.getElementById('useRestorationTemplate').checked  // Template choice
        };
        
        console.log('Data collected:', data);
        
        // Resize canvas to fit ALL content before drawing
        CANVAS_HEIGHT = calculateCanvasHeight(data);
        canvas.height = CANVAS_HEIGHT;
        // Re-apply smoothing settings (canvas resets these when height changes)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Choose which template to render based on checkbox
        if (data.useRestorationTemplate) {
            drawRestorationAnnouncement(data);
        } else {
            drawAnnouncementImproved(data);
        }
        
        // Show the preview section (remove 'hidden' class)
        previewSection.classList.remove('hidden');
        
        console.log('Announcement generated successfully');
        
        // Smooth scroll to preview after a short delay (allows render to complete)
        setTimeout(() => {
            previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
    } catch (error) {
        // If anything goes wrong, log the error and alert the user
        console.error('Error generating announcement:', error);
        alert('Error generating announcement: ' + error.message);
    }
}

// ============================================================================
// CUSTOMER-FIRST ANNOUNCEMENT TEMPLATE (NEW & IMPROVED!)
// ============================================================================

/**
 * Draws the HYBRID announcement template (BEST OF BOTH WORLDS).
 * Combines customer-first design with comprehensive details.
 * 
 * STRUCTURE:
 * 1. ⭐ HUGE restoration time (72px) - Most important info first
 * 2. Empathy message - Shows we care
 * 3. Affected area - Prominent yellow box
 * 4. DETAILED incident info box - All timeline, impact, updates
 * 5. Contact section - How to get help
 * 6. Footer - Reference and copyright
 * 
 * @param {object} data - All announcement data from form
 */
function drawAnnouncementImproved(data) {
    try {
        console.log('Drawing CUSTOMER-FIRST announcement...');
        
        const brandColors = getBrandColors();
        
        // Clear canvas and draw white background
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        let yPos = 0;
        
        // Determine incident characteristics
        const isPlanned = data.incidentType === 'Planned Maintenance' || data.incidentStatus === 'Scheduled';
        const isResolved = data.incidentStatus === 'Resolved';
        const hasEndTime = data.endDate && data.endTime;
        
        // ==========================================================================
        // SECTION 1: SIMPLE HEADER (Logo + Contact)
        // ==========================================================================
        
        const headerHeight = 90;
        
        // Colored header background
        ctx.fillStyle = brandColors.secondary;
        ctx.fillRect(0, 0, CANVAS_WIDTH, headerHeight);
        
        // Logo rendering
        const defaultLogo = brandLogos[data.brand] || brandLogos.sadv;
        const displayLogo = logoImage || defaultLogo;
        const logoReady = displayLogo && displayLogo.complete && displayLogo.naturalWidth > 0;
        
        if (logoReady) {
            const maxLogoHeight = 60;
            const maxLogoWidth = 120;
            let logoWidth = displayLogo.width;
            let logoHeight = displayLogo.height;
            
            if (logoHeight > maxLogoHeight) {
                const scale = maxLogoHeight / logoHeight;
                logoHeight = maxLogoHeight;
                logoWidth = logoWidth * scale;
            }
            if (logoWidth > maxLogoWidth) {
                const scale = maxLogoWidth / logoWidth;
                logoWidth = maxLogoWidth;
                logoHeight = logoHeight * scale;
            }
            
            ctx.drawImage(displayLogo, 30, 15, logoWidth, logoHeight);
        } else {
            // Text fallback: white on dark (Infinifi navy), brand primary on light (SADV yellow)
            const headerIsDark = brandColors.secondary.startsWith('#0') || brandColors.secondary.startsWith('#1');
            ctx.fillStyle = headerIsDark ? COLORS.white : brandColors.primary;
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(data.brandName, 35, 50);
        }
        
        // Contact info — white on dark header (Infinifi), dark on light header (SADV)
        const contactTextColor = (brandColors.secondary.startsWith('#0') || brandColors.secondary.startsWith('#1')) ? COLORS.white : COLORS.dark;
        ctx.font = '13px Arial';
        ctx.fillStyle = contactTextColor;
        ctx.textAlign = 'right';
        ctx.fillText(`📞 ${data.brandPhone} | 💬 Chat`, CANVAS_WIDTH - 30, 40);
        ctx.fillText(`🌐 ${data.brandWebsite}`, CANVAS_WIDTH - 30, 62);
        
        yPos = headerHeight + 30;  // Tighter gap from header to first element
        
        // ==========================================================================
        // SECTION 2: ⭐ HUGE RESTORATION TIME (MOST IMPORTANT!)
        // ==========================================================================
        
        // ---- Badge 1: Incident Type ----
        const incidentTypeLabel = data.incidentType.toUpperCase();
        const typeBadgeColor    = isResolved ? COLORS.success : (isPlanned ? brandColors.primary : COLORS.warning);
        const typeBadgeText     = isResolved ? COLORS.white   : (isPlanned ? COLORS.white : COLORS.dark);

        // ---- Badge 2: Status ----
        const statusLabel = data.incidentStatus.toUpperCase();
        const statusBadgeColor = {
            'SCHEDULED':    '#6366F1',  // Indigo
            'IN PROGRESS':  '#F59E0B',  // Amber
            'INVESTIGATING':'#EF4444',  // Red
            'RESOLVED':     '#10B981',  // Green
        }[statusLabel] || brandColors.primary;
        const statusBadgeText = '#FFFFFF';

        // Measure both badges so they can be placed centred with a gap between them
        ctx.font = 'bold 15px Arial';
        const badgePadX  = 24;   // horizontal padding inside each pill
        const badgeH     = 36;
        const badgeGap   = 16;   // gap between the two pills
        const typeW      = ctx.measureText(incidentTypeLabel).width + badgePadX * 2;
        const statusW    = ctx.measureText(statusLabel).width      + badgePadX * 2;
        const totalW     = typeW + badgeGap + statusW;
        const startX     = CANVAS_WIDTH / 2 - totalW / 2;
        const badgeTopY  = yPos - 10;

        // Draw type pill
        ctx.fillStyle = typeBadgeColor;
        roundRect(ctx, startX, badgeTopY, typeW, badgeH, 18);
        ctx.fill();
        ctx.fillStyle = typeBadgeText;
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(incidentTypeLabel, startX + typeW / 2, badgeTopY + 24);

        // Draw status pill
        ctx.fillStyle = statusBadgeColor;
        roundRect(ctx, startX + typeW + badgeGap, badgeTopY, statusW, badgeH, 18);
        ctx.fill();
        ctx.fillStyle = statusBadgeText;
        ctx.fillText(statusLabel, startX + typeW + badgeGap + statusW / 2, badgeTopY + 24);

        yPos += 90;  // Extra gap so large heading text doesn't visually overlap badges
        
        // HUGE TEXT: When service returns (or status message)
        ctx.fillStyle = COLORS.dark;
        ctx.textAlign = 'center';
        
        if (hasEndTime && !isResolved) {
            // EXPECTED RESTORATION TIME - BIGGEST TEXT ON PAGE
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = COLORS.textLight;
            ctx.letterSpacing = '2px';
            ctx.fillText('SERVICE RETURNS AT', CANVAS_WIDTH/2, yPos);
            
            yPos += 65;  // Needs enough room so 72px time doesn't overlap this label
            
            // MASSIVE 72px time display
            ctx.font = 'bold 72px Arial';
            ctx.fillStyle = brandColors.primary;
            ctx.fillText(data.endTime, CANVAS_WIDTH/2, yPos);
            
            yPos += 45;  // gap between 72px time baseline and date
            
            // Date below
            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = COLORS.dark;
            const endDateFormatted = new Date(data.endDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long'
            });
            ctx.fillText(endDateFormatted, CANVAS_WIDTH/2, yPos);
            
            yPos += 5;
            
        } else if (isResolved) {
            // SERVICE RESTORED - Big, positive, celebration-style
            ctx.font = 'bold 60px Arial';
            ctx.fillStyle = COLORS.success;
            ctx.fillText('✓ SERVICE RESTORED', CANVAS_WIDTH/2, yPos);
            
            yPos += 40;  // 60px font needs more breathing room
            
            if (data.endTime) {
                ctx.font = 'bold 20px Arial';
                ctx.fillStyle = COLORS.textLight;
                ctx.fillText(`Restored at ${data.endTime}`, CANVAS_WIDTH/2, yPos);
                yPos += 30;
            }
            
            // Reassuring message
            ctx.font = '18px Arial';
            ctx.fillStyle = COLORS.text;
            ctx.fillText('Your connection is back online', CANVAS_WIDTH/2, yPos);
            
            yPos += 10;
            
        } else {
            // NO END TIME - FLIP THE HIERARCHY: Reassurance FIRST, problem second
            
            // HUGE reassuring message (was small before)
            ctx.font = 'bold 64px Arial';
            ctx.fillStyle = COLORS.success;
            ctx.fillText('WE\'RE ON IT', CANVAS_WIDTH/2, yPos);
            
            yPos += 65;  // 64px font descender + comfortable gap before secondary line
            
            // Secondary: What's happening now (action-focused)
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = brandColors.primary;
            ctx.fillText('Technicians on-site repairing now', CANVAS_WIDTH/2, yPos);
            
            yPos += 40;
            
            // Tertiary: The problem (smaller, less scary)
            ctx.font = '18px Arial';
            ctx.fillStyle = COLORS.textLight;
            ctx.fillText('Service interruption in progress', CANVAS_WIDTH/2, yPos);
            
            yPos += 25;
            
            ctx.font = 'italic 16px Arial';
            ctx.fillStyle = COLORS.textLight;
            ctx.fillText('Restoration time will be confirmed shortly', CANVAS_WIDTH/2, yPos);
        }
        
        yPos += 25;  // Consistent gap from any status block into the apology section
        
        // ==========================================================================
        // SECTION 3: APOLOGY / EMPATHY MESSAGE
        // ==========================================================================
        
        // Professional, concise messages appropriate for each scenario
        const apologyHeading = isResolved
            ? 'Thank You for Your Patience'
            : 'We Sincerely Apologize';
        
        const apologyMessage = isResolved
            ? 'We apologize for the inconvenience caused by this service disruption. Your connection has now been fully restored. Thank you for your patience and continued support.'
            : 'We sincerely apologize for this disruption to your service. Our technical team is actively on-site and working to restore your connectivity as a matter of priority. We will keep you informed as the situation progresses.';
        
        // Pre-calculate wrapped lines so box height is dynamic — no text overflow
        ctx.font = '15px Arial';
        const apologyLines = wrapText(ctx, apologyMessage, CANVAS_WIDTH - 300);
        
        const apologyPadV   = 22;   // top and bottom inner padding
        const apologyHeadH  = 26;   // heading block height
        const apologyLineH  = 23;   // line height for body text
        const apologyGap    = 14;   // gap between heading and body
        const apologyBoxH   = apologyPadV + apologyHeadH + apologyGap + (apologyLines.length * apologyLineH) + apologyPadV;
        
        // Box background
        ctx.fillStyle = 'rgba(255, 249, 240, 0.7)';
        roundRect(ctx, 60, yPos, CANVAS_WIDTH - 120, apologyBoxH, 12);
        ctx.fill();
        
        // Box border
        ctx.strokeStyle = brandColors.accent;
        ctx.lineWidth = 2;
        roundRect(ctx, 60, yPos, CANVAS_WIDTH - 120, apologyBoxH, 12);
        ctx.stroke();
        
        // Heading
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = COLORS.dark;
        ctx.textAlign = 'center';
        ctx.fillText(apologyHeading, CANVAS_WIDTH / 2, yPos + apologyPadV + 18);
        
        // Body text — 150px margin each side keeps text away from box edges
        ctx.font = '15px Arial';
        ctx.fillStyle = '#444444';
        let apologyTextY = yPos + apologyPadV + apologyHeadH + apologyGap + 15;
        apologyLines.forEach(line => {
            ctx.fillText(line, CANVAS_WIDTH / 2, apologyTextY);
            apologyTextY += apologyLineH;
        });
        
        yPos += apologyBoxH + 20;  // Gap between apology box and area box
        
        // ==========================================================================
        // SECTION 4: AFFECTED AREA
        // ==========================================================================
        
        // Area box — dynamic height so multiple areas always fit
        const areaMaxW = CANVAS_WIDTH - 120 - 60; // 30px padding each side inside box
        ctx.font = 'bold 26px Arial';
        const areaLines = wrapText(ctx, data.affectedAreas || '—', areaMaxW);
        const areaLineH = 32;
        const areaBoxH  = 28 + (areaLines.length * areaLineH) + 16; // label + lines + bottom pad

        ctx.fillStyle = brandColors.secondary;
        roundRect(ctx, 60, yPos, CANVAS_WIDTH - 120, areaBoxH, 12);
        ctx.fill();

        // "AREA AFFECTED" label
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = COLORS.dark;
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.6;
        ctx.fillText('AREA AFFECTED', CANVAS_WIDTH / 2, yPos + 18);
        ctx.globalAlpha = 1.0;

        // Area name lines
        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = COLORS.dark;
        ctx.textAlign = 'center';
        let areaTextY = yPos + 28 + areaLineH - 6;
        areaLines.forEach(function(line) {
            ctx.fillText(line, CANVAS_WIDTH / 2, areaTextY);
            areaTextY += areaLineH;
        });

        yPos += areaBoxH + 20;  // Gap between area box and incident details box
        
        // ==========================================================================
        // SECTION 5: COMPREHENSIVE INCIDENT DETAILS BOX
        // ==========================================================================
        // Full detailed information: dates, times, duration, reason, impact, updates
        
        const boxX = 60;
        const boxWidth = CANVAS_WIDTH - 120;
        const boxStartY = yPos;
        
        // --- Box Title Bar ---
        const titleBarHeight = 35;
        const boxTitle = isResolved ? 'Resolution Summary' : 'Incident Details';
        
        // Title bar background
        ctx.fillStyle = '#F3F4F6';
        roundRect(ctx, boxX, yPos, boxWidth, titleBarHeight, 10, true, false);
        ctx.fill();
        
        // Left accent bar (brand color)
        ctx.fillStyle = brandColors.primary;
        roundRect(ctx, boxX, yPos, 6, titleBarHeight, 10, true, false);
        ctx.fill();
        
        // Title text
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`📊  ${boxTitle}`, boxX + 20, yPos + 23);
        
        yPos += titleBarHeight;
        
        // --- Box Content Preparation ---
        // Calculate duration if both dates provided
        let durationHours = null;
        if (hasEndTime && data.startDate && data.startTime) {
            const startDate = new Date(data.startDate + 'T' + data.startTime);
            const endDate = new Date(data.endDate + 'T' + data.endTime);
            durationHours = Math.round((endDate - startDate) / (1000 * 60 * 60));
        }
        
        // Build array of detail rows
        const details = [];
        
        // Start date/time
        if (data.startDate && data.startTime) {
            const startLabel = isResolved ? (isPlanned ? 'Maintenance Date:' : 'Incident Date:') : (isPlanned ? 'Scheduled:' : 'Started:');
            const startFormatted = formatDateTime(data.startDate, data.startTime);
            details.push({ label: startLabel, value: startFormatted });
        }
        
        // End time / restoration time
        if (hasEndTime) {
            const endLabel = isResolved ? 'Restored:' : 'Expected End:';
            const endFormatted = formatDateTime(data.endDate, data.endTime);
            details.push({ label: endLabel, value: endFormatted });
            
            // Duration (for ongoing incidents)
            if (durationHours !== null && !isResolved) {
                details.push({ label: 'Duration:', value: `Approximately ${durationHours} hour${durationHours !== 1 ? 's' : ''}` });
            }
        } else if (!isResolved) {
            details.push({ label: 'Expected End:', value: 'To be confirmed - Updates will be provided' });
        }
        
        // Reason/Cause
        details.push({ 
            label: isResolved ? 'Cause:' : 'Reason:', 
            value: data.description 
        });
        
        // Impact (if provided)
        if (data.impact && data.impact.trim()) {
            details.push({ label: 'Impact:', value: data.impact });
        }
        
        // Calculate box height based on content
        let maxBoxHeight = 35;
        details.forEach(detail => {
            maxBoxHeight += 35;
            if (detail.value.length > 60) {
                maxBoxHeight += 24;  // Extra height for wrapped text
            }
        });
        
        // Draw box background
        ctx.fillStyle = '#FAFBFC';
        roundRect(ctx, boxX, yPos, boxWidth, maxBoxHeight, 10, false, true);
        ctx.fill();
        
        // Border around entire box
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1.5;
        roundRect(ctx, boxX, boxStartY, boxWidth, titleBarHeight + maxBoxHeight, 10);
        ctx.stroke();
        
        // Draw box content rows
        yPos += 25;
        details.forEach((detail, index) => {
            // Alternating row backgrounds
            if (index % 2 === 0) {
                ctx.fillStyle = 'rgba(249, 250, 251, 0.5)';
                ctx.fillRect(boxX + 1, yPos - 16, boxWidth - 2, 35);
            }
            
            // Label (left)
            ctx.fillStyle = COLORS.textLight;
            ctx.font = '13px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(detail.label, boxX + 18, yPos);
            
            // Value (right, with wrapping)
            ctx.fillStyle = COLORS.dark;
            ctx.font = 'bold 13px Arial';
            const valueLines = wrapText(ctx, detail.value, boxWidth - 200);
            valueLines.forEach((line, lineIndex) => {
                ctx.fillText(line, boxX + 160, yPos + (lineIndex * 20));
            });
            yPos += 35 + ((valueLines.length > 1) ? 24 : 0);
        });
        
        yPos += 22;  // Gap between details box and next section
        
        // ==========================================================================
        // SECTION 6: UPDATES (if provided)
        // ==========================================================================
        
        if (data.updates && data.updates.trim()) {
            // Pre-calculate wrapped lines so box height is dynamic
            ctx.font = '14px Arial';
            const updateLines = wrapText(ctx, data.updates, CANVAS_WIDTH - 220);
            const updatePadV = 18;
            const updateLineH = 22;
            const updateBoxH = updatePadV + 24 + 12 + (updateLines.length * updateLineH) + updatePadV;

            // Box background with left accent bar
            ctx.fillStyle = '#F0F7FF';
            roundRect(ctx, 60, yPos, CANVAS_WIDTH - 120, updateBoxH, 10);
            ctx.fill();

            // Left accent bar in brand accent colour
            ctx.fillStyle = brandColors.accent;
            roundRect(ctx, 60, yPos, 6, updateBoxH, 10);
            ctx.fill();

            // Box border
            ctx.strokeStyle = brandColors.accent;
            ctx.lineWidth = 1.5;
            roundRect(ctx, 60, yPos, CANVAS_WIDTH - 120, updateBoxH, 10);
            ctx.stroke();

            // Heading
            ctx.fillStyle = brandColors.accent;
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('📢  Latest Update', 80, yPos + updatePadV + 16);

            // Update text
            ctx.font = '14px Arial';
            ctx.fillStyle = COLORS.dark;
            let updateTextY = yPos + updatePadV + 24 + 12 + 14;
            updateLines.forEach(line => {
                ctx.fillText(line, 80, updateTextY);
                updateTextY += updateLineH;
            });

            yPos += updateBoxH;
        }
        
        // ==========================================================================
        // SECTION 7: CONTACT + FOOTER — flows naturally after content
        // ==========================================================================
        // Canvas height is pre-calculated to fit all content, so we just flow
        // the contact box directly after the last section.
        
        const footerReserve  = 42;   // Space for copyright line + breathing room below it
        const contactBoxH    = 126;  // Height of the "Need Help?" box
        const contactBoxGap  = 14;   // Gap between contact box bottom and footer text
        const contactBoxY    = yPos + 20; // flows naturally after last section
        
        // Draw contact box at pinned position
        ctx.fillStyle = brandColors.primary;
        roundRect(ctx, 60, contactBoxY, CANVAS_WIDTH - 120, contactBoxH, 12);
        ctx.fill();
        
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Need Help?', CANVAS_WIDTH/2, contactBoxY + 38);
        
        ctx.font = '17px Arial';
        ctx.fillText(`📞 ${data.contactInfo.replace('WhatsApp: ', '')}`, CANVAS_WIDTH/2, contactBoxY + 72);
        
        ctx.font = '15px Arial';
        ctx.fillText(`💬 Live Chat on ${data.brandName} App`, CANVAS_WIDTH/2, contactBoxY + 104);
        
        // Footer — sits below the contact box with a small gap
        const footerY = contactBoxY + contactBoxH + contactBoxGap;
        
        if (data.reference && data.reference.trim()) {
            ctx.font = '11px Arial';
            ctx.fillStyle = COLORS.textLight;
            ctx.textAlign = 'center';
            ctx.fillText(`Ref: ${data.reference}  |  © ${new Date().getFullYear()} ${data.brandName} Network Operations`, CANVAS_WIDTH/2, footerY);
        } else {
            ctx.font = '12px Arial';
            ctx.fillStyle = COLORS.textLight;
            ctx.textAlign = 'center';
            ctx.fillText(`© ${new Date().getFullYear()} ${data.brandName} Network Operations`, CANVAS_WIDTH/2, footerY);
        }
        
        console.log('Customer-first announcement drawn successfully');
        
    } catch (error) {
        console.error('Error in drawAnnouncementImproved:', error);
        throw error;
    }
}

// ============================================================================
// REGULAR ANNOUNCEMENT TEMPLATE RENDERER (OLD VERSION - NOT IN USE)
// ============================================================================

/**
 * [DEPRECATED] Old detailed announcement template.
 * This function is preserved for reference but is NOT currently used.
 * 
 * The new drawAnnouncementImproved() function above is now the default template
 * as it better prioritizes customer needs.
 * 
 * @param {object} data - All announcement data collected from the form
 */
function drawAnnouncement(data) {
    try {
        console.log('Drawing announcement on canvas...');
        
        // Get brand-specific colors for this announcement
        const brandColors = getBrandColors();
        
        // Clear any previous content from canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw white background as base layer
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Initialize vertical position tracker (used to position elements top-to-bottom)
        let yPos = 0;

    // ==========================================================================
    // SECTION 1: HEADER WITH COLORED BACKGROUND
    // ==========================================================================
    // Draws the top header section with brand color background, logo, and contact info
    
    const headerHeight = 100;  // Height of header section in pixels
    
    // Draw colored background rectangle across full width
    ctx.fillStyle = brandColors.secondary;  // Use brand's secondary color (yellow/blue)
    ctx.fillRect(0, 0, CANVAS_WIDTH, headerHeight);

    // Add subtle vertical stripe pattern for visual depth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';  // Semi-transparent white
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {   // Every 20 pixels
        ctx.fillRect(i, 0, 1, headerHeight);        // Draw 1px vertical line
    }

    // --- Logo Rendering (Left Side) ---
    // Priority: 1. User-uploaded logo, 2. Brand default logo, 3. Text fallback
    
    const defaultLogo = brandLogos[data.brand] || brandLogos.sadv;  // Get brand logo
    const displayLogo = logoImage || defaultLogo;                    // Use custom or default
    
    // Verify logo is loaded and ready to draw (prevents runtime errors)
    const logoReady = displayLogo && displayLogo.complete && displayLogo.naturalWidth > 0;
    
    if (logoReady) {
        // Logo is available - draw it with proportional scaling
        
        const maxLogoHeight = 70;   // Maximum logo height to fit header
        const maxLogoWidth = 140;   // Maximum logo width to prevent overflow
        let logoWidth = displayLogo.width;
        let logoHeight = displayLogo.height;
        
        // Scale logo down if it's too tall (maintain aspect ratio)
        if (logoHeight > maxLogoHeight) {
            const scale = maxLogoHeight / logoHeight;
            logoHeight = maxLogoHeight;
            logoWidth = logoWidth * scale;
        }
        
        // Scale logo down if it's too wide (maintain aspect ratio)
        if (logoWidth > maxLogoWidth) {
            const scale = maxLogoWidth / logoWidth;
            logoWidth = maxLogoWidth;
            logoHeight = logoHeight * scale;
        }
        
        // Draw the scaled logo in top-left corner
        ctx.drawImage(displayLogo, 30, 15, logoWidth, logoHeight);
        
    } else {
        // Logo not available - use text fallback (brand name)
        console.log('Using text fallback for logo');
        ctx.fillStyle = brandColors.primary;  // Use brand's primary color
        ctx.font = 'bold 45px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(data.brandName, 35, 55);  // Draw brand name as text
    }

    // --- Contact Information (Right Side) ---
    // Display phone number, live chat, and website URL
    ctx.font = '14px Arial';
    ctx.fillStyle = COLORS.dark;
    ctx.textAlign = 'right';
    ctx.fillText(`📞 ${data.brandPhone} | 💬 Live Chat`, CANVAS_WIDTH - 30, 45);
    ctx.fillText(`🌐 ${data.brandWebsite}`, CANVAS_WIDTH - 30, 70);

    // ==========================================================================
    // SECTION 2: TITLE BANNER WITH STATUS BADGE
    // ==========================================================================
    // Draws a prominent banner showing the announcement title and current status
    
    yPos = headerHeight;          // Start below header
    const bannerHeight = 60;      // Height of title banner
    
    // Draw solid primary color banner background
    ctx.fillStyle = COLORS.primary;
    ctx.fillRect(0, yPos, CANVAS_WIDTH, bannerHeight);

    // Add accent color line at top of banner for visual separation
    ctx.fillStyle = brandColors.secondary;
    ctx.fillRect(0, yPos, CANVAS_WIDTH, 4);  // 4px thick accent line

    // --- Announcement Title (Left Side) ---
    // Title text with automatic wrapping if too long
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    const titleText = data.title.toUpperCase();  // Convert to uppercase for emphasis
    const maxTitleWidth = CANVAS_WIDTH - 220;    // Leave space for badge on right
    const titleLines = wrapText(ctx, titleText, maxTitleWidth);  // Split into lines if needed
    
    // Adjust vertical position based on number of lines (center multi-line text)
    const titleY = titleLines.length > 1 ? yPos + 20 : yPos + 38;
    titleLines.forEach((line, index) => {
        ctx.fillText(line, 35, titleY + (index * 25));  // Draw each line
    });

    // --- Status Badge (Right Side) ---
    // Color-coded badge showing incident status (Investigating/In Progress/etc.)
    
    let badgeColor, badgeText;
    
    // Determine badge color and text based on incident status
    switch(data.incidentStatus) {
        case 'Investigating':
            badgeColor = COLORS.danger;   // Red - critical/urgent
            badgeText = 'INVESTIGATING';
            break;
        case 'In Progress':
            badgeColor = COLORS.warning;  // Yellow - work in progress
            badgeText = 'IN PROGRESS';
            break;
        case 'Scheduled':
            badgeColor = '#10B981';       // Green - planned maintenance
            badgeText = 'SCHEDULED';
            break;
        case 'Resolved':
            badgeColor = COLORS.success;  // Green - issue fixed
            badgeText = 'RESOLVED';
            break;
        default:
            badgeColor = COLORS.warning;  // Default to yellow
            badgeText = data.incidentStatus.toUpperCase();
    }
    
    // Calculate badge dimensions and position
    const badgeWidth = 140;
    const badgeHeight = 32;
    const badgeX = CANVAS_WIDTH - badgeWidth - 35;  // Positioned on right side
    const badgeY = yPos + 14;                       // Vertically centered in banner
    
    // Draw rounded badge background
    ctx.fillStyle = badgeColor;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 16);  // 16px corner radius
    ctx.fill();
    
    // Draw badge text (centered)
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeWidth/2, badgeY + 21);

    // ==========================================================================
    // SECTION 3: LOCATION AND DATE INFO
    // ==========================================================================
    // Displays affected areas and current date in top-right corner
    
    yPos += bannerHeight + 25;  // Move below banner with spacing
    
    // Display affected areas/locations
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '13px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(data.affectedAreas, CANVAS_WIDTH - 35, yPos);
    
    yPos += 18;  // Space between lines
    
    // Display current date in readable format (e.g., "20 March 2026")
    const currentDate = new Date().toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
    ctx.fillText(currentDate, CANVAS_WIDTH - 35, yPos);

    // ==========================================================================
    // SECTION 4: SERVICE NOTICE HEADER WITH ICON
    // ==========================================================================
    // Shows a header describing the type of notice (restoration/maintenance/interruption)
    
    yPos += 38;  // Add spacing from previous section
    
    // Determine incident characteristics based on type and status
    const isPlanned = data.incidentType === 'Planned Maintenance' || data.incidentStatus === 'Scheduled';
    const isOutage = data.incidentType === 'Network Outage' || data.incidentType === 'Service Interruption';
    const isResolved = data.incidentStatus === 'Resolved';
    
    // --- Icon Box (Left Side) ---
    // Color-coded icon showing notice type
    let iconColor, iconText;
    
    if (isResolved) {
        iconColor = COLORS.success;    // Green checkmark for resolved
        iconText = '✓';
    } else if (isPlanned) {
        iconColor = brandColors.primary;  // Brand color for planned maintenance
        iconText = '🔧';
    } else {
        iconColor = COLORS.warning;    // Yellow warning for issues
        iconText = '⚠';
    }
    
    // Draw rounded icon box
    ctx.fillStyle = iconColor;
    roundRect(ctx, 35, yPos - 18, 30, 30, 6);  // Small rounded square
    ctx.fill();
    
    // Draw icon/emoji inside box
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(iconText, 50, yPos + 5);  // 50 = center of 30px box at x=35
    
    // --- Notice Header Text (Right of Icon) ---
    // Descriptive header based on incident type
    ctx.fillStyle = COLORS.dark;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    
    let noticeHeader;
    if (isResolved) {
        noticeHeader = 'Service Restoration Notice';
    } else if (isPlanned) {
        noticeHeader = 'Planned Maintenance Notice';
    } else {
        noticeHeader = 'Service Interruption Notice';
    }
    ctx.fillText(noticeHeader, 75, yPos);  // Position next to icon

    // ===== INCIDENT DETAILS BOX =====
    // This box contains all structured information: dates, times, duration, impact
    // Displays as a card with rounded corners, title bar, and zebra-striped rows
    yPos += 35;
    const boxX = 35;
    const boxWidth = CANVAS_WIDTH - 70;
    const boxStartY = yPos;

    // --- Box Title Bar ---
    // Colored header bar at top of details box with title and icon
    const titleBarHeight = 32;
    const boxTitle = isResolved ? 'Resolution Summary' : 'Service Details';
    
    // Title bar background (light gray)
    ctx.fillStyle = COLORS.light;
    roundRect(ctx, boxX, yPos, boxWidth, titleBarHeight, 8, true, false);
    ctx.fill();
    
    // Left accent bar (brand color) - provides visual hierarchy
    ctx.fillStyle = brandColors.primary;
    roundRect(ctx, boxX, yPos, 6, titleBarHeight, 8, true, false);
    ctx.fill();
    
    // Title text with emoji icon indicating content type
    let titleIcon = isResolved ? '✓' : '📊';  // Checkmark for resolved, chart for details
    ctx.fillStyle = COLORS.dark;
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(titleIcon + '  ' + boxTitle, boxX + 20, yPos + 21);
    
    yPos += titleBarHeight;

    // --- Box Content Preparation ---
    // Dynamically build list of detail rows based on available data
    const boxPadding = 20;
    const boxContentStart = yPos;
    
    // Calculate time duration between start and end (if both provided)
    let durationHours = null;
    let hasEndTime = data.endDate && data.endTime;
    
    if (hasEndTime && data.startDate && data.startTime) {
        const startDate = new Date(data.startDate + 'T' + data.startTime);
        const endDate = new Date(data.endDate + 'T' + data.endTime);
        durationHours = Math.round((endDate - startDate) / (1000 * 60 * 60));  // Convert ms to hours
    }

    // Build array of label-value pairs to display
    // Each object represents one row in the details box
    const details = [];
    
    // Row 1: Always show affected area/location
    details.push({ label: 'Affected Area:', value: data.affectedAreas });
    
    // Row 2: Start date with context-appropriate label
    if (data.startDate) {
        const dateLabel = isResolved ? (isPlanned ? 'Maintenance Date:' : 'Incident Date:') : (isPlanned ? 'Scheduled Date:' : 'Start Date:');
        details.push({ 
            label: dateLabel, 
            value: new Date(data.startDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) 
        });
    }
    
    // Row 3: Start time (if provided)
    if (data.startTime) {
        details.push({ label: 'Start Time:', value: data.startTime });
    }
    
    // Row 4: End time with dynamic label based on resolution status
    if (hasEndTime) {
        const endLabel = isResolved ? 'Service Restored:' : 'Expected End Time:';
        details.push({ label: endLabel, value: data.endTime });
        
        // Row 5: Duration (only show for ongoing incidents with calculated hours)
        if (durationHours !== null && !isResolved) {
            details.push({ label: 'Duration:', value: `Approximately ${durationHours} hour${durationHours !== 1 ? 's' : ''}` });
        }
    } else if (!isResolved) {
        // Show "TBC" if end time not provided for ongoing incidents
        details.push({ label: 'End Time:', value: 'To be confirmed' });
    }
    
    // Row N: Description/reason for incident
    details.push({ label: isResolved ? 'Cause:' : 'Reason:', value: data.description });
    
    // Row N+1: Impact information (optional, only if provided)
    if (data.impact && data.impact.trim()) {
        details.push({ label: 'Impact:', value: data.impact });
    }

    // Calculate required box height based on number of rows and text wrapping
    let maxBoxHeight = 30;  // Base padding
    details.forEach(detail => {
        maxBoxHeight += 28;  // Standard row height
        if (detail.value.length > 50) {
            maxBoxHeight += 18;  // Extra space for wrapped text
        }
    });

    // --- Draw Box Background ---
    // Main content area with subtle background color
    ctx.fillStyle = '#FAFBFC';
    roundRect(ctx, boxX, boxContentStart, boxWidth, maxBoxHeight, 8, false, true);
    ctx.fill();
    
    // Border around entire box (title + content)
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    roundRect(ctx, boxX, boxStartY, boxWidth, titleBarHeight + maxBoxHeight, 8);
    ctx.stroke();

    // --- Draw Box Rows ---
    // Each detail row with label on left, value on right, alternating backgrounds
    yPos = boxContentStart + 24;
    details.forEach((detail, index) => {
        // Zebra striping: alternate row backgrounds for better readability
        if (index % 2 === 0) {
            ctx.fillStyle = '#F9FAFB';  // Slightly darker background for even rows
            ctx.fillRect(boxX + 1, yPos - 16, boxWidth - 2, 28);
        }
        
        // Label (left side, light gray)
        ctx.fillStyle = COLORS.textLight;
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(detail.label, boxX + 18, yPos);

        // Value (right side, bold dark text, with text wrapping if needed)
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 12px Arial';
        const valueLines = wrapText(ctx, detail.value, boxWidth - 210);  // Wrap to fit available space
        valueLines.forEach((line, lineIndex) => {
            ctx.fillText(line, boxX + 170, yPos + (lineIndex * 18));
        });
        yPos += 28 + (valueLines.length > 1 ? 18 : 0);  // Add extra space for wrapped lines
    });

    // ===== IMPACT INFORMATION SECTION =====
    // User-friendly explanation of what the incident means for them
    // Different messaging for planned maintenance vs unexpected outages
    yPos += 35;
    
    // --- Section Header: "What This Means For You" ---
    ctx.fillStyle = COLORS.dark;
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    
    if (!isResolved) {
        // Color-coded icon box (yellow for outage, brand color for planned)
        let infoIconColor = isPlanned ? brandColors.primary : COLORS.warning;
        ctx.fillStyle = infoIconColor;
        roundRect(ctx, 35, yPos - 16, 26, 26, 5);
        ctx.fill();
        
        // Lightning bolt emoji to indicate impact/importance
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', 48, yPos + 4);
        
        // Section title
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('What This Means For You', 70, yPos);
        yPos += 25;
        
        // Impact message: planned vs unplanned
        ctx.font = '13px Arial';
        ctx.fillStyle = COLORS.text;
        
        const impactMsg = isPlanned 
            ? 'Your internet service will be temporarily unavailable during maintenance.'
            : 'You are currently experiencing a loss of internet connectivity.';
        
        // Wrap text to fit canvas width
        const impactLines = wrapText(ctx, impactMsg, CANVAS_WIDTH - 70);
        impactLines.forEach(line => {
            ctx.fillText(line, 35, yPos);
            yPos += 18;
        });
        yPos += 25;
        
        // --- Section: "No Action Required" ---
        // Reassure users that the issue will resolve automatically
        ctx.fillStyle = COLORS.success;  // Green for positive message
        roundRect(ctx, 35, yPos - 16, 26, 26, 5);
        ctx.fill();
        
        // Checkmark emoji indicating no action needed
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓', 48, yPos + 4);
        
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('No Action Required', 70, yPos);
        yPos += 25;
        
        // Action message: reassurance that service will auto-restore
        ctx.font = '13px Arial';
        ctx.fillStyle = COLORS.text;
        
        const actionMsg = isPlanned
            ? 'Service will automatically resume. No intervention needed.'
            : 'Our team is working on it. Service will restore automatically.';
        
        const actionLines = wrapText(ctx, actionMsg, CANVAS_WIDTH - 70);
        actionLines.forEach(line => {
            ctx.fillText(line, 35, yPos);
            yPos += 18;
        });
        
    } else {
        // --- For Resolved Incidents ---
        // Show "Service Restored" message with green checkmark
        ctx.fillStyle = COLORS.success;
        roundRect(ctx, 35, yPos - 16, 26, 26, 5);
        ctx.fill();
        
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓', 48, yPos + 4);
        
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Service Restored', 70, yPos);
        yPos += 25;
        
        // Resolution message with troubleshooting tip
        ctx.font = '13px Arial';
        ctx.fillStyle = COLORS.text;
        const restoredLines = wrapText(ctx, 'Your connection is active. If issues persist, restart your router.', CANVAS_WIDTH - 70);
        restoredLines.forEach(line => {
            ctx.fillText(line, 35, yPos);
            yPos += 18;
         });
    }

    // ===== LATEST UPDATE SECTION (Optional) =====
    // Only displayed if user provided additional updates/comments in the form
    // Used for progress updates, additional context, or important messages
    if (data.updates && data.updates.trim()) {
        yPos += 35;
        
        // Icon box with brand accent color (often yellow/pink for SADV, orange for Infinifi)
        ctx.fillStyle = brandColors.accent;
        roundRect(ctx, 35, yPos - 16, 26, 26, 5);
        ctx.fill();
        
        // Megaphone emoji to indicate announcement/update
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📢', 48, yPos + 4);
        
        // Section title
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Latest Update', 70, yPos);

        yPos += 25;
        
        // Display update text with automatic wrapping
        ctx.font = '13px Arial';
        ctx.fillStyle = COLORS.text;
        const updateLines = wrapText(ctx, data.updates, CANVAS_WIDTH - 70);
        updateLines.forEach(line => {
            ctx.fillText(line, 35, yPos);
            yPos += 18;
        });
    }

    // ===== CONTACT & SUPPORT SECTION =====
    // Provide clear contact options for customer support
    // Shows WhatsApp number and app live chat option
    yPos += 35;
    
    // Icon box with primary brand color
    ctx.fillStyle = brandColors.primary;
    roundRect(ctx, 35, yPos - 16, 26, 26, 5);
    ctx.fill();
    
    // Speech balloon emoji for support/communication
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💬', 48, yPos + 4);
    
    // Section title
    ctx.fillStyle = COLORS.dark;
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Need Assistance?', 70, yPos);
    
    yPos += 25;
    
    // Contact information: WhatsApp and Live Chat
    ctx.font = '13px Arial';
    ctx.fillStyle = COLORS.text;
    const contactLines = wrapText(ctx, `WhatsApp: ${data.contactInfo.replace('WhatsApp: ', '')} | Live Chat: ${data.brandName} App`, CANVAS_WIDTH - 70);
    contactLines.forEach(line => {
        ctx.fillText(line, 35, yPos);
        yPos += 18;
    });
    
    yPos += 15;
    
    // Additional support message (context-aware: resolved vs ongoing)
    ctx.font = '12px Arial';
    ctx.fillStyle = COLORS.textLight;
    const supportMsg = isResolved 
        ? 'Our support team is available 24/7.'
        : 'Contact us for updates or questions.';
    ctx.fillText(supportMsg, 35, yPos);

    // ===== SIGNATURE & FOOTER =====
    // Professional sign-off with brand name, reference number, and logo watermark
    yPos += 40;
    const signatureY = yPos;
    
    // Signature text (left aligned) - shows department/team name
    ctx.fillStyle = COLORS.dark;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${data.brandName} Network Operations`, 35, signatureY);
    
    // Reference/ticket number (optional) - displayed below signature
    // Useful for tracking and customer service queries
    if (data.reference && data.reference.trim()) {
        ctx.font = '11px Arial';
        ctx.fillStyle = COLORS.textLight;
        ctx.fillText(`Ref: ${data.reference}`, 35, signatureY + 18);
    }

    // --- Logo Watermark (Right Side) ---
    // Subtle branded logo aligned with signature line on opposite side
    let logoReady2 = displayLogo && displayLogo.complete && displayLogo.naturalWidth > 0;
    if (logoReady2) {
        const watermarkSize = 60;  // Maximum dimensions
        let wmWidth = displayLogo.width;
        let wmHeight = displayLogo.height;
        
        // Scale logo proportionally to fit within watermarkSize square
        if (wmHeight > watermarkSize) {
            const scale = watermarkSize / wmHeight;
            wmHeight = watermarkSize;
            wmWidth = wmWidth * scale;
        }
        if (wmWidth > watermarkSize) {
            const scale = watermarkSize / wmWidth;
            wmWidth = watermarkSize;
            wmHeight = wmHeight * scale;
        }
        
        // Position watermark on same vertical line as signature, far right
        const wmX = CANVAS_WIDTH - wmWidth - 35;
        const wmY = signatureY - 12;  // Slight vertical adjustment for alignment
        
        // Draw watermark with reduced opacity for subtle branding
        ctx.globalAlpha = 0.6;  // 60% opacity
        ctx.drawImage(displayLogo, wmX, wmY, wmWidth, wmHeight);
        ctx.globalAlpha = 1.0;  // Reset to full opacity for subsequent drawings
    }
    
    yPos += 50;  // Spacing before footer

    // ===== FOOTER SECTION =====
    // Bottom of announcement with website, phone, and copyright
    // Positioned at absolute bottom of canvas regardless of content height
    yPos = Math.max(yPos + 25, CANVAS_HEIGHT - 70);  // At least 70px from bottom
    
    // --- Footer Separator Line ---
    // Thin horizontal line to visually separate footer from content
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, yPos);
    ctx.lineTo(CANVAS_WIDTH - 35, yPos);
    ctx.stroke();

    yPos += 22;

    // --- Footer Contact Information ---
    // Website and WhatsApp number in brand color
    ctx.font = '11px Arial';
    ctx.fillStyle = brandColors.primary;
    ctx.textAlign = 'center';
    ctx.fillText(`${data.brandWebsite}  |  WhatsApp: ${data.brandPhone}`, CANVAS_WIDTH / 2, yPos);

    // --- Copyright Notice ---
    // Dynamic year with brand name and tagline
    yPos += 18;
    ctx.font = '10px Arial';
    ctx.fillStyle = COLORS.textLight;
    const year = new Date().getFullYear();  // Current year (auto-updates)
    ctx.fillText(`© ${year} ${data.brandName} - ${data.brandTagline}`, CANVAS_WIDTH / 2, yPos);
    
    console.log('Canvas drawing complete');
    } catch (error) {
        console.error('Error in drawAnnouncement:', error);
        throw error;
    }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, topOnly = false, bottomOnly = false) {
    ctx.beginPath();
    
    if (topOnly) {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
    } else if (bottomOnly) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y);
    } else {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
    }
    
    ctx.closePath();
}

// ============================================================================
// HELPER FUNCTION: TEXT WRAPPING
// ============================================================================

/**
 * Wraps text into multiple lines to fit within a specified width.
 * Uses canvas measureText() to accurately calculate text dimensions.
 * 
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context (needed for text measurement)
 * @param {string} text - The text string to wrap
 * @param {number} maxWidth - Maximum width in pixels for each line
 * @returns {Array<string>} Array of text lines that fit within maxWidth
 * 
 * Example:
 *   wrapText(ctx, "This is a long text", 200)
 *   Returns: ["This is a", "long text"]
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');  // Split text into individual words
    const lines = [];               // Array to store wrapped lines
    let currentLine = '';           // Current line being built
    
    // Process each word
    words.forEach(word => {
        // Test if adding this word would exceed max width
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);  // Measure pixel width
        
        // If too wide and we have content, start new line
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);  // Save current line
            currentLine = word;       // Start new line with current word
        } else {
            currentLine = testLine;   // Add word to current line
        }
    });
    
    // Add the last line if it has content
    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;  // Return array of wrapped lines
}

// ============================================================================
// RESTORATION ANNOUNCEMENT TEMPLATE RENDERER
// ============================================================================

/**
 * Draws the "GOOD NEWS" restoration template for service restoration announcements.
 * This is a simplified, positive template optimized for WhatsApp sharing.
 * 
 * Template features:
 * - Full colored background (brand secondary color)
 * - Logo or brand name at top
 * - Diagonal design element with contrasting color
 * - Large "GOOD NEWS" banner
 * - Fixed "SERVICE RESTORED" message (ignores title field)
 * - Optional affected area and restoration time
 * - Minimal footer info
 * 
 * Note: This template always shows "SERVICE RESTORED" regardless of form title.
 * Only use when service has actually been restored!
 * 
 * @param {object} data - All announcement data collected from the form
 */
function drawRestorationAnnouncement(data) {
    try {
        console.log('Drawing restoration announcement...');

        const brandColors = getBrandColors();
        const headerIsDark = brandColors.secondary.startsWith('#0') || brandColors.secondary.startsWith('#1');

        // White canvas background
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = COLORS.white;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        let yPos = 0;

        // ── HEADER (same style as improved template) ──────────────────────────
        const headerH = 90;
        ctx.fillStyle = brandColors.secondary;
        ctx.fillRect(0, 0, CANVAS_WIDTH, headerH);

        const defaultLogo = brandLogos[data.brand] || brandLogos.sadv;
        const displayLogo = logoImage || defaultLogo;
        const logoReady   = displayLogo && displayLogo.complete && displayLogo.naturalWidth > 0;

        if (logoReady) {
            let lw = displayLogo.width, lh = displayLogo.height;
            const maxLH = 60, maxLW = 120;
            if (lh > maxLH) { lw *= maxLH / lh; lh = maxLH; }
            if (lw > maxLW) { lh *= maxLW / lw; lw = maxLW; }
            ctx.drawImage(displayLogo, 30, 15, lw, lh);
        } else {
            ctx.fillStyle = headerIsDark ? COLORS.white : brandColors.primary;
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(data.brandName, 35, 55);
        }

        const contactColor = headerIsDark ? COLORS.white : COLORS.dark;
        ctx.font = '13px Arial';
        ctx.fillStyle = contactColor;
        ctx.textAlign = 'right';
        ctx.fillText(`📞 ${data.brandPhone} | 💬 Chat`, CANVAS_WIDTH - 30, 40);
        ctx.fillText(`🌐 ${data.brandWebsite}`, CANVAS_WIDTH - 30, 62);

        yPos = headerH + 40;

        // ── GOOD NEWS BADGE ───────────────────────────────────────────────────
        const gnLabel  = '✓  GOOD NEWS';
        ctx.font = 'bold 17px Arial';
        const gnW      = ctx.measureText(gnLabel).width + 48;
        const gnH      = 40;
        const gnX      = CANVAS_WIDTH / 2 - gnW / 2;

        ctx.fillStyle = COLORS.success;
        roundRect(ctx, gnX, yPos, gnW, gnH, 20);
        ctx.fill();
        ctx.fillStyle = COLORS.white;
        ctx.textAlign = 'center';
        ctx.fillText(gnLabel, CANVAS_WIDTH / 2, yPos + 27);

        yPos += gnH + 36;

        // ── BIG "SERVICE RESTORED" HEADING ────────────────────────────────────
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = COLORS.success;
        ctx.textAlign = 'center';
        ctx.fillText('SERVICE RESTORED', CANVAS_WIDTH / 2, yPos + 54);
        yPos += 72 + 18;

        // Subheading
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = COLORS.dark;
        ctx.fillText('Your connectivity has been fully restored.', CANVAS_WIDTH / 2, yPos);
        yPos += 30;

        ctx.font = '17px Arial';
        ctx.fillStyle = COLORS.textLight;
        ctx.fillText('Thank you for your patience and continued support.', CANVAS_WIDTH / 2, yPos);
        yPos += 44;

        // ── AREA BOX — dynamic height for multiple areas ──────────────────────
        const areaTextColor2 = headerIsDark ? COLORS.white : COLORS.dark;
        const areaMaxW2  = CANVAS_WIDTH - 120 - 60;
        ctx.font = 'bold 26px Arial';
        const areaLines2 = wrapText(ctx, data.affectedAreas || '—', areaMaxW2);
        const areaLineH2 = 32;
        const areaBoxH2  = 28 + (areaLines2.length * areaLineH2) + 16;

        ctx.fillStyle = brandColors.secondary;
        roundRect(ctx, 60, yPos, CANVAS_WIDTH - 120, areaBoxH2, 12);
        ctx.fill();

        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = areaTextColor2;
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.65;
        ctx.fillText('AREA AFFECTED', CANVAS_WIDTH / 2, yPos + 18);
        ctx.globalAlpha = 1.0;

        ctx.font = 'bold 26px Arial';
        ctx.fillStyle = areaTextColor2;
        let areaTextY2 = yPos + 28 + areaLineH2 - 6;
        areaLines2.forEach(function(line) {
            ctx.fillText(line, CANVAS_WIDTH / 2, areaTextY2);
            areaTextY2 += areaLineH2;
        });
        yPos += areaBoxH2 + 20;

        // ── DETAILS BOX ───────────────────────────────────────────────────────
        const boxX = 60, boxW = CANVAS_WIDTH - 120;

        // Title bar
        ctx.fillStyle = '#F3F4F6';
        roundRect(ctx, boxX, yPos, boxW, 35, 10, true, false);
        ctx.fill();
        ctx.fillStyle = COLORS.success;
        roundRect(ctx, boxX, yPos, 6, 35, 10, true, false);
        ctx.fill();
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('📋  Resolution Summary', boxX + 20, yPos + 24);
        yPos += 35;

        // Rows
        const rows = [];
        if (data.startDate && data.startTime) rows.push({ label: 'Incident Date:', value: formatDateTime(data.startDate, data.startTime) });
        if (data.endDate && data.endTime)     rows.push({ label: 'Restored At:',   value: formatDateTime(data.endDate,   data.endTime)   });
        if (data.description && data.description.trim()) rows.push({ label: 'Cause:', value: data.description });
        if (data.impact && data.impact.trim())            rows.push({ label: 'Impact:', value: data.impact });

        // Row container background
        const rowAreaH = rows.length * 38 + 20;
        ctx.fillStyle = '#FAFBFC';
        roundRect(ctx, boxX, yPos, boxW, rowAreaH, 10, false, true);
        ctx.fill();
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1.5;
        roundRect(ctx, boxX, yPos - 35, boxW, 35 + rowAreaH, 10);
        ctx.stroke();

        yPos += 18;
        rows.forEach(function(row, i) {
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(249,250,251,0.6)';
                ctx.fillRect(boxX + 1, yPos - 14, boxW - 2, 35);
            }
            ctx.fillStyle = COLORS.textLight;
            ctx.font = '13px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(row.label, boxX + 18, yPos);

            ctx.fillStyle = COLORS.dark;
            ctx.font = 'bold 13px Arial';
            const vLines = wrapText(ctx, row.value, boxW - 200);
            vLines.forEach(function(line, li) { ctx.fillText(line, boxX + 160, yPos + li * 20); });
            yPos += 35 + (vLines.length > 1 ? (vLines.length - 1) * 20 : 0);
        });
        yPos += 22;

        // ── LATEST UPDATE (if any) ────────────────────────────────────────────
        if (data.updates && data.updates.trim()) {
            ctx.font = '14px Arial';
            const uLines  = wrapText(ctx, data.updates, CANVAS_WIDTH - 220);
            const uBoxH   = 18 + 24 + 12 + (uLines.length * 22) + 18;

            ctx.fillStyle = '#F0FFF4';
            roundRect(ctx, 60, yPos, CANVAS_WIDTH - 120, uBoxH, 10);
            ctx.fill();
            ctx.fillStyle = COLORS.success;
            roundRect(ctx, 60, yPos, 6, uBoxH, 10);
            ctx.fill();
            ctx.strokeStyle = COLORS.success;
            ctx.lineWidth = 1.5;
            roundRect(ctx, 60, yPos, CANVAS_WIDTH - 120, uBoxH, 10);
            ctx.stroke();

            ctx.fillStyle = COLORS.success;
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('📢  Latest Update', 80, yPos + 18 + 16);

            ctx.font = '14px Arial';
            ctx.fillStyle = COLORS.dark;
            let utY = yPos + 18 + 24 + 12 + 14;
            uLines.forEach(function(line) { ctx.fillText(line, 80, utY); utY += 22; });
            yPos += uBoxH + 20;
        }

        // ── CONTACT BOX ───────────────────────────────────────────────────────
        const contactY = yPos + 20;
        ctx.fillStyle = brandColors.primary;
        roundRect(ctx, 60, contactY, CANVAS_WIDTH - 120, 126, 12);
        ctx.fill();

        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Need Help?', CANVAS_WIDTH / 2, contactY + 38);

        ctx.font = '17px Arial';
        ctx.fillText(`📞 ${data.contactInfo.replace('WhatsApp: ', '')}`, CANVAS_WIDTH / 2, contactY + 72);

        ctx.font = '15px Arial';
        ctx.fillText(`💬 Live Chat on ${data.brandName} App`, CANVAS_WIDTH / 2, contactY + 104);

        // ── FOOTER ────────────────────────────────────────────────────────────
        const footerY = contactY + 126 + 14;
        ctx.font = '12px Arial';
        ctx.fillStyle = COLORS.textLight;
        ctx.textAlign = 'center';
        const refPart = (data.reference && data.reference.trim()) ? `Ref: ${data.reference}  |  ` : '';
        ctx.fillText(`${refPart}© ${new Date().getFullYear()} ${data.brandName} Network Operations`, CANVAS_WIDTH / 2, footerY);

        console.log('Restoration announcement drawn successfully');

    } catch (error) {
        console.error('Error drawing restoration announcement:', error);
        throw error;
    }
}

// ============================================================================
// HELPER FUNCTION: DATE/TIME FORMATTING
// ============================================================================

/**
 * Formats date and time into a human-readable string.
 * Converts ISO date/time into locale-appropriate format.
 * 
 * @param {string} date - Date string in YYYY-MM-DD format
 * @param {string} time - Time string in HH:MM format
 * @returns {string} Formatted date/time string or "Not specified" if inputs missing
 * 
 * Example:
 *   formatDateTime("2026-03-20", "14:30")
 *   Returns: "20 March 2026, 14:30"
 */
function formatDateTime(date, time) {
    // Return default message if either date or time is missing
    if (!date || !time) return 'Not specified';
    
    // Combine date and time into ISO 8601 format for Date object
    const dateObj = new Date(date + 'T' + time);
    
    // Define formatting options for readable output
    const options = { 
        year: 'numeric',      // Full year (e.g., 2026)
        month: 'long',        // Full month name (e.g., March)
        day: 'numeric',       // Day of month (e.g., 20)
        hour: '2-digit',      // 2-digit hour (e.g., 14)
        minute: '2-digit'     // 2-digit minute (e.g., 30)
    };
    
    // Format using South African English locale
    return dateObj.toLocaleString('en-ZA', options);
}

// ============================================================================
// DOWNLOAD FUNCTION: PNG IMAGE EXPORT
// ============================================================================

/**
 * Exports the canvas content as a PNG image file.
 * Generates filename based on brand, incident type, and current date.
 * Includes fallback mechanisms if direct download fails.
 * 
 * Download process:
 * 1. Verify canvas exists
 * 2. Create temporary download link
 * 3. Convert canvas to data URL (base64 PNG)
 * 4. Trigger browser download
 * 5. If fails, try opening in new window
 * 6. If that fails, show manual save instructions
 * 
 * Filename format: BRANDNAME-Announcement-IncidentType-YYYY-MM-DD.png
 * Example: SADV-Announcement-Network-Outage-2026-03-20.png
 */
function downloadAsImage() {
    console.log('Download as image clicked');
    
    // Verify canvas element exists before attempting download
    if (!canvas) {
        alert('Canvas not found. Please generate an announcement first.');
        return;
    }
    
    try {
        console.log('Attempting to download image...');
        
        // Add small delay to ensure canvas rendering is complete
        // Prevents issues with logo loading or text rendering
        setTimeout(() => {
            try {
                // Create temporary anchor element for download
                const link = document.createElement('a');
                
                // Generate filename with timestamp
                const timestamp = new Date().toISOString().slice(0, 10);  // YYYY-MM-DD
                const incidentType = document.getElementById('incidentType').value.replace(/\s+/g, '-');
                const brandName = document.getElementById('brandSelect').value.toUpperCase();
                link.download = `${brandName}-Announcement-${incidentType}-${timestamp}.png`;
                
                console.log('Converting canvas to data URL...');
                // Convert canvas to PNG data URL (base64 encoded)
                link.href = canvas.toDataURL('image/png', 1.0);  // 1.0 = maximum quality
                
                console.log('Triggering download...');
                // Add link to DOM, click it, then remove it
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                console.log('Download triggered successfully');
                
            } catch (innerError) {
                console.error('Inner download error:', innerError);
                throw innerError;
            }
        }, 100);  // 100ms delay
        
    } catch (error) {
        console.error('Download error:', error);
        alert('Download failed: ' + error.message + '\n\nPlease check the browser console for more details.');
        
        // FALLBACK METHOD: Open image in new window
        try {
            const imgData = canvas.toDataURL('image/png');
            const newWindow = window.open();
            
            if (newWindow) {
                // Write image to new window (user can right-click to save)
                const brandName = document.getElementById('brandSelect').value.toUpperCase();
                newWindow.document.write(`<img src="${imgData}" alt="${brandName} Announcement"/>`);
            } else {
                // Pop-up was blocked
                alert('Pop-up blocked. Please allow pop-ups for this site or right-click the preview and select "Save image as..."');
            }
            
        } catch (e) {
            // All methods failed - show manual instructions
            console.error('Fallback error:', e);
            alert('Unable to download. Please right-click the preview image and select "Save image as..."');
        }
    }
}

// ============================================================================
// DOWNLOAD FUNCTION: PDF EXPORT
// ============================================================================

/**
 * Exports the canvas content as a PDF document.
 * Uses jsPDF library (loaded from CDN) to create A4-sized PDF.
 * Canvas image is scaled and centered on the page.
 * 
 * PDF specifications:
 * - Format: A4 (210mm x 297mm)
 * - Orientation: Portrait
 * - Margins: 10mm on all sides
 * - Image: Centered vertically, scaled to fit width
 * 
 * Filename format: BRANDNAME-Announcement-IncidentType-YYYY-MM-DD.pdf
 * Example: INFINIFI-Announcement-Planned-Maintenance-2026-03-20.pdf
 * 
 * Note: Requires jsPDF library to be loaded (included via CDN in HTML)
 */
function downloadAsPDF() {
    console.log('Download as PDF clicked');
    
    // Verify canvas element exists before attempting export
    if (!canvas) {
        alert('Canvas not found. Please generate an announcement first.');
        return;
    }
    
    try {
        console.log('Checking jsPDF library...');
        if (!window.jspdf) {
            throw new Error('jsPDF library not loaded. Please check your internet connection.');
        }
        
        const { jsPDF } = window.jspdf;
        
        console.log('Creating PDF...');
        // Create PDF in A4 portrait
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        console.log('Converting canvas to image...');
        // Get canvas as image
        const imgData = canvas.toDataURL('image/png');
        
        // A4 dimensions in mm
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        // Calculate image dimensions to fit A4
        const imgWidth = pdfWidth - 20; // 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Center the image
        const x = 10;
        const y = (pdfHeight - imgHeight) / 2;
        
        console.log('Adding image to PDF...');
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
        
        // Download PDF
        const timestamp = new Date().toISOString().slice(0, 10);
        const incidentType = document.getElementById('incidentType').value.replace(/\s+/g, '-');
        const brandName = document.getElementById('brandSelect').value.toUpperCase();
        
        console.log('Saving PDF...');
        pdf.save(`${brandName}-Announcement-${incidentType}-${timestamp}.pdf`);
        console.log('PDF download triggered successfully');
    } catch (error) {
        console.error('PDF download error:', error);
        alert('PDF download failed: ' + error.message + '\n\nPlease check the browser console for more details.');
    }
}

// ============================================================================
// PAGE INITIALIZATION - RUNS WHEN PAGE LOADS
// ============================================================================

/**
 * Initialize form with default values when page loads.
 * Sets up:
 * - Current date/time for start fields
 * - Default 4-hour duration for end fields
 * - Brand-specific contact information
 * - Event listener for brand switching
 * 
 * This ensures users have sensible defaults and reduces manual data entry.
 */
window.addEventListener('load', function() {
    // Get current date and time
    const now = new Date();
    const today = now.toISOString().split('T')[0];        // Format: YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5);   // Format: HH:MM
    
    // Pre-fill start date and time with current values
    document.getElementById('startDate').value = today;
    document.getElementById('startTime').value = currentTime;
    
    // Calculate end time as 4 hours from now (typical maintenance window)
    const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);  // Add 4 hours in milliseconds
    document.getElementById('endDate').value = endTime.toISOString().split('T')[0];
    document.getElementById('endTime').value = endTime.toTimeString().slice(0, 5);
    
    // --- Brand-Specific Contact Info Auto-Update ---
    const brandSelect = document.getElementById('brandSelect');
    const contactInfoField = document.getElementById('contactInfo');
    
    /**
     * Updates contact info field when brand is changed.
     * Automatically populates WhatsApp number for selected brand.
     */
    function updateContactInfo() {
        const brand = brandSelect.value;              // Get selected brand (sadv/infinifi)
        const brandInfo = BRAND_COLORS[brand];        // Get brand configuration
        contactInfoField.value = `WhatsApp: ${brandInfo.whatsapp}`;  // Set WhatsApp number
    }
    
    // Set initial contact info on page load (defaults to SADV)
    updateContactInfo();
    
    // Listen for brand dropdown changes and update contact info accordingly
    brandSelect.addEventListener('change', updateContactInfo);
});

// ============================================================================
// PANGEA API INTEGRATION
// ============================================================================
//
// WHAT IS THIS?
// -------------
// Pangea is Vumatel's internal platform that tracks network incidents (outages,
// maintenance, fiber breaks, etc.). It exposes a REST API — a way for other
// programs to ask it questions over the internet and get answers as JSON data.
//
// WHAT DOES THIS CODE DO?
// -----------------------
// Instead of typing incident details manually into the announcement form,
// this code:
//   1. Calls the Pangea API to get a list of active incidents
//   2. Displays them in a dropdown on the page
//   3. When you pick one, automatically fills in the form fields
//      (affected areas, incident type, status, dates, description, etc.)
//
// HOW THE API KEY WORKS (SECURITY):
// ----------------------------------
// The API key is like a password that proves we are allowed to use the API.
// We NEVER write it directly in this file because this file is public on GitHub.
// Instead:
//   - Locally:    it lives in config.js (which is listed in .gitignore so Git ignores it)
//   - Live site:  GitHub Actions (our automated deployment robot) injects it
//                 from a GitHub Secret (a secure vault in GitHub settings)
//                 into config.js at build time, so it never appears in the source code.
//
// ============================================================================

// The base URL of the Pangea API — all requests start with this address
const PANGEA_API_BASE = 'https://pangea-staging.vumatel.co.za';

// Read the API key from config.js (loaded before this script in index.html).
// If config.js didn't load or the key is missing, default to an empty string.
// The '&&' checks mean: "only try to read apiKey if PANGEA_CONFIG exists first"
const PANGEA_API_KEY = (window.PANGEA_CONFIG && window.PANGEA_CONFIG.apiKey)
    ? window.PANGEA_CONFIG.apiKey
    : '';

// This array stores the list of incidents we got from the last API call.
// We keep it here (outside the functions) so both fetchPangeaIncidents()
// and loadSelectedPangeaIncident() can share the same data.
let pangeaIncidents = [];

// ============================================================================
// FUNCTION: fetchPangeaIncidents
// ============================================================================
// Called when the user clicks the "Fetch Incidents" button.
// Makes an HTTP GET request to Pangea, parses the response,
// and populates the dropdown with the incident list.
// ============================================================================
function fetchPangeaIncidents() {
    // Read the selected filter value from the dropdown (open / future / historical)
    const type = document.getElementById('pangeaEventType').value;

    // Get references to the status message element and the dropdown container
    const statusEl = document.getElementById('pangeaStatus');
    const dropEl   = document.getElementById('pangeaIncidentDropdown');

    // Show a "loading" message while we wait for the API to respond
    statusEl.style.display = 'block';
    statusEl.textContent   = '⏳ Fetching incidents…';
    statusEl.style.color   = '#3B82F6'; // blue
    dropEl.style.display   = 'none';   // hide old dropdown until new data arrives

    // --- THE API CALL ---
    // fetch() is a built-in browser function that makes HTTP requests.
    // We build the URL by appending the filter type as a query parameter.
    // encodeURIComponent() makes the value URL-safe (e.g. spaces become %20).
    fetch(PANGEA_API_BASE + '/support/isp-events/?type=' + encodeURIComponent(type), {
        method: 'GET',          // We are reading data, not sending it, so we use GET
        headers: {
            'accept': 'application/json',  // Tell the API we want JSON back
            'APIKEY': PANGEA_API_KEY       // Our authentication key
        }
    })

    // --- STEP 1: Check the HTTP response ---
    // .then() means "when the API responds, do this..."
    // The 'response' object contains the raw HTTP response (status code, headers, body).
    .then(function(response) {
        // response.ok is true for status codes 200-299 (success)
        // If it's false (e.g. 401 Unauthorized, 404 Not Found), throw an error
        if (!response.ok) { throw new Error('HTTP ' + response.status); }

        // Parse the response body as JSON and pass it to the next .then()
        return response.json();
    })

    // --- STEP 2: Process the JSON data ---
    // 'data' is the full parsed JSON object returned by Pangea.
    // The actual incident list is nested at: data.events.results
    // Example structure:
    //   {
    //     "events": {
    //       "count": 25,
    //       "total_records": 68,
    //       "next": "...page=2...",
    //       "results": [ { incident1 }, { incident2 }, ... ]
    //     }
    //   }
    .then(function(data) {
        // Log the raw response to the browser console for debugging.
        // slice(0, 800) limits the output to 800 characters so the console isn't flooded.
        console.log('Pangea raw response:', JSON.stringify(data).slice(0, 800));

        // We need to find the array of incidents inside the response.
        // APIs don't always return data in the same shape, so we try multiple paths:
        var list = [];

        if (Array.isArray(data)) {
            // Case 1: The entire response IS the array  →  [ {...}, {...} ]
            list = data;
        } else if (data && data.events && Array.isArray(data.events.results)) {
            // Case 2: Pangea's actual structure  →  data.events.results  ← THIS IS THE ONE
            list = data.events.results;
        } else if (data && Array.isArray(data.results)) {
            // Case 3: Common API pattern  →  data.results
            list = data.results;
        } else if (data && Array.isArray(data.events)) {
            // Case 4: events is directly an array  →  data.events
            list = data.events;
        } else if (data && Array.isArray(data.data)) {
            // Case 5: Another common pattern  →  data.data
            list = data.data;
        } else if (data && typeof data === 'object') {
            // Case 6: Search all top-level keys for any array value
            var keys = Object.keys(data);
            for (var i = 0; i < keys.length; i++) {
                if (Array.isArray(data[keys[i]])) { list = data[keys[i]]; break; }
            }
        }

        // Edge case: API returned a single incident object instead of an array
        // We wrap it in an array [ inc ] so the rest of the code works the same way
        if (list.length === 0 && data && typeof data === 'object' && !Array.isArray(data) && data.id) {
            list = [data];
        }

        // Store the incidents globally so loadSelectedPangeaIncident() can access them
        pangeaIncidents = list;

        // If no incidents were found after all that, show an info message
        if (pangeaIncidents.length === 0) {
            statusEl.textContent = 'ℹ️ No incidents found for type: ' + type;
            statusEl.style.color = '#888';
            return; // Stop here, nothing to show
        }

        // Show how many incidents were found
        statusEl.textContent = '✅ ' + pangeaIncidents.length + ' incident(s) found — select one below.';
        statusEl.style.color = '#10B981'; // green

        // Build the dropdown options from the incident list
        populatePangeaDropdown(pangeaIncidents);

        // Show the dropdown container (it was hidden above)
        dropEl.style.display = 'block';
    })

    // --- ERROR HANDLER ---
    // .catch() runs if anything in the chain above throws an error
    // (network failure, HTTP error, JSON parse failure, etc.)
    .catch(function(err) {
        statusEl.textContent = '❌ Fetch failed: ' + err.message;
        statusEl.style.color = '#EF4444'; // red
        console.error('Pangea API error:', err);
    });
}

// ============================================================================
// FUNCTION: populatePangeaDropdown
// ============================================================================
// Takes the array of incidents and creates an <option> element for each one
// inside the <select> dropdown on the page.
// Each option shows: INC-000004021 | NETWORK_INCIDENT | Johannesburg
// ============================================================================
function populatePangeaDropdown(incidents) {
    const select = document.getElementById('pangeaIncidentSelect');

    // Clear any previous options and add a default placeholder
    select.innerHTML = '<option value="">-- Choose an incident --</option>';

    // Safety check: if incidents is not an array, log a warning and stop
    if (!Array.isArray(incidents)) {
        console.warn('populatePangeaDropdown: expected array, got', typeof incidents, incidents);
        return;
    }

    // Loop through each incident and create a dropdown option for it
    incidents.forEach(function(inc, idx) {
        // Use the best available ID field, fallback to a generated one
        const id   = inc.prefixed_id || inc.record_id || ('INC-' + idx);

        // Event type (e.g. NETWORK_INCIDENT, PLANNED_MAINTENANCE)
        const type = inc.event_type || 'Event';

        // Best available area description — try multiple fields
        const area = inc.affected_areas
            || (Array.isArray(inc.cities) && inc.cities[0])  // first city in list
            || inc.suburb
            || inc.nwi_name
            || 'Unknown area';

        // Create a new <option> HTML element
        const opt = document.createElement('option');
        opt.value       = idx;                                  // store the array index as value
        opt.textContent = id + ' | ' + type + ' | ' + area;   // display text

        select.appendChild(opt); // add it to the dropdown
    });
}

// ============================================================================
// FUNCTION: mapPangeaEventType
// ============================================================================
// The Pangea API uses its own event type names (e.g. "NETWORK_INCIDENT").
// Our form dropdown uses different names (e.g. "Network Outage").
// This function translates between them using keyword matching.
// ============================================================================
function mapPangeaEventType(apiType) {
    if (!apiType) return ''; // nothing to map

    // Normalise: lowercase + replace underscores with spaces for easy matching
    // e.g. "NETWORK_INCIDENT" → "network incident"
    const t = apiType.toLowerCase().replace(/_/g, ' ');

    if (t.includes('emergency'))                             return 'Emergency Maintenance';
    if (t.includes('planned') || t.includes('maintenance')) return 'Planned Maintenance';
    if (t.includes('interruption'))                         return 'Service Interruption';
    if (t.includes('outage'))                               return 'Network Outage';
    if (t.includes('restor'))                               return 'Service Restoration';
    return 'General Notice'; // default if nothing matched
}

// ============================================================================
// FUNCTION: mapPangeaStatus
// ============================================================================
// Same idea as mapPangeaEventType — translates Pangea status values
// (e.g. "Pending Investigation") into the form's status dropdown values.
// ============================================================================
function mapPangeaStatus(apiStatus) {
    if (!apiStatus) return '';

    const s = apiStatus.toLowerCase(); // normalise to lowercase

    if (s.includes('resolv') || s.includes('restor') || s.includes('closed') || s.includes('complet')) return 'Resolved';
    if (s.includes('investigat'))                        return 'Investigating';
    if (s.includes('schedul') || s.includes('planned') || s.includes('future')) return 'Scheduled';
    return 'In Progress'; // default
}

// ============================================================================
// FUNCTION: parsePangeaDatetime
// ============================================================================
// The API returns dates as ISO 8601 strings like "2026-04-07T07:00:12.000Z"
// (the Z means UTC/Zulu time). Our HTML date/time inputs need them split into:
//   date: "2026-04-07"   (YYYY-MM-DD)
//   time: "07:00"        (HH:MM)
// ============================================================================
function parsePangeaDatetime(dtStr) {
    if (!dtStr) return null; // nothing to parse

    // JavaScript's Date object can parse ISO strings directly
    const d = new Date(dtStr);

    // isNaN check: if the string was not a valid date, Date returns "Invalid Date"
    if (isNaN(d.getTime())) return null;

    return {
        date: d.toISOString().split('T')[0],  // "2026-04-07T07:00:12.000Z" → "2026-04-07"
        time: d.toTimeString().slice(0, 5)    // "07:00:12 GMT+..." → "07:00"
    };
}

// ============================================================================
// FUNCTION: mapPangeaBrand
// ============================================================================
// Each incident in Pangea has a 'product' field (e.g. "Vuma Core;Vuma Reach").
// This function checks if the product name contains "infinifi" or "sadv"
// and returns the matching brand key used in this app.
// ============================================================================
function mapPangeaBrand(product) {
    if (!product) return null;
    const p = product.toLowerCase();
    if (p.includes('infinifi')) return 'infinifi';
    if (p.includes('sadv'))     return 'sadv';
    return null; // product doesn't match either brand — leave brand unchanged
}

// ============================================================================
// FUNCTION: loadSelectedPangeaIncident
// ============================================================================
// Called when the user clicks "Load into Form ↓".
// Reads the selected incident from the dropdown, then maps its API fields
// to the announcement form fields one by one.
// ============================================================================
function loadSelectedPangeaIncident() {
    const select = document.getElementById('pangeaIncidentSelect');

    // If nothing is selected, do nothing
    if (!select.value && select.value !== 0) return;

    // Retrieve the full incident object using the index stored in option.value
    // parseInt() converts the string "3" to the number 3
    const inc = pangeaIncidents[parseInt(select.value)];
    if (!inc) return;

    // --- BRAND ---
    // Try to detect SADV vs Infinifi from the product field
    const brand = mapPangeaBrand(inc.product);
    if (brand) {
        document.getElementById('brandSelect').value = brand;
        // Manually fire a 'change' event so the contact info also updates
        // (the brand dropdown has a listener that changes the WhatsApp number)
        document.getElementById('brandSelect').dispatchEvent(new Event('change'));
    }

    // --- INCIDENT TYPE ---
    // Translate the Pangea event_type to the form's dropdown option
    const mappedType = mapPangeaEventType(inc.event_type);
    if (mappedType) document.getElementById('incidentType').value = mappedType;

    // --- STATUS ---
    // isp_event_status is the main status field; fall back to 'status' if missing
    const mappedStatus = mapPangeaStatus(inc.isp_event_status || inc.status);
    if (mappedStatus) document.getElementById('incidentStatus').value = mappedStatus;

    // --- AFFECTED AREAS ---
    // Merge all available area fields to give the most complete picture.
    // We check for duplicates before adding each one (case-insensitive).
    var areas = [];
    if (inc.affected_areas) areas.push(inc.affected_areas);
    if (Array.isArray(inc.cities) && inc.cities.length) {
        inc.cities.forEach(function(c) {
            // Only add the city if it's not already mentioned in the areas list
            if (c && !areas.join(' ').toLowerCase().includes(c.toLowerCase())) {
                areas.push(c);
            }
        });
    }
    if (inc.suburb && !areas.join(' ').toLowerCase().includes(inc.suburb.toLowerCase())) {
        areas.push(inc.suburb);
    }
    if (areas.length) {
        document.getElementById('affectedAreas').value = areas.join(', ');
    }

    // --- TITLE ---
    // Build a human-readable title from event type + primary area.
    // replace(/_/g, ' ')  →  "NETWORK_INCIDENT" becomes "NETWORK INCIDENT"
    // replace(/\b\w/g, ...) capitalises the first letter of each word
    var titleArea = inc.affected_areas || (Array.isArray(inc.cities) && inc.cities[0]) || inc.nwi_name || '';
    var titleType = inc.event_type
        ? inc.event_type.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); })
        : 'Network Event';
    document.getElementById('title').value = titleType + (titleArea ? ' - ' + titleArea : '');

    // --- DESCRIPTION ---
    // Pangea nests the reason inside a 'details' sub-object.
    // We try details.reason first, then fall back to other fields.
    var desc = (inc.details && inc.details.reason) || inc.details || inc.website_description || '';
    if (desc) document.getElementById('description').value = desc;

    // --- IMPACT ---
    // system_impact_category describes what services are affected
    var impact = (inc.details && inc.details.system_impact_category) || inc.impact || '';
    if (impact) document.getElementById('impact').value = impact;

    // --- START DATE/TIME ---
    var start = parsePangeaDatetime(inc.event_start_date);
    if (start) {
        document.getElementById('startDate').value = start.date;
        document.getElementById('startTime').value = start.time;
    }

    // --- END DATE/TIME ---
    var end = parsePangeaDatetime(inc.event_end_date);
    if (end) {
        document.getElementById('endDate').value = end.date;
        document.getElementById('endTime').value = end.time;
    }

    // --- REFERENCE NUMBER ---
    // prefixed_id is the human-readable ID (e.g. INC-000004021)
    // record_id is the internal Salesforce ID — use as fallback
    var ref = inc.prefixed_id || inc.record_id;
    if (ref) document.getElementById('reference').value = ref;

    // --- RESTORATION TEMPLATE ---
    // If the incident is already resolved/restored, automatically tick the
    // "Use Restoration Template" checkbox to show the GOOD NEWS design
    var statusLow = (inc.isp_event_status || inc.status || '').toLowerCase();
    document.getElementById('useRestorationTemplate').checked =
        statusLow.includes('restor') || statusLow.includes('resolv') || statusLow.includes('closed');

    // --- DONE ---
    // Show a success message and smoothly scroll down to the form
    var statusEl = document.getElementById('pangeaStatus');
    statusEl.textContent = '✅ Form filled from ' + (inc.prefixed_id || inc.record_id || 'incident') + '. Review details and click Generate.';
    statusEl.style.color = '#10B981'; // green
    document.getElementById('announcementForm').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================================
// BUTTON EVENT LISTENERS
// ============================================================================
// These two lines connect the HTML buttons to the JavaScript functions above.
// addEventListener('click', fn) means: "when this button is clicked, run fn()"
// ============================================================================
document.getElementById('fetchPangeaBtn').addEventListener('click', fetchPangeaIncidents);
document.getElementById('loadIncidentBtn').addEventListener('click', loadSelectedPangeaIncident);

// ============================================================================
// END OF SCRIPT
// ============================================================================
