import { Controller, Get, Param, Query, Logger } from "@nestjs/common";
import { SatelliteMetadataService } from "./satellite-metadata.service";
import { QuerySatelliteMetadataDto } from "./dto/query-metadata.dto";

@Controller("satellite-metadata")
export class SatelliteMetadataController {
  private readonly logger = new Logger(SatelliteMetadataController.name);

  constructor(private readonly metadataService: SatelliteMetadataService) {}

  @Get()
  async getList(@Query() query: QuerySatelliteMetadataDto) {
    this.logger.log(
      `获取卫星元数据列表：page=${query.page}, limit=${query.limit}, noradId=${query.noradId}, name=${query.name}`,
    );
    return this.metadataService.findAll(query);
  }

  @Get(":noradId")
  async getOne(@Param("noradId") noradId: string) {
    this.logger.log(`获取卫星元数据详情：noradId=${noradId}`);
    const meta = await this.metadataService.findOne(noradId);
    if (!meta) {
      return null;
    }
    return meta;
  }
}
