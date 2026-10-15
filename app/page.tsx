import { Suspense } from "react";
import { NewsDesk } from "@/components/desk/news-desk";
import { DeskShell, LoadingState } from "@/components/desk/shell";
export default function Home() { return <Suspense fallback={<DeskShell><LoadingState/></DeskShell>}><NewsDesk /></Suspense>; }
