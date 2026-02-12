import { MAX_HEALTH } from '../game/constants';

export class HealthSystem {
  private readonly maxHealth: number;

  private currentHealth: number;

  constructor(maxHealth = MAX_HEALTH) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
  }

  get value(): number {
    return this.currentHealth;
  }

  damage(amount: number): number {
    this.currentHealth = Math.max(0, this.currentHealth - Math.max(0, amount));
    return this.currentHealth;
  }

  heal(amount: number): number {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + Math.max(0, amount));
    return this.currentHealth;
  }

  reset(): number {
    this.currentHealth = this.maxHealth;
    return this.currentHealth;
  }
}
