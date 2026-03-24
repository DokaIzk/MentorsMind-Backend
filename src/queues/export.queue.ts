import { Queue, Worker, Job } from 'bullmq';
import config from '../config';
import { ExportService } from '../services/export.service';
import { ExportJobModel } from '../models/export-job.model';
import { AuditLoggerService } from '../services/audit-logger.service';
import { LogLevel } from '../utils/log-formatter.utils';

const redisUrl = config.redis.url || 'redis://localhost:6379';
const url = new URL(redisUrl);

const connection = {
  host: url.hostname,
  port: parseInt(url.port, 10) || 6379,
  password: url.password || undefined,
};

export const exportQueue = new Queue('export-queue', { connection });

export const exportWorker = new Worker(
  'export-queue',
  async (job: Job) => {
    const { userId, jobId } = job.data;
    await ExportService.processExport(userId, jobId);
  },
  { connection, concurrency: 5 }
);

exportWorker.on('completed', (job) => {
  console.log(`Export job ${job.id} completed`);
});

exportWorker.on('failed', async (job, err) => {
  console.error(`Export job ${job?.id} failed: ${err.message}`);
  if (job) {
    const { jobId, userId } = job.data;
    await ExportJobModel.updateStatus(jobId, 'failed', undefined, err.message);
    
    await AuditLoggerService.logEvent({
      level: LogLevel.ERROR,
      action: 'DATA_EXPORT_FAILED',
      message: `Data export failed for user ${userId}: ${err.message}`,
      userId: userId,
      entityType: 'export_job',
      entityId: jobId,
      metadata: { error: err.message }
    });
  }
});
