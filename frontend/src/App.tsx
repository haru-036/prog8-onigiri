import { Button } from "./components/ui/button";

function App() {
  return (
    <div
      className="h-screen w-screen flex justify-center items-center  flex-col
    "
    >
      <div className="text-left">
        <div className="text-2x pb-8 font-bold ">
          ミーティング後、 <br />
          議事録からタスクを自動追加。
        </div>
        <Button>Googleアカウントで始める</Button>
      </div>
    </div>
  );
}

export default App;
