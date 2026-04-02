import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

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
      this.configService.get<string>('app.email.user') ||
      'noreply@nova-space.com';
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('app.email.host');
    const port = this.configService.get<number>('app.email.port');
    const user = this.configService.get<string>('app.email.user');
    const pass = this.configService.get<string>('app.email.pass');

    if (!host || !user || !pass) {
      this.logger.warn(
        'Email configuration not complete. Email sending will be disabled.',
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
        'Email transporter not configured. Skipping email send.',
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
        'Email transporter not configured. Skipping email send.',
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Nova Space 测试推送',
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
    let content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; padding: 30px; border-radius: 12px;">
        <h1 style="color: #00d4ff; text-align: center; margin-bottom: 30px;">Nova Space 每日资讯</h1>
        <p style="color: #888; text-align: center; margin-bottom: 30px;">${data.date}</p>
    `;

    // 空间天气预警部分
    if (data.spaceWeather && data.spaceWeather.hasAlert) {
      content += `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #ef4444; margin-top: 0;">🚨 空间天气预警</h2>
          <div style="color: #ccc; font-size: 14px;">
      `;
      data.spaceWeather.alerts.forEach((alert: any) => {
        content += `
          <div style="background: rgba(239, 68, 68, 0.2); padding: 10px; border-radius: 6px; margin-top: 10px;">
            <p style="margin: 0; color: #fff;"><strong>${alert.type}</strong> - ${alert.time}</p>
            <p style="margin: 5px 0 0 0; color: #aaa; font-size: 13px;">${alert.summary}</p>
          </div>
        `;
      });
      content += `
          </div>
        </div>
      `;
    } else if (data.spaceWeather === null) {
      content += `
        <div style="text-align: center; padding: 20px; color: #666; margin-bottom: 20px;">
          <p>暂无空间天气数据</p>
        </div>
      `;
    }

    // 航天情报部分
    if (data.intelligence && data.intelligence.length > 0) {
      content += `
        <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 20px;">
          <h2 style="color: #a855f7; margin-top: 0;">🛰️ 航天情报 (${data.intelligence.length}条)</h2>
      `;
      data.intelligence.forEach((item: any) => {
        content += `
          <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 6px; margin-bottom: 10px;">
            <h4 style="color: #fff; margin: 0 0 8px 0;">${item.title}</h4>
            <p style="color: #aaa; margin: 0; font-size: 14px; line-height: 1.5;">${item.summary || ''}</p>
            <a href="${this.configService.get<string>('app.frontend.url')}/intelligence/${item.id}" 
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
          <a href="${this.configService.get<string>('app.frontend.url')}" style="color: #00d4ff;">访问 Nova Space</a>
        </p>
      </div>
    `;

    return content;
  }

  private generateDigestText(data: DigestData): string {
    let content = `Nova Space 每日资讯 - ${data.date}\n\n`;

    if (data.spaceWeather && data.spaceWeather.hasAlert) {
      content += `空间天气预警\n`;
      data.spaceWeather.alerts.forEach((alert: any) => {
        content += `- ${alert.type}: ${alert.summary}\n`;
      });
      content += `\n`;
    }

    if (data.intelligence && data.intelligence.length > 0) {
      content += `航天情报\n`;
      data.intelligence.forEach((item: any) => {
        content += `- ${item.title}\n  ${item.summary || ''}\n`;
      });
    } else {
      content += `今日无重要资讯\n`;
    }

    return content;
  }
}