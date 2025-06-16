import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";

import { Budget } from "@/budget/entity/budget";
@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column()
  password!: string;
  
  @Column()
  fullName!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(()  => Budget, (budget) => budget.user)
  budgets!: Budget[];
}
