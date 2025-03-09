import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useQueryState } from "nuqs";
import { useDebouncedCallback } from "use-debounce";
import type { Route } from "./+types/home";
import { format } from "date-fns/format";
import { createClient } from "~/lib/supabase";
import ProgressCard from "~/components/ProgressCard";
import CustomPagination from "~/components/CustomPagination";
import { Card, CardContent } from "~/components/ui/card";

export async function loader({ request }: Route.LoaderArgs) {
  const search = new URL(request.url).searchParams.get("search") || "";
  const page = Number(new URL(request.url).searchParams.get("page") || 0);
  const pagination = 10;
  const offset = page * pagination;

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
        date,
        note
      )
    `,
      { count: "exact" }
    )
    .order("updated_at", { foreignTable: "progresses", ascending: false })
    .limit(1, { foreignTable: "progresses" })
    .ilike("name", `%${search}%`) // Case-insensitive search by task name
    .range(offset, offset + pagination - 1);

  // Group tasks by sub_category
  const groupedData = data?.reduce((acc, task) => {
    // @ts-ignore
    const subCategoryName = task.sub_category.name;
    const categoryName = task.sub_category.category.name;

    // Check if this sub-category already exists in the accumulator
    const existingGroup = acc.find((group) => group.sub_category_name === subCategoryName);

    if (existingGroup) {
      existingGroup.tasks.push({
        ...task,
        latest_progress: task.progresses[0]?.value || null,
        latest_progress_date: task.progresses[0]?.date || null,
        note: task.progresses[0]?.note || null,
      });
    } else {
      acc.push({
        sub_category_name: subCategoryName,
        category_name: categoryName,
        tasks: [
          {
            ...task,
            latest_progress: task.progresses[0]?.value || null,
            latest_progress_date: task.progresses[0]?.date || null,
            note: task.progresses[0]?.note || null,
          },
        ],
      });
    }

    return acc;
  }, []);

  const hasNextPage = count ? Math.floor(count / pagination) > page : false;

  return { tasks: groupedData, hasNextPage };
}

export async function clientAction({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const task_id = formData.get("task_id");
  const progress = formData.get("value");
  const note = formData.get("note");

  const supabase = await createClient();
  await supabase.from("progresses").insert([
    {
      task_id: Number(task_id),
      value: Number(progress),
      note: note || "",
      date: format(new Date(), "yyyy-MM-dd"),
      updated_at: new Date().toISOString(),
    },
  ]);
  return true;
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
          <div className="space-y-4">
            <h1 className="bg-slate-200 py-2 px-4 font-bold rounded-lg text-sm">
              {task.category_name}: {task.sub_category_name}
            </h1>
            {task.tasks.map((task) => (
              <ProgressCard task={task} />
            ))}
          </div>
        ))}
        <CustomPagination />
      </ScrollArea>
    </div>
  );
}
