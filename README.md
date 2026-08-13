# News-Aggregator

### Overview
A news aggregator built with vanilla JavaScript on the frontend and Cloudflare Workers on the backend. It fetches news from NewsData.io API with category filtering, search, and infinite scroll.

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

### Backend
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat&logo=cloudflare&logoColor=white)

## Features

- Live news headlines from NewsData.io
- Category filtering (World, Business, Tech, Science, Sports, etc.)
- Search functionality
- Infinite scroll pagination
- Featured story highlight
- Rate limiting (15 requests per minute)
- CORS protection
- Responsive design

---

## Project Structure

news-aggregator/
├── index.html
├── script.js
├── style.css
├── worker.js  # Cloudflare Worker (backend)
├── assets/
│   └── media/
│       └── news-placeholder.jpg  # Fallback image
└── README.md
