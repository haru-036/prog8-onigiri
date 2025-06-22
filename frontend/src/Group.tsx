import { useState } from "react";
import { ArrowDownUp, Calendar, CircleSmall, Filter, Flag } from "lucide-react";
import { Checkbox } from "./components/ui/checkbox";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "./components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import type { Task } from "./types";
import { Link, useParams } from "react-router";
import { PriorityBadge } from "./components/priorityBadge";
import { useQuery } from "@tanstack/react-query";
import { api } from "./lib/axios";
import { useGroupMembers } from "./hooks/useGroupMembers";

export default function Group() {
  const urlParams = useParams<{ groupId: string }>();
  const groupId = urlParams.groupId;
  // フィルタ状態
  const [filter, setFilter] = useState<{
    priorities: string[];
    users: number[];
  }>({
    priorities: [],
    users: [],
  });

  // 全タスク（フィルターなし）
  const { data: allTasks } = useQuery({
    queryKey: ["tasks", groupId, "all"],
    queryFn: async (): Promise<Task[]> => {
      const res = await api.get(`/groups/${groupId}/tasks`);
      return res.data;
    },
  });

  // クエリパラメータを組み立て
  const params: Record<string, string | number | undefined> = {};
  if (filter.priorities.length === 1) {
    params.priority = filter.priorities[0];
  }
  if (filter.users.length === 1) {
    params.assign = filter.users[0];
  }

  // フィルター済みタスク
  const { data } = useQuery({
    queryKey: ["tasks", groupId, filter, params],
    queryFn: async (): Promise<Task[]> => {
      const res = await api.get(`/groups/${groupId}/tasks`, { params });
      return res.data;
    },
  });

  if (!data && !allTasks) {
    return (
      <div className="grow flex items-center justify-center">
        <p className="text-muted-foreground">タスクを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="grow w-full bg-neutral-50 p-6 flex gap-6">
      <div className="flex-1 flex gap-6 mx-auto max-w-7xl xl:container">
        <div className="max-w-56 w-full">
          {/* <div className="relative mb-4">
            <Input
              className="bg-white pl-9 text-base py-2.5 rounded-lg"
              placeholder="タスクを検索"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          </div> */}
          <TaskFilter
            groupId={Number(groupId)}
            tasks={data!}
            allTasks={allTasks!}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>
        {/* 並び替え */}
        <div className="w-full">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xl">チームタスク</h2>
            <Select defaultValue="priority-deadline">
              <SelectTrigger className="w-48">
                <div className="flex items-center gap-2">
                  <ArrowDownUp />
                  <SelectValue placeholder="並び替え" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority-deadline">優先度×期限順</SelectItem>
                <SelectItem value="priority">優先度順</SelectItem>
                <SelectItem value="deadline">期限順</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* かんばん表示 */}
          <div className="py-5 grid grid-cols-3 gap-4">
            <div>
              <div className="bg-white rounded-md p-3 flex justify-between items-center">
                <div className="flex items-center gap-1 font-semibold">
                  <CircleSmall className="size-4 fill-muted-foreground stroke-0" />
                  未着手
                </div>
                <div className="text-muted-foreground">
                  {data?.filter((t) => t.status === "not-started-yet").length}
                </div>
              </div>
              <div className="py-3 grid grid-cols-1 gap-3">
                {data
                  ?.filter((t) => t.status === "not-started-yet")
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      groupId={Number(groupId)}
                    />
                  ))}
              </div>
            </div>
            <div>
              <div className="bg-blue-50 rounded-md p-3 flex justify-between items-center h-fit">
                <div className="flex items-center gap-1 font-semibold">
                  <CircleSmall className="size-4 fill-blue-600 stroke-0" />
                  進行中
                </div>
                <div className="text-muted-foreground">
                  {data?.filter((t) => t.status === "in-progress").length}
                </div>
              </div>
              <div className="py-3 grid grid-cols-1 gap-3">
                {data
                  ?.filter((t) => t.status === "in-progress")
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      groupId={Number(groupId)}
                    />
                  ))}
              </div>
            </div>
            <div>
              <div className="bg-green-50 rounded-md p-3 flex justify-between items-center h-fit">
                <div className="flex items-center gap-1 font-semibold">
                  <CircleSmall className="size-4 fill-green-600 stroke-0" />
                  完了
                </div>
                <div className="text-muted-foreground">
                  {data?.filter((t) => t.status === "done").length}
                </div>
              </div>
              <div className="py-3 grid grid-cols-1 gap-3 opacity-50">
                {data
                  ?.filter((t) => t.status === "done")
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      groupId={Number(groupId)}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TaskCard = ({ task, groupId }: { task: Task; groupId: number }) => {
  return (
    <Link to={`/groups/${groupId}/${task.id}`}>
      <Card
        className={`border-neutral-200 shadow-none gap-3 hover:shadow-md transition-shadow`}
      >
        <CardHeader className="grid-flow-col justify-between items-center">
          <PriorityBadge priority={task.priority} />
          <div className="flex items-center gap-0.5 text-sm">
            <Calendar size={12} />
            <span>
              {/* TODO: 締め切りの表示 */}
              {new Date(task.deadline + "Z").toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="font-bold">{task.title}</h4>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-1">
            <Avatar className="size-4">
              <AvatarImage
                src={
                  task.assigned_user?.picture ||
                  "https://api.dicebear.com/9.x/glass/svg?seed=default"
                }
              />
              <AvatarFallback className={`text-white text-xs`}>
                {task.assigned_user?.user_name.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {task.assigned_user?.user_name || "未割り当て"}
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

const TaskFilter = ({
  groupId,
  allTasks,
  filter,
  onFilterChange,
}: {
  groupId: number;
  tasks: Task[];
  allTasks: Task[];
  filter: { priorities: string[]; users: number[] };
  onFilterChange: (f: { priorities: string[]; users: number[] }) => void;
}) => {
  const { data: members } = useGroupMembers(groupId);
  // チェック状態をローカルで管理
  const [checkedPriorities, setCheckedPriorities] = useState<string[]>(
    filter.priorities
  );
  const [checkedUsers, setCheckedUsers] = useState<number[]>(filter.users);

  // チェック変更時に親へ通知
  const handlePriorityChange = (priority: string) => {
    let next: string[];
    if (checkedPriorities.includes(priority)) {
      next = checkedPriorities.filter((p) => p !== priority);
    } else {
      next = [...checkedPriorities, priority];
    }
    setCheckedPriorities(next);
    onFilterChange({ priorities: next, users: checkedUsers });
  };
  const handleUserChange = (userId: number) => {
    let next: number[];
    if (checkedUsers.includes(userId)) {
      next = checkedUsers.filter((id) => id !== userId);
    } else {
      next = [...checkedUsers, userId];
    }
    setCheckedUsers(next);
    onFilterChange({ priorities: checkedPriorities, users: next });
  };

  return (
    <div className="bg-white rounded-lg p-4 border-input border">
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-primary" />
        <h3 className="font-semibold">絞り込み</h3>
      </div>
      <div>
        <div className="py-3">
          <h4 className="text-muted-foreground text-sm">優先度</h4>
          <ul className="flex flex-col gap-2 pt-2">
            <li className="flex items-center gap-2">
              <Checkbox
                id="high"
                checked={checkedPriorities.includes("high")}
                onCheckedChange={() => handlePriorityChange("high")}
              />
              <Label htmlFor="high" className="gap-0.5">
                <Flag className="size-3.5 text-red-700 fill-red-700" />高
                <span className="font-normal ml-2 text-muted-foreground">
                  {allTasks.filter((task) => task.priority === "high").length}
                </span>
              </Label>
            </li>
            <li className="flex items-center gap-2">
              <Checkbox
                id="middle"
                checked={checkedPriorities.includes("middle")}
                onCheckedChange={() => handlePriorityChange("middle")}
              />
              <Label htmlFor="middle" className="gap-0.5">
                <Flag className="size-3.5 text-amber-600 fill-amber-600" />中
                <span className="font-normal ml-2 text-muted-foreground">
                  {allTasks.filter((task) => task.priority === "middle").length}
                </span>
              </Label>
            </li>
            <li className="flex items-center gap-2">
              <Checkbox
                id="low"
                checked={checkedPriorities.includes("low")}
                onCheckedChange={() => handlePriorityChange("low")}
              />
              <Label htmlFor="low" className="gap-0.5">
                <Flag className="size-3.5 text-neutral-600" />低
                <span className="font-normal ml-2 text-muted-foreground">
                  {allTasks.filter((task) => task.priority === "low").length}
                </span>
              </Label>
            </li>
          </ul>
        </div>
        <div className="py-2">
          <h4 className="text-muted-foreground text-sm">担当者</h4>
          <ul className="flex flex-col gap-2 pt-2">
            {members?.map((member) => (
              <li key={member.id} className="flex items-center gap-2">
                <Checkbox
                  id={`user-${member.id}`}
                  checked={checkedUsers.includes(member.id)}
                  onCheckedChange={() => handleUserChange(member.id)}
                />
                <Label htmlFor={`user-${member.id}`}>
                  <Avatar className="size-4">
                    <AvatarImage
                      src={
                        member.picture ||
                        "https://api.dicebear.com/9.x/glass/svg?seed=default"
                      }
                    />
                    <AvatarFallback className="text-xs">
                      {member.user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {member.user_name}
                  <span className="font-normal ml-2 text-muted-foreground">
                    {
                      allTasks.filter(
                        (task) => task.assigned_user?.id === member.id
                      ).length
                    }
                  </span>
                </Label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
