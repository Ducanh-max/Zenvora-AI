import FeatureGate from "../feature-gate";
export const dynamic="force-dynamic";
export default function FunLayout({children}:{children:React.ReactNode}){return <FeatureGate flag="games_enabled">{children}</FeatureGate>;}
