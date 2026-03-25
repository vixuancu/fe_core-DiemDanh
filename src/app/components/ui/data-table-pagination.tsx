import * as React from "react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "./pagination";
import { PortableSelect } from "./portable-form-controls";

interface DataTablePaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    perPageOptions?: number[];
}

export function DataTablePagination({
    currentPage,
    lastPage,
    total,
    perPage,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 20, 30, 40],
}: DataTablePaginationProps) {

    const getVisiblePages = () => {
        const pages: (number | string)[] = [];
        if (lastPage <= 5) {
            for (let i = 1; i <= lastPage; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, "...", lastPage);
            } else if (currentPage >= lastPage - 2) {
                pages.push(1, "...", lastPage - 2, lastPage - 1, lastPage);
            } else {
                pages.push(1, "...", currentPage, "...", lastPage);
            }
        }
        return pages;
    };

    return (
        <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-white">
            <div className="flex items-center gap-6">
                <p className="text-sm text-muted-foreground hidden sm:block">
                    Tổng số: <span className="font-medium text-foreground">{total}</span>
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Hiển thị:</span>
                    <PortableSelect
                        value={perPage}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                        className="h-8 w-[70px] text-xs"
                    >
                        {perPageOptions.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </PortableSelect>
                </div>
            </div>

            <Pagination className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); if (currentPage > 1) onPageChange(currentPage - 1); }}
                            className={currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                        />
                    </PaginationItem>

                    {getVisiblePages().map((p, i) => (
                        <PaginationItem key={i}>
                            {p === "..." ? (
                                <PaginationEllipsis />
                            ) : (
                                <PaginationLink
                                    href="#"
                                    isActive={currentPage === p}
                                    onClick={(e) => { e.preventDefault(); onPageChange(p as number); }}
                                    className="cursor-pointer"
                                >
                                    {p}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); if (currentPage < lastPage) onPageChange(currentPage + 1); }}
                            className={currentPage === lastPage ? "pointer-events-none opacity-40" : "cursor-pointer"}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}