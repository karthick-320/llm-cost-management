import { UsageRecord } from "../types/index.js";

export class UsageTracker {
  private readonly events: UsageRecord[] = [];
  private isSameDay(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  private isSameMonth(first: Date, second: Date): boolean {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth()
    );
  }

  add(event: UsageRecord): void {
    this.events.push(event);
  }

  getAll(): UsageRecord[] {
    return [...this.events];
  }

  getTotalCost(): number {
    return this.events.reduce((total, event) => total + event.cost, 0);
  }

  getUserCost(userId: string): number {
    return this.events
      .filter((event) => event.userId === userId)
      .reduce((total, event) => total + event.cost, 0);
  }

  getFeatureCost(feature: string): number {
    return this.events
      .filter((event) => event.feature === feature)
      .reduce((total, event) => total + event.cost, 0);
  }
  getProjectCost(projectId: string): number {
    return this.events
      .filter((event) => event.projectId === projectId)
      .reduce((total, event) => total + event.cost, 0);
  }

  getDailyCost(date: Date = new Date()): number {
    return this.events
      .filter((event) => this.isSameDay(event.timestamp, date))
      .reduce((total, event) => total + event.cost, 0);
  }

  getMonthlyCost(date: Date = new Date()): number {
    return this.events
      .filter((event) => this.isSameMonth(event.timestamp, date))
      .reduce((total, event) => total + event.cost, 0);
  }
}
