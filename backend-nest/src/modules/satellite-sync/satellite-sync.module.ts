import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SatelliteSyncController } from './satellite-sync.controller';
import { SatelliteSyncService } from './satellite-sync.service';
import {
  SatelliteSyncTaskEntity,
  SatelliteTle,
  SatelliteMetadataEntity,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SatelliteSyncTaskEntity,
      SatelliteTle,
      SatelliteMetadataEntity,
    ]),
  ],
  controllers: [SatelliteSyncController],
  providers: [SatelliteSyncService],
  exports: [SatelliteSyncService],
})
export class SatelliteSyncModule {}