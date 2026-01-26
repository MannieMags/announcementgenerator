// SADV Brand Colors
const COLORS = {
    primary: '#6B7FED',      // Purple-blue
    secondary: '#B76FD8',    // Purple-pink
    accent: '#FF6B35',
    dark: '#1A1A2E',
    light: '#F5F5F5',
    lightPurple: '#F3F2FF',  // Light background for boxes
    white: '#FFFFFF',
    text: '#333333',
    textLight: '#666666',
    warning: '#FFD700',      // Yellow for IN PROGRESS badge
    danger: '#E53935',
    success: '#00C853',
    borderBlue: '#6B7FED'    // Blue accent for borders
};

// Form elements
const form = document.getElementById('announcementForm');
const resetBtn = document.getElementById('resetBtn');
const previewSection = document.getElementById('previewSection');
const canvas = document.getElementById('announcementCanvas');
const ctx = canvas.getContext('2d');
const downloadImageBtn = document.getElementById('downloadImage');
const downloadPDFBtn = document.getElementById('downloadPDF');
const logoUpload = document.getElementById('logoUpload');

// Logo image
let logoImage = null;

// Canvas dimensions  
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1800;

// Set canvas size
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Enable smooth text rendering
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// Enable smooth text rendering
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

// Event Listeners
form.addEventListener('submit', function(e) {
    e.preventDefault();
    generateAnnouncement();
});

resetBtn.addEventListener('click', function() {
    form.reset();
    logoImage = null;
    previewSection.classList.add('hidden');
});

logoUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                logoImage = img;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

downloadImageBtn.addEventListener('click', downloadAsImage);
downloadPDFBtn.addEventListener('click', downloadAsPDF);

