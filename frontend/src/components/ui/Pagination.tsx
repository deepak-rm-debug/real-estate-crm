import { ChevronLeft, ChevronRight } from "lucide-react";

import { secondaryBtn } from "./styles";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between pt-4 text-sm text-slate-600">
      <span>
        {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <button className={secondaryBtn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {page} / {pages}
        </span>
        <button className={secondaryBtn} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}