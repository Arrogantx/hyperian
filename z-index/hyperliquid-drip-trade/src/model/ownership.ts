// src/model/ownership.ts

import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('ownership')
export class Ownership {
  @PrimaryColumn()
  id!: string;

  @Column()
  owner!: string;

  @Column()
  contract!: string;

  @Column()
  tokenId!: string;
}