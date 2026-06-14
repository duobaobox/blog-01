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
  username: string;
  showPasswordNotice?: boolean;
};

export function AccountForm({
  defaultName,
  username,
  showPasswordNotice = false,
}: AccountFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [loginUsername, setLoginUsername] = useState(username);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg("");
    setNameError("");

    const normalizedUsername = loginUsername.trim().toLowerCase();

    if (!normalizedUsername) {
      setNameError("登录账号不能为空");
      return;
    }

    if (!/^[a-z0-9._-]{3,32}$/i.test(normalizedUsername)) {
      setNameError("登录账号支持 3-32 位字母、数字、点、下划线或短横线");
      return;
    }

    setNameLoading(true);

    const { error } = await authClient.updateUser({
      name,
      username: normalizedUsername,
      displayUsername: normalizedUsername,
    });

    setNameLoading(false);

    if (error) {
      setNameError(error.message || "更新失败");
    } else {
      setNameMsg("账号信息已更新");
      setLoginUsername(normalizedUsername);
      router.refresh();
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
      revokeOtherSessions: true,
    });

    setPwLoading(false);

    if (error) {
      setPwError(error.message || "修改失败，请确认当前密码是否正确");
    } else {
      setPwMsg("密码已修改，正在重新登录...");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await authClient.signOut();
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {showPasswordNotice ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          你当前仍在使用默认管理员凭据。建议现在就修改登录账号和密码，修改完成后首次初始化提醒会自动消失。
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">登录账号</Label>
              <Input
                id="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
              />
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
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
            {nameMsg && <p className="text-sm text-muted-foreground">{nameMsg}</p>}
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
