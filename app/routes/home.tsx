import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useQueryState } from "nuqs";
import { useDebouncedCallback } from "use-debounce";
import type { Route } from "./+types/home";
import { DUMMY_TASKS } from "~/constants";

export function loader({ request }: Route.LoaderArgs) {
  const search = new URL(request.url).searchParams.get("search") || "";
  const page = Number(new URL(request.url).searchParams.get("page") || 0);
  const pagination = 2;

  const filteredTasks = DUMMY_TASKS.filter((dt) => dt.name.toLowerCase().includes(search?.toLowerCase()));
  const paginatedTasks = filteredTasks.slice(pagination * page, pagination * (page + 1));
  const hasNextPage = !!filteredTasks[pagination * (page + 1) + 1];

  return { tasks: paginatedTasks, hasNextPage };
}

export default function Homepage({ loaderData }: Route.ComponentProps) {
  const { tasks } = loaderData;
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
        {tasks.map((t) => (
          <Card key={t.id} className="mb-4">
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
              <CardDescription>{`${t.sub_category?.category.name} - ${t.sub_category?.name}`}</CardDescription>
              <CardContent className="flex h-full items-end justify-between px-0">
                <div className="text-xs">Progress Terakhir: {t.get_latest_progress?.value}</div>
                <Input className="w-14 text-sm font-medium" defaultValue={t.get_latest_progress?.value} />
              </CardContent>
            </CardHeader>
          </Card>
        ))}
        <CustomPagination />
      </ScrollArea>
    </div>
  );
}

import { Pagination, PaginationContent, PaginationItem } from "~/components/ui/pagination";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLoaderData } from "react-router";

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
