import { Suspense } from "react";
import LearnerSupport from "./learner-support";
import PerformanceReporter from "./performance-reporter";
import CopyProtection from "./copy-protection";
import MembershipWatcher from "./membership-watcher";
export default function LearnLayout({children}:{children:React.ReactNode}){return <><MembershipWatcher/><CopyProtection/><Suspense fallback={null}><LearnerSupport/><PerformanceReporter/></Suspense>{children}</>}

