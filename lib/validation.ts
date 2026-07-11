// Validation rules and error messages

/** Alphanumeric string, e.g. CS2024042 or 230317J */
export const INDEX_NUMBER_PATTERN = /^[a-zA-Z0-9]+$/;

export function normalizeIndexNumber(indexNumber: string): string {
  return indexNumber.trim().toUpperCase();
}

export function isValidIndexNumber(indexNumber: string): boolean {
  return INDEX_NUMBER_PATTERN.test(normalizeIndexNumber(indexNumber));
}

export const ValidationRules = {
  indexNumber: {
    pattern: INDEX_NUMBER_PATTERN,
    errorMessage:
      "Index number must contain only letters and numbers.",
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

function validateIndexNumberField(indexNumber: string): ValidationError | null {
  const normalizedIndex = normalizeIndexNumber(indexNumber);

  if (!indexNumber.trim()) {
    return {
      field: "indexNumber",
      message: "Index number is required",
    };
  }

  if (!ValidationRules.indexNumber.pattern.test(normalizedIndex)) {
    return {
      field: "indexNumber",
      message: ValidationRules.indexNumber.errorMessage,
    };
  }

  return null;
}

// Login validation
export function validateLoginForm(data: LoginFormData): ValidationError[] {
  const errors: ValidationError[] = [];

  const indexError = validateIndexNumberField(data.indexNumber);
  if (indexError) {
    errors.push(indexError);
  }

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

  const indexError = validateIndexNumberField(data.indexNumber);
  if (indexError) {
    errors.push(indexError);
  }

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
