import { Button } from "./components/ui/button";

function NewGroup() {
  return (
    <div className="grow flex justify-center items-center flex-col">
      <div className="text-left">
        <div className="text-2xl pb-4 font-bold ">新規グループ作成</div>
        <div className="pb-4">
          あなたがリーダーとなるグループを作成します。
          <br />
          既存のグループに入る場合はリーダーから招待を受けてください。
        </div>
        <Button className="w-full">グループを作成する</Button>
      </div>
    </div>
  );
}

export default NewGroup;
