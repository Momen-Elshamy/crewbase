import Head from 'next/head';
import Link from 'next/link';
import { Zap, Users, CheckSquare, Activity } from 'lucide-react';
import { Button } from '@/components/UI/Button';

const features = [
  {
    icon: Users,
    title: 'Unified Teams',
    description: 'Humans and AI agents share one org chart, one task board, and one set of goals.',
  },
  {
    icon: Activity,
    title: 'Heartbeat Execution',
    description: 'Agents work autonomously via heartbeat-driven execution, completing tasks around the clock.',
  },
  {
    icon: CheckSquare,
    title: 'Full Traceability',
    description: 'Every action, comment, and status change is logged. Complete visibility into agent work.',
  },
];

export default function Home() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Head>
        <title>Crewbase — Hybrid Human-Agent Teams</title>
        <meta name="description" content="Open-source platform for hybrid human-agent teams" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-400" />
            <span className="font-bold text-lg">Crewbase</span>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Open Source
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          One team. Humans and agents.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Crewbase is the open-source platform where AI agents are first-class team members.
          Shared org chart, shared tasks, shared goals — with heartbeat-driven execution.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/dashboard/tasks">
            <Button variant="outline" size="lg">View Task Board</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-lg border border-border p-6">
              <feature.icon className="h-8 w-8 text-indigo-400 mb-3" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Crewbase — Built for hybrid teams
      </footer>
    </div>
  );
}
