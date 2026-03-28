import type { LoginResponse, TLoginForm } from '../types';

export const login = async (data: TLoginForm): Promise<LoginResponse> => {
  // TODO: Replace with real API call (e.g., axios.post('/auth/login', data))
  return new Promise<LoginResponse>((resolve, reject) => {
    setTimeout(() => {
      console.log('Login API called with data:');
      if (data.pin === '1234') {
        resolve({
          auth: {
            accessToken: 'mock_jwt_access_token_12345',
            refreshToken: 'mock_jwt_refresh_token_67890',
          },
          data: {
            systemConfig: {
              lotName: 'Bãi xe Trung tâm KHTN',
              freeMinutes: 15,
              lostCardFee: 50000,
              bankName: 'Vietcombank',
              accountNumber: '0123456789',
              accountName: 'Nguyen Van A',
              qrImageUrl: null,
              monthlyPriceMotorbike: 150000,
              monthlyPriceCar: 1000000,
              monthlyPriceEbike: 120000,
              updatedAt: new Date('2026-03-16T12:00:00Z'),
            },
            pricingRules: [
              {
                id: 'rule_1',
                vehicleType: 'motorbike',
                timeType: 'daytime',
                firstHours: 4,
                firstPrice: 5000,
                extraPerHour: 2000,
                maxPerDay: 20000,
                overnightPrice: null,
                overnightStartTime: null,
                overnightEndTime: null,
              },
              {
                id: 'rule_2',
                vehicleType: 'car',
                timeType: 'daytime',
                firstHours: 2,
                firstPrice: 20000,
                extraPerHour: 10000,
                maxPerDay: 100000,
                overnightPrice: null,
                overnightStartTime: null,
                overnightEndTime: null,
              },
            ],
            staffList: [
              {
                id: 'staff_1',
                pinHash: '1234',
                role: 'admin',
                name: 'staff1',
                isDeleted: false,
              },
              {
                id: 'staff_2',
                pinHash: '1234',
                role: 'staff',
                name: 'staff2',
                isDeleted: false,
              },
              {
                id: 'staff_3',
                pinHash: '1234',
                role: 'staff',
                name: 'staff3',
                isDeleted: false,
              },
            ],
          },
        });
      } else {
        reject(new Error('Số điện thoại hoặc mã PIN không đúng. Gợi ý PIN: 1234'));
      }
    }, 1500);
  });
};