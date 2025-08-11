
## 📌 Overview

This project was developed as part of my **Cognifyz Full Stack Development Internship** to explore and demonstrate end-to-end web application development. The portal enables users to register, log in, reset passwords, and access a dynamic dashboard with real-time features.

It combines **modern UI design**, **secure backend development**, and **smooth client-server interaction** to deliver a complete user management system.

---

## ✨ Key Features

### 🖥 Frontend Highlights

* **Responsive Design** – Works seamlessly across desktops, tablets, and mobile devices.
* **Interactive Forms** – Real-time validation for usernames, emails, and phone numbers.
* **Smooth User Onboarding** – Guided sign-up process with instant feedback.

### 🔒 Security

* **Password Hashing** – Uses bcrypt for secure password storage.
* **Session Management** – Maintains secure user sessions with `express-session` & `connect-mongodb-session`.
* **Server-side Sanitization** – Protects against XSS and other injection attacks.

### 🛠 Backend Features

* **Dynamic Fetch API Calls** – No page reloads; all form submissions and data updates happen asynchronously.
* **Weather API Integration** – Personalized dashboard includes real-time local weather (cached for performance).
* **Request Logging & Caching** – Tracks server interactions and optimizes repeated data requests.

---

## 🧰 Tech Stack

**Frontend:**

* HTML5, CSS3 (custom styling & animations), JavaScript (ES6+)
* EJS templating for dynamic page rendering

**Backend:**

* Node.js, Express.js
* MongoDB with Mongoose ORM
* bcrypt, express-session, connect-mongodb-session, crypto

**Tools & Workflow:**

* Git & GitHub for version control
* MongoDB Atlas / Local MongoDB

---

## 🚀 Getting Started

### 1️⃣ Prerequisites

* **Node.js** (with npm) → [Download Here](https://nodejs.org)
* **MongoDB**

  * **Local:** Install MongoDB Community Server and run `mongod`
  * **Cloud:** Create a free MongoDB Atlas account and get your connection URI

### 2️⃣ Clone the Repository

```bash
git clone https://github.com/Misterious0572/CognifyzInternshipProject.git
cd CognifyzInternshipProject
```

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Configure Database Connection

In `app.js`, update your `mongoURI` variable:

```javascript
const mongoURI = 'mongodb://localhost:27017/user_registration_db';
// OR (for MongoDB Atlas)
const mongoURI = 'mongodb+srv://<username>:<password>@<cluster-url>/user_registration_db';
```

### 5️⃣ Start the Application

```bash
node app.js
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
CognifyzInternshipProject/
│
├── public/              # Static assets (CSS, JS, images)
│   ├── css/              # Stylesheets
│   └── js/               # Client-side scripts
├── views/               # EJS templates
├── app.js               # Main server file
├── package.json         # Project metadata & dependencies
└── package-lock.json    # Dependency lock file
```

---

## 🔮 Future Enhancements

* Email-based password reset using **Nodemailer**
* Editable user profiles
* **JWT-based authentication** or 2FA
* Integration with more live APIs
* Deployment to a cloud hosting service

---

## 📜 License

This project is open-sourced under the **MIT License**. You are free to use, modify, and distribute it.

---

If you’d like, I can also make a **visually enhanced version** with badges, section dividers, and screenshots to make your GitHub page look more professional. That way, your project will stand out to recruiters.

Do you want me to prepare that **visually enhanced README** next?
