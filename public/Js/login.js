// Get login form elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');

// Get global error display elements
const globalErrorsDiv = document.getElementById('globalErrors');
const serverErrorDisplay = document.getElementById('serverErrorDisplay');

// Get all password toggle spans (for login page)
const togglePasswordSpans = document.querySelectorAll('.toggle-password'); // Corrected to select all

// --- Password Toggle Functionality (Generalized) ---
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


// --- Validation Status and Error Messages (Simplified for Login) ---
const validationStatus = {
    username: false,
    password: false
};

const errorMessages = {
    username: {
        required: 'Username is required.'
    },
    password: {
        required: 'Password is required.'
    }
};

// --- Helper Functions (Copied from script.js for consistency) ---
function updateInputUI(inputElement, isValid) {
    inputElement.classList.remove('is-invalid', 'is-valid');
    if (isValid) {
        inputElement.classList.add('is-valid');
    } else {
        inputElement.classList.add('is-invalid');
    }
}

function checkFormValidity() {
    const allFieldsValid = Object.values(validationStatus).every(status => status === true);
    loginButton.disabled = !allFieldsValid;
}

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

// --- Validation Functions for Login Form ---
function validateUsername() {
    const isValid = usernameInput.value.trim() !== '';
    validationStatus.username = isValid;
    return isValid;
}

function validatePassword() {
    const isValid = passwordInput.value.trim() !== '';
    validationStatus.password = isValid;
    return isValid;
}

// --- Event Listeners for Login Form Validation ---
const loginInputs = loginForm.querySelectorAll('input');
loginInputs.forEach(input => {
    input.addEventListener('focus', () => {
        if (serverErrorDisplay) {
            serverErrorDisplay.style.display = 'none';
        }
        globalErrorsDiv.style.display = 'none';
        input.classList.remove('is-invalid', 'is-valid');
    });

    input.addEventListener('blur', () => {
        let isValidField = false;
        switch (input.id) {
            case 'username': isValidField = validateUsername(); break;
            case 'password': isValidField = validatePassword(); break;
        }
        updateInputUI(input, isValidField);
        const errorsToDisplay = [];
        if (!isValidField) {
            const message = errorMessages[input.id].required;
            if (message) errorsToDisplay.push(message);
        }
        displayGlobalErrors(errorsToDisplay);
        checkFormValidity();
    });

    input.addEventListener('input', () => {
        switch (input.id) {
            case 'username': validateUsername(); break;
            case 'password': validatePassword(); break;
        }
        updateInputUI(input, validationStatus[input.id]);
        checkFormValidity();
    });
});


// --- Initial setup on page load ---
document.addEventListener('DOMContentLoaded', () => {
    loginButton.disabled = true;

    if (serverErrorDisplay && serverErrorDisplay.innerHTML.trim() !== '') {
        serverErrorDisplay.style.display = 'block';
    } else {
        if (serverErrorDisplay) {
            serverErrorDisplay.style.display = 'none';
        }
    }

    updateInputUI(usernameInput, validateUsername());
    updateInputUI(passwordInput, validatePassword());
    checkFormValidity();
});

// --- Login Form Submission using Fetch API ---
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const allValidClientSide = validateUsername() && validatePassword();

    updateInputUI(usernameInput, validationStatus.username);
    updateInputUI(passwordInput, validationStatus.password);

    const clientSideErrorsOnSubmit = [];
    Object.keys(validationStatus).forEach(fieldId => {
        if (!validationStatus[fieldId]) {
            const inputElement = document.getElementById(fieldId);
            const message = errorMessages[fieldId].required;
            if (message) clientSideErrorsOnSubmit.push(message);
        }
    });

    if (!allValidClientSide) {
        displayGlobalErrors(clientSideErrorsOnSubmit);
        const firstInvalid = document.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    displayGlobalErrors([]);
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';

    const formData = {
        username: usernameInput.value,
        password: passwordInput.value
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            window.location.href = `/success?type=login&username=${encodeURIComponent(result.user.username)}`;
        } else {
            displayGlobalErrors(result.errors || ['An unexpected error occurred during login. Please try again.']);
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
    } catch (error) {
        console.error('Error during login:', error);
        displayGlobalErrors(['Network error or server unreachable. Please try again.']);
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
});