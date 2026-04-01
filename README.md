# SADV & Infinifi Announcement Generator

A free, browser-based announcement generator for SADV and Infinifi Customer Care teams to create professional incident announcements with company branding. Generate both images (PNG) and PDFs with no installation or server required.

## Features

✨ **Easy to Use**
- Simple form-based interface
- Pre-filled incident types
- Auto-populated date/time fields

🎨 **Multi-Brand Support**
- SADV official colors (Blue #005EB8, Yellow #FFC107, Pink #E91E63)
- Infinifi official colors (Orange #FF6B35, Deep Blue #004E89, Light Blue #00A8E8)
- Automatic logo and contact info switching
- Professional layout and design

📢 **Incident Types Supported**
- Planned Maintenance
- Service Interruption
- Network Outage
- Service Restoration
- General Notice
- Emergency Maintenance

📥 **Download Options**
- PNG Image (high resolution - 1080x1080px, perfect for Instagram)
- PDF Document (A4 format)

💰 **Completely Free**
- No server costs
- No installation required
- No dependencies to install
- Runs entirely in browser
- No API keys needed

## How to Use

### Quick Start

1. **Open the application**
   - Simply open `index.html` in any modern web browser
   - Or host it on any free static hosting (GitHub Pages, Netlify, Vercel, etc.)

2. **Select your brand**
   - Choose between SADV or Infinifi from the brand dropdown
   - Contact information will automatically update

3. **Fill in the incident details**
   - Select the incident type
   - Enter announcement title
   - Specify affected areas
   - Set start and end date/time
   - Add detailed description
   - Optionally add expected impact and reference number

3. **Generate the announcement**
   - Click "Generate Announcement"
   - Preview the generated image
   - Download as PNG or PDF

### Field Guide

| Field | Required | Description |
|-------|----------|-------------|
| Incident Type | ✓ | Category of the incident (determines badge color) |
| Announcement Title | ✓ | Main heading for the announcement |
| Affected Areas | ✓ | Locations/regions affected (e.g., "Johannesburg, Sandton") |
| Start Date/Time | ✓ | When the incident begins |
| End Date/Time | ✓ | When the incident is expected to end |
| Description | ✓ | Detailed explanation of the incident |
| Expected Impact | - | What services will be affected |
| Contact Information | - | How customers can reach support (pre-filled with WhatsApp) |
| Reference Number | - | Internal tracking number (e.g., INC-2026-001) |

## Installation & Deployment

### Local Use (No Installation)

1. Download all files to a folder
2. Double-click `index.html`
3. Start creating announcements!

### Free Hosting Options

#### GitHub Pages
```bash
# Create a new repository
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/sadv-announcements.git
git push -u origin main

# Enable GitHub Pages in repository settings
# Your app will be live at: https://yourusername.github.io/sadv-announcements/
```

#### Netlify (Drag & Drop)
1. Go to [netlify.com](https://www.netlify.com)
2. Drag the entire folder to Netlify Drop
3. Get instant free hosting with custom URL

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd sadv-announcement-generator
vercel
```

## Customization

### Changing Colors
Edit `script.js` line 2-11 to modify brand colors:
```javascript
const COLORS = {
    primary: '#00A3E0',    // Main brand color
    secondary: '#0066CC',  // Secondary brand color
    accent: '#FF6B35',     // Accent color
    // ... other colors
};
```

### Adding New Incident Types
Edit `index.html` line 19-26 to add more options:
```html
<option value="Your New Type">Your New Type</option>
```

### Changing Canvas Size
Edit `script.js` line 21-22:
```javascript
const CANVAS_WIDTH = 1200;  // Width in pixels
const CANVAS_HEIGHT = 1600; // Height in pixels
```

## Browser Compatibility

✅ Chrome (Recommended)
✅ Edge
✅ Firefox
✅ Safari
✅ Opera

**Note:** Requires a modern browser with HTML5 Canvas support (all browsers from 2015+)

## Troubleshooting

### Downloads not working
- Ensure pop-ups are not blocked in your browser
- Try right-click → "Save as" on the preview image

### Image looks blurry
- The canvas is rendered at 1200x1600px for high quality
- If preview looks blurry, download the PNG/PDF for full quality

### PDF library not loading
- Check your internet connection (jsPDF loads from CDN)
- For offline use, download jsPDF and update the script tag in index.html

## File Structure

```
sadv-announcement-generator/
├── index.html          # Main HTML file with form
├── styles.css          # SADV branded styling
├── script.js           # Canvas rendering & download logic
└── README.md          # This file
```

## Technical Details

- **Frontend:** Pure HTML5, CSS3, JavaScript (ES6+)
- **Canvas API:** For image generation
- **jsPDF:** For PDF generation (loaded from CDN)
- **No backend required:** Everything runs client-side
- **No database needed:** Form data is processed in memory only

## Privacy & Security

- ✅ No data is sent to any server
- ✅ All processing happens locally in your browser
- ✅ No tracking or analytics
- ✅ No cookies or local storage used
- ✅ Safe to use with sensitive incident information

## Support

For issues or questions:
- WhatsApp: +27 84 555 5585
- Email: Contact SADV support

## License

Internal use for SADV Customer Care team.

## Version History

### v1.0.0 (January 2026)
- Initial release
- PNG and PDF download support
- 6 incident types
- SADV branding and colors
- Responsive design
- Auto date/time population

---

**Made with ❤️ for SADV Customer Care Team**
*Be XTRA with SADV*
