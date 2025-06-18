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
    <div className="h-screen  flex justify-center items-center  flex-col bg-neutral-50">
      <div className="text-left max-w-2xl w-full px-6">
        <h1 className="text-3xl pb-8 font-bold ">議事録からタスクを自動抽出</h1>
        <div className=" bg-white p-8 rounded-lg shadow-md ">
          <div>
            議事録を貼り付けまたはテキストファイルをアップロードしてください。
          </div>
          <Textarea
            className="w-full mt-4 mb-8 h-44 resize-none p-3"
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

          <Button className="w-full py-5 text-center">
            <Sparkles />
            タスクを抽出する
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Extraction;
