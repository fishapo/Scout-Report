# Scout Report - Component Previews

This directory contains interactive HTML previews for all Scout Report components. These previews showcase the user interface and admin dashboard in a web browser.

## 📁 Files

### 1. **index.html** - Main Preview Hub
Main entry point with tabbed interface to view all components.

**Features:**
- Tabbed navigation to switch between components
- Documentation and features overview
- Component information cards
- API endpoints reference
- Browser compatibility information

**How to Use:**
1. Open `index.html` in a web browser
2. Click tabs to switch between different preview components
3. View component details and documentation
4. Press F12 to test responsive design on mobile sizes

---

### 2. **user-form.html** - Scout Report Form
Mobile-first web form for creating scout reports (converted from React Native).

**Features:**
- ✅ Farm selection with greenhouse toggle
- ✅ Crop type and variety selection with dynamic loading
- ✅ Environmental conditions tracking
- ✅ Temperature, humidity, and weather inputs
- ✅ GPS location display and update
- ✅ Dynamic pest observations (add/remove)
- ✅ Dynamic disease observations (add/remove)
- ✅ Severity levels (Low, Medium, High, Critical)
- ✅ Percentage inputs for affected plants
- ✅ Notes and detailed observations
- ✅ Form submission validation

**Components:**
- Header with branding
- Form sections for better organization
- Input fields (text, number, select, textarea)
- Switch buttons for field/greenhouse selection
- Add/Remove buttons for observations
- Submit button with validation

**Mobile-First Design:**
- Responsive layout optimized for mobile devices
- Touch-friendly button sizes
- Vertical stacking on small screens
- Easy scrolling on smartphones

---

### 3. **admin-dashboard.html** - Admin Interface
Professional dashboard for managing scout reports and monitoring farm health.

**Features:**
- 📊 Real-time statistics dashboard
- 📈 Key metrics display (Total Reports, Critical Issues, Active Farms, Response Rate)
- 🔍 Advanced filtering system
- 📋 Comprehensive reports table
- 🎯 Status badges (Completed, Pending, Critical)
- 📍 Severity level indicators
- ⚙️ Action buttons (View, Edit, Delete)
- 📄 Pagination controls
- 💾 Export functionality
- 🔧 Settings menu

**Layout:**
- Fixed sidebar navigation
- Main content area
- Responsive grid system
- Modal dialogs for detailed views
- Filter bar for data refinement

**Dashboard Sections:**
- Header with title and action buttons
- Statistics cards grid
- Filter controls
- Reports table
- Pagination
- View modal with detailed report information
- Create new report modal

---

## 🎯 Quick Start

### Option 1: View All Components
```bash
# Open the main hub
open index.html
# or on Linux:
firefox index.html
```

### Option 2: View Specific Components
```bash
open user-form.html      # Scout Report Form
open admin-dashboard.html # Admin Dashboard
```

## 💻 Browser Compatibility

✅ **Supported:**
- Chrome (latest) ✓
- Firefox (latest) ✓
- Safari (latest) ✓
- Edge (latest) ✓
- Chrome Mobile ✓
- Safari iOS ✓

## 📱 Responsive Design

All components are fully responsive:
- **Mobile**: 320px - 480px (Portrait)
- **Tablet**: 481px - 768px
- **Desktop**: 769px and above

### Test Responsive Design:
1. Press `F12` in your browser to open Developer Tools
2. Press `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
3. Select mobile device from the dropdown
4. Test interactions on different screen sizes

## 🎨 Color Scheme

- **Primary Green**: `#4CAF50` - Main actions and highlights
- **Primary Blue**: `#2a5298` - Admin interface
- **Dark Gray**: `#333` - Text
- **Light Gray**: `#f5f5f5` - Backgrounds
- **Border Gray**: `#ddd` - Borders

## 📊 Sample Data

All previews include sample data:
- **Farms**: Green Valley Farm, Sunset Ridge Farm, Highland Plains Farm
- **Crops**: Tomato, Pepper, Cucumber, Lettuce
- **Pests**: Whitefly, Aphid, Spider Mite, Thrips
- **Diseases**: Early Blight, Late Blight, Powdery Mildew, Fusarium Wilt
- **Sample Reports**: 4 example scout reports with various statuses

## 🔗 Integration

These HTML previews are:
- **Development references** for mobile app design
- **Web-based alternatives** when mobile app isn't available
- **Admin dashboard** accessible via web browser
- **Component showcases** for stakeholders

## 🚀 Deployment

### Serve Locally
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Then visit the preview hub from the served root, for example /previews/
```

### Deploy to GitHub Pages
```bash
# These files will be automatically served if pushed to gh-pages branch
git checkout --orphan gh-pages
git add previews/
git commit -m "Add component previews"
git push -u origin gh-pages
```

## 🛠️ Customization

### Edit Colors
Find and replace color values:
- `#4CAF50` → Primary green
- `#2a5298` → Primary blue
- `#f5f5f5` → Background light

### Add More Crops/Pests
Edit the JavaScript object in `user-form.html`:
```javascript
const varieties = {
    'Tomato': ['Cherry Tomato', 'Beefsteak Tomato', ...],
    'Your Crop': ['Variety 1', 'Variety 2', ...]
};
```

### Modify Farm Data
Update the select options in both `user-form.html` and `admin-dashboard.html`.

## 📝 Notes

- These are **static HTML previews** (no real backend)
- Form submissions show alerts instead of sending data
- All interactions are JavaScript-based
- Suitable for UI/UX testing and stakeholder reviews
- Can be integrated with a real backend API

## 🤝 Contributing

To improve these previews:
1. Edit the HTML/CSS
2. Test in multiple browsers
3. Verify responsive design
4. Submit updates via pull request

## 📞 Support

For questions or issues:
- Check the main README.md
- Review component documentation
- Contact: isaacmunyua01@gmail.com

---

**Last Updated**: 2026-06-10
**Version**: 1.0.0
**Status**: Production Ready ✓
