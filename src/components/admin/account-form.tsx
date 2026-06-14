"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/infrastructure/auth/client";
import { updateAdminProfile } from "@/features/settings/actions/account.actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";

type AccountFormProps = {
  defaultName: string;
  showPasswordNotice?: boolean;
};

export function AccountForm({
  defaultName,
  showPasswordNotice = false,
}: AccountFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [savedName, setSavedName] = useState(defaultName);
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  const hasPendingNameChange = name.trim() !== savedName.trim();

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg("");
    setNameError("");

    setNameLoading(true);

    try {
      await updateAdminProfile({
        name,
      });
      setNameMsg("昵称已更新");
      setSavedName(name.trim());
      router.refresh();
    } catch (error) {
      setNameError(error instanceof Error ? error.message : "更新失败");
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg("");
    setNameError("");
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

    try {
      if (hasPendingNameChange) {
        await updateAdminProfile({
          name,
        });
        setSavedName(name.trim());
      }

      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        setPwError(error.message || "修改失败，请确认当前密码是否正确");
        return;
      }

      setPwMsg("密码已修改，正在重新登录...");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await authClient.signOut();
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      setPwError(
        error instanceof Error
          ? error.message
          : "保存账号信息失败，请稍后重试",
      );
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {showPasswordNotice ? (
        <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          你当前仍在使用默认管理员初始密码。建议现在改掉，改完后初始化提醒会自动消失。
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleNameSubmit} className="space-y-4">
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
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="输入当前密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="至少 8 位"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="再次输入新密码"
              />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            {hasPendingNameChange ? (
              <p className="text-sm text-muted-foreground">
                你有未保存的昵称修改。修改密码时会先自动保存昵称。
              </p>
            ) : null}
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
