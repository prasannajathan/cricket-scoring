import { InningsData, } from '@/types';

export function getBattingOrder(innings: InningsData): string[] {
    const order: string[] = [];
    const seen = new Set<string>();
  
    // Iterate over deliveries in chronological order
    for (const delivery of innings.deliveries) {
      // If this delivery has a recorded striker ID (preSwitchStrikerId or batsmanId),
      // that means the batter faced that ball
      const strikerId = delivery.preSwitchStrikerId || delivery.batsmanId;
      if (strikerId && !seen.has(strikerId)) {
        seen.add(strikerId);
        order.push(strikerId);
      }
  
      // If a new batsman joined after a wicket, they'll appear in nextBatsmanId
      if (delivery.nextBatsmanId && !seen.has(delivery.nextBatsmanId)) {
        seen.add(delivery.nextBatsmanId);
        order.push(delivery.nextBatsmanId);
      }
    }
  
    return order;
  }