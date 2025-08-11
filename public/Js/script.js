// Get all password toggle spans
const togglePasswordSpans = document.querySelectorAll('.toggle-password'); // Select all toggle spans

// Get form and input elements for validation
const registrationForm = document.getElementById('registrationForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const countryCodeSelect = document.getElementById('countryCode');
const genderSelect = document.getElementById('gender');
const submitButton = document.getElementById('submitButton');

// Get the global error display div
const globalErrorsDiv = document.getElementById('globalErrors');
const serverErrorDisplay = document.getElementById('serverErrorDisplay');

// Object to keep track of validation status for each field
const validationStatus = {
  username: false,
  email: false,
  phone: false,
  gender: false,
  password: false,
  confirmPassword: false
};

// Map of error messages for each field
const errorMessages = {
  username: {
    required: 'Username is required.',
    invalid: 'Username is required.',
    exists: 'Username is already taken.'
  },
  email: {
    required: 'Email is required.',
    invalid: 'Please enter a valid email address.',
    exists: 'Email is already registered.'
  },
  phone: {
    required: 'Phone number is required.',
    invalid: 'Please enter a valid 10-digit phone number (numbers only).',
    exists: 'Phone number is already registered.'
  },
  gender: {
    required: 'Please select your gender.',
    invalid: 'Please select your gender.'
  },
  password: {
    required: 'Password is required.',
    invalid: 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special.'
  },
  confirmPassword: {
    required: 'Confirm password is required.',
    invalid: 'Passwords do not match.'
  }
};

// --- Helper function to update input styles (CSS classes) ---
function updateInputUI(inputElement, isValid) {
  inputElement.classList.remove('is-invalid', 'is-valid');
  if (isValid) {
    inputElement.classList.add('is-valid');
  } else {
    inputElement.classList.add('is-invalid');
  }
}

// --- Function to check overall form validity and enable/disable submit button ---
function checkFormValidity() {
  const allFieldsValid = Object.values(validationStatus).every(status => status === true);
  submitButton.disabled = !allFieldsValid;
}

// --- Function to display all current client-side validation errors ---
function displayGlobalErrors(errorsArray) {
  globalErrorsDiv.innerHTML = '';
  if (errorsArray && errorsArray.length > 0) {
    errorsArray.forEach(msg => {
      const p = document.createElement('p');
      p.textContent = msg;
      globalErrorsDiv.appendChild(p);
    });
    globalErrorsDiv.style.display = 'block';
  } else {
    globalErrorsDiv.style.display = 'none';
  }
}

// --- Password Toggle Functionality (Generalized) ---
// This now handles all .toggle-password spans
togglePasswordSpans.forEach(toggleSpan => {
  toggleSpan.addEventListener('click', () => {
    const targetId = toggleSpan.dataset.target; // Get the ID of the input to toggle
    const targetInput = document.getElementById(targetId);

    if (targetInput) {
      if (targetInput.type === 'password') {
        targetInput.type = 'text';
        toggleSpan.textContent = '🙈';
      } else {
        targetInput.type = 'password';
        toggleSpan.textContent = '👁';
      }
    }
  });
});


// --- Debounce function to limit API calls ---
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// --- Client-Side Validation Functions ---
async function validateUsername() {
  const value = usernameInput.value.trim();
  const isValidFormat = value !== '';
  validationStatus.username = isValidFormat;

  if (isValidFormat) {
    try {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(value)}`);
      const result = await response.json();
      if (result.exists) {
        validationStatus.username = false;
        errorMessages.username.invalid = errorMessages.username.exists;
      } else {
        errorMessages.username.invalid = errorMessages.username.required;
      }
    } catch (error) {
      console.error("Error checking username existence:", error);
      validationStatus.username = false;
      errorMessages.username.invalid = 'Error checking username. Please try again.';
    }
  } else {
    errorMessages.username.invalid = errorMessages.username.required;
  }
  checkFormValidity();
  return validationStatus.username;
}

async function validateEmail() {
  const value = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidFormat = value !== '';
  validationStatus.email = isValidFormat;

  if (isValidFormat) {
    try {
      const response = await fetch(`/api/check-email?email=${encodeURIComponent(value)}`);
      const result = await response.json();
      if (result.exists) {
        validationStatus.email = false;
        errorMessages.email.invalid = errorMessages.email.exists;
      } else {
        errorMessages.email.invalid = 'Please enter a valid email address.';
      }
    } catch (error) {
      console.error("Error checking email existence:", error);
      validationStatus.email = false;
      errorMessages.email.invalid = 'Error checking email. Please try again.';
    }
  } else {
    errorMessages.email.invalid = 'Please enter a valid email address.';
  }
  checkFormValidity();
  return validationStatus.email;
}

async function validatePhone() {
  const value = phoneInput.value.trim();
  const countryCode = countryCodeSelect.value;
  const fullPhoneNumber = countryCode + value;

  const phoneRegex = /^[0-9]{10}$/;
  const isValidFormat = value !== '' && phoneRegex.test(value);
  validationStatus.phone = isValidFormat;

  if (isValidFormat) {
    try {
      const response = await fetch(`/api/check-phone?phone=${encodeURIComponent(fullPhoneNumber)}`);
      const result = await response.json();
      if (result.exists) {
        validationStatus.phone = false;
        errorMessages.phone.invalid = errorMessages.phone.exists;
      } else {
        errorMessages.phone.invalid = 'Please enter a valid 10-digit phone number (numbers only).';
      }
    } catch (error) {
      console.error("Error checking phone existence:", error);
      validationStatus.phone = false;
      errorMessages.phone.invalid = 'Error checking phone. Please try again.';
    }
  } else {
    errorMessages.phone.invalid = 'Please enter a valid 10-digit phone number (numbers only).';
  }
  checkFormValidity();
  return validationStatus.phone;
}

function validateGender() {
  const isValid = genderSelect.value !== "";
  validationStatus.gender = isValid;
  return isValid;
}

function validatePassword() {
  const value = passwordInput.value;
  const passwordStrengthRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+}{"':;?/>.<,])(?=.*[a-zA-Z]).{8,}$/;
  const isValid = value !== '' && passwordStrengthRegex.test(value);
  validationStatus.password = isValid;
  return isValid;
}

function validateConfirmPassword() {
  const value = confirmPasswordInput.value;
  const isValid = value !== '' && passwordInput.value === value;
  validationStatus.confirmPassword = isValid;
  return isValid;
}

// --- Event Listeners for Validation ---
const allFormInputs = registrationForm.querySelectorAll('input, select');
allFormInputs.forEach(input => {
  input.addEventListener('focus', () => {
    if (serverErrorDisplay) {
      serverErrorDisplay.style.display = 'none';
    }
    globalErrorsDiv.style.display = 'none';
    input.classList.remove('is-invalid', 'is-valid');
  });

  input.addEventListener('blur', async () => {
    let isValidField = false;
    switch (input.id) {
      case 'username': isValidField = await validateUsername(); break;
      case 'email': isValidField = await validateEmail(); break;
      case 'phone': isValidField = await validatePhone(); break;
      case 'gender': isValidField = validateGender(); break;
      case 'password': isValidField = validatePassword(); break;
      case 'confirmPassword': isValidField = validateConfirmPassword(); break;
    }
    updateInputUI(input, isValidField);
    const clientSideErrors = [];
    if (!validationStatus[input.id]) {
        const value = input.value.trim();
        let message = '';
        if (input.hasAttribute('required') && value === '') {
            message = errorMessages[input.id].required;
        } else if (errorMessages[input.id] && !validationStatus[input.id]) {
            message = errorMessages[input.id].invalid;
        }
        if (message) clientSideErrors.push(message);
    }
    displayGlobalErrors(clientSideErrors);
    checkFormValidity();
  });

  if (input.id === 'password') {
    input.addEventListener('input', () => {
      const isValid = validatePassword();
      updateInputUI(input, isValid);
      checkFormValidity();
    });
  }
  if (input.id === 'confirmPassword') {
      input.addEventListener('input', () => {
          const isValid = validateConfirmPassword();
          updateInputUI(input, isValid);
          checkFormValidity();
      });
  }
});

// --- Phone number input restriction ---
phoneInput.addEventListener('input', debounce(async (event) => {
    const originalValue = event.target.value;
    const numericValue = originalValue.replace(/[^0-9]/g, '');
    if (originalValue !== numericValue) {
        event.target.value = numericValue;
    }
    const isValid = await validatePhone();
    updateInputUI(phoneInput, isValid);
    checkFormValidity();
}, 500));

// NEW: Event listener for country code select change
countryCodeSelect.addEventListener('change', async () => {
    const isValid = await validatePhone();
    updateInputUI(phoneInput, isValid);
    displayGlobalErrors(getCurrentClientSideErrors());
    checkFormValidity();
});


// Helper function to get all current client-side errors for display
function getCurrentClientSideErrors() {
    const errors = [];
    Object.keys(validationStatus).forEach(fieldId => {
        if (!validationStatus[fieldId]) {
            const inputElement = document.getElementById(fieldId);
            const value = inputElement ? inputElement.value.trim() : '';
            let message = '';
            if (inputElement && inputElement.hasAttribute('required') && value === '') {
                message = errorMessages[fieldId].required;
            } else if (errorMessages[fieldId] && !validationStatus[fieldId]) {
                message = errorMessages[fieldId].invalid;
            }
            if (message) errors.push(message);
        }
    });
    return errors;
}


// --- Initial setup on page load ---
document.addEventListener('DOMContentLoaded', () => {
  submitButton.disabled = true;

  if (serverErrorDisplay && serverErrorDisplay.innerHTML.trim() !== '') {
    serverErrorDisplay.style.display = 'block';
  } else {
    if (serverErrorDisplay) {
        serverErrorDisplay.style.display = 'none';
    }
  }

  validateUsername();
  validateEmail();
  validatePhone(); // This will now trigger async check on load if phone is pre-filled
  validateGender();
  validatePassword();
  validateConfirmPassword();
  checkFormValidity();
});

// --- Form Submission using Fetch API ---
registrationForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const allValidClientSide = await validateUsername() &&
                             await validateEmail() &&
                             await validatePhone() &&
                             validateGender() &&
                             validatePassword() &&
                             await validateConfirmPassword();

  updateInputUI(usernameInput, validationStatus.username);
  updateInputUI(emailInput, validationStatus.email);
  updateInputUI(phoneInput, validationStatus.phone);
  updateInputUI(genderSelect, validationStatus.gender);
  updateInputUI(passwordInput, validationStatus.password);
  updateInputUI(confirmPasswordInput, validationStatus.confirmPassword);

  const clientSideErrorsOnSubmit = getCurrentClientSideErrors();

  if (!allValidClientSide) {
    displayGlobalErrors(clientSideErrorsOnSubmit);
    const firstInvalid = document.querySelector('.is-invalid');
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  globalErrorsDiv.style.display = 'none';
  submitButton.disabled = true;
  submitButton.textContent = 'Registering...';

  const formData = {
    username: usernameInput.value,
    email: emailInput.value,
    phone: countryCodeSelect.value + phoneInput.value, // Send combined phone number
    gender: genderSelect.value,
    password: passwordInput.value,
    confirmPassword: confirmPasswordInput.value
  };

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      window.location.href = `/success?type=register&username=${encodeURIComponent(result.user.username)}&email=${encodeURIComponent(result.user.email)}`;
    } else {
      displayGlobalErrors(result.errors || ['An unexpected error occurred during registration. Please try again.']);
      submitButton.disabled = false;
      submitButton.textContent = 'Register';
    }
  } catch (error) {
    console.error('Error during registration:', error);
    displayGlobalErrors(['Network error or server unreachable. Please try again.']);
    submitButton.disabled = false;
    submitButton.textContent = 'Register';
  }
});
