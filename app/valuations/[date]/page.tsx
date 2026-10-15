import { ValuationsPage } from "@/components/valuations/valuations-page";
export default async function DatedValuation({params}:{params:Promise<{date:string}>}){const {date}=await params;return <ValuationsPage date={date}/>;}
