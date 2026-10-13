import { Header } from "@/components/site/header";
import { Footer } from "@/components/marketing/footer";
import { cn } from "@/lib/utils";
import { onest } from "./fonts";

/** The public site: landing, feature pages and the zakat calculator share one header and footer. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    // Always-dark editorial scope: .dark switches component tokens, .landing deepens them to ink.
    <div className={cn(onest.variable, "dark landing min-h-screen bg-background text-foreground")}>
      <Header />
      {children}
      <Footer />
    </div>
  );
}
