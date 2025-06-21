function Statistics() {
  return (
    <div className=" bg-neutral-50 pr-4 pt-6 w-[300px] shrink-0">
      <div className="bg-white border border-neutral-200 max-w-sm rounded-md ">
        <div className="text-left p-4">
          <div className="text-2xl pb-2 font-bold">統計情報</div>
          <div className="flex justify-between">
            <div className="justify-start text-muted-foreground pb-2">
              総タスク数
            </div>
            <div>8</div>
          </div>
          <div className="flex justify-between">
            <div className="justify-start text-muted-foreground pb-2">
              高優先度
            </div>
            <div>8</div>
          </div>
          <div className="flex justify-between">
            <div className="justify-start text-muted-foreground pb-2">
              担当者設定済
            </div>
            <div>8</div>
          </div>
          <div className="flex justify-between">
            <div className="justify-start text-muted-foreground pb-2">
              期限設定済
            </div>
            <div>8</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
