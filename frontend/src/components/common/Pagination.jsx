import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    // If only 1 page, no need to show pagination
    if (totalPages <= 1) return null;

    const generatePages = () => {
        const pages = [];
        
        // Show max 5 buttons (e.g. 1 2 3 4 5, or 1 ... 4 5 6 ... 10)
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
            <div className="text-[13px] font-medium text-slate-500">
                Showing <span className="font-bold text-slate-800">{startItem}</span> to <span className="font-bold text-slate-800">{endItem}</span> of <span className="font-bold text-slate-800">{totalItems}</span> results
            </div>
            
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                
                <div className="flex items-center gap-1">
                    {generatePages().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <div className="w-9 h-9 flex items-center justify-center text-slate-400">
                                    <MoreHorizontal size={16} />
                                </div>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold transition-all ${
                                        currentPage === page 
                                            ? 'bg-indigo-600 text-white shadow-[0_2px_8px_rgba(79,70,229,0.25)]' 
                                            : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
