"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Plus,
  Copy,
  Check,
  Trash2,
  Key,
  User,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Edit2,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type UsageTag = '拼车无质保' | '拼车有质保' | '独享无质保' | '独享有质保';

interface EmailUsage {
  id: string;
  userName: string;
  usedAt: string;
  verifyCode: string | null;
  tag?: UsageTag;
}

interface Email {
  id: string;
  email: string;
  usedCount: number;
  maxUses: number;
  createdAt: string;
  updatedAt: string;
  usages: EmailUsage[];
}

export default function Home() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmails, setNewEmails] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "used">("available");

  // 接码相关状态
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyEmailTime, setVerifyEmailTime] = useState<string | null>(null);
  const [useDialogOpen, setUseDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [userName, setUserName] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordTag, setRecordTag] = useState<UsageTag>("拼车无质保");

  // 使用记录管理状态
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [editingUsage, setEditingUsage] = useState<EmailUsage | null>(null);
  const [usageUserName, setUsageUserName] = useState("");
  const [usageVerifyCode, setUsageVerifyCode] = useState("");
  const [usageDate, setUsageDate] = useState("");
  const [usageTag, setUsageTag] = useState<UsageTag>("拼车无质保");
  const [savingUsage, setSavingUsage] = useState(false);

  // 标签选项
  const tagOptions: UsageTag[] = ['拼车无质保', '拼车有质保', '独享无质保', '独享有质保'];

  // 删除确认对话框状态
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"email" | "usage">("email");
  const [deleteEmailId, setDeleteEmailId] = useState<string | null>(null);
  const [deleteUsageId, setDeleteUsageId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadEmails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/emails");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmails(data);
      }
    } catch (error) {
      console.error("加载邮箱失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  // 复制邮箱
  const copyEmail = async (email: string, id: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  // 批量添加邮箱
  const handleAddEmails = async () => {
    if (!newEmails.trim()) return;

    try {
      setAdding(true);
      const emailList = newEmails.split("\n").filter((e) => e.trim());
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: emailList }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setNewEmails("");
        setAddDialogOpen(false);
        loadEmails();
      } else {
        alert(data.error || "添加失败");
      }
    } catch (error) {
      alert("添加失败");
    } finally {
      setAdding(false);
    }
  };

  // 打开删除邮箱确认对话框
  const confirmDeleteEmail = (id: string) => {
    setDeleteType("email");
    setDeleteEmailId(id);
    setDeleteUsageId(null);
    setDeleteConfirmOpen(true);
  };

  // 打开删除使用记录确认对话框
  const confirmDeleteUsage = (emailId: string, usageId: string) => {
    setDeleteType("usage");
    setDeleteEmailId(emailId);
    setDeleteUsageId(usageId);
    setDeleteConfirmOpen(true);
  };

  // 执行删除操作
  const executeDelete = async () => {
    if (!deleteEmailId) return;

    try {
      setDeleting(true);
      if (deleteType === "email") {
        const res = await fetch(`/api/emails/${deleteEmailId}`, { method: "DELETE" });
        if (res.ok) {
          loadEmails();
        } else {
          alert("删除失败");
        }
      } else if (deleteType === "usage" && deleteUsageId) {
        const res = await fetch(`/api/emails/${deleteEmailId}/usages/${deleteUsageId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          loadEmails();
        } else {
          alert(data.error || "删除失败");
        }
      }
      setDeleteConfirmOpen(false);
    } catch (error) {
      alert("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  // 获取验证码
  const getVerifyCode = async (email: Email) => {
    setSelectedEmail(email);
    setVerifyingId(email.id);
    setVerifyCode(null);
    setVerifyError(null);
    setVerifyEmailTime(null);
    setUserName("");
    setRecordTag("拼车无质保");
    setUseDialogOpen(true);

    try {
      const res = await fetch(`/api/verify-code?email=${encodeURIComponent(email.email)}`);
      const data = await res.json();

      if (data.success && data.verifyCode) {
        setVerifyCode(data.verifyCode);
        setVerifyEmailTime(data.receivedTime || null);
      } else {
        setVerifyError(data.error || "获取验证码失败");
        setVerifyEmailTime(data.receivedTime || null);
      }
    } catch (error) {
      setVerifyError("获取验证码失败");
    } finally {
      setVerifyingId(null);
    }
  };

  // 刷新验证码
  const refreshVerifyCode = async () => {
    if (!selectedEmail) return;
    setVerifyingId(selectedEmail.id);
    setVerifyCode(null);
    setVerifyError(null);
    setVerifyEmailTime(null);

    try {
      const res = await fetch(`/api/verify-code?email=${encodeURIComponent(selectedEmail.email)}`);
      const data = await res.json();

      if (data.success && data.verifyCode) {
        setVerifyCode(data.verifyCode);
        setVerifyEmailTime(data.receivedTime || null);
      } else {
        setVerifyError(data.error || "获取验证码失败");
        setVerifyEmailTime(data.receivedTime || null);
      }
    } catch (error) {
      setVerifyError("获取验证码失败");
    } finally {
      setVerifyingId(null);
    }
  };

  // 记录使用
  const recordUsage = async () => {
    if (!selectedEmail || !userName.trim()) {
      alert("请输入使用者名字");
      return;
    }

    try {
      setRecording(true);
      const res = await fetch(`/api/emails/${selectedEmail.id}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: userName.trim(),
          verifyCode: verifyCode || null,
          tag: recordTag,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("记录成功！");
        setUseDialogOpen(false);
        setSelectedEmail(null);
        setUserName("");
        setVerifyCode(null);
        loadEmails();
      } else {
        alert(data.error || "记录失败");
      }
    } catch (error) {
      alert("记录失败");
    } finally {
      setRecording(false);
    }
  };

  // 获取北京时间格式化字符串 (用于 datetime-local input)
  const getBeijingTimeString = () => {
    const now = new Date();
    // 转换为北京时间 (UTC+8)
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return beijingTime.toISOString().slice(0, 16);
  };

  // 打开添加使用记录对话框
  const openAddUsageDialog = (email: Email) => {
    setSelectedEmail(email);
    setEditingUsage(null);
    setUsageUserName("");
    setUsageVerifyCode("");
    setUsageDate(getBeijingTimeString());
    setUsageTag("拼车无质保");
    setUsageDialogOpen(true);
  };

  // 打开编辑使用记录对话框
  const openEditUsageDialog = (email: Email, usage: EmailUsage) => {
    setSelectedEmail(email);
    setEditingUsage(usage);
    setUsageUserName(usage.userName);
    setUsageVerifyCode(usage.verifyCode || "");
    // 将 UTC 时间转换为北京时间显示
    const utcTime = new Date(usage.usedAt);
    const beijingTime = new Date(utcTime.getTime() + 8 * 60 * 60 * 1000);
    setUsageDate(beijingTime.toISOString().slice(0, 16));
    setUsageTag(usage.tag || "拼车无质保");
    setUsageDialogOpen(true);
  };

  // 保存使用记录（添加或编辑）
  const saveUsage = async () => {
    if (!selectedEmail || !usageUserName.trim()) {
      alert("请输入使用者名字");
      return;
    }

    try {
      setSavingUsage(true);
      // 用户输入的是北京时间，需要转换为 UTC 时间存储
      let usedAt: string | undefined;
      if (usageDate) {
        const beijingTime = new Date(usageDate);
        const utcTime = new Date(beijingTime.getTime() - 8 * 60 * 60 * 1000);
        usedAt = utcTime.toISOString();
      }

      if (editingUsage) {
        // 编辑
        const res = await fetch(`/api/emails/${selectedEmail.id}/usages/${editingUsage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: usageUserName.trim(),
            verifyCode: usageVerifyCode.trim() || null,
            usedAt,
            tag: usageTag,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert("更新成功！");
          setUsageDialogOpen(false);
          loadEmails();
        } else {
          alert(data.error || "更新失败");
        }
      } else {
        // 添加
        const res = await fetch(`/api/emails/${selectedEmail.id}/usages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: usageUserName.trim(),
            verifyCode: usageVerifyCode.trim() || null,
            usedAt,
            tag: usageTag,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert("添加成功！");
          setUsageDialogOpen(false);
          loadEmails();
        } else {
          alert(data.error || "添加失败");
        }
      }
    } catch (error) {
      alert(editingUsage ? "更新失败" : "添加失败");
    } finally {
      setSavingUsage(false);
    }
  };

  // 过滤邮箱
  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.usages.some((u) => u.userName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === "available") {
      return matchesSearch && email.usedCount < email.maxUses;
    }
    if (filterStatus === "used") {
      return matchesSearch && email.usedCount >= email.maxUses;
    }
    return matchesSearch;
  });

  // 统计数据
  const stats = {
    total: emails.length,
    available: emails.filter((e) => e.usedCount < e.maxUses).length,
    used: emails.filter((e) => e.usedCount >= e.maxUses).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <header className="border-b bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary p-2">
                <Mail className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Cursor 邮箱管理</h1>
                <p className="text-xs text-muted-foreground">管理邮箱 · 接码验证</p>
              </div>
            </div>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  批量添加
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>批量添加邮箱</DialogTitle>
                  <DialogDescription>每行一个邮箱地址</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="example1@outlook.com
example2@outlook.com
example3@outlook.com"
                    value={newEmails}
                    onChange={(e) => setNewEmails(e.target.value)}
                    className="min-h-[200px] font-mono"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddEmails} disabled={adding || !newEmails.trim()}>
                    {adding ? "添加中..." : "确认添加"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* 统计卡片 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">总邮箱数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                  <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">可用邮箱</p>
                  <p className="text-2xl font-bold">{stats.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900">
                  <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">已用完</p>
                  <p className="text-2xl font-bold">{stats.used}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索邮箱或使用者..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                  size="sm"
                >
                  全部
                </Button>
                <Button
                  variant={filterStatus === "available" ? "default" : "outline"}
                  onClick={() => setFilterStatus("available")}
                  size="sm"
                >
                  可用
                </Button>
                <Button
                  variant={filterStatus === "used" ? "default" : "outline"}
                  onClick={() => setFilterStatus("used")}
                  size="sm"
                >
                  已用完
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 邮箱列表 */}
        <Card>
          <CardHeader>
            <CardTitle>邮箱列表</CardTitle>
            <CardDescription>
              共 {filteredEmails.length} 个邮箱
              {searchTerm && ` (搜索: "${searchTerm}")`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {emails.length === 0 ? "暂无邮箱，点击右上角添加" : "没有匹配的邮箱"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmails.map((email) => (
                  <div key={email.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer select-none"
                      onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* 展开/收起图标 */}
                        <div className="flex-shrink-0 text-muted-foreground">
                          {expandedId === email.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>

                        {/* 邮箱地址 - 可点击复制 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyEmail(email.email, email.id);
                          }}
                          className="font-mono text-sm hover:text-primary transition-colors flex items-center gap-2 min-w-0"
                        >
                          <span className="truncate">{email.email}</span>
                          {copiedId === email.id ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>

                        {/* 使用次数 */}
                        <Badge
                          variant={email.usedCount >= email.maxUses ? "warning" : "success"}
                          className="flex-shrink-0"
                        >
                          {email.usedCount}/{email.maxUses}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* 接码按钮 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => getVerifyCode(email)}
                          disabled={email.usedCount >= email.maxUses}
                          className="gap-1"
                        >
                          <Key className="h-4 w-4" />
                          接码
                        </Button>

                        {/* 删除按钮 */}
                        <Button variant="ghost" size="icon" onClick={() => confirmDeleteEmail(email.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* 使用记录列表 */}
                    {expandedId === email.id && (
                      <div className="border-t bg-muted/30 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">使用记录:</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 h-7 text-xs"
                            onClick={() => openAddUsageDialog(email)}
                          >
                            <PlusCircle className="h-3 w-3" />
                            添加记录
                          </Button>
                        </div>
                        {email.usages.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-2">暂无使用记录</p>
                        ) : (
                          <div className="space-y-2">
                            {email.usages.map((usage) => (
                              <div
                                key={usage.id}
                                className="flex items-center justify-between text-sm bg-background rounded p-2 group"
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{usage.userName}</span>
                                  {usage.tag && (
                                    <Badge 
                                      variant={usage.tag.includes('有质保') ? 'success' : 'destructive'}
                                      className="text-xs"
                                    >
                                      {usage.tag}
                                    </Badge>
                                  )}
                                  {usage.verifyCode && (
                                    <Badge variant="outline" className="font-mono">
                                      {usage.verifyCode}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground text-xs">
                                    {format(new Date(usage.usedAt), "MM-dd HH:mm")}
                                  </span>
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => openEditUsageDialog(email, usage)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => confirmDeleteUsage(email.id, usage.id)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 接码和记录使用对话框 */}
      <Dialog open={useDialogOpen} onOpenChange={setUseDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>接码 & 记录使用</DialogTitle>
            <DialogDescription className="font-mono">{selectedEmail?.email}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 验证码显示 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">验证码</label>
                {verifyEmailTime && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {verifyEmailTime}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-2xl text-center tracking-widest">
                  {verifyingId ? (
                    <span className="text-muted-foreground text-base">获取中...</span>
                  ) : verifyCode ? (
                    <span className="text-green-600 dark:text-green-400">{verifyCode}</span>
                  ) : verifyError ? (
                    <span className="text-destructive text-sm">{verifyError}</span>
                  ) : (
                    <span className="text-muted-foreground text-base">-</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={refreshVerifyCode}
                  disabled={!!verifyingId}
                >
                  <RefreshCw className={`h-4 w-4 ${verifyingId ? "animate-spin" : ""}`} />
                </Button>
                {verifyCode && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(verifyCode);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* 使用者名字输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">使用者名字 *</label>
              <Input
                placeholder="输入使用者名字"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            {/* 类型标签 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <div className="grid grid-cols-2 gap-2">
                {tagOptions.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={recordTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRecordTag(tag)}
                    className={`text-xs ${
                      recordTag === tag
                        ? tag.includes('有质保')
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                        : ''
                    }`}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              {recordTag.includes('独享') && (
                <p className="text-xs text-amber-600">选择独享后，该邮箱将变为 1/1</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="success"
              onClick={recordUsage}
              disabled={recording || !userName.trim()}
              className="gap-1"
            >
              <Check className="h-4 w-4" />
              {recording ? "记录中..." : "记录本次使用"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手动管理使用记录对话框 */}
      <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingUsage ? "编辑使用记录" : "添加使用记录"}</DialogTitle>
            <DialogDescription className="font-mono">{selectedEmail?.email}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 使用者名字 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">使用者名字 *</label>
              <Input
                placeholder="输入使用者名字"
                value={usageUserName}
                onChange={(e) => setUsageUserName(e.target.value)}
              />
            </div>

            {/* 类型标签 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">类型</label>
              <div className="grid grid-cols-2 gap-2">
                {tagOptions.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={usageTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUsageTag(tag)}
                    className={`text-xs ${
                      usageTag === tag
                        ? tag.includes('有质保')
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                        : ''
                    }`}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
              {usageTag.includes('独享') && (
                <p className="text-xs text-amber-600">选择独享后，该邮箱将变为 1/1</p>
              )}
            </div>

            {/* 验证码（可选） */}
            <div className="space-y-2">
              <label className="text-sm font-medium">验证码（可选）</label>
              <Input
                placeholder="输入验证码"
                value={usageVerifyCode}
                onChange={(e) => setUsageVerifyCode(e.target.value)}
                className="font-mono"
              />
            </div>

            {/* 使用时间 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">使用时间</label>
              <Input
                type="datetime-local"
                value={usageDate}
                onChange={(e) => setUsageDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsageDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={saveUsage}
              disabled={savingUsage || !usageUserName.trim()}
            >
              {savingUsage ? "保存中..." : editingUsage ? "更新" : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              {deleteType === "email"
                ? "确定要删除这个邮箱吗？删除后将无法恢复，所有使用记录也会一并删除。"
                : "确定要删除这条使用记录吗？删除后将无法恢复。"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
