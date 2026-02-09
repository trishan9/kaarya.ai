"use client";

import Link from "next/link";
import Image from "next/image";
import { TUser } from "@/lib/definitions";
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
import { Card } from "@/components/ui/card";
import { Eye, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { PaginationMeta } from "@/lib/pagination";
import { Input } from "@/components/ui/input";

interface UsersTableProps {
  users: TUser[];
  meta?: PaginationMeta;
  errorMessage?: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

function getShowingRange(meta?: PaginationMeta) {
  if (!meta || meta.totalItems <= 0 || meta.totalPages <= 0) {
    return { from: 0, to: 0 };
  }

  const from = (meta.page - 1) * meta.size + 1;
  const to = Math.min(meta.totalItems, meta.page * meta.size);
  return { from, to };
}

export function UsersTable({ users, meta, errorMessage }: UsersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialSearch = searchParams?.get("search") ?? "";
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [pageInput, setPageInput] = useState<string>(() =>
    String(meta?.page ?? 1),
  );

  const showing = useMemo(() => getShowingRange(meta), [meta]);

  const setQueryParams = (next: {
    page?: number | null;
    size?: number | null;
    search?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (typeof next.search === "string" && next.search.trim().length > 0) {
      params.set("search", next.search);
    } else if (next.search === null) {
      params.delete("search");
    }

    if (typeof next.page === "number" && Number.isFinite(next.page)) {
      params.set("page", String(next.page));
    } else if (next.page === null) {
      params.delete("page");
    }

    if (typeof next.size === "number" && Number.isFinite(next.size)) {
      params.set("size", String(next.size));
    } else if (next.size === null) {
      params.delete("size");
    }

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const currentPage = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 0;
  const currentSize = meta?.size ?? 10;

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const nextSearch = searchValue.trim();
      setPageInput("1");
      setQueryParams({
        page: 1,
        search: nextSearch.length > 0 ? nextSearch : null,
      });
    }, 400);

    return () => clearTimeout(handle);
  }, [searchValue]);

  return (
    <Card className="overflow-hidden py-0">
      <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium text-muted-foreground">
          Users overview
        </div>
        <div className="flex w-full max-w-xs items-center gap-2 rounded-md border bg-background px-2 py-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search users by name or email..."
            className="h-8 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errorMessage && (
              <TableRow>
                <TableCell
                  className="h-24 text-center text-muted-foreground"
                  colSpan={6}
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            )}

            {!errorMessage && users.length === 0 && (
              <TableRow>
                <TableCell
                  className="h-24 text-center text-muted-foreground"
                  colSpan={6}
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}

            {users.map((user) => (
              <TableRow key={user.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative size-10 overflow-hidden rounded-full border-2 border-background bg-muted ring-2 ring-muted group-hover:ring-primary/20 transition-all">
                      {user?.photo ? (
                        <Image
                          src={user.photo}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold bg-linear-to-br from-primary/20 to-primary/10">
                          {user.name.charAt(0).toUpperCase()}
                          {user.name.split(" ")[1]?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {user.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm">{user.email ?? "-"}</span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {user.role}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {user.updatedAt
                      ? new Date(user.updatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild className="gap-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </Button>

                    <Button variant="ghost" size="sm" asChild className="gap-2">
                      <Link href={`/admin/users/${user.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!errorMessage && meta && (
        <div className="flex flex-col gap-3 border-t bg-background/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {meta.totalItems > 0 ? (
              <>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {showing.from}-{showing.to}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {meta.totalItems}
                </span>
              </>
            ) : (
              "No users to display"
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <label className="text-sm text-muted-foreground">
              <span className="sr-only">Rows per page</span>
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={String(currentSize)}
                onChange={(e) => {
                  const nextSize = Number(e.target.value);
                  setPageInput("1");
                  setQueryParams({ page: 1, size: nextSize });
                }}
              >
                {PAGE_SIZE_OPTIONS.map((sizeOption) => (
                  <option key={sizeOption} value={String(sizeOption)}>
                    {sizeOption} / page
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPrevPage}
                onClick={() => {
                  if (!meta.prevPage) return;
                  setPageInput(String(meta.prevPage));
                  setQueryParams({ page: meta.prevPage });
                }}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Page</span>
                <input
                  className="h-9 w-16 rounded-md border bg-background px-2 text-sm"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => setPageInput(String(currentPage))}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const raw = Number(pageInput);
                    const nextPage = Number.isFinite(raw)
                      ? Math.max(1, Math.min(totalPages || 1, raw))
                      : currentPage;
                    setPageInput(String(nextPage));
                    setQueryParams({ page: nextPage });
                  }}
                  aria-label="Page number"
                />
                <span className="text-muted-foreground">
                  of{" "}
                  <span className="font-medium text-foreground">
                    {totalPages}
                  </span>
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => {
                  if (!meta.nextPage) return;
                  setPageInput(String(meta.nextPage));
                  setQueryParams({ page: meta.nextPage });
                }}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
