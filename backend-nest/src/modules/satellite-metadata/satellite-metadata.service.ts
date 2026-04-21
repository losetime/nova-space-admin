import { Injectable, Logger, Inject } from "@nestjs/common";
import { eq, and, or, like, asc, sql, SQL } from "drizzle-orm";
import type { Database } from "../../database";
import { satelliteMetadata } from "../../database/schema/satellite-metadata";
import { QuerySatelliteMetadataDto } from "./dto/query-metadata.dto";

export interface SatelliteMetadataDetail {
  noradId: string;
  name: string | null;
  objectId: string | null;
  altName: string | null;
  objectType: string | null;
  status: string | null;
  countryCode: string | null;
  launchDate: string | null;
  stableDate: string | null;
  launchSite: string | null;
  launchPad: string | null;
  launchVehicle: string | null;
  flightNo: string | null;
  cosparLaunchNo: string | null;
  launchFailure: boolean | null;
  launchSiteName: string | null;
  decayDate: string | null;
  period: number | null;
  inclination: number | null;
  apogee: number | null;
  perigee: number | null;
  eccentricity: number | null;
  raan: number | null;
  argOfPerigee: number | null;
  rcs: string | null;
  stdMag: number | null;
  tleEpoch: string | null;
  tleAge: number | null;
  cosparId: string | null;
  objectClass: string | null;
  launchMass: number | null;
  shape: string | null;
  dimensions: string | null;
  span: number | null;
  mission: string | null;
  firstEpoch: string | null;
  operator: string | null;
  manufacturer: string | null;
  contractor: string | null;
  bus: string | null;
  configuration: string | null;
  purpose: string | null;
  power: string | null;
  motor: string | null;
  length: number | null;
  diameter: number | null;
  dryMass: number | null;
  equipment: string | null;
  adcs: string | null;
  payload: string | null;
  constellationName: string | null;
  lifetime: string | null;
  platform: string | null;
  color: string | null;
  materialComposition: string | null;
  majorEvents: string | null;
  relatedSatellites: string | null;
  transmitterFrequencies: string | null;
  sources: string | null;
  referenceUrls: string | null;
  summary: string | null;
  anomalyFlags: string | null;
  lastReviewed: string | null;
  predDecayDate: string | null;
  hasDiscosData: boolean;
  hasKeepTrackData: boolean;
  hasSpaceTrackData: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SatelliteMetadataListItem {
  noradId: string;
  name: string | null;
  countryCode: string | null;
  objectType: string | null;
  status: string | null;
  launchDate: string | null;
  objectClass: string | null;
  inclination: number | null;
  apogee: number | null;
  perigee: number | null;
  hasDiscosData: boolean;
  hasKeepTrackData: boolean;
  hasSpaceTrackData: boolean;
}

@Injectable()
export class SatelliteMetadataService {
  private readonly logger = new Logger(SatelliteMetadataService.name);

  constructor(@Inject("DATABASE") private readonly db: Database) {}

