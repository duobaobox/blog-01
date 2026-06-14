"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/infrastructure/auth/client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";

type AdminLoginFormProps = {
  defaultUsername?: string | null;
  defaultPassword?: string | null;
};

export function AdminLoginForm({
  defaultUsername,
  defaultPassword,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(defaultUsername || "");
  const [password, setPassword] = useState(defaultPassword || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await authClient.signIn.username({
      username,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message || "登录失败");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理员登录</CardTitle>
          <CardDescription>登录后台管理博客内容</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {defaultUsername && defaultPassword ? (
              <div className="rounded-lg border border-border/70 bg-muted/30 px-3.5 py-3 text-sm text-muted-foreground">
                默认管理员账号已经准备好。首次登录后建议先修改密码，再补齐站点基础信息。
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="username">登录账号</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="输入登录账号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
