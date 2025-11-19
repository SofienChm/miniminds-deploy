import { environment } from '../../../environments/environment.development';

export class ApiConfig {
  static readonly BASE_URL = environment.apiUrl;
  static readonly HUB_URL = environment.apiUrl.replace('/api', '');

  static readonly ENDPOINTS = {
    AUTH: `${ApiConfig.BASE_URL}/auth`,
    CHILDREN: `${ApiConfig.BASE_URL}/children`,
    EDUCATORS: `${ApiConfig.BASE_URL}/teachers`,
    PARENTS: `${ApiConfig.BASE_URL}/parents`,
    EVENTS: `${ApiConfig.BASE_URL}/events`,
    EVENT_PARTICIPANTS: `${ApiConfig.BASE_URL}/eventparticipants`,
    FEES: `${ApiConfig.BASE_URL}/fees`,
    HOLIDAYS: `${ApiConfig.BASE_URL}/holidays`,
    LEAVES: `${ApiConfig.BASE_URL}/leaves`,
    ATTENDANCE: `${ApiConfig.BASE_URL}/attendance`,
    DAILY_ACTIVITIES: `${ApiConfig.BASE_URL}/dailyactivities`,
    NOTIFICATIONS: `${ApiConfig.BASE_URL}/notifications`,
    MESSAGES: `${ApiConfig.BASE_URL}/messages`,
    CLASSES: `${ApiConfig.BASE_URL}/classes`,
    SETTINGS: `${ApiConfig.BASE_URL}/settings`
  };
}
