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
import { useLocation, useNavigate } from 'react-router';

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
    const location = useLocation();
    const navigate = useNavigate();
    const didInitFromUrlRef = React.useRef(false);

    const resolvePaginationFromUrl = React.useCallback(() => {
        const params = new URLSearchParams(location.search);

        const rawPerPage = Number(params.get("perPage"));
        const nextPerPage = perPageOptions.includes(rawPerPage) ? rawPerPage : perPage;

        const rawPage = Number(params.get("page"));
        const normalizedPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
        const maxPage = lastPage > 0 ? lastPage : 1;
        const nextPage = Math.min(normalizedPage, maxPage);

        return { nextPage, nextPerPage };
    }, [lastPage, location.search, perPage, perPageOptions]);

    const syncUrlParams = (page: number, nextPerPage: number, mode: "push" | "replace" = "push") => {
        const params = new URLSearchParams(location.search);
        params.set("page", String(page));
        params.set("perPage", String(nextPerPage));

        navigate(
            {
                pathname: location.pathname,
                search: `?${params.toString()}`,
            },
            { replace: mode === "replace" },
        );
    };

    const handlePageChange = (page: number) => {
        syncUrlParams(page, perPage);
        onPageChange(page);
    };

    const handlePerPageChange = (nextPerPage: number) => {
        syncUrlParams(1, nextPerPage, "push");
        onPerPageChange(nextPerPage);
        onPageChange(1);
    };

    React.useEffect(() => {
        if (didInitFromUrlRef.current) return;
        didInitFromUrlRef.current = true;

        const { nextPage, nextPerPage } = resolvePaginationFromUrl();

        if (nextPerPage !== perPage) {
            onPerPageChange(nextPerPage);
        }
        if (nextPage !== currentPage) {
            onPageChange(nextPage);
        }

        // Ensure URL is normalized on first load.
        syncUrlParams(nextPage, nextPerPage, "replace");
    }, [currentPage, onPageChange, onPerPageChange, perPage, resolvePaginationFromUrl]);

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
                        onChange={(e) => handlePerPageChange(Number(e.target.value))}
                        className="h-8 w-[70px] text-xs rounded-lg"
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
                            onClick={(e) => { e.preventDefault(); if (currentPage > 1) handlePageChange(currentPage - 1); }}
                            className={currentPage === 1 ? "pointer-events-none opacity-40 rounded-lg" : "cursor-pointer rounded-lg"}
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
                                    onClick={(e) => { e.preventDefault(); handlePageChange(p as number); }}
                                    className="cursor-pointer rounded-lg"
                                >
                                    {p}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); if (currentPage < lastPage) handlePageChange(currentPage + 1); }}
                            className={currentPage === lastPage ? "pointer-events-none opacity-40 rounded-lg" : "cursor-pointer rounded-lg"}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
}