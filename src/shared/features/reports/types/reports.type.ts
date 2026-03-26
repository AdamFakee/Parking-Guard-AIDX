export interface ReportOverview {
  finance: {
    total: number;
    cash: number;
    qr: number;
    monthly: number;
    lostCardFee: number;
  };
  traffic: {
    entries: number;
    exits: number;
    inYard: number;
  };
  security: {
    mismatchCount: number;
    voidCount: number;
    lostCardsCount: number;
  };
}

export type DateRangeType = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'custom';

export interface ReportDashboardOverviewProps {
  // Now self-contained, but keep optional for flexibility
  range?: DateRangeType;
  startDate?: Date;
  endDate?: Date;
  onRangeChange?: (range: DateRangeType, startDate: Date, endDate: Date) => void;
}
