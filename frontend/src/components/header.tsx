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

export default function Header() {
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
          <Dialog>
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
                />
              </div>
              <DialogFooter className="sm:justify-end">
                <Button type="button">送信</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button>
            <Plus />
            新規タスク
          </Button>
          <Avatar>
            <AvatarImage src="https://api.dicebear.com/9.x/glass/svg" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
