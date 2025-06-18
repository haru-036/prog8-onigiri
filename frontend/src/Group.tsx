import {
  ArrowDownUp,
  Calendar,
  CircleSmall,
  Filter,
  Flag,
  Search,
} from "lucide-react";
import { Input } from "./components/ui/input";
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
import { tasks } from "./mock/data";
import type { Task } from "./types";
import { Link } from "react-router";
import { PriorityBadge } from "./components/priorityBadge";

export default function Group() {
  return (
    <div className="grow w-full bg-neutral-50 p-6 flex gap-6">
      <div className="flex-1 flex gap-6 mx-auto max-w-7xl xl:container">
        <div className="max-w-64 w-full">
          <div className="relative mb-4">
            <Input
              className="bg-white pl-9 text-base py-2.5 rounded-lg"
              placeholder="タスクを検索"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          </div>
          <TaskFilter />
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
                  {tasks.filter((t) => t.status === "not-stated-yet").length}
                </div>
              </div>
              <div className="py-3 grid grid-cols-1 gap-3">
                {tasks
                  .filter((t) => t.status === "not-stated-yet")
                  .map((task) => (
                    <TaskCard key={task.id} task={task} />
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
                  {tasks.filter((t) => t.status === "in-progress").length}
                </div>
              </div>
              <div className="py-3 grid grid-cols-1 gap-3">
                {tasks
                  .filter((t) => t.status === "in-progress")
                  .map((task) => (
                    <TaskCard key={task.id} task={task} />
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
                  {tasks.filter((t) => t.status === "done").length}
                </div>
              </div>
              <div className="py-3 grid grid-cols-1 gap-3 opacity-50">
                {tasks
                  .filter((t) => t.status === "done")
                  .map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TaskCard = ({ task }: { task: Task }) => {
  return (
    <Link to={`/group/${task.id}`}>
      <Card
        className={`border-neutral-200 shadow-none gap-3 hover:shadow-md transition-shadow`}
      >
        <CardHeader className="grid-flow-col justify-between items-center">
          <PriorityBadge priority={task.priority} />
          <div className="flex items-center gap-0.5 text-sm">
            <Calendar size={12} />
            <span>
              {/* TODO: 締め切りの表示 */}
              {new Date(task.deadline).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="font-bold">{task.name}</h4>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-1">
            <Avatar className="size-4">
              <AvatarImage
                src={`https://api.dicebear.com/9.x/glass/svg?seed=${task.assign}`}
              />
              <AvatarFallback className={`text-white text-xs`}>
                CN
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{task.assign}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

const TaskFilter = () => {
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
              <Checkbox id="high" />
              <Label htmlFor="high" className="gap-0.5">
                <Flag className="size-3.5 text-red-700 fill-red-700" />高 (
                {tasks.filter((task) => task.priority === "high").length})
              </Label>
            </li>
            <li className="flex items-center gap-2">
              <Checkbox id="middle" />
              <Label htmlFor="middle" className="gap-0.5">
                <Flag className="size-3.5 text-amber-600 fill-amber-600" />中 (
                {tasks.filter((task) => task.priority === "middle").length})
              </Label>
            </li>
            <li className="flex items-center gap-2">
              <Checkbox id="low" />
              <Label htmlFor="low" className="gap-0.5">
                <Flag className="size-3.5 text-neutral-600" />低 (
                {tasks.filter((task) => task.priority === "low").length})
              </Label>
            </li>
          </ul>
        </div>

        <div className="py-2">
          <h4 className="text-muted-foreground text-sm">担当者</h4>
          <ul className="flex flex-col gap-2 pt-2">
            <li className="flex items-center gap-2">
              <Checkbox id="user1" />
              <Label htmlFor="user1">佐藤 (12)</Label>
            </li>
            <li className="flex items-center gap-2">
              <Checkbox id="user2" />
              <Label htmlFor="user2">田中 (4)</Label>
            </li>
            <li className="flex items-center gap-2">
              <Checkbox id="user3" />
              <Label htmlFor="user3">鈴木 (8)</Label>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
