import {
  ArrowUp,
  CalendarIcon,
  Check,
  CheckCircle,
  ChevronLeft,
  Edit,
  Flag,
  MessagesSquare,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { PriorityBadge } from "./components/priorityBadge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { useState } from "react";
import { Calendar } from "./components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { Button } from "./components/ui/button";
import { Link, useParams } from "react-router";
import type { Task } from "./types";
import { api } from "./lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useGroupMembers } from "./hooks/useGroupMembers";

export default function TaskDetail() {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState<"title" | "description" | null>(
    null
  );

  const [editData, setEditData] = useState<Partial<Task>>({});

  const urlParams = useParams<{ groupId: string; taskId: string }>();
  const groupId = urlParams.groupId;
  const taskId = urlParams.taskId;

  const queryClient = useQueryClient();

  const { data: members } = useGroupMembers(
    groupId ? parseInt(groupId) : undefined
  );

  const { data: task, isPending } = useQuery({
    queryKey: ["task", groupId, taskId],
    queryFn: async (): Promise<Task> => {
      const res = await api.get(`/tasks/${taskId}`);
      return res.data;
    },
  });

  const updateTaskMutation = useMutation({
    mutationKey: ["updateTask", groupId, taskId],
    mutationFn: async (updatedTask: Partial<Task>) => {
      const res = await api.put(`/tasks/${taskId}`, updatedTask);
      return res.data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["task", groupId, taskId] });
      setEditMode(null);
    },
    onError: (error) => {
      console.error("タスクの更新に失敗しました:", error);
    },
  });

  const handleSaveChanges = (field: string) => {
    if (!task) return;

    const value = editData[field as keyof Task] ?? task[field as keyof Task];

    updateTaskMutation.mutate({ [field]: value });
  };

  const handleInputChange = (field: keyof Task, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const getFieldValue = (field: keyof Task) => {
    if (editData[field] !== undefined) {
      return editData[field];
    }
    return task ? task[field] : "";
  };

  if (isPending) {
    return (
      <div className="w-full grow bg-neutral-50 flex items-center justify-center">
        <p className="text-muted-foreground">タスクを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="w-full grow bg-neutral-50 flex flex-col">
      <div className="w-full grow max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-4 flex flex-col">
        <Button
          asChild
          variant={"link"}
          className="w-fit mb-2 has-[>svg]:px-0 text-muted-foreground"
        >
          <Link to={`/groups/${groupId}`}>
            <ChevronLeft />
            チームタスク一覧に戻る
          </Link>
        </Button>
        <div className="flex items-center gap-2 justify-between">
          {editMode === "title" ? (
            <input
              type="text"
              className="w-full font-semibold py-1 text-2xl border-b border-border focus:outline-none focus:border-primary-500"
              value={getFieldValue("title")?.toString()}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
          ) : (
            <h1 className="w-full font-semibold text-2xl py-1 border-b border-transparent">
              {task?.title}
            </h1>
          )}
          <Button
            variant={editMode === "title" ? "default" : "secondary"}
            size="icon"
            onClick={() => {
              if (editMode === "title") {
                handleSaveChanges("title");
              } else {
                setEditMode("title");
              }
            }}
          >
            {editMode === "title" ? <Check /> : <Edit />}
          </Button>
        </div>
        <div className="py-4 border-b border-border">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="w-40">
                  <div className="flex items-center text-muted-foreground gap-2">
                    <User size={16} />
                    <span className="text-sm">担当者名</span>
                  </div>
                </TableCell>
                <TableCell className="hover:bg-muted/50 p-0">
                  <Select
                    value={
                      task?.assigned_user?.id
                        ? task.assigned_user.id.toString()
                        : undefined
                    }
                    onValueChange={(value) => {
                      const memberId = parseInt(value, 10);
                      handleInputChange("assign", memberId);
                      updateTaskMutation.mutate({
                        assign: memberId,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full border-none shadow-none hover:shadow-none focus:shadow-none focus-visible:border-none">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.map((member) => (
                        <SelectItem
                          key={member.id}
                          value={member.id.toString()}
                        >
                          <div className="flex items-center gap-1">
                            <Avatar className="size-5">
                              <AvatarImage
                                src={
                                  member.picture ||
                                  `https://api.dicebear.com/9.x/glass/svg?seed=${member.user_name}`
                                }
                              />
                              <AvatarFallback>
                                {member.user_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {member.user_name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40">
                  <div className="flex items-center text-muted-foreground gap-2">
                    <CalendarIcon size={16} />
                    <span className="text-sm">締め切り</span>
                  </div>
                </TableCell>
                <TableCell className="hover:bg-muted/50 p-0">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger
                      className="w-full text-start h-9 block px-3 font-semibold"
                      id="date"
                    >
                      {task
                        ? new Date(task.deadline).toLocaleDateString()
                        : "Select date"}
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={task ? new Date(task.deadline) : undefined}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (date) {
                            // Adjust for timezone to ensure the selected date is preserved
                            const adjustedDate = new Date(date);
                            adjustedDate.setHours(23, 59, 59, 999);
                            updateTaskMutation.mutate({
                              deadline: adjustedDate.toISOString(),
                            });
                          }
                          setOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40">
                  <div className="flex items-center text-muted-foreground gap-2">
                    <CheckCircle size={16} />
                    <span className="text-sm">ステータス</span>
                  </div>
                </TableCell>
                <TableCell className="hover:bg-muted/50 p-0">
                  <SelectCell
                    type="status"
                    value={getFieldValue("status")?.toString()}
                    onChange={(value) => {
                      handleInputChange("status", value);
                      updateTaskMutation.mutate({
                        status: value as
                          | "not-started-yet"
                          | "in-progress"
                          | "done",
                      });
                    }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40">
                  <div className="flex items-center text-muted-foreground gap-2">
                    <Flag size={16} />
                    <span className="text-sm">優先度</span>
                  </div>
                </TableCell>
                <TableCell className="hover:bg-muted/50 p-0">
                  <SelectCell
                    type="priority"
                    value={getFieldValue("priority")?.toString()}
                    onChange={(value) => {
                      handleInputChange("priority", value);
                      updateTaskMutation.mutate({
                        priority: value as "high" | "middle" | "low",
                      });
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* タスクの詳細とコメント */}
        <div className="grid lg:grid-cols-8 gap-6 py-5 grow flex-1">
          <div className="whitespace-pre-wrap flex gap-2 lg:col-span-5 w-full text-base grow">
            {editMode === "description" ? (
              <textarea
                className="w-full p-3 rounded-md border-input border text-base resize-none leading-relaxed break-words field-sizing-content"
                value={getFieldValue("description")?.toString()}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
              />
            ) : (
              <p className="p-3 w-full border border-transparent text-base leading-relaxed break-words">
                {task?.description || "タスクの説明がここに入ります。"}
              </p>
            )}
            <Button
              variant={editMode === "description" ? "default" : "secondary"}
              size="icon"
              onClick={() => {
                if (editMode === "description") {
                  handleSaveChanges("description");
                } else {
                  setEditMode("description");
                }
              }}
            >
              {editMode === "description" ? <Check /> : <Edit />}
            </Button>
          </div>
          <div className="w-full lg:col-span-3">
            <CommentList />
          </div>
        </div>
      </div>
    </div>
  );
}

export const StatusBadge = ({
  status,
}: {
  status: "not-started-yet" | "in-progress" | "done";
}) => {
  const statusColors: Record<string, string> = {
    "not-started-yet": "bg-neutral-100 text-neutral-800",
    "in-progress": "bg-blue-100 text-blue-800",
    done: "bg-green-100 text-green-800",
  };

  return (
    <Badge
      className={`text-xs border border-black/10 rounded-full ${
        statusColors[status] || "bg-neutral-100 text-neutral-800"
      }`}
    >
      {status === "not-started-yet"
        ? "未着手"
        : status === "in-progress"
        ? "進行中"
        : "完了"}
    </Badge>
  );
};

const SelectCell = ({
  type,
  value,
  onChange,
}: {
  type: "status" | "priority" | "user";
  value?: string | { id: number; user_name: string; picture: string };
  onChange?: (
    value: string | { id: number; user_name: string; picture: string }
  ) => void;
}) => {
  const options = {
    status: [
      { value: "not-started-yet", label: "未着手" },
      { value: "in-progress", label: "進行中" },
      { value: "done", label: "完了" },
    ],
    priority: [
      { value: "low", label: "低" },
      { value: "middle", label: "中" },
      { value: "high", label: "高" },
    ],
    user: [
      { value: "user1", label: "ユーザー1" },
      { value: "user2", label: "ユーザー2" },
      { value: "user3", label: "ユーザー3" },
    ],
  };

  return (
    <Select
      value={typeof value === "string" ? value : value?.id?.toString()}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full border-none shadow-none hover:shadow-none focus:shadow-none focus-visible:border-none">
        <SelectValue placeholder="選択してください" />
      </SelectTrigger>
      <SelectContent className="">
        {options[type].map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {type === "status" ? (
              <StatusBadge
                status={
                  option.value as "not-started-yet" | "in-progress" | "done"
                }
              />
            ) : type === "priority" ? (
              <PriorityBadge
                priority={option.value as "high" | "middle" | "low"}
              />
            ) : (
              <div className="flex items-center gap-1">
                <Avatar className="size-5">
                  <AvatarImage
                    src={`https://api.dicebear.com/9.x/glass/svg?seed=${option.value}`}
                  />
                  <AvatarFallback>{option.label}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const CommentList = () => {
  return (
    <div className="w-full px-4 border border-border rounded-lg py-4 bg-white">
      <h2 className="pb-1.5 flex items-center gap-2 font-semibold">
        <MessagesSquare size={16} />
        コメント
      </h2>
      <div className="divide-border divide-y">
        <CommentItem
          user="ユーザー1"
          date="2023/10/01 12:00"
          content="このタスクについてのコメント内容がここに入ります。"
        />
        <CommentItem
          user="ユーザー2"
          date="2023/10/01 12:00"
          content="このタスクについてのコメント内容がここに入ります。"
        />
        <CommentItem
          user="ユーザー3"
          date="2023/10/01 12:00"
          content="このタスクについてのコメント内容がここに入ります。"
        />
      </div>

      <div className="flex items-start gap-2 pt-3">
        <Textarea
          placeholder="コメントを追加..."
          className="bg-white min-h-full resize-none"
        />
        <Button size={"icon"}>
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
  user: string;
  date: string;
  content: string;
}) => {
  return (
    <div className="py-3 flex items-start gap-2 px-1">
      <Avatar className="size-7">
        <AvatarImage
          src={`https://api.dicebear.com/9.x/glass/svg?seed=${user}`}
        />
        <AvatarFallback>{user}</AvatarFallback>
      </Avatar>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{user}</span>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
        <p className="text-base whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
};
