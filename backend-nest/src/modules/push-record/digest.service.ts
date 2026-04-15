import { Injectable, Logger, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq, desc, gt, inArray, and } from "drizzle-orm";
import type { Database } from "../../database";
import { intelligences } from "../../database/schema/intelligences";
import { users } from "../../database/schema/users";
import axios from "axios";

interface DigestContent {
  intelligence: any[];
  spaceWeather: unknown;
  date: string;
}

interface SubscriptionRecord {
  user_id: string;
  subscription_types?: string | null;
  intelligence_categories?: string | null;
  intelligence_level?: string | null;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @Inject("DATABASE") private db: Database,
    private configService: ConfigService,
  ) {}

  async generateDigestContent(
    subscription: SubscriptionRecord,
  ): Promise<DigestContent> {
    const date = new Date().toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const content: DigestContent = {
      intelligence: [],
      spaceWeather: null,
      date,
    };

    const subscriptionTypes = subscription.subscription_types?.split(",") || [];

    if (subscriptionTypes.includes("intelligence")) {
      content.intelligence = await this.getIntelligenceContent(subscription);
    }

    if (subscriptionTypes.includes("space_weather")) {
      content.spaceWeather = await this.getSpaceWeatherContent();
    }

    return content;
  }

  async generateSimpleDigest(): Promise<DigestContent> {
    const date = new Date().toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const content: DigestContent = {
      intelligence: [],
      spaceWeather: null,
      date,
    };

    content.intelligence = await this.getIntelligenceContentSimple();
    content.spaceWeather = await this.getSpaceWeatherContent();

    return content;
  }

  private async getIntelligenceContent(
    subscription: SubscriptionRecord,
  ): Promise<any[]> {
    try {
      const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const userResult = await this.db
        .select()
        .from(users)
        .where(eq(users.id, subscription.user_id))
        .limit(1);
      const level = userResult[0]?.level || "basic";

      let whereLevels: string[] = ["free"];
      if (level === "professional") {
        whereLevels = ["free", "advanced", "professional"];
      } else if (level === "advanced") {
        whereLevels = ["free", "advanced"];
      }

      const items = await this.db
        .select({
          id: intelligences.id,
          title: intelligences.title,
          summary: intelligences.summary,
          category: intelligences.category,
          published_at: intelligences.published_at,
        })
        .from(intelligences)
        .where(
          and(
            inArray(intelligences.level, whereLevels as any),
            gt(intelligences.created_at, YESTERDAY),
          ),
        )
        .orderBy(desc(intelligences.created_at))
        .limit(3);

      return items;
    } catch (error) {
      this.logger.error("Failed to fetch intelligence", error);
      return [];
    }
  }

  private async getIntelligenceContentSimple(): Promise<any[]> {
    try {
      const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const items = await this.db
        .select({
          id: intelligences.id,
          title: intelligences.title,
          summary: intelligences.summary,
          category: intelligences.category,
          published_at: intelligences.published_at,
        })
        .from(intelligences)
        .where(
          and(
            eq(intelligences.level, "free"),
            gt(intelligences.created_at, YESTERDAY),
          ),
        )
        .orderBy(desc(intelligences.created_at))
        .limit(3);

      return items;
    } catch (error) {
      this.logger.error("Failed to fetch intelligence", error);
      return [];
    }
  }

  private async getSpaceWeatherContent(): Promise<unknown> {
    try {
      const [scalesRes, solarWindRes] = await Promise.all([
        axios.get("https://services.swpc.noaa.gov/products/noaa-scales.json", {
          timeout: 5000,
        }),
        axios.get(
          "https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json",
          { timeout: 5000 },
        ),
      ]);

      const scales = scalesRes.data;
      const solarWind = solarWindRes.data;

      return {
        dateStamp: scales["0"]?.DateStamp || null,
        timeStamp: scales["0"]?.TimeStamp || null,
        radiation: {
          scale: parseInt(scales["0"]?.R?.Scale) || 0,
          text: scales["0"]?.R?.Text || "none",
        },
        solarFlare: {
          scale: parseInt(scales["0"]?.S?.Scale) || 0,
          text: scales["0"]?.S?.Text || "none",
        },
        geomagnetic: {
          scale: parseInt(scales["0"]?.G?.Scale) || 0,
          text: scales["0"]?.G?.Text || "none",
        },
        solarWind: {
          speed: parseInt(solarWind.WindSpeed) || 0,
        },
      };
    } catch (error) {
      this.logger.error("Failed to fetch space weather from NOAA API", error);
      return null;
    }
  }
}