  async findAll(
    query: QuerySatelliteMetadataDto,
  ): Promise<{
    data: SatelliteMetadataListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, noradId, name } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (noradId) {
      conditions.push(eq(satelliteMetadata.noradId, noradId));
    }
    if (name) {
      conditions.push(like(satelliteMetadata.name, `%${name}%`));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const metas = await this.db
      .select({
        noradId: satelliteMetadata.noradId,
        name: satelliteMetadata.name,
        countryCode: satelliteMetadata.countryCode,
        objectType: satelliteMetadata.objectType,
        status: satelliteMetadata.status,
        launchDate: satelliteMetadata.launchDate,
        objectClass: satelliteMetadata.objectClass,
        inclination: satelliteMetadata.inclination,
        apogee: satelliteMetadata.apogee,
        perigee: satelliteMetadata.perigee,
        hasDiscosData: satelliteMetadata.hasDiscosData,
        hasKeepTrackData: satelliteMetadata.hasKeepTrackData,
        hasSpaceTrackData: satelliteMetadata.hasSpaceTrackData,
      })
      .from(satelliteMetadata)
      .where(whereClause)
      .orderBy(asc(satelliteMetadata.noradId))
      .limit(limit)
      .offset(offset);

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(satelliteMetadata)
      .where(whereClause);
    const total = Number(countResult[0]?.count || 0);

    const data: SatelliteMetadataListItem[] = metas.map((meta) => ({
      noradId: meta.noradId,
      name: meta.name,
      countryCode: meta.countryCode,
      objectType: meta.objectType,
      status: meta.status,
      launchDate: meta.launchDate
        ? typeof meta.launchDate === "string"
          ? meta.launchDate
          : meta.launchDate.toISOString().split("T")[0]
        : null,
      objectClass: meta.objectClass,
      inclination: meta.inclination,
      apogee: meta.apogee,
      perigee: meta.perigee,
      hasDiscosData: meta.hasDiscosData,
      hasKeepTrackData: meta.hasKeepTrackData,
      hasSpaceTrackData: meta.hasSpaceTrackData,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(noradId: string): Promise<SatelliteMetadataDetail | null> {
    const meta = await this.db
      .select()
      .from(satelliteMetadata)
      .where(eq(satelliteMetadata.noradId, noradId))
      .limit(1);

    if (!meta || meta.length === 0) {
      return null;
    }

    const m = meta[0];
    return {
      noradId: m.noradId,
      name: m.name,
      objectId: m.objectId,
      altName: m.altName,
      objectType: m.objectType,
      status: m.status,
      countryCode: m.countryCode,
      launchDate: m.launchDate
        ? typeof m.launchDate === "string"
          ? m.launchDate
          : m.launchDate.toISOString().split("T")[0]
        : null,
      stableDate: m.stableDate
        ? typeof m.stableDate === "string"
          ? m.stableDate
          : m.stableDate.toISOString().split("T")[0]
        : null,
      launchSite: m.launchSite,
      launchPad: m.launchPad,
      launchVehicle: m.launchVehicle,
      flightNo: m.flightNo,
      cosparLaunchNo: m.cosparLaunchNo,
      launchFailure: m.launchFailure,
      launchSiteName: m.launchSiteName,
      decayDate: m.decayDate
        ? typeof m.decayDate === "string"
          ? m.decayDate
          : m.decayDate.toISOString().split("T")[0]
        : null,
      period: m.period,
      inclination: m.inclination,
      apogee: m.apogee,
      perigee: m.perigee,
      eccentricity: m.eccentricity,
      raan: m.raan,
      argOfPerigee: m.argOfPerigee,
      rcs: m.rcs,
      stdMag: m.stdMag,
      tleEpoch: m.tleEpoch ? m.tleEpoch.toISOString() : null,
      tleAge: m.tleAge,
      cosparId: m.cosparId,
      objectClass: m.objectClass,
      launchMass: m.launchMass,
      shape: m.shape,
      dimensions: m.dimensions,
      span: m.span,
      mission: m.mission,
      firstEpoch: m.firstEpoch
        ? typeof m.firstEpoch === "string"
          ? m.firstEpoch
          : m.firstEpoch.toISOString().split("T")[0]
        : null,
      operator: m.operator,
      manufacturer: m.manufacturer,
      contractor: m.contractor,
      bus: m.bus,
      configuration: m.configuration,
      purpose: m.purpose,
      power: m.power,
      motor: m.motor,
      length: m.length,
      diameter: m.diameter,
      dryMass: m.dryMass,
      equipment: m.equipment,
      adcs: m.adcs,
      payload: m.payload,
      constellationName: m.constellationName,
      lifetime: m.lifetime,
      platform: m.platform,
      color: m.color,
      materialComposition: m.materialComposition,
      majorEvents: m.majorEvents,
      relatedSatellites: m.relatedSatellites,
      transmitterFrequencies: m.transmitterFrequencies,
      sources: m.sources,
      referenceUrls: m.referenceUrls,
      summary: m.summary,
      anomalyFlags: m.anomalyFlags,
      lastReviewed: m.lastReviewed ? m.lastReviewed.toISOString() : null,
      predDecayDate: m.predDecayDate
        ? typeof m.predDecayDate === "string"
          ? m.predDecayDate
          : m.predDecayDate.toISOString().split("T")[0]
        : null,
      hasDiscosData: m.hasDiscosData,
      hasKeepTrackData: m.hasKeepTrackData,
      hasSpaceTrackData: m.hasSpaceTrackData,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}