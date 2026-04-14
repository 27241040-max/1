import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
} from "lucide-react";
import {
  TicketCategory,
  TicketStatus,
  type TicketListItem,
  type TicketSortField,
  type TicketSortOrder,
} from "core/email";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TicketsTableProps = {
  isSortingPending?: boolean;
  onSortingChange: (sortBy: TicketSortField) => void;
  sorting: {
    sortBy: TicketSortField;
    sortOrder: TicketSortOrder;
  };
  tickets: TicketListItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getCategoryLabel(category: TicketListItem["category"]) {
  if (!category) {
    return "未分类";
  }

  switch (category) {
    case TicketCategory.general:
      return "General";
    case TicketCategory.technical:
      return "Technical";
    case TicketCategory.refundRequest:
      return "Refund Request";
  }
}

function getStatusLabel(status: TicketStatus) {
  switch (status) {
    case TicketStatus.open:
      return "Open";
    case TicketStatus.resolved:
      return "Resolved";
    case TicketStatus.closed:
      return "Closed";
  }
}

function getStatusClassName(status: TicketStatus) {
  switch (status) {
    case TicketStatus.open:
      return "border-transparent bg-primary text-primary-foreground";
    case TicketStatus.resolved:
      return "border-transparent bg-secondary text-secondary-foreground";
    case TicketStatus.closed:
      return "border-border bg-background text-muted-foreground";
  }
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") {
    return <ArrowUpIcon className="size-3.5" />;
  }

  if (direction === "desc") {
    return <ArrowDownIcon className="size-3.5" />;
  }

  return <ArrowUpDownIcon className="size-3.5" />;
}

function SortableHeader({
  columnId,
  disabled = false,
  label,
  onSortingChange,
  sorting,
}: {
  columnId: TicketSortField;
  disabled?: boolean;
  label: string;
  onSortingChange: (sortBy: TicketSortField) => void;
  sorting: TicketsTableProps["sorting"];
}) {
  const direction = sorting.sortBy === columnId ? sorting.sortOrder : false;

  return (
    <Button
      className="-ml-2 h-auto px-2 py-1 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
      disabled={disabled}
      onClick={() => onSortingChange(columnId)}
      size="sm"
      type="button"
      variant="ghost"
    >
      <span>{label}</span>
      <SortIcon direction={direction} />
    </Button>
  );
}

export function TicketsTable({
  isSortingPending = false,
  onSortingChange,
  sorting,
  tickets,
}: TicketsTableProps) {
  const sortingState: SortingState = [
    {
      desc: sorting.sortOrder === "desc",
      id: sorting.sortBy,
    },
  ];

  const columns: ColumnDef<TicketListItem>[] = [
    {
      accessorKey: "subject",
      header: () => (
        <SortableHeader
          columnId="subject"
          disabled={isSortingPending}
          label="主题"
          onSortingChange={onSortingChange}
          sorting={sorting}
        />
      ),
      cell: ({ row }) => (
        <strong className="block text-sm text-card-foreground">{row.original.subject}</strong>
      ),
    },
    {
      id: "customer",
      accessorFn: (ticket) => ticket.customer.name,
      header: () => (
        <SortableHeader
          columnId="customer"
          disabled={isSortingPending}
          label="客户"
          onSortingChange={onSortingChange}
          sorting={sorting}
        />
      ),
      cell: ({ row }) => (
        <>
          <strong className="block text-sm text-card-foreground">{row.original.customer.name}</strong>
          <span className="mt-1 block text-sm text-muted-foreground">
            {row.original.customer.email}
          </span>
        </>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <SortableHeader
          columnId="status"
          disabled={isSortingPending}
          label="状态"
          onSortingChange={onSortingChange}
          sorting={sorting}
        />
      ),
      cell: ({ row }) => (
        <Badge className={getStatusClassName(row.original.status)} variant="outline">
          {getStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "category",
      header: () => (
        <SortableHeader
          columnId="category"
          disabled={isSortingPending}
          label="分类"
          onSortingChange={onSortingChange}
          sorting={sorting}
        />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{getCategoryLabel(row.original.category)}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className="flex justify-end">
          <SortableHeader
            columnId="createdAt"
            disabled={isSortingPending}
            label="创建时间"
            onSortingChange={onSortingChange}
            sorting={sorting}
          />
        </div>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
      meta: {
        cellClassName: "text-right",
        headerClassName: "text-right",
      },
    },
  ];

  const table = useReactTable({
    columns,
    data: tickets,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: {
      sorting: sortingState,
    },
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow className="border-b border-border/70 hover:bg-transparent" key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              const meta = header.column.columnDef.meta as
                | { cellClassName?: string; headerClassName?: string }
                | undefined;

              return (
                <TableHead className={meta?.headerClassName} key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow className="border-b border-border/60 hover:bg-transparent" key={row.id}>
            {row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta as
                | { cellClassName?: string; headerClassName?: string }
                | undefined;

              return (
                <TableCell className={`align-top ${meta?.cellClassName ?? ""}`.trim()} key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
