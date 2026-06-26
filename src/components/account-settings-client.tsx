"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import {
  Shield,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  MessageSquare,
  User as UserIcon,
} from "lucide-react";

interface AccountSettingsClientProps {
  userEmail: string;
  userName: string;
  userRole: "admin" | "user";
  prdCount: number;
  chatCount: number;
}

export function AccountSettingsClient({
  userEmail,
  userName,
  userRole,
  prdCount,
  chatCount,
}: AccountSettingsClientProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (confirmEmail.toLowerCase().trim() !== userEmail.toLowerCase()) {
      toast.error("Email konfirmasi tidak cocok.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(data.message, { duration: 5000 });
      setDeleteOpen(false);
      // Sign out + redirect
      await signOut({ callbackUrl: "/?deleted=1" });
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-transparent" />
        <div className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <UserIcon className="h-4 w-4 text-accent" />
            Profil
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nama</Label>
              <p className="mt-1 text-sm font-medium">{userName || "-"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="mt-1 truncate text-sm font-medium">{userEmail}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <div className="mt-1">
                {userRole === "admin" ? (
                  <Badge variant="outline" className="border-accent/40 text-accent">
                    <Shield className="mr-1 h-3 w-3" /> Admin
                  </Badge>
                ) : (
                  <Badge variant="outline">User</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Card>
        <div className="p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
            <FileText className="h-4 w-4 text-accent" />
            Statistik
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <FileText className="mb-2 h-5 w-5 text-accent" />
              <p className="font-display text-2xl font-bold">{prdCount}</p>
              <p className="text-xs text-muted-foreground">PRD dibuat</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <MessageSquare className="mb-2 h-5 w-5 text-accent" />
              <p className="font-display text-2xl font-bold">{chatCount}</p>
              <p className="text-xs text-muted-foreground">Chat thread</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <div className="p-6">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Zona Berbahaya
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Hapus akun permanen. Semua PRD ({prdCount}), chat thread ({chatCount}),
            dan data pribadi akan dihapus dan tidak bisa dikembalikan.
          </p>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Hapus akun saya
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Konfirmasi hapus akun
                </DialogTitle>
                <DialogDescription>
                  Tindakan ini <strong>tidak bisa dibatalkan</strong>. Semua data
                  berikut akan dihapus permanen:
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 space-y-2 rounded-lg border border-destructive/30 bg-destructive/[0.04] p-4">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-destructive" />
                  <span>{prdCount} PRD documents</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-destructive" />
                  <span>{chatCount} chat threads</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-destructive" />
                  <span>Akun & data pribadi</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-email" className="text-sm">
                  Ketik email kamu untuk konfirmasi:{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {userEmail}
                  </span>
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={userEmail}
                  disabled={deleting}
                  className="h-11"
                />
              </div>

              <DialogFooter className="mt-6">
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deleting}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={
                    deleting ||
                    confirmEmail.toLowerCase().trim() !== userEmail.toLowerCase()
                  }
                  className="gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Hapus permanen
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Privacy notice */}
      <Card className="bg-muted/30">
        <div className="p-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <Shield className="mr-1 inline h-3 w-3" />
            Sesuai{" "}
            <a
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Kebijakan Privasi
            </a>{" "}
            dan UU PDP No. 27/2022 Pasal 11, kamu berhak menghapus data pribadi
            kamu. Penghapusan akun bersifat permanen dan tidak bisa di-undo.
            Audit log (tanpa data pribadi) tetap disimpan untuk kepatuhan
            keamanan.
          </p>
        </div>
      </Card>
    </div>
  );
}