// Generate announcement image
function generateAnnouncement() {
    const data = {
        incidentType: document.getElementById('incidentType').value,
        incidentStatus: document.getElementById('incidentStatus').value,
        title: document.getElementById('title').value,
        affectedAreas: document.getElementById('affectedAreas').value,
        startDate: document.getElementById('startDate').value,
        startTime: document.getElementById('startTime').value,
        endDate: document.getElementById('endDate').value,
        endTime: document.getElementById('endTime').value,
        description: document.getElementById('description').value,
        impact: document.getElementById('impact').value,
        updates: document.getElementById('updates').value,
        contactInfo: document.getElementById('contactInfo').value,
        reference: document.getElementById('reference').value
    };

    drawAnnouncement(data);
    previewSection.classList.remove('hidden');
    
    // Smooth scroll to preview
    setTimeout(() => {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Draw announcement on canvas
function drawAnnouncement(data) {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // White background
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    let yPos = 0;

    // ===== HEADER SECTION WITH GRADIENT =====
    const headerHeight = 200;
    const headerGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    headerGradient.addColorStop(0, COLORS.primary);
    headerGradient.addColorStop(1, COLORS.secondary);
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, headerHeight);

    // Logo or SADV text
    if (logoImage) {
        // Draw uploaded logo
        const maxLogoHeight = 120;
        const maxLogoWidth = 300;
        let logoWidth = logoImage.width;
        let logoHeight = logoImage.height;
        
        // Scale logo to fit
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
        
        ctx.drawImage(logoImage, 50, 40, logoWidth, logoHeight);
    } else {
        // Default SADV text
        ctx.fillStyle = COLORS.white;
        ctx.font = 'bold 70px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('SADV', 50, 90);

        // Tagline
        ctx.font = '22px Arial';
        ctx.fillText('Connecting you to what matters', 50, 125);
    }

    // Contact info (phone, email, website)
    ctx.fillStyle = COLORS.white;
    ctx.font = '17px Arial';
    ctx.fillText('📞 084 555 5585  |  ✉ info@sadv.co.za  |  🌐 www.sadv.co.za', 50, 165);

    // ===== TITLE BANNER WITH STATUS BADGE =====
    yPos = headerHeight;
    const bannerHeight = 80;
    ctx.fillStyle = COLORS.primary;
    ctx.fillRect(0, yPos, CANVAS_WIDTH, bannerHeight);

    // Red accent line at top of banner
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(0, yPos, CANVAS_WIDTH, 4);

    // Title text
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(data.title.toUpperCase(), 50, yPos + 50);

    // Status badge
    let badgeColor, badgeText;
    switch(data.incidentStatus) {
        case 'Investigating':
            badgeColor = COLORS.danger;
            badgeText = 'INVESTIGATING';
            break;
        case 'In Progress':
            badgeColor = COLORS.warning;
            badgeText = 'IN PROGRESS';
            break;
        case 'Scheduled':
            badgeColor = '#4CAF50';
            badgeText = 'SCHEDULED';
            break;
        case 'Resolved':
            badgeColor = COLORS.success;
            badgeText = 'RESOLVED';
            break;
        default:
            badgeColor = COLORS.warning;
            badgeText = data.incidentStatus.toUpperCase();
    }
    
    ctx.fillStyle = badgeColor;
    const badgeWidth = 180;
    const badgeHeight = 45;
    const badgeX = CANVAS_WIDTH - badgeWidth - 50;
    const badgeY = yPos + 18;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 8);
    ctx.fill();

    ctx.fillStyle = COLORS.dark;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeWidth/2, badgeY + 30);

    // ===== LOCATION AND DATE (TOP RIGHT) =====
    yPos += bannerHeight + 40;
    ctx.fillStyle = COLORS.textLight;
    ctx.font = '22px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(data.affectedAreas, CANVAS_WIDTH - 50, yPos);
    yPos += 30;
    const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillText(currentDate, CANVAS_WIDTH - 50, yPos);

    // ===== GREETING =====
    yPos += 60;
    ctx.fillStyle = COLORS.text;
    ctx.font = '26px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Dear Valued SADV Customer,', 50, yPos);

    // ===== INTRODUCTION PARAGRAPH =====
    yPos += 50;
    ctx.font = '22px Arial';
    ctx.fillStyle = COLORS.textLight;
    
    // Dynamic introduction based on incident type
    let intro;
    const isPlanned = data.incidentType === 'Planned Maintenance' || data.incidentStatus === 'Scheduled';
    const isOutage = data.incidentType === 'Network Outage' || data.incidentType === 'Service Interruption';
    const isResolved = data.incidentStatus === 'Resolved';
    
    if (isResolved) {
        intro = `We are pleased to inform you that the ${data.incidentType.toLowerCase()} affecting fibre services in your area has been resolved. Thank you for your patience and understanding during this time.`;
    } else if (isPlanned) {
        intro = `We are writing to inform you about a ${data.incidentType.toLowerCase()} that will affect fibre services in your area. We understand how important your connectivity is, and we want to keep you informed every step of the way.`;
    } else if (isOutage) {
        intro = `We are currently experiencing a ${data.incidentType.toLowerCase()} affecting fibre services in your area. Our technical team is actively working to restore your service as quickly as possible. We understand how important your connectivity is and sincerely apologize for any inconvenience.`;
    } else {
        intro = `We are writing to inform you about a service update affecting fibre services in your area. We understand how important your connectivity is, and we want to keep you informed every step of the way.`;
    }
    
    const introLines = wrapText(ctx, intro, CANVAS_WIDTH - 100);
    introLines.forEach(line => {
        ctx.fillText(line, 50, yPos);
        yPos += 35;
    });

    // ===== OUTAGE DETAILS BOX =====
    yPos += 40;
    const boxX = 50;
    const boxWidth = CANVAS_WIDTH - 100;
    const boxStartY = yPos;

    // Box title
    ctx.fillStyle = COLORS.primary;
    ctx.font = 'bold 28px Arial';
    const boxTitle = isOutage && !isPlanned ? 'Incident Details' : isResolved ? 'Resolution Details' : 'Outage Details';
    ctx.fillText(boxTitle, boxX, yPos);
    yPos += 20;

    // Box background
    const boxPadding = 30;
    const boxContentStart = yPos;
    
    // Calculate duration if both dates are provided
    let durationHours = null;
    let hasEndTime = data.endDate && data.endTime;
    
    if (hasEndTime && data.startDate && data.startTime) {
        const startDate = new Date(data.startDate + 'T' + data.startTime);
        const endDate = new Date(data.endDate + 'T' + data.endTime);
        durationHours = Math.round((endDate - startDate) / (1000 * 60 * 60));
    }

    // Prepare box content - dynamic based on what info is available
    const details = [];
    
    details.push({ label: 'Affected Area:', value: data.affectedAreas });
    
    if (data.startDate) {
        const dateLabel = isPlanned ? 'Date:' : isResolved ? 'Date Occurred:' : 'Started:';
        details.push({ 
            label: dateLabel, 
            value: new Date(data.startDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) 
        });
    }
    
    if (data.startTime) {
        const timeLabel = isPlanned ? 'Start Time:' : 'Time:';
        details.push({ label: timeLabel, value: data.startTime });
    }
    
    if (hasEndTime) {
        if (durationHours !== null) {
            details.push({ label: 'Expected Duration:', value: `Approximately ${durationHours} hours` });
        }
        const restorationLabel = isResolved ? 'Restored At:' : 'Expected Restoration:';
        details.push({ label: restorationLabel, value: data.endTime });
    } else if (!isResolved) {
        details.push({ label: 'Expected Restoration:', value: 'To be determined - updates will follow' });
    }
    
    details.push({ label: 'Reason:', value: data.description });

    let maxBoxHeight = 40;
    details.forEach(detail => {
        maxBoxHeight += 35;
        if (detail.value.length > 50) {
            maxBoxHeight += 30;
        }
    });

    // Draw box background
    ctx.fillStyle = COLORS.lightPurple;
    roundRect(ctx, boxX, boxContentStart, boxWidth, maxBoxHeight, 8);
    ctx.fill();

    // Draw left blue border
    ctx.fillStyle = COLORS.borderBlue;
    ctx.fillRect(boxX, boxContentStart, 6, maxBoxHeight);

    // Draw box content
    yPos = boxContentStart + 35;
    details.forEach(detail => {
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(detail.label, boxX + boxPadding, yPos);

        ctx.fillStyle = COLORS.textLight;
        ctx.font = '20px Arial';
        const valueLines = wrapText(ctx, detail.value, boxWidth - 280);
        valueLines.forEach((line, index) => {
            ctx.fillText(line, boxX + 280, yPos + (index * 30));
        });
        yPos += 35 + (valueLines.length > 1 ? 30 : 0);
    });

    // ===== ADDITIONAL INFORMATION PARAGRAPH =====
    yPos += 45;
    ctx.font = '22px Arial';
    ctx.fillStyle = COLORS.textLight;
    
    let info1;
    if (isResolved) {
        info1 = `Your service has been fully restored and should be operating normally. If you are still experiencing connectivity issues, please try restarting your router. Should problems persist, our support team is ready to assist you.`;
    } else if (isPlanned) {
        info1 = `This maintenance is essential to improve network performance, reliability, and speed for all our customers. Our technical team will be working diligently to complete the upgrade as quickly as possible while minimizing disruption to your service.`;
    } else {
        info1 = `Our technical team is currently investigating and working to resolve this issue. We are doing everything possible to restore your service as quickly as we can. We will continue to provide updates as more information becomes available.`;
    }
    
    const info1Lines = wrapText(ctx, info1, CANVAS_WIDTH - 100);
    info1Lines.forEach(line => {
        ctx.fillText(line, 50, yPos);
        yPos += 35;
    });

    // ===== "What you need to know:" SECTION =====
    if (!isResolved) {
        yPos += 45;
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 24px Arial';
        ctx.fillText('What you need to know:', 50, yPos);

        yPos += 45;
        ctx.font = '22px Arial';
        ctx.fillStyle = COLORS.textLight;
        
        let info2;
        if (isPlanned) {
            info2 = `During the maintenance window, you will experience a complete loss of internet connectivity. We have scheduled this work during off-peak hours to minimize the impact on your daily activities. Once the maintenance is complete, your service will automatically resume - no action is required from your side.`;
        } else {
            info2 = `You are currently experiencing a loss of internet connectivity. Our team is actively working on resolving this issue. We will provide regular updates on our progress and notify you as soon as service is restored. No action is required from your side at this time.`;
        }
        
        const info2Lines = wrapText(ctx, info2, CANVAS_WIDTH - 100);
        info2Lines.forEach(line => {
            ctx.fillText(line, 50, yPos);
            yPos += 35;
        });

        yPos += 40;
        const contactText = hasEndTime 
            ? `If you experience any issues after the scheduled restoration time, please don't hesitate to contact our support team via WhatsApp at ${data.contactInfo.replace('WhatsApp: ', '')} or through the SADV KoNect App.`
            : `For updates or any concerns, please contact our support team via WhatsApp at ${data.contactInfo.replace('WhatsApp: ', '')} or through the SADV KoNect App. We are here to help.`;
        const contactLines = wrapText(ctx, contactText, CANVAS_WIDTH - 100);
        contactLines.forEach(line => {
            ctx.fillText(line, 50, yPos);
            yPos += 35;
        });
    }

    // ===== UPDATES/COMMENTS SECTION (if provided) =====
    if (data.updates && data.updates.trim()) {
        yPos += 45;
        ctx.fillStyle = COLORS.dark;
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Latest Update:', 50, yPos);

        yPos += 45;
        ctx.font = '22px Arial';
        ctx.fillStyle = COLORS.textLight;
        const updateLines = wrapText(ctx, data.updates, CANVAS_WIDTH - 100);
        updateLines.forEach(line => {
            ctx.fillText(line, 50, yPos);
            yPos += 35;
        });
    }

    // ===== CLOSING STATEMENT =====
    yPos += 45;
    ctx.font = '22px Arial';
    ctx.fillStyle = COLORS.textLight;
    
    let closing;
    if (isResolved) {
        closing = `Thank you for your patience and understanding during this time. We are committed to providing you with reliable service.`;
    } else if (isPlanned) {
        closing = `We appreciate your patience and understanding as we work to enhance your internet experience.`;
    } else {
        closing = `We sincerely apologize for the inconvenience and appreciate your patience as we work to resolve this issue.`;
    }
    
    const closingLines = wrapText(ctx, closing, CANVAS_WIDTH - 100);
    closingLines.forEach(line => {
        ctx.fillText(line, 50, yPos);
        yPos += 35;
    });

    yPos += 25;
    ctx.fillText('Stay connected, stay XTRA.', 50, yPos);

    // ===== SIGNATURE =====
    yPos += 60;
    ctx.fillStyle = COLORS.dark;
    ctx.font = 'bold 24px Arial';
    ctx.fillText('SADV Technical Support Team', 50, yPos);
    yPos += 35;
    ctx.font = '20px Arial';
    ctx.fillStyle = COLORS.textLight;
    ctx.fillText('Network Operations Department', 50, yPos);

    // ===== FOOTER SECTION =====
    yPos = CANVAS_HEIGHT - 140;
    
    // Footer separator line
    ctx.strokeStyle = COLORS.light;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, yPos);
    ctx.lineTo(CANVAS_WIDTH, yPos);
    ctx.stroke();

    yPos += 40;

    // Tagline
    ctx.fillStyle = COLORS.dark;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SADV Fibre - Be XTRA. Get XTRA. Live XTRA.', CANVAS_WIDTH / 2, yPos);

    // Links
    yPos += 40;
    ctx.font = '20px Arial';
    ctx.fillStyle = COLORS.primary;
    ctx.fillText('Help Center  |  My Account  |  WhatsApp Support', CANVAS_WIDTH / 2, yPos);

    // Copyright
    yPos += 35;
    ctx.font = '16px Arial';
    ctx.fillStyle = COLORS.textLight;
    const year = new Date().getFullYear();
    ctx.fillText(`© ${year} SADV. All rights reserved. | Unlimited Data. No Contracts. No Hassles.`, CANVAS_WIDTH / 2, yPos);
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

// Helper function to wrap text
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    
    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

// Helper function to format date and time
function formatDateTime(date, time) {
    if (!date || !time) return 'Not specified';
    
    const dateObj = new Date(date + 'T' + time);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return dateObj.toLocaleString('en-ZA', options);
}

// Download as PNG image
function downloadAsImage() {
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    const incidentType = document.getElementById('incidentType').value.replace(/\s+/g, '-');
    link.download = `SADV-Announcement-${incidentType}-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Download as PDF
function downloadAsPDF() {
    const { jsPDF } = window.jspdf;
    
    // Create PDF in A4 portrait
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

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
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    
    // Download PDF
    const timestamp = new Date().toISOString().slice(0, 10);
    const incidentType = document.getElementById('incidentType').value.replace(/\s+/g, '-');
    pdf.save(`SADV-Announcement-${incidentType}-${timestamp}.pdf`);
}

// Set default date and time to current
window.addEventListener('load', function() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    document.getElementById('startDate').value = today;
    document.getElementById('startTime').value = currentTime;
    
    // Set end date/time to 4 hours from now
    const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    document.getElementById('endDate').value = endTime.toISOString().split('T')[0];
    document.getElementById('endTime').value = endTime.toTimeString().slice(0, 5);
});
