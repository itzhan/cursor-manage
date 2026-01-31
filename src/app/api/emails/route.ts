import { NextRequest, NextResponse } from 'next/server';
import { getAllEmails, addEmails } from '@/lib/db';

// 获取所有邮箱
export async function GET() {
  try {
    const emails = getAllEmails();
    return NextResponse.json(emails);
  } catch (error) {
    console.error('获取邮箱失败:', error);
    return NextResponse.json({ error: '获取邮箱失败' }, { status: 500 });
  }
}

// 批量添加邮箱
export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json();
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: '无效的邮箱数据' }, { status: 400 });
    }

    const result = addEmails(emails);

    return NextResponse.json({ 
      success: true, 
      added: result.added, 
      skipped: result.skipped,
      message: `成功添加 ${result.added} 个邮箱${result.skipped > 0 ? `，跳过 ${result.skipped} 个已存在的` : ''}`
    });
  } catch (error) {
    console.error('添加邮箱失败:', error);
    return NextResponse.json({ error: '添加邮箱失败' }, { status: 500 });
  }
}
