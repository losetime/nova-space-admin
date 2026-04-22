import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { SatelliteMetadataController } from "./satellite-metadata.controller";
import { SatelliteMetadataService } from "./satellite-metadata.service";

@Module({
  imports: [DatabaseModule],
  controllers: [SatelliteMetadataController],
  providers: [SatelliteMetadataService],
  exports: [SatelliteMetadataService],
})
export class SatelliteMetadataModule {}
