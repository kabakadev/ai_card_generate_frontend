<h1 align="center">FlashLearn Frontend</h1>

## 👤 Authors

- **Ian Kabaka**
- Team Members: **Kabakadev**, **OumaMichael**, **Psychedelic-313**

## 📝 Description

This repository contains the **frontend** of Flashlearn - **React frontend** with a **Flask REST API backend**. It allows users to create decks, manage flashcards, track study progress, and even generate AI-powered flashcards. With a **freemium model** (an upcoming feature that will grant the user 5 free AI generations per month) and seamless **M-Pesa (IntaSend)** subscription payments (a feature that's currently being implemented), FlashLearn is built to enhance learning for students and lifelong learners alike.

---

## 📦 Project Showcase

- **Pitch Deck**: [View PDF](https://gamma.app/docs/Flashlearn-66x4z7ri3qptyf1)
- **Deployed Website**: [Visit Site](https://aiflashcard254.netlify.app/)
- **Live Demo Video**: [Watch Video](https://youtu.be/vSqeCP2co_M)
- **Backend repository**: [Visit Repository](https://github.com/kabakadev/ai_card_generate_backend)
- **Backend Render**: [Visit URL](https://ai-card-generate-backend.onrender.com/)

---

## ✨ Features

- **User Authentication** (Sign in, Login, JWT session storage)
- **Deck Management** (create, edit, delete decks)
- **Flashcard Management** (add, edit, delete flashcards)
- **Dashboard & Statistics**
- **AI FlashCard Generation** (freemium + paid subscription)
- **Light and Dark Mode Toggle**
- **Responsive Design for Seamless Use Across Devices**

---

## 💻 Tech Stack

- **React** - Frontend framework
- **Material UI** - Component library
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Tailwind CSS** - Minimal styling
- **Vite** - Development bundler

---

## ⚙️ Installation & Setup

### 📋 Prerequisites

Before using FlashLearn, ensure you have the following:

- **Basic Computer Skills**
- **An Operating System Installed** (Windows, macOS, or Linux)
- **Node.js and npm Installed** (for local setup)
- **Git**

To install and run FlashLearn locally, follow these steps:

```
git clone <repo-url>
cd ai_card_generate_frontend
npm install
npm run dev -- --open

```
This starts the development server (default: http://localhost:5173)

---

## 📎 API Integration

The frontend connects to the Flask backend for:
- **Authentication** (`/signup`, `/login`, `/user`)
- **Decks & Flashcards** (`/decks`, `/flashcards`)

---

## 💳 Billing & Freemium (Upcoming Feature)

- Users get **5 free AI flashcard generations/month**.
- An **Upgrade** button in the **NavBar** will open the Billing modal.
- The upgrade price will be KES 100/month
- The **Billing Page** will show:

    - Subscription status
    - Free prompts remaining
    - Payment call-to-action 

- Payments will be handled by **Mpesa (IntaSend Hosted Checkout)**.
- **Note**: This feature is upcoming and is still being implemented.

---

## 📞 Support & Contact

For support or inquiries, feel free to reach out:

- ✉️ **Email:** [franklinphilip81@gmail.com](mailto:franklinphilip81@gmail.com)
- ✉️ **Email:** [iankabaka1@gmail.com](mailto:iankabaka1@gmail.com)
- ✉️ **Email:** [oumamichael108@gmail.com](mailto:oumamichael108@gmail.com)

---

## 📄 License

This project is licensed under the MIT License 

Built with ❤️ by the 3 Members

