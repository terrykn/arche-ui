"use client";
import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "./button.js";
import { Calendar } from "./calendar.js";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.js";
import { cn } from "./lib/utils.js";

type DatePickerProps = {
    value?: Date | null;
    defaultValue?: Date;
    onValueChange?: (date: Date | undefined) => void;
    placeholder?: string;
    formatDate?: (date: Date) => string;
    disabled?: boolean;
    className?: string;
};

function DatePicker({
    value,
    defaultValue,
    onValueChange,
    placeholder = "Pick a date",
    formatDate = (date) => date.toLocaleDateString(undefined, { dateStyle: "medium" }),
    disabled,
    className,
}: DatePickerProps) {
    const [inner, setInner] = React.useState(defaultValue);
    const selected = value === undefined ? inner : (value ?? undefined);
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    data-slot="date-picker"
                    variant="outline"
                    disabled={disabled}
                    className={cn("w-(--date-picker-width,15rem) justify-start font-normal", !selected && "text-muted-foreground", className)}
                >
                    <CalendarIcon aria-hidden="true" />
                    {selected ? formatDate(selected) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date: Date | undefined) => {
                        if (value === undefined) setInner(date);
                        onValueChange?.(date);
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}

export { DatePicker };