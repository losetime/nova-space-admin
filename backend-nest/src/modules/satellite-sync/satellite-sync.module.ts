import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { SatelliteSyncController } from "./satellite-sync.controller";
import { SatelliteSyncService } from "./satellite-sync.service";

@Module({
  imports: [DatabaseModule],
  controllers: [SatelliteSyncController],
  providers: [SatelliteSyncService],
  exports: [SatelliteSyncService],
})
export class SatelliteSyncModule {}
