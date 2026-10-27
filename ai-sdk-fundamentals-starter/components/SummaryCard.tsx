import { CheckCircle2, List, MessageSquare } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SummaryCardProps {
  headline: string
  context: string[]
  discussionPoints: string[]
  takeaways: string[]
}

export function SummaryCard({
  headline,
  context,
  discussionPoints,
  takeaways,
}: SummaryCardProps) {
  return (
    <Card className="w-full border-border/70 bg-card shadow-sm">
      <CardHeader className="gap-3 border-b border-border/60 pb-6">
        <CardTitle className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {headline}
        </CardTitle>
        <CardDescription className="max-w-2xl text-base leading-7 text-muted-foreground">
          {context.join(" ")}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-8 pt-6 md:grid-cols-2 md:gap-x-12">
        <section aria-labelledby="discussion-heading" className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageSquare aria-hidden="true" className="size-4 text-muted-foreground" />
            <h2 id="discussion-heading">Discussion points</h2>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm leading-6 text-muted-foreground">
            {discussionPoints.map((point, index) => (
              <li key={`${point}-${index}`} className="flex gap-3">
                <List aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="takeaways-heading" className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CheckCircle2 aria-hidden="true" className="size-4 text-muted-foreground" />
            <h2 id="takeaways-heading">Action Points</h2>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm leading-6 text-muted-foreground">
            {takeaways.map((action, index) => (
              <li key={`${action}-${index}`} className="flex gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  )
}
