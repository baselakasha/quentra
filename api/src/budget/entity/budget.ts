import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
} from "typeorm";

import { User } from "../../auth/entity/user";
import { Category } from "./category";

@Entity()
@Unique(["user", "name"])
export class Budget {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, (user) => user.budgets)
  user!: User;

  @Column()
  name!: string;

  @Column({ type: "date" })
  startDate!: Date;

  @Column({ type: "date" })
  endDate!: Date;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  monthlyIncome!: number;

  @Column({ default: false })
  isPinned!: boolean;

  @OneToMany(() => Category, (category) => category.budget, {
    cascade: true,
    onDelete: "CASCADE"
  })
  categories!: Category[];

}
