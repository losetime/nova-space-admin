import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3002", 10) || 3002,
  baseUrl: process.env.BASE_URL || "http://localhost:3002",
  jwtSecret: process.env.JWT_SECRET || "nova-space-secret-key-2024",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  database: {
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "nwbd@123",
    database: process.env.DB_NAME || "nova_space",
  },
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:5175",
  },
  email: {
    host: process.env.SMTP_HOST || "",
    port: parseInt(process.env.SMTP_PORT || "587", 10) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "noreply@nova-space.com",
  },
  satellite: {
    maxSatellites:
      parseInt(process.env.SATELLITE_MAX_COUNT || "10000", 10) || 10000,
  },
  spaceTrack: {
    username: process.env.SPACE_TRACK_USERNAME || "",
    password: process.env.SPACE_TRACK_PASSWORD || "",
    baseUrl: "https://www.space-track.org",
  },
  esaDiscos: {
    apiToken: process.env.ESA_DISCOS_API_TOKEN || "",
    baseUrl: "https://discosweb.esoc.esa.int/api",
  },
  celestrak: {
    baseUrl: "https://celestrak.org/NORAD/elements",
  },
  keepTrack: {
    apiKey: process.env.KEEPTRACK_API_KEY || "",
    baseUrl: "https://api.keeptrack.space/v4",
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10) || 9000,
    accessKey: process.env.MINIO_ACCESS_KEY || "admin",
    secretKey: process.env.MINIO_SECRET_KEY || "admin123456",
    bucket: process.env.MINIO_BUCKET || "nova-space",
    useSSL: process.env.MINIO_USE_SSL === "true" || false,
    publicUrl: process.env.MINIO_PUBLIC_URL || "",
  },
  push: {
    enabled: process.env.PUSH_ENABLED === "true" || true,
    scheduleTime: parseInt(process.env.PUSH_SCHEDULE_TIME || "8", 10) || 8,
    batchSize: parseInt(process.env.PUSH_BATCH_SIZE || "10", 10) || 10,
    batchInterval: parseInt(process.env.PUSH_BATCH_INTERVAL || "1", 10) || 1,
  },
  useMockData: process.env.USE_MOCK_DATA === "true" || false,
}));
