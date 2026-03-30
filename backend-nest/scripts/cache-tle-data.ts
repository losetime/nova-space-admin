/**
 * TLE 数据缓存脚本
 * 从 CelesTrak 和 Space-Track 获取 TLE 数据并缓存到本地文件
 */

import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');
const CELESTRAK_CACHE_FILE = path.join(DATA_DIR, 'celestrak-tle-cache.json');
const SPACE_TRACK_CACHE_FILE = path.join(DATA_DIR, 'space-track-tle-cache.json');

// Space-Track 配置
const SPACE_TRACK_USERNAME = process.env.SPACE_TRACK_USERNAME || '';
const SPACE_TRACK_PASSWORD = process.env.SPACE_TRACK_PASSWORD || '';

/**
 * 解析 TLE 文本格式为 JSON
 * TLE 格式：每颗卫星 3 行（名称行 + TLE 第 1 行 + TLE 第 2 行）
 */
function parseTleText(text: string): any[] {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const result: any[] = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 >= lines.length) break;

    const nameLine = lines[i].trim();
    const tleLine1 = lines[i + 1].trim();
    const tleLine2 = lines[i + 2].trim();

    // 跳过非 TLE 数据行
    if (!tleLine1.startsWith('1 ') || !tleLine2.startsWith('2 ')) continue;

    // 从 TLE Line 1 提取 NORAD ID (第 3-7 位)
    const noradId = tleLine1.substring(2, 7).trim();

    // 从 TLE Line 1 提取 Epoch (第 19-32 位)
    const epochStr = tleLine1.substring(18, 32).trim();

    // 解析 Epoch 年份
    let epochYear = parseInt(epochStr.substring(0, 2), 10);
    epochYear = epochYear > 57 ? 1900 + epochYear : 2000 + epochYear;
    const epochDay = parseFloat(epochStr.substring(2));
    const epochDate = new Date(epochYear, 0, 1);
    epochDate.setDate(epochDate.getDate() + Math.floor(epochDay));

    result.push({
      OBJECT_NAME: nameLine,
      NORAD_CAT_ID: noradId,
      TLE_LINE0: nameLine,
      TLE_LINE1: tleLine1,
      TLE_LINE2: tleLine2,
      EPOCH: epochDate.toISOString(),
    });
  }

  return result;
}

/**
 * 获取 CelesTrak TLE 数据
 */
