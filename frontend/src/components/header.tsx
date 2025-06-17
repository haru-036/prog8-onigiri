import { FileText, MailPlus, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

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
          <Button variant={"outline"}>
            <MailPlus />
            メンバー招待
          </Button>
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
