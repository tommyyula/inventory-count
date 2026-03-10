export interface DomainEvent {
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export type EventHandler = (event: DomainEvent) => void;

class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  on(type: string, handler: EventHandler): void {
    const list = this.handlers.get(type) || [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  off(type: string, handler: EventHandler): void {
    const list = this.handlers.get(type) || [];
    this.handlers.set(type, list.filter(h => h !== handler));
  }

  emit(event: DomainEvent): void {
    const list = this.handlers.get(event.type) || [];
    list.forEach(h => h(event));
  }
}

export const eventBus = new EventBus();
