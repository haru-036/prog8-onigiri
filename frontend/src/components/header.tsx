import { CalendarIcon, FileText, MailPlus, Plus } from "lucide-react";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { useParams } from "react-router";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "./ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { StatusBadge } from "@/TaskDetail";
import { PriorityBadge } from "./priorityBadge";

const formSchema = z.object({
  title: z
    .string()
    .min(2, { message: "タイトルは2文字以上である必要があります" })
    .max(50),
  description: z
    .string()
    .min(2, { message: "説明は2文字以上である必要があります" })
    .max(200),
  deadline: z.date(),
  status: z.enum(["not-started-yet", "in-progress", "done"]),
  priority: z.enum(["high", "middle", "low"]),
  assign: z.number(),
});

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export default function Header() {
  const urlParams = useParams<{ groupId: string }>();
  const groupId = urlParams.groupId;
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState<"invite" | "calendar" | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: new Date(),
      status: "not-started-yet", // デフォルトステータス
      priority: "middle", // デフォルトの優先度
      assign: undefined, // 初期値はundefined（未割り当て）
    },
  });

  const { data: members, isPending } = useQuery<
    { id: number; user_name: string; picture: string }[]
  >({
    queryKey: ["members", groupId],
    queryFn: async () => {
      if (!groupId) {
        return [];
      }
      const res = await api.get(`/groups/${groupId}/members`);
      return res.data;
    },
    retry: 1,
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/me");
      return res.data;
    },
    retry: 1,
  });

  function handleTaskSubmit(values: z.infer<typeof formSchema>) {
    taskMutation.mutate(values);
  }

  const taskMutation = useMutation({
    mutationKey: ["createTask"],
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await api.post(`/groups/${groupId}/tasks`, values);
      return res.data;
    },
    onSuccess: () => {
      // タスク追加成功時の処理
      console.log("Task added successfully");
      form.reset(); // フォームをリセット
      setOpen(null); // ダイアログを閉じる
    },
  });

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
      setOpen(null); // ダイアログを閉じる
    },
  });

  return (
    <div className="w-full bg-white border-b border-border">
      <div className="flex items-center justify-between py-3 px-3 max-w-7xl xl:container mx-auto">
        <div className="flex items-center gap-1.5">
          <span className="bg-linear-to-tr from-purple-700 to-primary rounded-md size-8 grid place-content-center">
            <FileText className="size-4 text-white" />
          </span>
          <div className="font-bold text-lg">MeeTask</div>
        </div>
        <div className="flex items-center gap-4">
          {/* TODO: メンバー招待はリーダーだけに表示する */}
          {groupId && (
            <>
              {/* メンバー招待ダイアログ */}
              <Dialog
                open={open === "invite"}
                onOpenChange={(e) => setOpen(e ? "invite" : null)}
              >
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

              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus />
                    新規タスク
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader className="pb-3">
                    <DialogTitle>タスク追加</DialogTitle>
                    <DialogDescription>
                      新しいタスクを追加するには、以下の情報を入力してください。
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleTaskSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>タスクタイトル</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="タスクのタイトル"
                                className="py-2"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>タスク説明</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="タスクの説明"
                                className="py-2"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem className="w-fit">
                            <FormLabel>締め切り</FormLabel>
                            <FormControl>
                              <div className="relative flex gap-2">
                                <Input
                                  id="date"
                                  value={formatDate(field.value)}
                                  placeholder="June 01, 2025"
                                  className="bg-background pr-10 py-2"
                                  onChange={(e) => {
                                    const date = new Date(e.target.value);
                                    if (isValidDate(date)) {
                                      setDate(date);
                                      setMonth(date);
                                    }
                                    field.onChange(formatDate(date));
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
                                  onOpenChange={(e) =>
                                    setOpen(e ? "calendar" : null)
                                  }
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      id="date-picker"
                                      variant="ghost"
                                      className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                                    >
                                      <CalendarIcon className="size-3.5" />
                                      <span className="sr-only">
                                        Select date
                                      </span>
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
                                      onSelect={(date) => {
                                        setDate(date);
                                        form.setValue(
                                          "deadline",
                                          date || new Date()
                                        );
                                        setOpen(null);
                                      }}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center w-full gap-5">
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>ステータス</FormLabel>
                              <FormControl>
                                <Select
                                  defaultValue="not-started-yet"
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="選択してください" />
                                  </SelectTrigger>
                                  <SelectContent className="">
                                    <SelectItem value="not-started-yet">
                                      <StatusBadge status={"not-started-yet"} />
                                    </SelectItem>
                                    <SelectItem value="in-progress">
                                      <StatusBadge status={"in-progress"} />
                                    </SelectItem>
                                    <SelectItem value="done">
                                      <StatusBadge status={"done"} />
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>優先度</FormLabel>
                              <FormControl>
                                <Select
                                  defaultValue="middle"
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="選択してください" />
                                  </SelectTrigger>
                                  <SelectContent className="">
                                    <SelectItem value="high">
                                      <PriorityBadge priority={"high"} />
                                    </SelectItem>
                                    <SelectItem value="middle">
                                      <PriorityBadge priority={"middle"} />
                                    </SelectItem>
                                    <SelectItem value="low">
                                      <PriorityBadge priority={"low"} />
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="assign"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>割り当て</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value?.toString()}
                                  onValueChange={(value) =>
                                    field.onChange(Number(value))
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="選択してください" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {isPending ? (
                                      <SelectItem value="loading" disabled>
                                        読み込み中...
                                      </SelectItem>
                                    ) : (
                                      members?.map((member) => (
                                        <SelectItem
                                          key={member.id}
                                          value={String(member.id)}
                                        >
                                          <Avatar className="inline-block size-5">
                                            <AvatarImage src={member.picture} />
                                          </Avatar>
                                          {member.user_name}
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter className="sm:justify-end">
                        <Button type="submit">タスク追加 </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button>
                <FileText />
                議事録アップロード
              </Button>
            </>
          )}

          <Avatar className="size-9">
            <AvatarImage src={me?.picture} />
            <AvatarFallback>{me?.user_name}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}
