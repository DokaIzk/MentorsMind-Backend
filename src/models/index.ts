import { AuditLogModel } from './audit-log.model';
import { ExportJobModel } from './export-job.model';
import { SessionModel } from './session.model';
import { PaymentModel } from './payment.model';
import { ReviewModel } from './review.model';

export const initializeModels = async () => {
  try {
    await AuditLogModel.initializeTable();
    await ExportJobModel.initializeTable();
    await SessionModel.initializeTable();
    await PaymentModel.initializeTable();
    await ReviewModel.initializeTable();
    console.log('✅ All database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};
