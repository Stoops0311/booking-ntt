"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, FileText, LogOut } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function UserDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      router.push("/login");
    } else {
      setToken(storedToken);
    }
  }, [router]);

  const session = useQuery(api.auth.verifySession, token ? { token } : "skip");
  const appointments = useQuery(
    api.appointments.getUserAppointments,
    session?.userId ? { userId: session.userId } : "skip"
  );
  const logout = useMutation(api.auth.logout);

  const handleLogout = async () => {
    if (token) {
      await logout({ token });
      localStorage.removeItem("authToken");
      router.push("/");
    }
  };

  const cancelAppointment = useMutation(api.appointments.cancelAppointment);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!session?.userId) return;
    
    const result = await cancelAppointment({
      appointmentId: appointmentId as any,
      userId: session.userId,
    });

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
      completed: "outline",
      cancelled: "destructive",
    };

    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">User Dashboard</h1>
              <p className="text-gray-600">Welcome, {session.user.fullName}</p>
            </div>
            <div className="flex gap-4">
              <Link href="/dashboard/book-appointment">
                <Button>Book New Appointment</Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button variant="outline">Profile</Button>
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{appointments?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {appointments?.filter(a => a.status === "pending").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {appointments?.filter(a => a.status === "accepted").length || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {appointments?.filter(a => a.status === "completed").length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Appointments</CardTitle>
              <CardDescription>
                View and manage your appointment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments && appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{appointment.purpose}</h3>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <p className="text-sm text-gray-600">{appointment.description}</p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {appointment.requestedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.requestedTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {appointment.representative.user.fullName} - {appointment.representative.title}
                            </span>
                          </div>
                          {appointment.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                              <strong>Rejection Reason:</strong> {appointment.rejectionReason}
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-600">
                              <strong>Notes:</strong> {appointment.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {(appointment.status === "pending" || appointment.status === "accepted") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelAppointment(appointment._id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You don't have any appointments yet.</p>
                  <Link href="/dashboard/book-appointment">
                    <Button>Book Your First Appointment</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}