import { nanoid } from "nanoid";
import { type ClassValue, clsx } from "clsx";

export function generateInviteCode(): string {
    return nanoid(8);
}

// Simple classname merge (no tailwind-merge needed for our scope)
export function cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
}
