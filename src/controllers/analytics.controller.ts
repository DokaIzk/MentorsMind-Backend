import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { ResponseUtil } from '../utils/response.utils';
import { TtlCache, withCache } from '../utils/cache.utils';
import { logger } from '../utils/logger.utils';

// 5 minutes TTL
const ANALYTICS_CACHE_TTL = 5 * 60 * 1000;
const analyticsCache = new TtlCache<any>(ANALYTICS_CACHE_TTL);

export class AnalyticsController {
  static async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const data = await withCache(
        'analytics:overview',
        () => AnalyticsService.getOverview(),
        analyticsCache
      );
      ResponseUtil.success(res, data, 'Platform overview analytics');
    } catch (error) {
      logger.error('AnalyticsController.getOverview error', { error });
      ResponseUtil.error(res, 'Failed to fetch overview analytics');
    }
  }

  static async getRevenue(req: Request, res: Response): Promise<void> {
    const period = (req.query.period as string) || '30d';
    try {
      const data = await withCache(
        `analytics:revenue:${period}`,
        () => AnalyticsService.getRevenueBreakdown(period),
        analyticsCache
      );
      ResponseUtil.success(res, data, `Revenue breakdown for ${period}`);
    } catch (error) {
      logger.error('AnalyticsController.getRevenue error', { error });
      ResponseUtil.error(res, 'Failed to fetch revenue analytics');
    }
  }

  static async getUsers(req: Request, res: Response): Promise<void> {
    const period = (req.query.period as string) || '30d';
    try {
      const data = await withCache(
        `analytics:users:${period}`,
        () => AnalyticsService.getUserGrowth(period),
        analyticsCache
      );
      ResponseUtil.success(res, data, `User growth for ${period}`);
    } catch (error) {
      logger.error('AnalyticsController.getUsers error', { error });
      ResponseUtil.error(res, 'Failed to fetch user analytics');
    }
  }

  static async getSessions(req: Request, res: Response): Promise<void> {
    const period = (req.query.period as string) || '30d';
    try {
      const data = await withCache(
        `analytics:sessions:${period}`,
        () => AnalyticsService.getSessionMetrics(period),
        analyticsCache
      );
      ResponseUtil.success(res, data, `Session metrics for ${period}`);
    } catch (error) {
      logger.error('AnalyticsController.getSessions error', { error });
      ResponseUtil.error(res, 'Failed to fetch session analytics');
    }
  }

  static async getPayments(req: Request, res: Response): Promise<void> {
    const period = (req.query.period as string) || '30d';
    try {
      const data = await withCache(
        `analytics:payments:${period}`,
        () => AnalyticsService.getPaymentMetrics(period),
        analyticsCache
      );
      ResponseUtil.success(res, data, `Payment metrics for ${period}`);
    } catch (error) {
      logger.error('AnalyticsController.getPayments error', { error });
      ResponseUtil.error(res, 'Failed to fetch payment analytics');
    }
  }
}
