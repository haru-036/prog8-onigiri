import { ArrowUp, MessagesSquare } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useState } from "react";

type Comment = {
  id: number;
  contents: string;
  created_at: Date;
  commenter: {
    id: number;
    user_name: string;
    picture: string;
  };
};

export const CommentList = ({ taskId }: { taskId: string }) => {
  const [newComment, setNewComment] = useState<string>("");
  const { data: comments, isPending } = useQuery<Comment[]>({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/comments`);

      return response.data;
    },
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["addComment", taskId],
    mutationFn: async (newComment: string) => {
      const res = await api.post(`/tasks/${taskId}/comments`, {
        contents: newComment,
      });
      return res.data;
    },
    onSuccess: () => {
      setNewComment("");
      // Refetch comments after adding a new comment
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  return (
    <div className="w-full px-4 border border-border rounded-lg py-4 bg-white">
      <h2 className="pb-1.5 flex items-center gap-2 font-semibold">
        <MessagesSquare size={16} />
        コメント
      </h2>
      <div className="divide-border divide-y">
        {isPending && (
          <div className="text-center text-muted-foreground py-4">
            読み込み中...
          </div>
        )}
        {comments?.map((comment) => (
          <CommentItem
            key={comment.id}
            user={comment.commenter}
            date={new Date(comment.created_at + "Z").toLocaleDateString(
              "ja-JP",
              {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
            content={comment.contents}
          />
        ))}
      </div>

      <div className="flex items-start gap-2 pt-3">
        <Textarea
          placeholder="コメントを追加..."
          className="bg-white min-h-full resize-none"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button size={"icon"} onClick={() => mutation.mutate(newComment)}>
          <ArrowUp />
        </Button>
      </div>
    </div>
  );
};

const CommentItem = ({
  user,
  date,
  content,
}: {
  user: { id: number; user_name: string; picture: string };
  date: string;
  content: string;
}) => {
  return (
    <div className="py-3 flex items-start gap-2 px-1 relative">
      <Avatar className="size-7">
        <AvatarImage
          src={
            user.picture ||
            `https://api.dicebear.com/9.x/glass/svg?seed=${user.id}`
          }
        />
        <AvatarFallback>{user.user_name.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="space-y-1 flex-1">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{user.user_name}</span>
            <p className="text-sm text-muted-foreground">{date}</p>
          </div>
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6">
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="text-destructive" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
        <p className="text-base whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
};
