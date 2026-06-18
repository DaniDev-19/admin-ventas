export class AppError extends Error {
    constructor(public message: string, public status: number = 500, public details: any = null) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = "Error de validación", details: any = null) {
        super(message, 400, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Recurso no encontrado") {
        super(message, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Conflicto con recurso existente") {
        super(message, 409);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "No autorizado") {
        super(message, 401);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Acceso prohibido") {
        super(message, 403);
    }
}
