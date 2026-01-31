import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 数据文件路径
const DATA_FILE = path.join(process.cwd(), 'data', 'emails.json');

// 标签类型
export type UsageTag = '拼车无质保' | '拼车有质保' | '独享无质保' | '独享有质保';

// 类型定义
export interface EmailUsage {
  id: string;
  userName: string;
  usedAt: string;
  verifyCode: string | null;
  tag: UsageTag;
}

export interface Email {
  id: string;
  email: string;
  usedCount: number;
  maxUses: number;
  createdAt: string;
  updatedAt: string;
  usages: EmailUsage[];
}

interface Database {
  emails: Email[];
}

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取数据库
function readDB(): Database {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { emails: [] };
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { emails: [] };
  }
}

// 写入数据库
function writeDB(db: Database) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// 获取所有邮箱
export function getAllEmails(): Email[] {
  const db = readDB();
  return db.emails.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// 添加邮箱
export function addEmails(emailList: string[]): { added: number; skipped: number } {
  const db = readDB();
  const existingEmails = new Set(db.emails.map(e => e.email.toLowerCase()));
  
  let added = 0;
  let skipped = 0;
  
  for (const email of emailList) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      continue;
    }
    
    if (existingEmails.has(normalizedEmail)) {
      skipped++;
      continue;
    }
    
    const now = new Date().toISOString();
    db.emails.push({
      id: uuidv4(),
      email: normalizedEmail,
      usedCount: 0,
      maxUses: 3,
      createdAt: now,
      updatedAt: now,
      usages: [],
    });
    existingEmails.add(normalizedEmail);
    added++;
  }
  
  writeDB(db);
  return { added, skipped };
}

// 删除邮箱
export function deleteEmail(id: string): boolean {
  const db = readDB();
  const index = db.emails.findIndex(e => e.id === id);
  if (index === -1) return false;
  
  db.emails.splice(index, 1);
  writeDB(db);
  return true;
}

// 记录邮箱使用
export function recordUsage(
  id: string, 
  userName: string, 
  verifyCode: string | null
): { success: boolean; error?: string } {
  const db = readDB();
  const email = db.emails.find(e => e.id === id);
  
  if (!email) {
    return { success: false, error: '邮箱不存在' };
  }
  
  if (email.usedCount >= email.maxUses) {
    return { success: false, error: '该邮箱已达到最大使用次数' };
  }
  
  email.usages.push({
    id: uuidv4(),
    userName: userName.trim(),
    usedAt: new Date().toISOString(),
    verifyCode,
  });
  email.usedCount++;
  email.updatedAt = new Date().toISOString();
  
  writeDB(db);
  return { success: true };
}

// 获取邮箱详情
export function getEmail(id: string): Email | null {
  const db = readDB();
  return db.emails.find(e => e.id === id) || null;
}

// 手动添加使用记录
export function addUsage(
  emailId: string,
  userName: string,
  verifyCode: string | null,
  usedAt?: string,
  tag: UsageTag = '拼车无质保'
): { success: boolean; error?: string } {
  const db = readDB();
  const email = db.emails.find(e => e.id === emailId);

  if (!email) {
    return { success: false, error: '邮箱不存在' };
  }

  // 根据标签类型设置 maxUses
  if (tag.includes('独享')) {
    email.maxUses = 1;
  } else {
    // 拼车模式，设置为 3
    email.maxUses = 3;
  }

  email.usages.push({
    id: uuidv4(),
    userName: userName.trim(),
    usedAt: usedAt || new Date().toISOString(),
    verifyCode: verifyCode || null,
    tag,
  });
  email.usedCount = email.usages.length;
  email.updatedAt = new Date().toISOString();

  writeDB(db);
  return { success: true };
}

// 编辑使用记录
export function updateUsage(
  emailId: string,
  usageId: string,
  userName: string,
  verifyCode: string | null,
  usedAt?: string,
  tag?: UsageTag
): { success: boolean; error?: string } {
  const db = readDB();
  const email = db.emails.find(e => e.id === emailId);

  if (!email) {
    return { success: false, error: '邮箱不存在' };
  }

  const usage = email.usages.find(u => u.id === usageId);
  if (!usage) {
    return { success: false, error: '使用记录不存在' };
  }

  usage.userName = userName.trim();
  usage.verifyCode = verifyCode || null;
  if (usedAt) {
    usage.usedAt = usedAt;
  }
  if (tag) {
    usage.tag = tag;
    // 根据标签类型设置 maxUses
    if (tag.includes('独享')) {
      email.maxUses = 1;
    } else {
      // 拼车模式，恢复为 3
      email.maxUses = 3;
    }
  }
  email.updatedAt = new Date().toISOString();

  writeDB(db);
  return { success: true };
}

// 删除使用记录
export function deleteUsage(
  emailId: string,
  usageId: string
): { success: boolean; error?: string } {
  const db = readDB();
  const email = db.emails.find(e => e.id === emailId);

  if (!email) {
    return { success: false, error: '邮箱不存在' };
  }

  const usageIndex = email.usages.findIndex(u => u.id === usageId);
  if (usageIndex === -1) {
    return { success: false, error: '使用记录不存在' };
  }

  email.usages.splice(usageIndex, 1);
  email.usedCount = email.usages.length;
  email.updatedAt = new Date().toISOString();

  writeDB(db);
  return { success: true };
}
