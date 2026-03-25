export type PaginationToken = number | '...';

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
  boundaryCount = 1,
): PaginationToken[] {
  if (totalPages <= 0) return [];

  const safeCurrent = Math.min(Math.max(1, currentPage), totalPages);
  const pages = new Set<number>();

  for (let i = 1; i <= Math.min(boundaryCount, totalPages); i += 1) {
    pages.add(i);
  }

  for (
    let i = Math.max(1, safeCurrent - siblingCount);
    i <= Math.min(totalPages, safeCurrent + siblingCount);
    i += 1
  ) {
    pages.add(i);
  }

  for (
    let i = Math.max(1, totalPages - boundaryCount + 1);
    i <= totalPages;
    i += 1
  ) {
    pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items: PaginationToken[] = [];

  let prev: number | null = null;
  for (const page of sorted) {
    if (prev !== null) {
      if (page - prev === 2) {
        items.push(prev + 1);
      } else if (page - prev > 2) {
        items.push('...');
      }
    }
    items.push(page);
    prev = page;
  }

  return items;
}
