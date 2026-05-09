ALTER TABLE "satellite_metadata"
  ALTER COLUMN "norad_id" TYPE varchar(50),
  ALTER COLUMN "object_id" TYPE varchar(100),
  ALTER COLUMN "cospar_launch_no" TYPE varchar(100),
  ALTER COLUMN "cospar_id" TYPE varchar(100),
  ALTER COLUMN "rcs" TYPE varchar(100),
  ALTER COLUMN "object_type" TYPE varchar(100),
  ALTER COLUMN "country_code" TYPE varchar(100),
  ALTER COLUMN "launch_pad" TYPE varchar(100),
  ALTER COLUMN "flight_no" TYPE varchar(100),
  ALTER COLUMN "object_class" TYPE varchar(100),
  ALTER COLUMN "dimensions" TYPE varchar(100),
  ALTER COLUMN "anomaly_flags" TYPE varchar(100);