async function fetchCelestrakData(): Promise<any[]> {
  console.log('正在从 CelesTrak 获取 TLE 数据...');

  // 使用 TLE 文本格式 - 活跃卫星
  const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';

  // 使用像浏览器的 User-Agent
  const response = await axios.get(url, {
    headers: {
      'Accept': 'text/plain',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
    maxRedirects: 5,
  });

  if (response.status !== 200) {
    throw new Error(`CelesTrak API 错误：${response.status} ${response.statusText}`);
  }

  const text = response.data;
  const data = parseTleText(text);
  console.log(`获取到 ${data.length} 条 CelesTrak 数据`);

  return data;
}

/**
 * 登录 Space-Track 获取 session cookie
 */
async function loginSpaceTrack(): Promise<string> {
  if (!SPACE_TRACK_USERNAME || !SPACE_TRACK_PASSWORD) {
    throw new Error('Space-Track 凭据未配置');
  }

  console.log('正在登录 Space-Track...');

  const url = 'https://www.space-track.org/ajaxauth/login';

  const response = await axios.post(url,
    `identity=${encodeURIComponent(SPACE_TRACK_USERNAME)}&password=${encodeURIComponent(SPACE_TRACK_PASSWORD)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Nova-Space-Admin/1.0',
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`Space-Track 登录失败：${response.status}`);
  }

  const cookies = response.headers['set-cookie'] as string | string[] | undefined;
  if (!cookies) {
    throw new Error('未获取到 session cookie');
  }

  const sessionCookie = Array.isArray(cookies)
    ? cookies.map((c: string) => c.split(';')[0]).join('; ')
    : cookies.split(',').map((c: string) => c.split(';')[0]).join('; ');
  console.log('Space-Track 登录成功');

  return sessionCookie;
}

/**
 * 获取 Space-Track TLE 数据（分批次）
 */
async function fetchSpaceTrackData(): Promise<any[]> {
  const sessionCookie = await loginSpaceTrack();

  const batches = [
    { range: '1--9999', name: '早期卫星' },
    { range: '10000--19999', name: '1980s-1990s' },
    { range: '20000--29999', name: '1990s-2000s' },
    { range: '30000--39999', name: '2000s-2010s' },
    { range: '40000--49999', name: '2010s-2020s' },
    { range: '50000--99999', name: '2020s 至今' },
  ];

  const allData: any[] = [];

  for (const batch of batches) {
    console.log(`获取批次：${batch.name} (NORAD ID ${batch.range})`);

    const url = `https://www.space-track.org/basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/decay_date/null-val/epoch/>now-10/NORAD_CAT_ID/${batch.range}/format/json`;

    const response = await axios.get(url, {
      headers: {
        Cookie: sessionCookie,
        'User-Agent': 'Nova-Space-Admin/1.0',
      },
      timeout: 180000,
    });

    if (response.status !== 200) {
      console.error(`批次 ${batch.name} 失败：${response.status}`);
      continue;
    }

    const data = response.data;
    console.log(`批次 ${batch.name} 获取到 ${data.length} 条数据`);

    allData.push(...data);

    // 批次间隔，避免触发限流
    await sleep(3000);
  }

  console.log(`Space-Track 共获取到 ${allData.length} 条数据`);
  return allData;
}

/**
 * 保存缓存文件
 */
function saveCacheFile(filePath: string, source: string, data: any[]) {
  const cache = {
    source,
    description: source === 'celestrak'
      ? 'CelesTrak TLE 数据缓存 - GROUP=active (活跃卫星)'
      : 'Space-Track TLE 数据缓存 - PAYLOAD 类型',
    url: source === 'celestrak'
      ? 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json'
      : 'https://www.space-track.org/basicspacedata/query/class/gp/OBJECT_TYPE/PAYLOAD/decay_date/null-val/epoch/>now-10/format/json',
    cachedAt: new Date().toISOString(),
    count: data.length,
    data,
  };

  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), 'utf-8');
  console.log(`缓存文件已保存：${filePath}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 主函数
 */
async function main() {
  console.log('=== TLE 数据缓存脚本 ===\n');

  // 确保数据目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let celestrakData: any[] = [];
  let spaceTrackData: any[] = [];

  try {
    // 1. 获取并缓存 CelesTrak 数据（可能因限流失败）
    console.log('\n--- CelesTrak 数据 ---');
    try {
      celestrakData = await fetchCelestrakData();
      saveCacheFile(CELESTRAK_CACHE_FILE, 'celestrak', celestrakData);
    } catch (error: any) {
      console.warn(`CelesTrak 获取失败：${error.message}`);
      console.warn('跳过 CelesTrak，继续获取 Space-Track 数据...');
    }

    // 间隔 5 秒，避免触发限流
    console.log('等待 5 秒后继续...');
    await sleep(5000);

    // 2. 获取并缓存 Space-Track 数据
    console.log('\n--- Space-Track 数据 ---');
    spaceTrackData = await fetchSpaceTrackData();
    saveCacheFile(SPACE_TRACK_CACHE_FILE, 'space-track', spaceTrackData);

    console.log('\n=== 缓存完成 ===');
    console.log(`CelesTrak: ${celestrakData.length} 条`);
    console.log(`Space-Track: ${spaceTrackData.length} 条`);
  } catch (error) {
    console.error('缓存失败:', error);
    process.exit(1);
  }
}

main();
