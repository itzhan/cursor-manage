import { NextRequest, NextResponse } from 'next/server';
import { updateUsage, deleteUsage, UsageTag } from '@/lib/db';

// 编辑使用记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; usageId: string }> }
) {
  try {
    const { id, usageId } = await params;
    const { userName, verifyCode, usedAt, tag } = await request.json();

    if (!userName || !userName.trim()) {
      return NextResponse.json({ error: '请输入使用者名字' }, { status: 400 });
    }

    const result = updateUsage(id, usageId, userName, verifyCode || null, usedAt, tag as UsageTag);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新使用记录失败:', error);
    return NextResponse.json({ error: '更新使用记录失败' }, { status: 500 });
  }
}

// 删除使用记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; usageId: string }> }
) {
  try {
    const { id, usageId } = await params;
    const result = deleteUsage(id, usageId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除使用记录失败:', error);
    return NextResponse.json({ error: '删除使用记录失败' }, { status: 500 });
  }
}
