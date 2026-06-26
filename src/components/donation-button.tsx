"use client";

import { Button } from "@/components/ui/button";
import { Heart, Coffee } from "lucide-react";
import Link from "next/link";

interface DonationButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  label?: string;
}

export function DonationButton({
  variant = "outline",
  size = "sm",
  className,
  label,
}: DonationButtonProps) {
  const url = process.env.NEXT_PUBLIC_DONATION_URL;
  const defaultLabel =
    process.env.NEXT_PUBLIC_DONATION_LABEL || "Traktir kopi";

  if (!url) return null;

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group gap-1.5"
      >
        <Coffee className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
        <span>{label || defaultLabel}</span>
        <Heart className="h-3 w-3 fill-accent text-accent transition-transform group-hover:scale-110" />
      </Link>
    </Button>
  );
}
