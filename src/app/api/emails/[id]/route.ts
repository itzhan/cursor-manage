import { NextRequest, NextResponse } from 'next/server';
import { deleteEmail, getEmail } from '@/lib/db';

// 获取单个邮箱
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const email = getEmail(id);
    
    if (!email) {
      return NextResponse.json({ error: '邮箱不存在' }, { status: 404 });
    }
    
    return NextResponse.json(email);
  } catch (error) {
    console.error('获取邮箱失败:', error);
    return NextResponse.json({ error: '获取邮箱失败' }, { status: 500 });
  }
}

// 删除邮箱
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteEmail(id);
    
    if (!success) {
      return NextResponse.json({ error: '邮箱不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除邮箱失败:', error);
    return NextResponse.json({ error: '删除邮箱失败' }, { status: 500 });
  }
}
