import { useForm } from "react-hook-form";
import { Button } from "./components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/ui/form";
import { Input } from "./components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  groupname: z.string().min(1).max(20),
});

function NewGroup() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groupname: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }
  return (
    <div className="grow flex justify-center items-center flex-col">
      <div className="text-left">
        <div className="text-2xl pb-4 font-bold ">新規グループ作成</div>
        <div className="pb-8">
          あなたがリーダーとなるグループを作成します。
          <br />
          既存のグループに入る場合はリーダーから招待を受けてください。
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-4"
          >
            <FormField
              control={form.control}
              name="groupname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>グループ名</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="グループ名"
                      className="py-2 text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="w-full"
              type="submit"
              disabled={!form.formState.isValid}
            >
              グループを作成する
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default NewGroup;
