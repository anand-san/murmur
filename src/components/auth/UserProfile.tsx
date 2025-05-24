import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function UserProfile() {
  const { session, signOut } = useAuth();

  if (!session?.user) return null;

  const { user } = session;

  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg">
      <Avatar>
        <AvatarImage src={user.image || undefined} alt={user.name} />
        <AvatarFallback>{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Button onClick={signOut} variant="outline" size="sm">
        Sign Out
      </Button>
    </div>
  );
}
