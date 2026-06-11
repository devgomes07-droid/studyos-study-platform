# StudyOS — Intelligent Study Management Platform

<div align="center">

![StudyOS](https://img.shields.io/badge/StudyOS-Study%20Platform-6c5ce7?style=for-the-badge&logo=bookstack&logoColor=white)
![Java](https://img.shields.io/badge/Java%2021-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot%203.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

**A gamified, science-backed study platform designed to turn daily learning into an RPG-style progression experience.**

[🚀 Live Demo](https://studyos-study-platform-production.up.railway.app) · [📁 Repository](https://github.com/devgomes07-droid/studyos-study-platform) · [🐛 Report Bug](https://github.com/devgomes07-droid/studyos-study-platform/issues)

</div>

---


## ✨ Features

### 🎮 Gamification
- XP system with 6 levels (Beginner → Legendary)
- Daily study streaks
- 32 unlockable achievement badges
- Overall score and 10 skill ratings per user
- Level-up progression with XP bar

### 📚 Study Methods
- **12 scientifically-backed methods**: Pomodoro, Feynman, Active Recall, Spaced Repetition, Cornell Notes, Flow State, Mind Mapping, SQ3R, Interleaving, Elaborative Interrogation, Retrieval Practice, and Blurting
- Per-method session tracking with duration, XP earned, and completion status
- Fullscreen mode for Flow State sessions

### 🃏 Flashcards
- Create and manage flashcard decks per subject
- SM-2 spaced repetition algorithm for optimized review scheduling
- Due flashcard queue with quality-based review feedback

### 📊 Dashboard & Analytics
- Study session history with method, duration, and XP breakdown
- Subject performance overview
- Recent activity feed
- User profile with stats: total hours, sessions, streak, subjects, flashcards, XP

### 🔐 Authentication
- JWT-based stateless authentication
- Secure password hashing with BCrypt
- Register, login, and forgot-password flows
- Session persistence with localStorage

### 🌗 UI/UX
- Dark / Light theme toggle (persisted across sessions)
- Collapsible sidebar with tooltip support
- Fully responsive (desktop, notebook, mobile)
- Loading screen with animated progress bar
- Toast notifications for badge unlocks
- Terms of Use and Privacy Policy pages (LGPD compliant)

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Core language |
| Spring Boot | 3.5 | Application framework |
| Spring Security | 6 | Authentication & authorization |
| Spring Data JPA | 3.5 | ORM & database abstraction |
| Hibernate | 6.6 | JPA implementation |
| PostgreSQL | 18 | Relational database |
| JWT (jjwt) | 0.12.3 | Stateless token authentication |
| Lombok | 1.18.46 | Boilerplate reduction |
| Maven | 3.9 | Build & dependency management |

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 / CSS3 | Structure & styling |
| Vanilla JavaScript | Interactivity & API integration |
| Inter + Instrument Serif | Typography |
| CSS Custom Properties | Theming system (dark/light) |

### Infrastructure
| Service | Purpose |
|---|---|
| Railway | Cloud deployment & hosting |
| PostgreSQL (Railway) | Managed database |
| Docker | Containerized build |
| GitHub | Version control & CI/CD trigger |

---

## 🗂️ Project Structure

```
studyos-api/
├── src/
│   ├── main/
│   │   ├── java/com/studyos/studyos_api/
│   │   │   ├── config/          # Security, CORS, resource handlers
│   │   │   ├── controller/      # REST API endpoints
│   │   │   ├── dto/             # Request/Response objects
│   │   │   ├── entity/          # JPA entities
│   │   │   ├── repository/      # Spring Data repositories
│   │   │   ├── security/        # JWT filter & auth logic
│   │   │   └── service/         # Business logic
│   │   └── resources/
│   │       ├── static/          # Frontend (HTML, CSS, JS, assets)
│   │       │   ├── index.html   # Login / Register page
│   │       │   ├── pages/       # Dashboard, subjects, flashcards, profile...
│   │       │   ├── css/         # Stylesheets
│   │       │   ├── js/          # Scripts
│   │       │   └── assets/      # Logo, icons
│   │       └── application.properties
├── Dockerfile
└── pom.xml
```

---

## 🚀 Getting Started

### Prerequisites
- Java 21+
- Maven 3.9+
- PostgreSQL 14+

### Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/devgomes07-droid/studyos-study-platform.git
cd studyos-study-platform/studyos-api

# 2. Configure environment variables
# Create application-local.properties or set as environment variables:
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/studyos
SPRING_DATASOURCE_USERNAME=your_user
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
RESEND_API_KEY=your_resend_key
FRONTEND_URL=http://localhost:8080

# 3. Run the application
mvn spring-boot:run

# 4. Access the platform
open http://localhost:8080
```

### Docker

```bash
docker build -t studyos .
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/studyos \
  -e SPRING_DATASOURCE_USERNAME=user \
  -e SPRING_DATASOURCE_PASSWORD=pass \
  -e JWT_SECRET=secret \
  studyos
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/forgot-password` | Send password reset email |

### Subjects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/subjects` | List all subjects |
| POST | `/api/subjects` | Create subject |
| PUT | `/api/subjects/:id` | Update subject |
| DELETE | `/api/subjects/:id` | Soft delete subject |

### Study Sessions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sessions/start` | Start a study session |
| POST | `/api/sessions/:id/finish` | Finish a session |
| GET | `/api/sessions` | Get session history |

### Flashcards
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/flashcards` | List flashcards |
| GET | `/api/flashcards/due` | Get due flashcards |
| POST | `/api/flashcards` | Create flashcard |
| POST | `/api/flashcards/:id/review` | Submit SM-2 review |
| DELETE | `/api/flashcards/:id` | Delete flashcard |

---

## 🗺️ Roadmap

- [ ] AI-personalized study plans (Anthropic API integration)
- [ ] Mobile app (React Native)
- [ ] Social features — study groups and leaderboards
- [ ] Push notifications for streak reminders
- [ ] Export study reports as PDF
- [ ] Public API for third-party integrations

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 👤 Author

**Gabriel Gomes** — [@devgomes07-droid](https://github.com/devgomes07-droid)

> *"Small daily actions generate great results."*

---

