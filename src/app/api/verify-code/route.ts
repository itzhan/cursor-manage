import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'http://192.229.99.46:5001';
const API_TOKEN = 'dev-public-token-change-me';
const COOKIE = 'outlooker_rtk=bc198c95f7c4486eb8557852f4b297a6.SJys0fdfs3iYhjDkUkzvbUZ4PwvVEMLAWTDCO6sJiuE';

// 从邮件内容中提取验证码
function extractVerifyCode(htmlContent: string): string | null {
  // 尝试多种方式提取6位数字验证码
  
  // 方式1: 查找 "验证码是" 或 "验证码是：" 后面的数字
  const codeMatch1 = htmlContent.match(/验证码[是为：:]\s*(\d{6})/);
  if (codeMatch1) return codeMatch1[1];
  
  // 方式2: 查找 letter-spacing:2px 样式后的6位数字（Cursor 邮件格式）
  const codeMatch2 = htmlContent.match(/letter-spacing:\s*2px[^>]*>(\d{6})</);
  if (codeMatch2) return codeMatch2[1];
  
  // 方式3: 查找独立的6位数字
  const codeMatch3 = htmlContent.match(/>(\d{6})</);
  if (codeMatch3) return codeMatch3[1];
  
  // 方式4: 查找任意6位数字
  const codeMatch4 = htmlContent.match(/\b(\d{6})\b/);
  if (codeMatch4) return codeMatch4[1];
  
  return null;
}

// 获取验证码
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: '请提供邮箱地址' }, { status: 400 });
    }

    // 调用外部 API 获取邮件
    const apiUrl = `${API_BASE}/api/messages?email=${encodeURIComponent(email)}&page_size=1&page=1`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Public-Token': API_TOKEN,
        'Cookie': COOKIE,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `接码服务请求失败: ${response.status}` 
      }, { status: 500 });
    }

    const data = await response.json();

    if (!data.success || !data.data?.items?.length) {
      return NextResponse.json({ 
        success: false,
        error: '暂无邮件',
        verifyCode: null,
      });
    }

    const latestEmail = data.data.items[0];
    const subject = latestEmail.subject || '';
    const bodyContent = latestEmail.body?.content || '';
    const receivedTime = latestEmail.receivedDateTime || '';

    // 只处理 Cursor 相关邮件
    const isCursorEmail = 
      subject.includes('Cursor') || 
      subject.includes('cursor') ||
      latestEmail.sender?.emailAddress?.address?.includes('cursor');

    if (!isCursorEmail) {
      return NextResponse.json({ 
        success: false,
        error: '最新邮件不是 Cursor 验证邮件',
        verifyCode: null,
        subject,
        receivedTime,
      });
    }

    // 提取验证码
    const verifyCode = extractVerifyCode(bodyContent);

    if (!verifyCode) {
      return NextResponse.json({ 
        success: false,
        error: '无法从邮件中提取验证码',
        verifyCode: null,
        subject,
        receivedTime,
      });
    }

    return NextResponse.json({ 
      success: true,
      verifyCode,
      subject,
      receivedTime,
      sender: latestEmail.sender?.emailAddress?.address,
    });
  } catch (error) {
    console.error('获取验证码失败:', error);
    return NextResponse.json({ 
      error: '获取验证码失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
