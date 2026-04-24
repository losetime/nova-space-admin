import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

interface DigestData {
  intelligence?: any[];
  spaceWeather?: any;
  date: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    // 发件人必须与SMTP登录用户一致（邮件服务商限制）
    this.fromEmail =
      this.configService.get<string>("app.email.user") ||
      "noreply@nova-space.com";
  }

  private initializeTransporter() {
    const host = this.configService.get<string>("app.email.host");
    const port = this.configService.get<number>("app.email.port");
    const user = this.configService.get<string>("app.email.user");
    const pass = this.configService.get<string>("app.email.pass");

    if (!host || !user || !pass) {
      this.logger.warn(
        "Email configuration not complete. Email sending will be disabled.",
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: port || 587,
      secure: (port || 587) === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendDailyDigest(email: string, data: DigestData): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        "Email transporter not configured. Skipping email send.",
      );
      return false;
    }

    const html = this.generateDigestHtml(data);
    const text = this.generateDigestText(data);

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: `Nova Space 每日资讯 - ${data.date}`,
        html,
        text,
      });
      this.logger.log(`Daily digest sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send daily digest to ${email}`, error);
      return false;
    }
  }

  async sendTestEmail(email: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        "Email transporter not configured. Skipping email send.",
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: "Nova Space 测试推送",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #00d4ff;">Nova Space 测试推送</h1>
            <p>这是一封测试邮件，如果您收到此邮件，说明推送服务配置正常。</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              此邮件由 Nova Space Admin 自动发送，请勿直接回复。
            </p>
          </div>
        `,
      });
      this.logger.log(`Test email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send test email to ${email}`, error);
      return false;
    }
  }

  private generateDigestHtml(data: DigestData): string {
    const SITE_URL = "https://space.nuoweibd.com";
    let content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; padding: 30px; border-radius: 12px;">
        <h1 style="color: #00d4ff; text-align: center; margin-bottom: 30px;">Nova Space 每日资讯</h1>
        <p style="color: #888; text-align: center; margin-bottom: 30px;">${data.date}</p>
    `;

    if (data.spaceWeather) {
      const sw = data.spaceWeather;
      const hasWarning =
        sw.radiation?.scale > 0 ||
        sw.solarFlare?.scale > 0 ||
        sw.geomagnetic?.scale > 0;
      const titleColor = hasWarning ? "#ef4444" : "#22c55e";
      const icon = hasWarning ? "🚨" : "☀️";

      const translateText = (text: string, scale: number): string => {
        if (!text || text === "none" || scale === 0) return "平静";
        const map: Record<string, string> = {
          minor: "微弱",
          moderate: "中等",
          strong: "强烈",
          severe: "严重",
          extreme: "极端",
        };
        return map[text.toLowerCase()] || text;
      };

      content += `
        <div style="margin-bottom: 20px;">
          <h2 style="color: ${titleColor}; margin-top: 0; margin-bottom: 24px;">${icon} 空间天气</h2>
          <div style="color: #ccc; font-size: 14px; line-height: 1.8;">
            <p style="margin: 5px 0;">辐射风暴 (R): <strong style="color: ${sw.radiation?.scale > 0 ? "#ef4444" : "#22c55e"};">R${sw.radiation?.scale || 0} ${translateText(sw.radiation?.text, sw.radiation?.scale)}</strong></p>
            <p style="margin: 5px 0;">太阳耀斑 (S): <strong style="color: ${sw.solarFlare?.scale > 0 ? "#ef4444" : "#22c55e"};">S${sw.solarFlare?.scale || 0} ${translateText(sw.solarFlare?.text, sw.solarFlare?.scale)}</strong></p>
            <p style="margin: 5px 0;">地磁暴 (G): <strong style="color: ${sw.geomagnetic?.scale > 0 ? "#ef4444" : "#22c55e"};">G${sw.geomagnetic?.scale || 0} ${translateText(sw.geomagnetic?.text, sw.geomagnetic?.scale)}</strong></p>
            <p style="margin: 5px 0;">太阳风速度: <strong style="color: #00d4ff;">${sw.solarWind?.speed || 0} km/s</strong></p>
          </div>
        </div>
      `;
    } else {
      content += `
        <div style="text-align: center; padding: 20px; color: #666; margin-bottom: 20px;">
          <p>暂无空间天气数据</p>
        </div>
      `;
    }

    if (data.intelligence && data.intelligence.length > 0) {
      content += `
        <div>
          <h2 style="color: #a855f7; margin-top: 0; margin-bottom: 24px;">🛰️ 航天情报 (${data.intelligence.length}条)</h2>
      `;
      data.intelligence.forEach((item: any) => {
        content += `
          <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-bottom: 10px;">
            <h4 style="color: #fff; margin: 0 0 8px 0;">${item.title}</h4>
            <p style="color: #aaa; margin: 0; font-size: 14px; line-height: 1.5;">${item.summary || ""}</p>
            <a href="${SITE_URL}/intelligence/${item.id}" 
               style="color: #00d4ff; text-decoration: none; font-size: 12px; display: inline-block; margin-top: 8px;">
              查看详情 →
            </a>
          </div>
        `;
      });
      content += `</div>`;
    } else {
      content += `
        <div style="text-align: center; padding: 40px 20px;">
          <p style="color: #888; font-size: 16px;">今日无重要资讯</p>
          <p style="color: #666; font-size: 14px;">我们会持续关注航天动态，有重要消息第一时间推送给您</p>
        </div>
      `;
    }

    content += `
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
          此邮件由 Nova Space 自动发送<br>
          <a href="${SITE_URL}" style="color: #00d4ff;">访问 Nova Space</a>
        </p>
      </div>
    `;

    return content;
  }

  private generateDigestText(data: DigestData): string {
    let content = `Nova Space 每日资讯 - ${data.date}\n\n`;

    if (data.spaceWeather) {
      const sw = data.spaceWeather;
      const translateText = (text: string, scale: number): string => {
        if (!text || text === "none" || scale === 0) return "平静";
        const map: Record<string, string> = {
          minor: "微弱",
          moderate: "中等",
          strong: "强烈",
          severe: "严重",
          extreme: "极端",
        };
        return map[text.toLowerCase()] || text;
      };
      content += `空间天气:\n`;
      content += `- 辐射风暴(R): R${sw.radiation?.scale || 0} ${translateText(sw.radiation?.text, sw.radiation?.scale)}\n`;
      content += `- 太阳耀斑(S): S${sw.solarFlare?.scale || 0} ${translateText(sw.solarFlare?.text, sw.solarFlare?.scale)}\n`;
      content += `- 地磁暴(G): G${sw.geomagnetic?.scale || 0} ${translateText(sw.geomagnetic?.text, sw.geomagnetic?.scale)}\n`;
      content += `- 太阳风速度: ${sw.solarWind?.speed || 0} km/s\n\n`;
    }

    if (data.intelligence && data.intelligence.length > 0) {
      content += `航天情报\n`;
      data.intelligence.forEach((item: any) => {
        content += `- ${item.title}\n  ${item.summary || ""}\n`;
      });
    } else {
      content += `今日无重要资讯\n`;
    }

    content += `\n访问 https://space.nuoweibd.com\n`;
    return content;
  }
}
