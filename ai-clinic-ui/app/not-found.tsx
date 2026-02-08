import { redirect } from "next/navigation";

export default function NotFound() {
  // You can add logic here to log the 404 event or perform other actions
  redirect("/"); // Redirect to the root (homepage)
}
