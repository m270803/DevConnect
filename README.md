# DevConnect 🚀

### Connect. Collaborate. Create.

**A modern freelance service marketplace that connects clients with skilled professionals to turn ideas into reality.**

SkillConnect is a full-stack marketplace platform where clients can discover professionals, post projects, review proposals, manage contracts, track milestones, and collaborate through real-time messaging.

Whether you're looking for a developer to build your next application or you're a professional looking to showcase your expertise, SkillConnect brings the entire collaboration journey into one place.

---

## ✨ Key Features

### 👤 User Authentication & Profiles

- Secure registration and login.
- Role-based access for clients and professionals.
- Personalized user and professional profiles.
- Profile management and professional information.

### 💼 Project Marketplace

- Discover and explore available projects.
- Post projects with descriptions and requirements.
- Browse opportunities across multiple service categories.
- Submit and manage project proposals.

### 🤝 Contracts & Milestones

- Manage project agreements and contracts.
- Break projects into manageable milestones.
- Track project progress and completion.
- Keep client-professional collaboration organized.

### 💬 Real-Time Communication

- Real-time messaging using Socket.IO.
- Conversation management between project participants.
- Project-specific communication.
- Video calling functionality under development.

### 📝 Knowledge & Community

- Technology-focused blog platform.
- Share development insights and technical articles.
- Comment and interact with published content.

### 🛡️ Admin Dashboard

- Centralized administrative controls.
- Manage users and platform activity.
- Role-based administrative access.

---

## 🛠️ Tech Stack

| Layer           | Technologies                     |
| --------------- | -------------------------------- |
| Frontend        | Next.js, React, TypeScript       |
| Backend         | Node.js, Express.js              |
| Database        | MongoDB, Mongoose                |
| Real-Time       | Socket.IO                        |
| Authentication  | JWT, Cookie-based authentication |
| Styling         | Tailwind CSS                     |
| API Testing     | Postman                          |
| Version Control | Git, GitHub                      |

---

## 🏗️ Project Architecture

```text
SkillConnect/
│
├── client/
│   └── src/
│       ├── app/
│       │   ├── dashboard/
│       │   ├── projects/
│       │   ├── contracts/
│       │   └── messages/
│       │
│       ├── components/
│       └── lib/
│
├── server/
│   └── src/
│       ├── modules/
│       │   ├── users/
│       │   ├── professionalProfile/
│       │   ├── services/
│       │   ├── projects/
│       │   ├── proposals/
│       │   ├── contracts/
│       │   ├── milestones/
│       │   ├── conversations/
│       │   ├── messages/
│       │   ├── blog/
│       │   └── adminRole/
│       │
│       └── ...
│
└── README.md
```

---

## ⚙️ Getting Started

Follow these steps to run SkillConnect locally.

### 1. Clone the Repository

```bash
git clone YOUR_REPOSITORY_URL
cd SkillConnect
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_secret_at_least_32_characters
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend Setup

Open another terminal:

```bash
cd client
npm install
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

### 4. Open the Application

Visit:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:5000](http://localhost:5000)

*Note: Ensure your MongoDB database is running and configure environment variables according to your project setup.*

---

## 🔐 Security Considerations

SkillConnect is designed with security-conscious development practices:

- JWT-based authentication.
- HttpOnly cookie-based authentication.
- Role-based authorization.
- CSRF protection for state-changing API requests.
- Server-side validation of incoming data.
- Protected project conversations and messaging.

Never commit `.env` files, credentials, database connection strings, or JWT secrets to GitHub.

---

## 🗺️ Development Roadmap

- [x] Backend project structure and modular architecture
- [x] User registration and authentication
- [x] User profile management
- [x] Project management APIs
- [x] Proposal and contract workflows
- [x] Milestone management
- [x] Conversation and messaging functionality
- [x] Next.js frontend foundation
- [x] Complete real-time video calling
- [ ] File sharing and attachments
- [ ] Payment integration
- [ ] Advanced notifications
- [ ] Enhanced search and filtering

---

## 🎯 Vision

The goal of SkillConnect is to simplify how people find talent, collaborate on projects, and deliver meaningful work.

By bringing project discovery, professional networking, communication, and project management together, SkillConnect aims to create a more connected freelance ecosystem.

---

## 👨‍💻 Developed With Passion

**SkillConnect** — Built to connect skills with opportunities.

If you find this project interesting, consider giving the repository a ⭐ on GitHub!

---

*Made with ❤️ and a passion for building useful technology.*
