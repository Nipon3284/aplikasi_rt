import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  let localIp = '127.0.0.1';
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
      if (localIp !== '127.0.0.1') break;
    }
  } catch (e) {
    console.error('Error getting local IP:', e);
  }

  return NextResponse.json({
    success: true,
    localIp,
    port: 3000,
    mobileUrl: `http://${localIp}:3000`,
  });
}
