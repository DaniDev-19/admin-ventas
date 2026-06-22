import type { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ConflictError, ValidationError, UnauthorizedError } from '../utils/errors';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

const JWT_SECRET = process.env.JWT_SECRET || 'single_sale_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export class AuthService {
  constructor(private db: PrismaClient) {}

  async register(input: RegisterInput) {
    const { username, password, nombre, rol } = input;

    // Verificar si el usuario ya existe
    const existing = await this.db.usuarios.findUnique({
      where: { username }
    });

    if (existing) {
      throw new ConflictError('El nombre de usuario ya está registrado');
    }

    // Encriptar contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await this.db.usuarios.create({
      data: {
        username,
        password: hashedPassword,
        nombre,
        rol: rol || 'vendedor'
      },
      select: {
        id: true,
        username: true,
        nombre: true,
        rol: true,
        created_at: true
      }
    });

    return user;
  }

  async login(input: LoginInput) {
    const { username, password } = input;

    // Buscar usuario
    const user = await this.db.usuarios.findUnique({
      where: { username }
    });

    if (!user) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    // Verificar si el usuario está inhabilitado
    if (user.status === 'inactivo') {
      throw new UnauthorizedError('Usuario inhabilitado. Por favor, contacte al administrador.');
    }

    // Verificar contraseña
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol: user.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol
      }
    };
  }
}

export default AuthService;
