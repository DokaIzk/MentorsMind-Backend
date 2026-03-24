import pool from '../config/database';

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
}

export interface RevenueBreakdown {
  total: number;
  fees: number;
  payouts: number;
}

export interface UserGrowth {
  date: string;
  count: number;
}

export interface SessionMetrics {
  total: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

export interface PaymentMetrics {
  totalVolume: number;
  count: number;
  methods: Record<string, number>;
}

export interface PlatformOverview {
  totalRevenue: number;
  totalUsers: number;
  activeSessions: number;
  completionRate: number;
}

export class AnalyticsService {
  /**
   * Helper to parse period string into start/end dates
   */
  static getPeriodDates(period: string = '30d'): AnalyticsPeriod {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '30d':
      default:
        start.setDate(end.getDate() - 30);
        break;
    }
    
    return { start, end };
  }

  static async getOverview(): Promise<PlatformOverview> {
    const queries = {
      revenue: 'SELECT SUM(amount) as total FROM payments WHERE status = \'completed\'',
      users: 'SELECT COUNT(*) as total FROM users WHERE is_active = true',
      sessions: 'SELECT COUNT(*) as total FROM sessions WHERE status = \'confirmed\'',
      completion: `
        SELECT 
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) as total
        FROM sessions
        WHERE status IN ('completed', 'cancelled')
      `
    };

    const [revRes, usersRes, sessionsRes, compRes] = await Promise.all([
      pool.query(queries.revenue),
      pool.query(queries.users),
      pool.query(queries.sessions),
      pool.query(queries.completion)
    ]);

    const completed = parseInt(compRes.rows[0].completed, 10) || 0;
    const total = parseInt(compRes.rows[0].total, 10) || 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      totalRevenue: parseFloat(revRes.rows[0].total) || 0,
      totalUsers: parseInt(usersRes.rows[0].total, 10) || 0,
      activeSessions: parseInt(sessionsRes.rows[0].total, 10) || 0,
      completionRate
    };
  }

  static async getRevenueBreakdown(period: string): Promise<RevenueBreakdown> {
    const { start, end } = this.getPeriodDates(period);
    const query = `
      SELECT 
        SUM(amount) as total,
        SUM(fee_amount) as fees,
        SUM(payout_amount) as payouts
      FROM payments
      WHERE status = 'completed'
        AND created_at BETWEEN $1 AND $2
    `;
    const { rows } = await pool.query(query, [start, end]);
    return {
      total: parseFloat(rows[0].total) || 0,
      fees: parseFloat(rows[0].fees) || 0,
      payouts: parseFloat(rows[0].payouts) || 0
    };
  }

  static async getUserGrowth(period: string): Promise<UserGrowth[]> {
    const { start, end } = this.getPeriodDates(period);
    const query = `
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    const { rows } = await pool.query(query, [start, end]);
    return rows.map((r: any) => ({
      date: r.date.toISOString(),
      count: parseInt(r.count, 10)
    }));
  }

  static async getSessionMetrics(period: string): Promise<SessionMetrics> {
    const { start, end } = this.getPeriodDates(period);
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
      FROM sessions
      WHERE created_at BETWEEN $1 AND $2
    `;
    const { rows } = await pool.query(query, [start, end]);
    const total = parseInt(rows[0].total, 10) || 0;
    const completed = parseInt(rows[0].completed, 10) || 0;
    
    return {
      total,
      completed,
      cancelled: parseInt(rows[0].cancelled, 10) || 0,
      completionRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  static async getPaymentMetrics(period: string): Promise<PaymentMetrics> {
    const { start, end } = this.getPeriodDates(period);
    // Better query for volume and distribution
    const volumeQuery = `
      SELECT SUM(amount) as total_volume, COUNT(*) as count
      FROM payments
      WHERE created_at BETWEEN $1 AND $2
    `;
    const distributionQuery = `
      SELECT method, COUNT(*) as count
      FROM payments
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY method
    `;

    const [volRes, distRes] = await Promise.all([
      pool.query(volumeQuery, [start, end]),
      pool.query(distributionQuery, [start, end])
    ]);

    const methods: Record<string, number> = {};
    distRes.rows.forEach((r: any) => {
      methods[r.method] = parseInt(r.count, 10);
    });

    return {
      totalVolume: parseFloat(volRes.rows[0].total_volume) || 0,
      count: parseInt(volRes.rows[0].count, 10) || 0,
      methods
    };
  }
}
