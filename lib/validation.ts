// Validation rules and error messages
export const ValidationRules = {
  indexNumber: {
    minLength: 4,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9]+$/,
    errorMessage:
      "Index number must be 4-20 characters, letters and numbers only",
  },
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    errorMessage: "Name must be 2-50 characters, letters and spaces only",
  },
  password: {
    minLength: 8,
    maxLength: 100,
    errorMessage: "Password must be at least 8 characters long",
  },
};

export interface ValidationError {
  field: string;
  message: string;
}

export interface LoginFormData {
  indexNumber: string;
  password: string;
}

export interface RegisterFormData {
  indexNumber: string;
  name: string;
  password: string;
  confirmPassword?: string;
}

// Login validation
export function validateLoginForm(data: LoginFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Index number validation
  if (!data.indexNumber.trim()) {
    errors.push({
      field: "indexNumber",
      message: "Index number is required",
    });
  } else if (data.indexNumber.length < ValidationRules.indexNumber.minLength) {
    errors.push({
      field: "indexNumber",
      message: `Index number must be at least ${ValidationRules.indexNumber.minLength} characters`,
    });
  } else if (data.indexNumber.length > ValidationRules.indexNumber.maxLength) {
    errors.push({
      field: "indexNumber",
      message: `Index number must not exceed ${ValidationRules.indexNumber.maxLength} characters`,
    });
  } else if (!ValidationRules.indexNumber.pattern.test(data.indexNumber)) {
    errors.push({
      field: "indexNumber",
      message: ValidationRules.indexNumber.errorMessage,
    });
  }

  // Password validation
  if (!data.password) {
    errors.push({
      field: "password",
      message: "Password is required",
    });
  } else if (data.password.length < ValidationRules.password.minLength) {
    errors.push({
      field: "password",
      message: ValidationRules.password.errorMessage,
    });
  }

  return errors;
}

// Register validation
export function validateRegisterForm(data: RegisterFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  // Index number validation
  if (!data.indexNumber.trim()) {
    errors.push({
      field: "indexNumber",
      message: "Index number is required",
    });
  } else if (data.indexNumber.length < ValidationRules.indexNumber.minLength) {
    errors.push({
      field: "indexNumber",
      message: `Index number must be at least ${ValidationRules.indexNumber.minLength} characters`,
    });
  } else if (data.indexNumber.length > ValidationRules.indexNumber.maxLength) {
    errors.push({
      field: "indexNumber",
      message: `Index number must not exceed ${ValidationRules.indexNumber.maxLength} characters`,
    });
  } else if (!ValidationRules.indexNumber.pattern.test(data.indexNumber)) {
    errors.push({
      field: "indexNumber",
      message: ValidationRules.indexNumber.errorMessage,
    });
  }

  // Name validation
  if (!data.name.trim()) {
    errors.push({
      field: "name",
      message: "Full name is required",
    });
  } else if (data.name.length < ValidationRules.name.minLength) {
    errors.push({
      field: "name",
      message: `Name must be at least ${ValidationRules.name.minLength} characters`,
    });
  } else if (data.name.length > ValidationRules.name.maxLength) {
    errors.push({
      field: "name",
      message: `Name must not exceed ${ValidationRules.name.maxLength} characters`,
    });
  } else if (!ValidationRules.name.pattern.test(data.name)) {
    errors.push({
      field: "name",
      message: ValidationRules.name.errorMessage,
    });
  }

  // Password validation
  if (!data.password) {
    errors.push({
      field: "password",
      message: "Password is required",
    });
  } else if (data.password.length < ValidationRules.password.minLength) {
    errors.push({
      field: "password",
      message: ValidationRules.password.errorMessage,
    });
  }

  // Confirm password validation
  if (data.confirmPassword !== undefined) {
    if (!data.confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Please confirm your password",
      });
    } else if (data.password !== data.confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }
  }

  return errors;
}

// Server-side validation
export function validateLoginServer(data: unknown): ValidationError[] {
  if (!data || typeof data !== "object") {
    return [{ field: "general", message: "Invalid request" }];
  }

  const formData = data as Record<string, unknown>;
  const errors: ValidationError[] = [];

  if (
    !formData.indexNumber ||
    typeof formData.indexNumber !== "string" ||
    !formData.password ||
    typeof formData.password !== "string"
  ) {
    errors.push({
      field: "general",
      message: "Missing required fields",
    });
    return errors;
  }

  return validateLoginForm({
    indexNumber: formData.indexNumber,
    password: formData.password,
  });
}

export function validateRegisterServer(data: unknown): ValidationError[] {
  if (!data || typeof data !== "object") {
    return [{ field: "general", message: "Invalid request" }];
  }

  const formData = data as Record<string, unknown>;
  const errors: ValidationError[] = [];

  if (
    !formData.indexNumber ||
    typeof formData.indexNumber !== "string" ||
    !formData.name ||
    typeof formData.name !== "string" ||
    !formData.password ||
    typeof formData.password !== "string"
  ) {
    errors.push({
      field: "general",
      message: "Missing required fields",
    });
    return errors;
  }

  return validateRegisterForm({
    indexNumber: formData.indexNumber,
    name: formData.name,
    password: formData.password,
  });
}