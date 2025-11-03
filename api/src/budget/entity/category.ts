import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from "typeorm";

import { Budget } from "./budget";

export type CategoryType = "need" | "want";

@Entity()
@Unique(["budget", "name"])
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Budget, (budget) => budget.categories, {
    onDelete: "CASCADE"
  })
  budget!: Budget;

  @Column()
  name!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  plannedAmount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  spentAmount!: number;

  @Column({ type: "int", default: 0 })
  order!: number;

  @Column({ type: "varchar", length: 10, default: "need" })
  type!: CategoryType;
}
