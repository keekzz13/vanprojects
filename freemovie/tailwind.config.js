module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        'bg': '#1a1a1a',
        'sidebar': '#2a2a2a',
        'text': '#ffffff',
        'accent': '#ff4e50',
        'card': '#333333',
        'border': '#444444',
      },
      boxShadow: {
        'card': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'float': '0 10px 20px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'float': 'float 6s infinite ease-in-out',
        'fadeIn': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
