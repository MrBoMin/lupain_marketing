"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface PromotionBannerProps {
    deadline: string | null
    promoTag?: string | null
}

export function PromotionBanner({ deadline, promoTag }: PromotionBannerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number
        hours: number
        minutes: number
        seconds: number
    } | null>(null)

    useEffect(() => {
        if (!deadline) return

        const calculateTimeLeft = () => {
            const difference = +new Date(deadline) - +new Date()

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                }
            } else {
                return null
            }
        }

        // Initial calculation
        setTimeLeft(calculateTimeLeft())

        // Update every second
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)

        return () => clearInterval(timer)
    }, [deadline])

    if (!timeLeft) return null

    return (
        <div className="bg-secondary/50 border-b border-border py-3 px-4 backdrop-blur-sm sticky top-[65px] z-40">
            <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary animate-pulse" />
                    <span className="font-semibold text-lg text-foreground">
                        {promoTag ? `${promoTag} Ends In` : "Limited Time Offer Ends In"}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-sm font-mono font-medium">
                    <div className="flex flex-col items-center bg-background border border-border rounded px-3 py-1 min-w-[50px] shadow-sm">
                        <span className="text-lg font-bold tabular-nums text-foreground">{timeLeft.days}</span>
                        <span className="text-[10px] uppercase text-muted-foreground">Days</span>
                    </div>
                    <div className="text-xl text-muted-foreground pb-2">:</div>
                    <div className="flex flex-col items-center bg-background border border-border rounded px-3 py-1 min-w-[50px] shadow-sm">
                        <span className="text-lg font-bold tabular-nums text-foreground">{String(timeLeft.hours).padStart(2, '0')}</span>
                        <span className="text-[10px] uppercase text-muted-foreground">Hrs</span>
                    </div>
                    <div className="text-xl text-muted-foreground pb-2">:</div>
                    <div className="flex flex-col items-center bg-background border border-border rounded px-3 py-1 min-w-[50px] shadow-sm">
                        <span className="text-lg font-bold tabular-nums text-foreground">{String(timeLeft.minutes).padStart(2, '0')}</span>
                        <span className="text-[10px] uppercase text-muted-foreground">Min</span>
                    </div>
                    <div className="text-xl text-muted-foreground pb-2">:</div>
                    <div className="flex flex-col items-center bg-background border border-border rounded px-3 py-1 min-w-[50px] shadow-sm">
                        <span className="text-lg font-bold tabular-nums text-destructive">{String(timeLeft.seconds).padStart(2, '0')}</span>
                        <span className="text-[10px] uppercase text-muted-foreground">Sec</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
