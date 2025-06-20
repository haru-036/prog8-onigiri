import { Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Button } from "./components/ui/button";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "./lib/axios";

type Group = {
  id: number;
  name: string;
  role: "owner" | "member";
  member_length: number;
  member_pictures: string[];
};

export default function GroupsList() {
  const { data: groups, isPending } = useQuery({
    queryKey: ["groups"],
    queryFn: async (): Promise<Group[]> => {
      const res = await api.get("/groups");
      return res.data;
    },
    retry: 1,
  });

  return (
    <div className="grow py-8 max-w-5xl mx-auto px-4 w-full">
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">マイグループ</h1>
          <p className="text-muted-foreground">
            参加しているグループの一覧です
          </p>
        </div>
        <Button asChild>
          <Link to="/new-group">
            <Plus />
            グループ作成
          </Link>
        </Button>
      </div>

      {isPending && (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">グループを読み込み中...</p>
        </div>
      )}

      {/* グループが存在する場合 */}
      {groups && !isPending && groups.length > 0 ? (
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        !isPending && (
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
        )
      )}
    </div>
  );
}

const GroupCard = ({ group }: { group: Group }) => {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="bg-white w-full border border-border rounded-xl p-5 space-y-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <Avatar className="rounded-lg size-12">
          <AvatarImage
            src={`https://api.dicebear.com/9.x/initials/svg?seed=${group.name}`}
          />
          <AvatarFallback>{group.name}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{group.name}</h2>
          <p className="text-sm text-muted-foreground">
            {group.member_length}人のメンバー
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
          {group.member_pictures.map((picture, index) => (
            <Avatar className="size-7" key={index}>
              <AvatarImage src={picture} alt={`Member ${index + 1}`} />
              <AvatarFallback>{`${index + 1}`}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <p
          className={`text-sm ${
            group.role === "owner" ? "text-green-700" : "text-muted-foreground"
          } `}
        >
          {group.role === "owner" ? "あなたが管理者です" : "メンバー"}
        </p>
      </div>
    </Link>
  );
};
