import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import {feature} from "@/lib/learner-services-server";
import type {FlagKey} from "@/lib/service-validation";
export default async function FeatureGate({flag,children}:{flag:FlagKey;children:React.ReactNode}){let enabled=false;try{enabled=await feature(await createClient(),flag);}catch{}if(enabled)return <>{children}</>;return <main className="admin-gate"><section><h1>Tính năng đang tạm ngưng</h1><p>AUNORA đang cập nhật phần này. Bạn vẫn có thể tiếp tục học các bài khác.</p><Link href="/learn">Về trang học tập</Link></section></main>;}
