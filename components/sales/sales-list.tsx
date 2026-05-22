import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/types/supabase";
import { ArrowUpDown } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type SaleRow = Database["public"]["Tables"]["sales"]["Row"];

interface SalesListProps {
  sales: SaleRow[];
  total: number;
  page: number;
  totalPages: number;
  onEdit: (sale: SaleRow) => void;
  onDelete: (id: string) => void;
}

export function SalesList({
  sales,
  total,
  page,
  totalPages,
  onEdit,
  onDelete,
}: SalesListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "sold_at";
  const currentOrder = searchParams.get("order") ?? "desc";

  const updateSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSort === column) {
      params.set("order", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", column);
      params.set("order", "desc");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const sortLabel = (col: string) => {
    if (currentSort !== col) return null;
    return currentOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>
                <button
                  onClick={() => updateSort("sale_price")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Price{sortLabel("sale_price")}
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => updateSort("sold_at")}
                  className="flex items-center gap-1 hover:text-text-primary"
                >
                  Date{sortLabel("sold_at")}
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  {sale.domain_id ? (
                    <Link
                      href={`/domains/${sale.domain_id}`}
                      className="font-mono text-sm text-accent-primary hover:underline"
                    >
                      {sale.domain_name}
                    </Link>
                  ) : (
                    <span className="font-mono text-sm">{sale.domain_name}</span>
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium text-accent-success">
                  ${sale.sale_price.toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(sale.sold_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm text-text-muted">
                  {sale.buyer || "—"}
                </TableCell>
                <TableCell className="text-sm text-text-muted">
                  {sale.platform || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(sale)}
                      className="text-xs text-accent-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(sale.id)}
                      className="text-xs text-accent-danger hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-text-muted">
        <span>
          {total} sales · Page {page} of {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded-md bg-bg-elevated hover:bg-bg-elevated/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded-md bg-bg-elevated hover:bg-bg-elevated/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
