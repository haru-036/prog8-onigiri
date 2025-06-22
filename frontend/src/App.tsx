import { FileText } from "lucide-react";
import { Button } from "./components/ui/button";

function App() {
  return (
    <div className="min-h-svh flex justify-center items-center flex-col">
      <div className="text-left">
        <div className="flex items-center gap-2 pb-6">
          <span className="bg-linear-to-tr from-purple-700 to-primary rounded-md size-9 grid place-content-center">
            <FileText className="size-5 text-white" />
          </span>
          <div className="font-bold text-xl">MeeTask</div>
        </div>
        <div className="text-2xl pb-8 font-bold ">
          ミーティング後、 <br />
          議事録からタスクを自動追加。
        </div>
        <Button size={"lg"} className="text-base py-2" asChild>
          <a href={`${import.meta.env.VITE_API_URL}/login`}>
            Googleアカウントで始める
          </a>
        </Button>
      </div>
    </div>
  );
}

export default App;
