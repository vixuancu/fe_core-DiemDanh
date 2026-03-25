import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';

interface CustomDropdownProps {
    trigger?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function CustomDropdown({ trigger, children, className = "" }: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger || (
                    <button className="p-1.5 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer outline-none">
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div
                    className={`absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-xl border border-gray-200 z-[100] py-1 animate-in fade-in zoom-in-95 duration-100 ${className}`}
                    onClick={() => setIsOpen(false)}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

interface DropdownItemProps {
    icon?: ReactNode;
    label: string;
    onClick?: () => void;
    variant?: 'default' | 'danger' | 'info';
    className?: string;
}

export function DropdownItem({ icon, label, onClick, variant = 'default', className = "" }: DropdownItemProps) {
    const variantStyles = {
        default: "text-gray-700 hover:bg-gray-50",
        danger: "text-red-600 font-medium hover:bg-red-50",
        info: "text-blue-600 font-medium hover:bg-blue-50"
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${variantStyles[variant]} ${className}`}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{label}</span>
        </button>
    );
}

export function DropdownSeparator() {
    return <div className="h-px bg-gray-100 my-1" />;
}