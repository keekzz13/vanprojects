module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        'dark': '#0F1419',
        'sidebar': '#1a1f2b',
        'text': '#ffffff',
        'teal': '#00C7B7',
        'teal-dark': '#00a69e',
        'gray-300': '#d1d5db',
        'gray-400': '#9ca3af',
        'gray-600': '#4b5563',
        'gray-700': '#374151',
        'gray-800': '#1f2937',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
