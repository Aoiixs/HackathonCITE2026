import { redirect } from "next/navigation";

// The two stock pages became one "Manage Stocks" screen. This keeps old
// links and bookmarks working.
export default function StockInRedirect() {
  redirect("/stock?mode=in");
}
