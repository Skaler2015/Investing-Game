/**
 * Pure evaluators for resting orders and price alerts.
 *
 * Side-effect free: given an order/alert and the current price, decide whether
 * it should fire. The store calls these every tick and performs the actual
 * buy/sell + toast when they return true.
 */
import type { PendingOrder, PriceAlert } from '../types';

/** True when a resting order's trigger condition is met at `price`. */
export function orderShouldFill(order: PendingOrder, price: number): boolean {
  switch (order.kind) {
    case 'limit': // buy the dip
      return price <= order.price;
    case 'stop': // stop-loss: sell if it falls to the floor
      return price <= order.price;
    case 'take': // take-profit: sell if it rises to the target
      return price >= order.price;
    default:
      return false;
  }
}

/** True when a price alert should fire at `price`. */
export function alertShouldFire(alert: PriceAlert, price: number): boolean {
  return alert.dir === 'above' ? price >= alert.price : price <= alert.price;
}

/** Human label for an order kind. */
export function orderKindLabel(kind: PendingOrder['kind']): string {
  switch (kind) {
    case 'limit': return 'Limit buy';
    case 'stop': return 'Stop-loss';
    case 'take': return 'Take-profit';
    default: return 'Order';
  }
}
