import { NextRequest, NextResponse } from 'next/server';
import { addUsage, UsageTag } from '@/lib/db';

// 手动添加使用记录
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userName, verifyCode, usedAt, tag } = await request.json();

    if (!userName || !userName.trim()) {
      return NextResponse.json({ error: '请输入使用者名字' }, { status: 400 });
    }

    const result = addUsage(id, userName, verifyCode || null, usedAt, tag as UsageTag);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('添加使用记录失败:', error);
    return NextResponse.json({ error: '添加使用记录失败' }, { status: 500 });
  }
}
