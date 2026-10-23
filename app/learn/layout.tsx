import CopyProtection from "./copy-protection";
import MembershipWatcher from "./membership-watcher";
export default function LearnLayout({children}:{children:React.ReactNode}){return <><MembershipWatcher/><CopyProtection/>{children}</>}
