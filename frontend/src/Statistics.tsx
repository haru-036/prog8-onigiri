function Statistics() {
  return (
    <div className=" bg-neutral-50 pr-4 pt-6 w-[300px] shrink-0">
      <div className="bg-white border border-neutral-200 max-w-sm rounded-md ">
        <div className="text-left p-4">
          <div className="pb-2 font-bold text-lg">統計情報</div>
          <div className="flex justify-between">
            <div className="justify-start text-muted-foreground pb-2 text-sm">
              総タスク数
            </div>
            <div className="text-lg">8</div>
          </div>
          <div className="flex justify-between">
            <div className="justify-start text-muted-foreground pb-2 text-sm">
              高優先度
            </div>
            <div className="text-lg">8</div>
          </div>
          <div className="flex justify-between">
            <div className="justify-start text-muted-foreground pb-2 text-sm">
              担当者設定済
            </div>
            <div className="text-lg">8</div>
          </div>
          <div className="flex justify-between">
            <div className="justify-start text-muted-foreground pb-2 text-sm">
              期限設定済
            </div>
            <div className="text-lg">8</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
