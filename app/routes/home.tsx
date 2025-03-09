import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useQueryState } from "nuqs";
import { useDebouncedCallback } from "use-debounce";
import type { Route } from "./+types/home";
import { format } from "date-fns/format";

export async function loader({ request }: Route.LoaderArgs) {
  const search = new URL(request.url).searchParams.get("search") || "";
  const page = Number(new URL(request.url).searchParams.get("page") || 0);
  const pagination = 10;
  const offset = page * pagination; // Calculate offset for pagination

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("tasks")
    .select(
      `
      id,
      name,
      description,
      volume,
      unit,
      hds,
      total,
      price,
      weight,
      created_at,
      updated_at,
      sub_category:sub_category_id (name, category:category_id (name)),
      progresses (
        value,
        date
      )
    `,
      { count: "exact" }
    )
    .order("updated_at", { foreignTable: "progresses", ascending: false })
    .limit(1, { foreignTable: "progresses" })
    .ilike("name", `%${search}%`) // Case-insensitive search by task name
    .range(offset, offset + pagination - 1);

  const transformedData = data?.map((task) => ({
    ...task,
    // @ts-ignore
    sub_category_name: task.sub_category.name,
    // @ts-ignore
    category_name: task.sub_category.category.name,
    latest_progress: task.progresses[0]?.value || null,
    latest_progress_date: task.progresses[0]?.date || null,
  }));

  const hasNextPage = count ? Math.floor(count / pagination) > page : false;

  return { tasks: transformedData, hasNextPage };
}

export async function clientAction({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const progress = formData.get("progress");
  const task_id = formData.get("task_id");
  const supabase = await createClient();
  const s = await supabase.from("progresses").insert([
    {
      task_id: Number(task_id),
      value: Number(progress),
      date: format(new Date(), "yyyy-MM-dd"),
      updated_at: new Date().toISOString(),
    },
  ]);
  return;
}

export default function Homepage({ loaderData }: Route.ComponentProps) {
  const { tasks = [] } = loaderData;
  const [search, setSearch] = useQueryState("search", { defaultValue: "", shallow: false });
  const [_, setPage] = useQueryState("page", { defaultValue: "0", shallow: false });
  const onSearch = useDebouncedCallback((event) => {
    setPage(null);
    setSearch(event.target.value);
  }, 300);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Update Progress Harian</h1>
      <Input placeholder="Cari nama pesawat" defaultValue={search} onInput={onSearch} />
      <ScrollArea>
        {tasks.map((task) => (
          <ProgressCard task={task} />
        ))}
        <CustomPagination />
      </ScrollArea>
    </div>
  );
}

function ProgressCard({ task }: { task: Task }) {
  const fetcher = useDebounceFetcher();

  const onInput: React.FormEventHandler<HTMLInputElement> = (event) => {
    fetcher.debounceSubmit(event.currentTarget.form, { method: "POST", debounceTimeout: 300 });
  };

  return (
    <Card key={task.id} className="mb-4">
      <CardHeader>
        <CardTitle>{task.name}</CardTitle>
        <CardDescription>{`${task.category_name} - ${task.sub_category_name}`}</CardDescription>
        <CardContent className="flex h-full items-end justify-between px-0">
          <div className="text-xs">Progress Terakhir: {task.latest_progress}</div>
          <fetcher.Form method="post">
            <input type="hidden" name="task_id" value={task.id} />
            <Input
              name="progress"
              onInput={onInput}
              defaultValue={task.latest_progress || 0}
              className="w-14 text-sm font-medium"
              max={100}
            />
          </fetcher.Form>
        </CardContent>
      </CardHeader>
    </Card>
  );
}

import { Pagination, PaginationContent, PaginationItem } from "~/components/ui/pagination";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Form, useFetcher, useLoaderData, useSubmit } from "react-router";
import type { Task } from "~/types";
import { useState } from "react";
import { useDebounceFetcher } from "~/hooks/useDebounceFetcher";
import { createClient } from "~/lib/supabase";

export function CustomPagination() {
  const { hasNextPage } = useLoaderData();
  const [page, setPage] = useQueryState("page", { defaultValue: "0", shallow: false });
  return (
    <Pagination>
      <PaginationContent>
        {page !== "0" && (
          <PaginationItem>
            <Button size="icon" variant="ghost" onClick={() => setPage((page) => String(Number(page) - 1))}>
              <ChevronLeft />
            </Button>
          </PaginationItem>
        )}
        {hasNextPage && (
          <PaginationItem>
            <Button size="icon" variant="ghost" onClick={() => setPage((page) => String(Number(page) + 1))}>
              <ChevronRight />
            </Button>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
