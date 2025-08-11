const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// --- MongoDB Connection ---
const mongoURI = 'mongodb://localhost:27017/user_registration_db'; // Your MongoDB URI

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose User Schema and Model ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true, trim: true },
  gender: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// --- Password Reset Token Schema and Model ---
const passwordResetTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: '1h' }
});
const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

// --- MongoDB Session Store ---
const store = new MongoDBStore({
  uri: mongoURI,
  collection: 'sessions',
  expires: 1000 * 60 * 60 * 24
});

store.on('error', function(error) {
  console.error('Session Store Error:', error);
});

// --- Express Session Middleware ---
app.use(session({
  secret: 'your_super_secret_key_for_sessions', // Replace with a strong, random string
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));
// Set the view engine to EJS
app.set('view engine', 'ejs');

// NEW: Custom Logging Middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// NEW: Input Sanitization Utility Function
function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// --- Authentication Middleware to protect routes ---
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next(); // User is authenticated, proceed
  } else {
    res.redirect('/login?error=Please log in to access this page.');
  }
};

// --- Routes ---
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('form', {
    errors: [],
    formData: {}
  });
});

app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('login', {
    errors: req.query.error ? [req.query.error] : [],
    formData: {}
  });
});

app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', {
        errors: [],
        formData: {}
    });
});

app.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    try {
        const resetToken = await PasswordResetToken.findOne({ token: token });
        if (!resetToken) {
            return res.render('reset-password', { errors: ['Invalid or expired password reset token.'], token: '' });
        }
        res.render('reset-password', { errors: [], token: token });
    } catch (error) {
        console.error("Error fetching reset token:", error);
        res.render('reset-password', { errors: ['An error occurred. Please try again.'], token: '' });
    }
});

app.get('/success', (req, res) => {
  const type = req.query.type;
  const username = req.query.username || 'User';
  const email = req.query.email || 'email@example.com';

  let title = 'Operation Successful!';
  let message = 'Your action was completed successfully.';

  if (type === 'register') {
    title = 'Registration Successful!';
    message = `Welcome, ${username}! Your email: ${email}`;
  } else if (type === 'login') {
    title = 'Welcome Back!';
    message = `Welcome back, ${username}!`;
  } else if (type === 'password-reset-sent') {
      title = 'Password Reset Link Sent!';
      message = 'Please check your email for the password reset link.';
  } else if (type === 'password-reset-success') {
      title = 'Password Reset Successful!';
      message = 'Your password has been successfully reset. You can now log in with your new password.';
  }

  res.render('result', {
    title: title,
    message: message,
    username: username,
    email: email
  });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', {
        username: req.session.user.username
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false, message: 'Could not log out.' });
        }
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    });
});


// --- API Endpoints ---
app.post('/api/register', async (req, res) => {
  let { username, email, phone, gender, password, confirmPassword, countryCode } = req.body;

  // NEW: Sanitize inputs
  username = escapeHtml(username);
  email = escapeHtml(email);
  phone = escapeHtml(phone);
  gender = escapeHtml(gender);
  // Passwords are hashed, so no HTML escaping needed directly, but trim is good
  password = password.trim();
  confirmPassword = confirmPassword.trim();

  const fullPhoneNumber = countryCode + phone;

  let errors = [];

  // Server-side Validation
  if (!username || !email || !phone || !gender || !password || !confirmPassword || !countryCode) {
    errors.push('All fields are required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Please enter a valid email address.');
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (phone && !phoneRegex.test(phone.replace(/[-\s()]/g, ''))) {
    errors.push('Please enter a valid 10-digit phone number (numbers only).');
  }

  const allowedGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
  if (gender && !allowedGenders.includes(gender)) {
    errors.push('Invalid gender selected.');
  } else if (!gender) {
    errors.push('Gender is required.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  const passwordStrengthRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{"':;?/>.<,])(?=.*[a-zA-Z]).{8,}$/;
  if (password && !passwordStrengthRegex.test(password)) {
    errors.push('Password must be at least 8 characters, include uppercase, lowercase, number, and special character.');
  }

  // Check if username, email, or phone already exists in MongoDB
  try {
      const existingUserByUsername = await User.findOne({ username: username });
      if (existingUserByUsername) {
          errors.push('Username already taken.');
      }

      const existingUserByEmail = await User.findOne({ email: email });
      if (existingUserByEmail) {
          errors.push('Email already registered.');
      }

      const existingUserByPhone = await User.findOne({ phone: fullPhoneNumber });
      if (existingUserByPhone) {
          errors.push('Phone number already registered.');
      }

  } catch (error) {
      console.error("Error checking existing users in MongoDB:", error);
      errors.push("Server error during registration. Please try again.");
  }


  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors: errors });
  } else {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            email,
            phone: fullPhoneNumber,
            gender,
            password: hashedPassword
        });

        await newUser.save();
        console.log('New user registered and saved to MongoDB:', newUser.username);

        return res.status(200).json({ success: true, message: 'Registration successful!', user: { username, email } });
    } catch (error) {
        console.error("Error saving user to MongoDB or hashing password:", error);
        // NEW: More granular error handling for MongoDB specific errors
        if (error.code === 11000) { // MongoDB duplicate key error code
            let duplicateField = Object.keys(error.keyValue)[0];
            errors.push(`${duplicateField.charAt(0).toUpperCase() + duplicateField.slice(1)} '${error.keyValue[duplicateField]}' is already registered.`);
            return res.status(400).json({ success: false, errors: errors });
        }
        if (error.name === 'ValidationError') {
            const validationErrors = Object.keys(error.errors).map(key => error.errors[key].message);
            return res.status(400).json({ success: false, errors: validationErrors });
        }
        return res.status(500).json({ success: false, errors: ['Server error during registration. Please try again.'] });
    }
  }
});

