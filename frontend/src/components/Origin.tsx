import { Eye } from "lucide-react";
import { Button } from "./ui/button";

function Origin() {
  return (
    <div className=" bg-neutral-50 pt-6 w-[300px] shrink-0">
      <div className="bg-white border border-neutral-200 max-w-sm rounded-md ">
        <div className="text-left p-5 space-y-2 ">
          <div className="flex justify-between items-center">
            <div className="pb-2 font-bold text-base">元テキスト</div>
            <div className="text-lg font-bold bg-neutral-50">
              <Button variant="secondary" size="icon" className="size-8">
                <Eye />
              </Button>
            </div>
          </div>
          <div className=" bg-secondary p-4 rounded-md">
            <div className="flex justify-between items-center">
              <div className="justify-start pb-2 text-sm">
                会議議事録-2025/06/21
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="justify-start text-muted-foreground pb-2 text-sm">
                プロジェクトAの進捗確認を田中さんが来週月曜までに実施することになりました。また、新機能の仕様書作成を佐藤さんが今月末までに完了する予定です。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Origin;
