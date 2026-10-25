import FeatureGate from "../feature-gate";
export const dynamic="force-dynamic";
export default function TutorLayout({children}:{children:React.ReactNode}){return <FeatureGate flag="ai_tutor_enabled">{children}</FeatureGate>;}
