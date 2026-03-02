import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  email: string;
  username?: string;
  role: "admin" | "user";
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, role")
      .order("email", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdmin = async (user: Profile) => {
    const newRole = user.role === "admin" ? "user" : "admin";

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", user.id);

    if (error) {
      console.error("Role update failed:", error);
      alert("Failed to update role");
    } else {
      fetchUsers();
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading users...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gradient">
        Admin • Manage Users
      </h1>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t hover:bg-muted/30 transition"
              >
                <td className="px-4 py-3 font-medium">
                  {user.username || "Unnamed User"}
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {user.email}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-purple-600/10 text-purple-600"
                        : "bg-gray-500/10 text-gray-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleAdmin(user)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                      user.role === "admin"
                        ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {user.role === "admin"
                      ? "Remove Admin"
                      : "Make Admin"}
                  </button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}