app.post('/api/login', async (req, res) => {
    let { username, password } = req.body; // Use let for sanitization

    // NEW: Sanitize username for login (password is compared, not stored directly)
    username = escapeHtml(username);
    password = password.trim(); // Trim password, but don't escape as it's for comparison

    let errors = [];
    let foundUser;

    if (!username || !password) {
        errors.push('Username and password are required.');
    }

    try {
        foundUser = await User.findOne({ username: username });

        if (!foundUser) {
            errors.push('Invalid username or password.');
        } else {
            const passwordMatch = await bcrypt.compare(password, foundUser.password);

            if (!passwordMatch) {
                errors.push('Invalid username or password.');
            }
        }
    } catch (error) {
        console.error("Error during login query or password comparison:", error);
        errors.push("Server error during login. Please try again.");
    }

    if (errors.length > 0) {
        return res.status(401).json({ success: false, errors: errors });
    } else {
        req.session.user = {
            id: foundUser._id,
            username: foundUser.username,
            email: foundUser.email
        };
        return res.status(200).json({ success: true, message: 'Login successful!', user: { username: foundUser.username } });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    let { email } = req.body; // Use let for sanitization
    email = escapeHtml(email); // Sanitize email

    let errors = [];

    if (!email) {
        errors.push('Email is required.');
    }

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            console.log(`Password reset requested for non-existent email: ${email}`);
            return res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const resetToken = new PasswordResetToken({
            userId: user._id,
            token: token
        });
        await resetToken.save();

        const resetLink = `http://localhost:${PORT}/reset-password/${token}`;
        console.log(`\n--- SIMULATED EMAIL ---`);
        console.log(`To: ${user.email}`);
        console.log(`Subject: Password Reset Request`);
        console.log(`Body: Click this link to reset your password: ${resetLink}`);
        console.log(`--- END SIMULATED EMAIL ---\n`);

        return res.status(200).json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error("Error in forgot password process:", error);
        return res.status(500).json({ success: false, errors: ['Server error. Please try again.'] });
    }
});

app.post('/api/reset-password', async (req, res) => {
    let { token, password, confirmPassword } = req.body; // Use let for sanitization

    // Sanitize token (though it's generated by us, good practice if it came from user input)
    token = escapeHtml(token);
    password = password.trim();
    confirmPassword = confirmPassword.trim();

    let errors = [];

    if (!token || !password || !confirmPassword) {
        errors.push('All fields are required.');
    }

    if (password !== confirmPassword) {
        errors.push('Passwords do not match.');
    }

    const passwordStrengthRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{"':;?/>.<,])(?=.*[a-zA-Z]).{8,}$/;
    if (password && !passwordStrengthRegex.test(password)) {
        errors.push('Password must be at least 8 characters, include uppercase, lowercase, number, and special character.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors: errors });
    }

    try {
        const resetToken = await PasswordResetToken.findOne({ token: token });

        if (!resetToken) {
            return res.status(400).json({ success: false, errors: ['Invalid or expired password reset token.'] });
        }

        const user = await User.findById(resetToken.userId);
        if (!user) {
            return res.status(404).json({ success: false, errors: ['User not found.'] });
        }

        user.password = await bcrypt.hash(password, saltRounds);
        await user.save();

        await resetToken.deleteOne();

        return res.status(200).json({ success: true, message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ success: false, errors: ['Server error resetting password. Please try again.'] });
    }
});

// Protected API endpoint for weather data with caching
const weatherCache = {}; // Simple in-memory cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

app.get('/api/user-weather', isAuthenticated, async (req, res) => {
    const city = 'London'; // Fixed city for demonstration
    const cacheKey = `weather-${city}`;

    // Check cache first
    if (weatherCache[cacheKey] && (Date.now() - weatherCache[cacheKey].timestamp < CACHE_DURATION)) {
        console.log(`${req.method} ${req.originalUrl} - Serving weather for ${city} from cache.`);
        return res.json({ success: true, weather: weatherCache[cacheKey].data, cached: true });
    }

    // Simulate fetching real weather data (or call external API here)
    const weatherConditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy', 'Foggy', 'Snowy'];
    const randomTemp = Math.floor(Math.random() * (35 - 15 + 1)) + 15;
    const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const randomHumidity = Math.floor(Math.random() * (90 - 40 + 1)) + 40;
    const randomWind = Math.floor(Math.random() * (20 - 5 + 1)) + 5;

    const weatherData = {
        city: req.session.user.username ? `${req.session.user.username}'s City` : city,
        temperature: `${randomTemp}°C`,
        condition: randomCondition,
        humidity: `${randomHumidity}%`,
        windSpeed: `${randomWind} km/h`
    };

    // Store in cache
    weatherCache[cacheKey] = {
        data: weatherData,
        timestamp: Date.now()
    };
    console.log(`${req.method} ${req.originalUrl} - Fetched and cached weather for ${city}.`);
    res.json({ success: true, weather: weatherData, cached: false });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Registration form: http://localhost:${PORT}`);
  console.log(`Login form: http://localhost:${PORT}/login`);
  console.log(`Forgot Password: http://localhost:${PORT}/forgot-password`);
  console.log(`Success page: http://localhost:${PORT}/success`);
  console.log(`Protected Dashboard: http://localhost:${PORT}/dashboard`);
});
