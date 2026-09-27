import { redirect } from "next/navigation";

// Ancienne page « Mes restaurants » : tout se passe maintenant dans l'app.
export default function Dashboard() {
  redirect("/app");
}
