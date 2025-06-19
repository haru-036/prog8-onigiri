import { Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Button } from "./components/ui/button";
import { Link } from "react-router";

export default function GroupsList() {
  const groups = ["a"];
  return (
    <div className="grow py-8 max-w-5xl mx-auto px-4 w-full">
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">マイグループ</h1>
          <p className="text-muted-foreground">
            参加しているグループの一覧です
          </p>
        </div>
        <Button>
          <Plus />
          グループ作成
        </Button>
      </div>

      {groups.length > 0 ? (
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <GroupCard />
          <GroupCard />
        </div>
      ) : (
        <div className="py-6 text-center flex flex-col gap-2 items-center justify-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-muted">
            <Users size={32} />
          </div>
          <p className="font-semibold text-lg">
            あなたはまだグループに参加していません
          </p>
          <p className="text-muted-foreground">
            グループを作成するか、管理者に招待してもらいましょう
          </p>
        </div>
      )}
    </div>
  );
}

const GroupCard = () => {
  return (
    <Link
      to={`/group`}
      className="bg-white w-full border border-border rounded-xl p-5 space-y-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <Avatar className="rounded-lg size-12">
          <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=開" />
          <AvatarFallback>開発</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">開発チーム</h2>
          <p className="text-sm text-muted-foreground">3人のメンバー</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
          <Avatar className="size-7">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar className="size-7">
            <AvatarImage src="https://github.com/leerob.png" alt="@leerob" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
          <Avatar className="size-7">
            <AvatarImage
              src="https://github.com/evilrabbit.png"
              alt="@evilrabbit"
            />
            <AvatarFallback>ER</AvatarFallback>
          </Avatar>
        </div>
        <p className="text-sm text-muted-foreground">メンバー</p>
      </div>
    </Link>
  );
};
