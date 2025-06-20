import { Button } from "./components/ui/button";
import { Users, Flag, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import Statistics from "./components/Statistics";
import Origin from "./components/Origin";

function Result() {
  return (
    <div className="grow w-full bg-neutral-50">
      <div className="flex-1 flex gap-6 mx-auto max-w-7xl xl:container shrink-0 ">
        <div className="w-full">
          <div className="flex items-center p-1 gap-1 justify-between pl-8">
            <div className="items-start">
              <h2 className="font-bold text-2xl pt-6">抽出結果</h2>
              <div className="justify-start text-muted-foreground text-sm">
                8個のタスクが見つかりました
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
              <Button className="text-sm">
                <Plus />
                追加
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-col">
          <Statistics />
          <Origin />
        </div>
      </div>
    </div>
  );
}

export default Result;
