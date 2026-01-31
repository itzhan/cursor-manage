import { NextRequest, NextResponse } from 'next/server';
import { recordUsage } from '@/lib/db';

// 记录邮箱使用
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userName, verifyCode } = await request.json();

    if (!userName || !userName.trim()) {
      return NextResponse.json({ error: '请输入使用者名字' }, { status: 400 });
    }

    const result = recordUsage(id, userName, verifyCode || null);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('记录使用失败:', error);
    return NextResponse.json({ error: '记录使用失败' }, { status: 500 });
  }
}
