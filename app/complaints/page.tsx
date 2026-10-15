import { redirect } from "next/navigation";

/** Legacy path — feedback form lives under Contact. */
export default function ComplaintsRedirect() {
  redirect("/contact");
}
