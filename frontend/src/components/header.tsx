import { FileText, MailPlus, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useParams } from "react-router";
import { useState } from "react";

export default function Header() {
  const urlParams = useParams<{ groupId: string }>();
  const groupId = urlParams.groupId;
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  const handleInviteMember = () => {
    mutation.mutate(email);
  };

  const mutation = useMutation({
    mutationKey: ["inviteMember"],
    mutationFn: async (email: string) => {
      const res = await api.post(`/groups/${groupId}/invite`, { email });
      return res.data;
    },
    onSuccess: () => {
      // 招待成功時の処理
      console.log("Member invited successfully");
      setEmail(""); // 入力フィールドをクリア
      setOpen(false); // ダイアログを閉じる
    },
  });

  return (
    <div className="w-full bg-white border-b border-border">
      <div className="flex items-center justify-between py-3 px-3 max-w-7xl xl:container mx-auto">
        <div className="flex items-center gap-1.5">
          <span className="bg-linear-to-tr from-purple-700 to-primary rounded-md size-8 grid place-content-center">
            <FileText className="size-4 text-white" />
          </span>
          <div className="font-bold text-lg">TaskExtract</div>
        </div>
        <div className="flex items-center gap-4">
          {/* TODO: メンバー招待はリーダーだけに表示する */}
          {groupId && (
            <>
              {/* メンバー招待ダイアログ */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant={"outline"}>
                    <MailPlus />
                    メンバー招待
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>メンバー招待</DialogTitle>
                    <DialogDescription>
                      メンバーを招待するには、メールアドレスを入力してください。
                      招待されたメンバーは、タスクの閲覧やコメントが可能になります。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      className="py-2"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <DialogFooter className="sm:justify-end">
                    <Button
                      type="button"
                      onClick={handleInviteMember}
                      disabled={!email || mutation.isPending}
                    >
                      {mutation.isPending ? "送信中..." : "メール送信"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button>
                <Plus />
                新規タスク
              </Button>
            </>
          )}

          <Avatar className="size-9">
            <AvatarImage src="https://api.dicebear.com/9.x/glass/svg" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
