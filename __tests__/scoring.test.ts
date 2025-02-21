import { validateDelivery } from '@/utils/validation';
import { calculateRunRate } from '@/utils/netRunRate';
import { MATCH_RULES } from '@/constants/scoring';

describe('Scoring Validation', () => {
    test('should validate delivery details correctly', () => {
        const invalidDelivery = {
            runs: -1,
            batsmanId: '1',
            bowlerId: '2',
            timestamp: Date.now(),
            overNumber: 1,
            ballNumber: 1
        };

        expect(() => validateDelivery(invalidDelivery, mockMatchState))
            .toThrow('Invalid runs value');
    });

    test('should calculate run rate correctly', () => {
        const result = calculateRunRate(120, 20);
        expect(result).toBe(6);
    });
});