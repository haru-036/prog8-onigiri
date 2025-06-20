import { Button } from "./components/ui/button";

function App() {
  return (
    <div className="min-h-svh flex justify-center items-center flex-col">
      <div className="text-left">
        <div className="text-2xl pb-8 font-bold ">
          ミーティング後、 <br />
          議事録からタスクを自動追加。
        </div>
        <Button size={"lg"} className="text-base" asChild>
          <a href={`${import.meta.env.VITE_API_URL}/login`}>
            Googleアカウントで始める
          </a>
        </Button>
      </div>
    </div>
  );
}

export default App;
