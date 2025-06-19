import { Button } from "./components/ui/button";
import { Users } from "lucide-react";
import { ArrowDownWideNarrow } from "lucide-react";
function Result() {
  return (
    <div className="flex flex-row p-8 w-full">
      <section>
        <div className="text-3xl font-bold pr-200">抽出結果</div>
      </section>
      <ArrowDownWideNarrow />
      <select className="">
        <option value="someOption">優先度</option>
        <option value="otherOption"></option>
      </select>
      <div className="ms-8 flex flex-row">
        <Users />
        <select>
          <option value="someOption">担当者</option>
          <option value="otherOption"></option>
        </select>
      </div>
      <Button className="ms-8">+ 追加</Button>
    </div>
  );
}

export default Result;
