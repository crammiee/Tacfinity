import { db } from '../../shared/db/index.js';

type CreateUserInput = {
  username: string;
  email: string;
  passwordHash: string;
};

export const authRepository = {
  findUserByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  },

  findUserById(id: string) {
    return db.user.findUnique({ where: { id } });
  },

  createUser(input: CreateUserInput) {
    return db.user.create({ data: input });
  },
};
