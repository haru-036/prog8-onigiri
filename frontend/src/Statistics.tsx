function Statistics() {
  return (
    <div className="grow w-full bg-neutral-50">
      <div className="bg-white rounded-md p-3">
        <div className=" flex justify-center items-center  flex-col">
          <div className="text-left">
            <div className="text-2xl pb-2 font-bold ">統計情報</div>
            <div className="flex justify-between ">
              <div className="justify-start text-muted-foreground">
                総タスク数
              </div>
              <div>8</div>
            </div>
            <div className="justify-start text-muted-foreground">高優先度</div>
            <div className="justify-start text-muted-foreground">
              担当者設定済
            </div>
            <div className="justify-start text-muted-foreground">
              期限設定済
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
