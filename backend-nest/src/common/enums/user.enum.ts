export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserLevel {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

export enum SubscriptionPlan {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  LIFETIME = 'lifetime',
  CUSTOM = 'custom',
}

export enum PointsAction {
  REGISTER = 'register',
  DAILY_LOGIN = 'daily_login',
  SHARE = 'share',
  INVITE = 'invite',
  TASK_COMPLETE = 'task_complete',
  PURCHASE = 'purchase',
  CONSUME = 'consume',
  ADMIN_GRANT = 'admin_grant',
  EXPIRE = 'expire',
}

export enum FavoriteType {
  SATELLITE = 'satellite',
  NEWS = 'news',
  EDUCATION = 'education',
  INTELLIGENCE = 'intelligence',
}