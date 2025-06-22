import { useState } from "react";
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
import { useMutation } from "@tanstack/react-query";
import { api } from "./lib/axios";
import { useNavigate, useParams } from "react-router";

function Extraction() {
  const [text, setText] = useState<string>("");
  const urlParams = useParams<{ groupId: string }>();
  const groupId = urlParams.groupId || "";
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationKey: ["extractTasks"],
    mutationFn: async (text: string) => {
      const response = await api.post(`/groups/${groupId}/minutes/tasks`, {
        text: JSON.stringify({ text }),
      });

      return response.data;
    },
    onSuccess: (data) => {
      // Handle success, e.g., navigate to the result page or show a success message
      console.log("Tasks extracted successfully:", data);
      navigate(`/groups/${groupId}/result`, { state: { tasks: data } });
    },
  });

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
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例:
           ・プロジェクトAの進捗確認を田中さんが来週月曜までに実施"
          />
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

          <Button
            className="w-full font-bold py-4 text-center"
            size={"lg"}
            onClick={() => mutation.mutate(text)}
            disabled={mutation.isPending || !text.trim()}
          >
            <Sparkles />
            {mutation.isPending ? (
              <span className="animate-spin">処理中...</span>
            ) : (
              "タスクを抽出する"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Extraction;
