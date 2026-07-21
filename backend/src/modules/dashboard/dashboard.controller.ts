import { Controller, Get, Query, Sse } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('logs')
  getLogs(@Query('limit') limit: string) {
    const logLimit = parseInt(limit, 10) || 50;
    return {
      logs: this.dashboardService.getRecentLogs(logLimit),
    };
  }

  @Sse('stream')
  streamStats() {
    return interval(2000).pipe(
      map(() => ({
        data: JSON.stringify(this.dashboardService.getStats()),
      })),
    );
  }

  @Sse('logs/stream')
  streamLogs() {
    let lastLogCount = 0;
    return interval(1000).pipe(
      map(() => {
        const logs = this.dashboardService.getRecentLogs(10);
        const newLogs = logs.slice(0, logs.length - lastLogCount);
        lastLogCount = logs.length;
        return {
          data: JSON.stringify({ logs: newLogs }),
        };
      }),
    );
  }
}
