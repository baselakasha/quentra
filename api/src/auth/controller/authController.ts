import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "@/config/ormconfig";
import { User } from "@/auth/entity/user";
import { generateToken } from "@/auth/util/jwt";

const userRepo = AppDataSource.getRepository(User);

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password } = req.body;

  const existing = await userRepo.findOne({ where: { username } });
  if (existing) return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = userRepo.create({ username, password: hashedPassword });
  await userRepo.save(user);

  res.status(201).json({ token: generateToken(user.id) });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password } = req.body;

  const user = await userRepo.findOne({ where: { username } });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ token: generateToken(user.id) });
};
