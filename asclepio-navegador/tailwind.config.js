/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Polar Official Brand Colors
        polarBlue: '#01BAEF',
        polarBlueHover: '#38C9F2',
        polarCyan: '#01BAEF',
        polarCyanHover: '#38C9F2',
        polarAccent: '#E07B9C', // Subagent soft rose
        
        // Polar Dark Canvas
        polarDarkCanvas: '#222222',
        polarDarkApp: '#1A1A1A',
        polarDarkBorder: '#303030',
        polarDarkBubble: '#282828',

        // Polar Light Canvas
        polarLightCanvas: '#FFFFFF',
        polarLightSurface: '#F8F9FA',
        polarLightBorder: '#E5E7EB',
        polarLightBubble: '#F3F4F6',

        // Standard App UI Aliases
        sidebarBg: '#F8F9FA',
        sidebarBorder: '#E5E7EB',
        sidebarHover: '#F0F0F2',
        sidebarActive: '#EAEBEF',
        cardBorder: '#E5E7EB',
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        textMuted: '#9CA3AF',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
