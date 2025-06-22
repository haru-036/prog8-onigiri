import { Button } from "./components/ui/button";
import {
  Users,
  Flag,
  Plus,
  Calendar as CalendarIcon,
  UserX,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import Statistics from "./components/Statistics";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "./components/ui/card";
import type { Task } from "./types";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { PriorityBadge } from "./components/priorityBadge";
import { useGroupMembers } from "./hooks/useGroupMembers";
import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Input } from "./components/ui/input";
import { Calendar } from "./components/ui/calendar";
import { useMutation } from "@tanstack/react-query";
import { api } from "./lib/axios";

function Result() {
  const location = useLocation();
  const { tasks: initialTasks }: { tasks: Task[] } = location.state;
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  console.log("Tasks in Result:", tasks);
  const urlParams = useParams<{ groupId: string }>();
  const groupId = Number(urlParams.groupId);
  const navigate = useNavigate();

  // タスク削除関数
  const handleDeleteTask = (index: number) => {
    // const confirm = window.confirm("本当に削除しますか？");
    // if (confirm) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
    // }
  };

  // タスクの更新関数
  const handleUpdateTask = (index: number, updated: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task, i) => (i === index ? { ...task, ...updated } : task))
    );
  };

  const mutation = useMutation({
    mutationKey: ["addTask"],
    mutationFn: async (task: Task[]) => {
      // APIを呼び出してタスクを追加する処理
      await api.post(`/groups/${groupId}/tasks/save`, task);
    },
    onSuccess: () => {
      // タスク追加後の処理
      console.log("タスクが追加されました");
      navigate(`/groups/${groupId}`);
    },
  });

  return (
    <div className="grow w-full bg-neutral-50">
      <div className="flex-1 flex px-8 gap-6 mx-auto max-w-7xl xl:container shrink-0 ">
        <div className="w-full">
          <div className="flex items-center p-1 gap-1 justify-between">
            <div className="items-start">
              <h2 className="font-bold text-2xl pt-6">抽出結果</h2>
              <div className="justify-start text-muted-foreground text-sm">
                {tasks.length}個のタスクが見つかりました
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2 text-xs">
                    <Flag />
                    <SelectValue placeholder="優先度" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="middle">中</SelectItem>
                  <SelectItem value="low">小</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2 text-xs">
                    <Users />
                    <SelectValue placeholder="担当者" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one">ユーザー１</SelectItem>
                  <SelectItem value="two">ユーザー２</SelectItem>
                  <SelectItem value="three">ユーザー３</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => mutation.mutate(tasks)}>
                <Plus />
                追加
              </Button>
            </div>
          </div>
          <div>
            <ul className="grid grid-cols-2 gap-4 py-4">
              {tasks.map((task: Task, index: number) => (
                <TaskCard
                  key={index}
                  task={task}
                  onDelete={() => handleDeleteTask(index)}
                  onUpdate={(updated) => handleUpdateTask(index, updated)}
                />
              ))}
            </ul>
          </div>
        </div>
        <div className="flex-col">
          <Statistics tasks={tasks} />
          {/* <Origin /> */}
        </div>
      </div>
    </div>
  );
}

export default Result;

const TaskCard = ({ task, onDelete, onUpdate }: { task: Task; onDelete: () => void; onUpdate: (updated: Partial<Task>) => void }) => {
  const [date, setDate] = useState<Date>(task.deadline ? new Date(task.deadline + "Z") : new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [open, setOpen] = useState<"calendar" | null>(null);
  const [assign, setAssign] = useState<number | null>(task.assign || null);

  // 日付のバリデーション関数
  function isValidDate(d: Date) {
    return d instanceof Date && !isNaN(d.getTime());
  }
  // 日付を yyyy-mm-dd 形式にフォーマット
  function formatDate(d: Date) {
    return d.toISOString().split("T")[0];
  }

  useEffect(() => {
    onUpdate({ deadline: formatDate(date), assign: assign ?? undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, assign]);

  return (
    <Card className={`border-neutral-200 shadow-none gap-3`}>
      <CardHeader className="flex justify-between items-center">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-2 text-sm">
          {/* 削除ボタンを締切の横に配置 */}
          <Button
            variant="secondary"
            onClick={onDelete}
            aria-label="タスク削除"
            type="button"
            size={"icon"}
            className="size-7 rounded-sm"
          >
            <Trash2 size={14} className="" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <h4 className="font-bold">{task.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description || "説明なし"}
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-1 justify-between w-full">
          <UserSelect assign={assign} onChange={setAssign} />
          <div className="relative flex gap-2 w-fit">
            <Input
              id="date"
              value={formatDate(date)}
              placeholder="June 01, 2025"
              className="bg-background pr-10 py-2"
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (isValidDate(newDate)) {
                  setDate(newDate);
                  setMonth(newDate);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen("calendar");
                }
              }}
            />
            <Popover
              open={open === "calendar"}
              onOpenChange={(e) => setOpen(e ? "calendar" : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  id="date-picker"
                  variant="ghost"
                  className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                >
                  <CalendarIcon className="size-3.5" />
                  <span className="sr-only">Select date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="end"
                alignOffset={-8}
                sideOffset={10}
              >
                <Calendar
                  mode="single"
                  selected={date}
                  captionLayout="dropdown"
                  month={month}
                  onMonthChange={setMonth}
                  onSelect={(selectedDate: Date | undefined) => {
                    if (selectedDate) {
                      setDate(selectedDate);
                      setMonth(selectedDate);
                    }
                    setOpen(null);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

const UserSelect = ({ assign, onChange }: { assign: number | null; onChange?: (id: number | null) => void }) => {
  const urlParams = useParams();
  const groupId = Number(urlParams.groupId);
  const { data: members, isPending } = useGroupMembers(groupId);
  const [selectUser, setSelectUser] = useState<number | null>(assign || null);
  useEffect(() => {
    if (onChange) onChange(selectUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectUser]);
  return (
    <Select
      value={selectUser ? String(selectUser) : ""}
      onValueChange={(value) => setSelectUser(Number(value))}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            <span className="flex gap-1 items-center text-xs text-destructive font-bold">
              <UserX size={14} className="stroke-destructive" /> 未割り当て
            </span>
          }
        />
      </SelectTrigger>
      <SelectContent>
        {isPending ? (
          <SelectItem value="loading" disabled>
            読み込み中...
          </SelectItem>
        ) : (
          members?.map((member) => (
            <SelectItem key={member.id} value={String(member.id)}>
              <Avatar className="inline-block size-5">
                <AvatarImage src={member.picture} />
              </Avatar>
              {member.user_name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};
