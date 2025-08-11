// Get elements for forgot password form
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const sendResetLinkButton = document.getElementById('sendResetLinkButton');

// Get global error/success display elements
const globalErrorsDiv = document.getElementById('globalErrors');
const globalSuccessDiv = document.getElementById('globalSuccess');
const serverErrorDisplay = document.getElementById('serverErrorDisplay'); // For server-rendered errors on initial load

// --- Validation Status and Error Messages ---
const validationStatus = {
    email: false
};

const errorMessages = {
    email: {
        required: 'Email is required.',
        invalid: 'Please enter a valid email address.'
    }
};

// --- Helper Functions ---
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
    sendResetLinkButton.disabled = !allFieldsValid;
}

function displayGlobalErrors(errorsArray) {
    globalErrorsDiv.innerHTML = '';
    globalSuccessDiv.style.display = 'none'; // Hide success message if errors appear
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

function displayGlobalSuccess(message) {
    globalSuccessDiv.innerHTML = `<p>${message}</p>`;
    globalSuccessDiv.style.display = 'block';
    globalErrorsDiv.style.display = 'none'; // Hide errors if success appears
}

// --- Validation Function ---
function validateEmail() {
    const value = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = value !== '' && emailRegex.test(value);
    validationStatus.email = isValid;
    return isValid;
}

// --- Event Listeners ---
emailInput.addEventListener('focus', () => {
    if (serverErrorDisplay) { serverErrorDisplay.style.display = 'none'; }
    globalErrorsDiv.style.display = 'none';
    globalSuccessDiv.style.display = 'none'; // Clear success on focus
    emailInput.classList.remove('is-invalid', 'is-valid');
});

emailInput.addEventListener('blur', () => {
    const isValidField = validateEmail();
    updateInputUI(emailInput, isValidField);
    const errorsToDisplay = [];
    if (!isValidField) {
        const message = errorMessages.email.required;
        if (message) errorsToDisplay.push(message);
    }
    displayGlobalErrors(errorsToDisplay);
    checkFormValidity();
});

emailInput.addEventListener('input', () => {
    validateEmail();
    updateInputUI(emailInput, validationStatus.email);
    checkFormValidity();
});

// --- Form Submission ---
forgotPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const allValidClientSide = validateEmail();
    updateInputUI(emailInput, validationStatus.email);

    const clientSideErrorsOnSubmit = [];
    if (!validationStatus.email) {
        clientSideErrorsOnSubmit.push(errorMessages.email.required);
    }

    if (!allValidClientSide) {
        displayGlobalErrors(clientSideErrorsOnSubmit);
        emailInput.focus();
        return;
    }

    displayGlobalErrors([]); // Clear errors before API call
    displayGlobalSuccess(''); // Clear success message before API call
    sendResetLinkButton.disabled = true;
    sendResetLinkButton.textContent = 'Sending...';

    const formData = {
        email: emailInput.value
    };

    try {
        const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            displayGlobalSuccess(result.message);
            // Optionally clear the form after success
            forgotPasswordForm.reset();
            updateInputUI(emailInput, false); // Clear valid/invalid state
            validationStatus.email = false; // Reset validation status
            checkFormValidity(); // Update button state
        } else {
            displayGlobalErrors(result.errors || ['An unexpected error occurred. Please try again.']);
        }
    } catch (error) {
        console.error('Error during forgot password request:', error);
        displayGlobalErrors(['Network error or server unreachable. Please try again.']);
    } finally {
        sendResetLinkButton.disabled = false;
        sendResetLinkButton.textContent = 'Send Reset Link';
    }
});

// --- Initial setup on page load ---
document.addEventListener('DOMContentLoaded', () => {
    sendResetLinkButton.disabled = true;
    if (serverErrorDisplay && serverErrorDisplay.innerHTML.trim() !== '') {
        serverErrorDisplay.style.display = 'block';
    } else {
        if (serverErrorDisplay) {
            serverErrorDisplay.style.display = 'none';
        }
    }
    validateEmail(); // Validate if email is pre-filled
    checkFormValidity();
});