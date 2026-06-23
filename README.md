# E-Shop API

A full-featured RESTful e-commerce API built with **NestJS**, **MongoDB**, and **TypeScript**. It powers a complete online store backend — authentication, product catalog, cart, orders, wishlist, and an admin analytics dashboard.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black?style=flat&logo=jsonwebtokens)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [API Overview](#api-overview)
- [Authentication & Authorization](#authentication--authorization)
- [Scripts](#scripts)

---

## Features

- 🔐 **Authentication** — JWT access/refresh token flow, Google OAuth 2.0 login, password reset via email verification code
- 🛡️ **Role-Based Access Control** — `Public`, `User`, and `Admin` route guards via custom decorators
- 📦 **Product Catalog** — full CRUD with image upload (cover + gallery), filtering, sorting, pagination, search, tags, and featured/status flags
- 🗂️ **Categories, Sub-Categories & Brands** — admin-managed taxonomy with Cloudinary image uploads
- 🛒 **Shopping Cart** — add/update/remove items, quantity & color variants, coupon application
- 📬 **Orders** — cash orders and Stripe checkout sessions, order status tracking (paid / delivered)
- ❤️ **Wishlist** — per-user saved products
- ⭐ **Reviews & Ratings** — product reviews with auto-calculated average ratings
- 🎟️ **Coupons** — admin-managed discount codes with expiry validation
- 📊 **Admin Dashboard** — revenue, sales trends, top products/categories, user growth, recent orders/users
- 🖼️ **Cloudinary Integration** — centralized image upload service used across products, categories, brands, and avatars
- 📘 **Swagger Documentation** — fully documented, interactive API explorer

---

## Tech Stack

| Layer            | Technology                                   |
| ----------------- | --------------------------------------------- |
| Framework         | [NestJS](https://nestjs.com/)                 |
| Database           | MongoDB + [Mongoose](https://mongoosejs.com/) |
| Authentication     | Passport.js (JWT + Google OAuth 2.0)          |
| Validation         | class-validator / class-transformer            |
| File Storage       | Cloudinary                                     |
| Payments           | Stripe                                         |
| API Docs           | Swagger (OpenAPI)                              |
| Language           | TypeScript                                     |

---

## Project Structure

```
src/
├── auth/                  # JWT strategies, guards, decorators (Public, Roles)
├── common/                 # Shared interfaces (ApiResponse, JwtPayload)
├── models/
│   ├── users/               # User CRUD + self-service profile (/userMe)
│   ├── products/             # Product catalog
│   ├── categories/           # Categories
│   ├── sub-categories/        # Sub-categories
│   ├── brands/                # Brands
│   ├── cart/                  # Shopping cart
│   ├── orders/                 # Orders (cash + Stripe)
│   ├── wishlist/               # User wishlist
│   ├── review/                 # Product reviews
│   ├── coupons/                 # Discount coupons
│   └── uploads/                  # Cloudinary upload service
├── dashboard/               # Admin analytics & statistics
└── main.ts                  # App bootstrap, global pipes, Swagger setup
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- A Cloudinary account
- A Google Cloud OAuth client (for social login)
- A Stripe account (for card payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/e-shop-api.git
cd e-shop-api

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Run in development mode
npm run start:dev
```

The API will be available at `http://localhost:8000`, and Swagger docs at `http://localhost:8000/api`.

---

## Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Server
PORT=8000

# Database
MONGODB_URI=mongodb://localhost:27017/e-shop

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key

# Frontend (used for OAuth redirects)
FRONTEND_URL=http://localhost:3000
```

> ⚠️ Never commit your real `.env` file. It is already excluded via `.gitignore`.

---

## API Documentation

Once the server is running, interactive Swagger documentation is available at:

```
http://localhost:8000/api
```

It includes every endpoint, request/response schemas, and a built-in "Try it out" feature for testing requests directly from the browser (with Bearer token auth support).

---

## API Overview

| Module           | Base Route          | Description                                      |
| ----------------- | -------------------- | ------------------------------------------------- |
| Auth               | `/api/v1/auth`         | Signup, login, Google OAuth, password reset       |
| Users               | `/api/v1/users`         | Admin user management                             |
| User — Me           | `/api/v1/userMe`        | Self-service profile, avatar upload               |
| Categories           | `/api/v1/categories`     | Category CRUD with image upload                   |
| Sub-Categories         | `/api/v1/subCategories`  | Sub-category CRUD                                  |
| Brands                  | `/api/v1/brands`         | Brand CRUD                                          |
| Products                 | `/api/v1/products`       | Product catalog, filtering, search, pagination       |
| Cart                       | `/api/v1/cart`            | Add/update/remove items, apply coupon                 |
| Orders                       | `/api/v1/orders`           | Cash orders, Stripe checkout, order status               |
| Wishlist                       | `/api/v1/wishlist`          | Add/remove favorite products                              |
| Reviews                         | `/api/v1/review`             | Product reviews & ratings                                   |
| Coupons                           | `/api/v1/coupons`             | Admin discount code management                                |
| Dashboard                           | `/api/v1/dashboard`            | Revenue, sales trends, top products, user growth                |

Full request/response details are available in Swagger.

---

## Authentication & Authorization

The API uses a **dual JWT strategy**:

- **Access Token** — short-lived, sent as a `Bearer` token in the `Authorization` header
- **Refresh Token** — long-lived, stored in an `HttpOnly` cookie, used to silently renew access tokens

Routes are protected using custom decorators:

```ts
@Public()                          // skips authentication entirely
@Roles(UserRole.ADMIN)             // requires authentication + admin role
@Roles(UserRole.USER, UserRole.ADMIN) // any authenticated user
```

Google OAuth 2.0 is supported as an alternative login flow — successful authentication redirects to the frontend with a token appended to the URL.

---

## Scripts

| Command               | Description                          |
| ----------------------- | ------------------------------------- |
| `npm run start:dev`        | Run in watch mode (development)        |
| `npm run build`            | Compile TypeScript to `dist/`           |
| `npm run start:prod`        | Run the compiled production build        |
| `npm run lint`               | Run ESLint                                |
| `npm run test`                 | Run unit tests                              |

---

## License

This project is for educational and portfolio purposes.
