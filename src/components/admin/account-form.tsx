"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/infrastructure/auth/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";

type AccountFormProps = {
  defaultName: string;
  email: string;
  showPasswordNotice?: boolean;
};

export function AccountForm({
  defaultName,
  email,
  showPasswordNotice = false,
}: AccountFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg("");
    setNameLoading(true);

    const { error } = await authClient.updateUser({ name });

    setNameLoading(false);

    if (error) {
      setNameMsg(error.message || "更新失败");
    } else {
      setNameMsg("昵称已更新");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");

    if (newPassword !== confirmPassword) {
      setPwError("两次输入的密码不一致");
      return;
    }

    if (newPassword.length < 8) {
      setPwError("新密码至少 8 位");
      return;
    }

    setPwLoading(true);

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
    });

    setPwLoading(false);

    if (error) {
      setPwError(error.message || "修改失败，请确认当前密码是否正确");
    } else {
      setPwMsg("密码已修改");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {showPasswordNotice ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          你当前仍在使用默认管理员密码。建议现在就修改，修改完成后首次初始化提醒会自动消失。
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input value={email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">昵称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {nameMsg && (
              <p className="text-sm text-muted-foreground">{nameMsg}</p>
            )}
            <Button type="submit" disabled={nameLoading}>
              {nameLoading ? "保存中..." : "保存"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">修改密码</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="输入当前密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="至少 8 位"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="再次输入新密码"
              />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            {pwMsg && <p className="text-sm text-muted-foreground">{pwMsg}</p>}
            <Button type="submit" disabled={pwLoading}>
              {pwLoading ? "修改中..." : "修改密码"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
