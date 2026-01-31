# Cursor 邮箱管理系统

一个轻量级的邮箱管理系统，使用 JSON 文件存储数据。

## 功能特性

- **批量添加邮箱**：支持一次添加多个邮箱，自动去重
- **使用次数限制**：每个邮箱最多使用3次
- **使用记录**：记录每次使用者的名字和时间
- **点击复制**：点击邮箱地址即可复制
- **接码功能**：自动获取 Cursor 验证码

## 技术栈

- **框架**：Next.js 16 (App Router)
- **数据存储**：JSON 文件（无需数据库）
- **UI**：Tailwind CSS + shadcn/ui 风格组件

## 快速开始

```bash
cd cursor-manager

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000（或显示的端口）

## 数据存储

数据保存在 `data/emails.json` 文件中，格式如下：

```json
{
  "emails": [
    {
      "id": "uuid",
      "email": "example@outlook.com",
      "usedCount": 0,
      "maxUses": 3,
      "createdAt": "2026-01-31T10:00:00.000Z",
      "updatedAt": "2026-01-31T10:00:00.000Z",
      "usages": [
        {
          "id": "uuid",
          "userName": "张三",
          "usedAt": "2026-01-31T10:00:00.000Z",
          "verifyCode": "123456"
        }
      ]
    }
  ]
}
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/emails | 获取所有邮箱 |
| POST | /api/emails | 批量添加邮箱 |
| DELETE | /api/emails/[id] | 删除邮箱 |
| POST | /api/emails/[id]/use | 记录使用 |
| GET | /api/verify-code?email=xxx | 获取验证码 |
