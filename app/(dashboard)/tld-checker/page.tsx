import { redirect } from "next/navigation";

export default function TldCheckerPage() {
  redirect("/tools?tool=tld");
}
