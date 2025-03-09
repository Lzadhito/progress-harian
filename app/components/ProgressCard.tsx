import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "~/components/ui/dialog";
import type { Task } from "~/types";
import { useDebounceFetcher } from "~/hooks/useDebounceFetcher";
import { useEffect, useState } from "react";

export default function ProgressCard({ task }: { task: Task }) {
  const fetcher = useDebounceFetcher();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") setOpen(false);
  }, [fetcher]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card key={task.id} className="mb-4 cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader>
            <CardTitle>{task.name}</CardTitle>
            <CardDescription>{task.note}</CardDescription>
            <CardContent className="flex h-full items-end justify-end px-0">
              <div className="w-14 text-sm font-medium text-neutral-600">{task.latest_progress || 0}%</div>
            </CardContent>
          </CardHeader>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="mt-4 text-left">{task.name}</DialogTitle>
        </DialogHeader>

        <fetcher.Form method="post" className="space-y-4">
          <Input
            id="progress"
            name="value"
            type="number"
            min={0}
            max={100}
            defaultValue={task.latest_progress}
            placeholder={"Masukkan progress terbaru"}
            className="w-full"
          />
          <Textarea
            id="note"
            name="note"
            defaultValue={task.note}
            placeholder={"Catatan progress hari ini (optional)"}
            className="w-full"
          />

          <input type="hidden" name="task_id" value={task.id} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Tutup
            </Button>
            <Button type="submit" loading={fetcher.state === "submitting"}>
              Simpan
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
