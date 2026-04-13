import { DocPage } from "../index";

const page: DocPage = {
  slug: "dark-mode",
  title: "Dark Mode",
  description: "Theme customization, dark mode support, and accessibility features.",
  category: "features",
  order: 13,
  lastUpdated: "2026-04-10",
  tags: ["dark-mode", "theme", "accessibility", "ui"],
  readingTime: 3,
  body: `
## Dark Mode

MatCraft supports a full dark mode theme that applies to every page, component, and visualization across the platform.

### Toggling Dark Mode

Click the sun/moon icon in the top navigation bar to toggle between light and dark themes. Your preference is saved in local storage and persists across sessions.

### System Preference Detection

By default, MatCraft respects your operating system's color scheme preference. If your OS is set to dark mode, MatCraft will automatically start in dark mode on first visit. You can override this by manually toggling the theme.

### Theme Details

The dark theme uses carefully chosen colors optimized for readability and reduced eye strain:

- **Background**: Deep slate (#0f172a) rather than pure black, reducing contrast harshness
- **Text**: Light gray (#e2e8f0) for body text, white for headings
- **Accents**: Adjusted saturation levels to maintain vibrancy without causing glare
- **Borders**: Subtle dark gray borders that provide structure without visual noise

### Visualization Themes

All charts and plots automatically adapt to the active theme:

- **Scatter plots**: Dark background with brighter data point colors
- **Band structure / DOS**: Inverted color scheme with light lines on dark background
- **Phase diagrams**: Adjusted convex hull colors for dark background contrast
- **3D viewer**: The crystal structure viewer uses a dark gray background in dark mode

### Accessibility

MatCraft's theme system is designed with accessibility in mind:

- **WCAG AA compliance**: All text maintains a minimum 4.5:1 contrast ratio in both themes
- **Color-blind safe palettes**: Default chart color schemes avoid red-green conflicts
- **Keyboard navigation**: All interactive elements are keyboard-accessible
- **Screen reader support**: ARIA labels on all interactive components

### API and Embeds

If you embed MatCraft components in your own application, you can programmatically set the theme:

\`\`\`javascript
// Force dark mode in embedded viewer
const viewer = new MatCraftViewer({
  containerId: "my-viewer",
  materialId: "mp-149",
  theme: "dark"
});
\`\`\`
`,
};

export default page;
