/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  safelist: [
    "bg-primary", "bg-secondary", "bg-background", "bg-panel", "bg-border", "bg-selected", "bg-sidebarbg",
    "text-primary", "text-secondary", "text-heading", "text-body", "text-muted", "text-sidebartext", "text-success", "text-error", "text-draft",
    "border-primary", "border-secondary", "border-border", "border-error", "border-success", "border-draft",
    "hover:bg-primary/90", "hover:bg-secondary/90", "hover:bg-selected", "hover:bg-panel", "hover:bg-error/10", "hover:bg-success/10"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2C7A7B',
        secondary: '#F4A261',
        background: '#F9FAFB',
        panel: '#FFFFFF',
        border: '#E5E7EB',
        heading: '#1F2937',
        body: '#4B5563',
        muted: '#9CA3AF',
        success: '#38A169',
        error: '#E53E3E',
        draft: '#CBD5E1',
        selected: '#F0FFF4',
        sidebarbg: '#F9FAFB',
        sidebartext: '#1F2937',
      },
    },
  },
  plugins: [],
} 