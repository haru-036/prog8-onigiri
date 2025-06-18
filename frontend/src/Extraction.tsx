import { Button } from "./components/ui/button";
import {
  Dropzone,
  DropzoneDescription,
  DropzoneGroup,
  DropzoneInput,
  DropzoneTitle,
  DropzoneUploadIcon,
  DropzoneZone,
} from "./components/ui/dropzone";
import { Textarea } from "./components/ui/textarea";
import { Sparkles } from "lucide-react";

function Extraction() {
  return (
    <div className="grow flex justify-center items-center flex-col bg-neutral-100">
      <div className="text-left max-w-4xl w-full px-6">
        <h1 className="text-3xl pb-4 font-bold ">議事録からタスクを自動抽出</h1>
        <div className=" bg-white md:p-8 p-6 rounded-xl border border-border">
          <div>
            議事録を貼り付けまたはテキストファイルをアップロードしてください。
          </div>
          <Textarea
            className="w-full mt-3 mb-6 h-44 resize-x-none p-3"
            placeholder="例:
           ・プロジェクトAの進捗確認を田中さんが来週月曜までに実施"
          ></Textarea>
          <Dropzone
            accept={{
              "text/plain": [".txt"],
              "application/msword": [".doc", ".docx"],

              "application/pdf": [".pdf"],
            }}
            // onDropAccepted={setFiles}
          >
            <DropzoneZone className="mb-8">
              <DropzoneInput />
              <DropzoneGroup className="gap-4 ">
                <DropzoneUploadIcon />
                <DropzoneGroup>
                  <DropzoneTitle>ファイルをドラッグ&ドロップ</DropzoneTitle>
                  <DropzoneDescription>
                    PDF, Word, テキストファイル対応
                  </DropzoneDescription>
                </DropzoneGroup>
              </DropzoneGroup>
            </DropzoneZone>
          </Dropzone>

          <Button className="w-full font-bold py-4 text-center" size={"lg"}>
            <Sparkles />
            タスクを抽出する
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Extraction;
