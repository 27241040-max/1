import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type UsersTableProps = {
  onEdit: (user: UserListItem) => void;
  users: UserListItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRoleBadgeClassName(role: UserListItem["role"]) {
  if (role === "admin") {
    return "border-transparent bg-primary text-primary-foreground";
  }

  return "border-border bg-secondary text-secondary-foreground";
}

export function UsersTable({ onEdit, users }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b border-border/70 hover:bg-transparent">
          <TableHead>用户</TableHead>
          <TableHead>角色</TableHead>
          <TableHead>邮箱验证</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>最近更新</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow className="border-b border-border/60 hover:bg-transparent" key={user.id}>
            <TableCell className="align-top">
              <strong className="block text-sm text-card-foreground">{user.name}</strong>
              <span className="mt-1 block text-sm text-muted-foreground">{user.email}</span>
            </TableCell>
            <TableCell className="align-top">
              <Badge
                className={`uppercase tracking-[0.12em] ${getRoleBadgeClassName(user.role)}`}
                variant="outline"
              >
                {user.role}
              </Badge>
            </TableCell>
            <TableCell className="align-top">
              <Badge variant={user.emailVerified ? "secondary" : "outline"}>
                {user.emailVerified ? "已验证" : "未验证"}
              </Badge>
            </TableCell>
            <TableCell className="align-top text-muted-foreground">
              {formatDate(user.createdAt)}
            </TableCell>
            <TableCell className="align-top text-muted-foreground">
              {formatDate(user.updatedAt)}
            </TableCell>
            <TableCell className="align-top text-right">
              <Button
                aria-label={`编辑用户 ${user.name}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(user)}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <PencilIcon className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
