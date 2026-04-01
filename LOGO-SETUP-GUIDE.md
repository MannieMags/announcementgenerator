# Logo Setup Guide

## Required Logo Files

To ensure seamless brand switching, you need to add **2 logo files** to the project folder:

### 1. `SADVLOGO.png`
- **Brand:** SADV
- **Format:** PNG with transparent background (no white block)
- **Recommended size:** 500x500px or larger (will be auto-scaled)
- **Background:** Transparent
- **Content:** SADV company logo

### 2. `InfinifiLOGO.png`
- **Brand:** Infinifi
- **Format:** PNG with transparent background (no white block)
- **Recommended size:** 500x500px or larger (will be auto-scaled)
- **Background:** Transparent
- **Content:** Infinifi company logo

## How to Create Transparent PNGs

### Option 1: Using Photoshop/GIMP
1. Open your logo file
2. Remove/delete the background layer
3. Export as PNG (ensure "Transparency" is checked)
4. Save as `SADVLOGO.png` or `InfinifiLOGO.png`

### Option 2: Using Online Tools
1. Go to https://www.remove.bg or similar tool
2. Upload your logo image
3. Tool will automatically remove background
4. Download as PNG
5. Rename to `SADVLOGO.png` or `InfinifiLOGO.png`

### Option 3: Use PNG Logo Direct from Designer
1. Request PNG logo with transparent background from your design team
2. Ensure no white/colored background
3. Save with correct filename

## File Placement

Place both logo files in the same folder as `index.html`:

```
sadv-announcement-generator/
├── index.html
├── script.js
├── styles.css
├── SADVLOGO.png          ← Add this file
├── InfinifiLOGO.png      ← Add this file
└── README.md
```

## Testing

After adding the logos:
1. Open `index.html` in your browser
2. Select "SADV" from brand dropdown - should show SADV logo
3. Select "Infinifi" from brand dropdown - should show Infinifi logo
4. Generate an announcement to verify logo appears correctly

## Fallback Behavior

If a logo file is missing or fails to load:
- The app will display the brand name as text instead
- No errors will be shown to the user
- All other functionality continues to work normally

## Manual Logo Upload

Users can also upload their own logo via the "Company Logo (Optional)" field:
- Supports any image format (PNG, JPG, etc.)
- Uploaded logo will override the default brand logo
- Useful for special announcements or testing

## Image Quality Tips

For best results:
- **Resolution:** At least 500x500px (higher is better)
- **Format:** PNG with transparency
- **Aspect ratio:** Square or horizontal logos work best
- **File size:** Keep under 2MB for fast loading
- **Color mode:** RGB (not CMYK)
