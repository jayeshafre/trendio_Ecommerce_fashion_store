# Trendio

Trendio is a full-stack e-commerce platform for fashion retail — React on the
frontend, Django REST Framework for the core API, and a FastAPI microservice
for AI-powered features (semantic product search, similar-product
recommendations, and a shopping assistant chat widget).

**🔗 Live Demo:** [trendio-ecommerce-fashion-store.vercel.app](https://trendio-ecommerce-fashion-store.vercel.app/)

---

## Tech Stack

| Layer            | Technology                                      |
|-------------------|--------------------------------------------------|
| Frontend          | React 18, Vite, Tailwind CSS, Zustand, React Query |
| Backend API       | Django, Django REST Framework, Celery            |
| AI / Microservices| FastAPI                                          |
| Database          | PostgreSQL                                       |
| Payments          | Razorpay                                         |
| Containerization  | Docker, Docker Compose                           |

---

## Features

- **Storefront** — browsable catalog with category/size/color/price filters,
  AI-powered semantic search, and product recommendations
- **Product details** — image gallery, variant (size/color) selection,
  reviews & ratings
- **Cart & Checkout** — persistent cart, address management, Razorpay
  payment integration, order confirmation
- **Account** — order history & tracking, saved addresses, wishlist,
  profile & security settings
- **Notifications** — real-time order/payment status updates
- **Admin Panel** — dashboard with revenue analytics, order management with
  status-transition validation, product & bulk CSV upload, review
  moderation, user management
- **Fully responsive** — every page (storefront, account, checkout, and
  admin) is built to work across mobile, tablet, laptop, and desktop
  breakpoints

---

## Project Structure

```
trendio/
├── backend/
│   ├── apps/              # Django apps: cart, orders, payments, products, reviews, users, notifications
│   ├── config/             # Django settings (base/dev/prod), URLs, Celery, WSGI/ASGI
│   ├── services/            # Shared service layer (email, orders, payments)
│   ├── docker/              # Backend Dockerfile + entrypoint
│   └── requirements/        # base / dev / prod dependency sets
│
└── frontend/
    ├── src/
    │   ├── api/              # Axios API clients per domain
    │   ├── components/       # Reusable UI components (product, cart, layout, admin, ai, ui)
    │   ├── hooks/             # React Query hooks per domain
    │   ├── pages/              # Route-level pages (shop, account, admin, auth)
    │   ├── routes/              # Router configuration
    │   ├── store/                # Zustand stores (auth, cart, orders, wishlist)
    │   └── utils/                  # Shared helpers
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Python 3.11+ and [Poetry](https://python-poetry.org/)
- Node.js 18+ and npm
- PostgreSQL
- Docker & Docker Compose (optional, for containerized setup)

### Backend Setup

```bash
cd backend
poetry install
cp .env.example .env        # fill in your DB, secret key, Razorpay, etc.
poetry run python manage.py migrate
poetry run python manage.py createsuperuser
poetry run python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env         # set VITE_API_BASE_URL, etc.
npm run dev
```

### Docker (backend)

```bash
cd backend
docker-compose up --build
```

---

## Environment Variables

Each app has an `.env.example` file — copy it to `.env` and fill in your own
values. At minimum you'll need:

**Backend**
- `SECRET_KEY`
- `DATABASE_URL`
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
- `CELERY_BROKER_URL`

**Frontend**
- `VITE_API_BASE_URL`

---

## Available Scripts

**Frontend** (`frontend/package.json`)
| Command           | Description                     |
|--------------------|----------------------------------|
| `npm run dev`       | Start the Vite dev server        |
| `npm run build`      | Production build                 |
| `npm run lint`        | Run ESLint                       |

**Backend**
| Command                                    | Description                |
|----------------------------------------------|------------------------------|
| `poetry run python manage.py runserver`         | Start the Django dev server  |
| `poetry run python manage.py test`                | Run the test suite           |
| `poetry run celery -A config worker -l info`        | Start the Celery worker      |

---

## Responsiveness

The frontend is built mobile-first and tested across five breakpoint tiers:
mobile (320–480px), large phones (481–767px), tablets (768–1023px), laptops
(1024–1439px), and desktop/ultra-wide (1440px+). Admin panels use a
collapsible sidebar drawer below 768px, and data tables switch to a
card-based layout below 1024px where fixed-column layouts stop fitting.

---

## Contributing

1. Fork the repo and create a feature branch
2. Make your changes, following the existing code style
3. Open a pull request with a clear description of the change

---

## License

_Add your license here (e.g. MIT, proprietary)._
