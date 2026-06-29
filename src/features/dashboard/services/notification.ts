import { api } from '../../../config/api';
import type { APIResponse } from '../../../types/api.types';
import type { RecruiterDashboardNotification } from '../../../types/realtime.types';

export const notificationService = {
  async getNotifications(): Promise<APIResponse<RecruiterDashboardNotification[]>> {
    const response = await api.get<APIResponse<RecruiterDashboardNotification[]>>(
      '/notifications',
    );
    return response.data;
  },
};
