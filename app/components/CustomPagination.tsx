import { Pagination, PaginationContent, PaginationItem } from "~/components/ui/pagination";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLoaderData } from "react-router";

import { useQueryState } from "nuqs";

export default function CustomPagination() {
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
