import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";

import { FileDropZone } from "@/components/ui/file-drop-zone";

function Extraction() {
  return (
    <div
      className="h-screen w-screen flex justify-center items-center  flex-col
    "
    >
      <div className="text-left">
        <div className="text-3xl pb-8 font-bold ">
          議事録からタスクを自動抽出
        </div>
        <div>
          議事録を貼り付けまたはテキストファイルをアップロードしてください。
        </div>
        <Textarea
          className="w-full pb-30 mt-4 mb-8"
          placeholder="例:
           ・プロジェクトAの進捗確認を田中さんが来週月曜までに実施"
        ></Textarea>
        <FileDropZone />

        <Button className="w-full py-5 text-center">タスクを抽出する</Button>
      </div>
    </div>
  );
}
console.log("Extraction component loaded");

export default Extraction;
