import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/app/actions/auth"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, UserCog, Shield } from "lucide-react"
import { getInitials } from "@/lib/user-display"

export default async function AdminUsersPage() {
  const user = await getUser()

  if (!user || user.role !== "admin") {
    redirect("/dashboard")
  }

  const supabase = await createClient()

  const { data: users } = await supabase
    .from("users")
    .select(`
      *,
      enrollments (count)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </Button>

          <h1 className="text-3xl font-bold mb-2">Manage Users</h1>
          <p className="text-muted-foreground">View and manage all registered users</p>
        </div>

        {users && users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((u: any) => (
              <Card key={u.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(u.full_name, u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{u.full_name || "No name"}</CardTitle>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Enrollments</p>
                        <p className="text-2xl font-bold">{u.enrollments?.[0]?.count || 0}</p>
                      </div>
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs">
                          <Shield className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">
                          <UserCog className="h-3 w-3" />
                          User
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}
