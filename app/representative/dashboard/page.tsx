"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CheckCircle, XCircle, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Id } from "@/convex/_generated/dataModel";

export default function RepresentativeDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      router.push("/login");
    } else {
      setToken(storedToken);
    }
  }, [router]);

  const session = useQuery(api.auth.verifySession, token ? { token } : "skip");
  
  // Get representative profile
  const representativeProfile = useQuery(
    api.representatives.getRepresentativeByUserId,
    session?.userId ? { userId: session.userId } : "skip"
  );

  // Get appointments
  const appointments = useQuery(
    api.appointments.getRepresentativeAppointments,
    representativeProfile?._id ? { 
      representativeId: representativeProfile._id,
      date: selectedDate 
    } : "skip"
  );

  const allAppointments = useQuery(
    api.appointments.getRepresentativeAppointments,
    representativeProfile?._id ? { 
      representativeId: representativeProfile._id 
    } : "skip"
  );

  const logout = useMutation(api.auth.logout);
  const updateAppointmentStatus = useMutation(api.appointments.updateAppointmentStatus);

  const handleLogout = async () => {
    if (token) {
      await logout({ token });
      localStorage.removeItem("authToken");
      router.push("/");
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: "accepted" | "rejected" | "completed", rejectionReason?: string, notes?: string) => {
    const result = await updateAppointmentStatus({
      appointmentId: appointmentId as Id<"appointments">,
      status,
      rejectionReason,
      notes,
    });

    if (result.success) {
      toast.success(result.message);
      setRejectionReason("");
      setNotes("");
      setSelectedAppointmentId(null);
    } else {
      toast.error(result.message);
    }
  };

  if (!session || session.user.role !== "representative") {
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

  const pendingCount = allAppointments?.filter(a => a.status === "pending").length || 0;
  const todayCount = appointments?.length || 0;
  const acceptedCount = allAppointments?.filter(a => a.status === "accepted").length || 0;
  const completedCount = allAppointments?.filter(a => a.status === "completed").length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Representative Dashboard</h1>
              <p className="text-gray-600">Welcome, {session.user.fullName}</p>
              {representativeProfile && (
                <p className="text-sm text-gray-500">{representativeProfile.title} - {representativeProfile.department}</p>
              )}
            </div>
            <div className="flex gap-4">
              <Link href="/representative/availability">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Availability
                </Button>
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
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{acceptedCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Management</CardTitle>
              <CardDescription>
                View and manage appointment requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="today">Today's Schedule</TabsTrigger>
                  <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                  <TabsTrigger value="all">All Appointments</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Label>Select Date:</Label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border rounded px-3 py-1"
                    />
                  </div>
                  {appointments && appointments.length > 0 ? (
                    appointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment._id}
                        appointment={appointment}
                        onUpdateStatus={handleUpdateStatus}
                        onSelectAppointment={setSelectedAppointmentId}
                        selectedAppointmentId={selectedAppointmentId}
                        rejectionReason={rejectionReason}
                        setRejectionReason={setRejectionReason}
                        notes={notes}
                        setNotes={setNotes}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No appointments scheduled for this date.</p>
                  )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                  {allAppointments && allAppointments.filter(a => a.status === "pending").length > 0 ? (
                    allAppointments
                      .filter(a => a.status === "pending")
                      .map((appointment) => (
                        <AppointmentCard
                          key={appointment._id}
                          appointment={appointment}
                          onUpdateStatus={handleUpdateStatus}
                          onSelectAppointment={setSelectedAppointmentId}
                          selectedAppointmentId={selectedAppointmentId}
                          rejectionReason={rejectionReason}
                          setRejectionReason={setRejectionReason}
                          notes={notes}
                          setNotes={setNotes}
                        />
                      ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No pending appointment requests.</p>
                  )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                  {allAppointments && allAppointments.length > 0 ? (
                    allAppointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment._id}
                        appointment={appointment}
                        onUpdateStatus={handleUpdateStatus}
                        onSelectAppointment={setSelectedAppointmentId}
                        selectedAppointmentId={selectedAppointmentId}
                        rejectionReason={rejectionReason}
                        setRejectionReason={setRejectionReason}
                        notes={notes}
                        setNotes={setNotes}
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No appointments found.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({
  appointment,
  onUpdateStatus,
  onSelectAppointment,
  selectedAppointmentId,
  rejectionReason,
  setRejectionReason,
  notes,
  setNotes,
}: {
  appointment: any;
  onUpdateStatus: (id: string, status: "accepted" | "rejected" | "completed", rejectionReason?: string, notes?: string) => void;
  onSelectAppointment: (id: string | null) => void;
  selectedAppointmentId: string | null;
  rejectionReason: string;
  setRejectionReason: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
}) {
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
    <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
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
              {appointment.user.fullName}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            <p>Email: {appointment.user.email}</p>
            <p>Phone: {appointment.user.phone}</p>
            <p>Nationality: {appointment.user.nationality}</p>
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
        <div className="flex gap-2 ml-4">
          {appointment.status === "pending" && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => onUpdateStatus(appointment._id, "accepted")}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onSelectAppointment(appointment._id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Appointment</DialogTitle>
                    <DialogDescription>
                      Please provide a reason for rejection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reason">Rejection Reason</Label>
                      <Textarea
                        id="reason"
                        value={selectedAppointmentId === appointment._id ? rejectionReason : ""}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason for rejection..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onUpdateStatus(appointment._id, "rejected", rejectionReason);
                        onSelectAppointment(null);
                      }}
                      disabled={!rejectionReason.trim()}
                    >
                      Confirm Rejection
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {appointment.status === "accepted" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelectAppointment(appointment._id)}
                >
                  Mark Complete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Appointment</DialogTitle>
                  <DialogDescription>
                    Add any notes about the completed appointment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={selectedAppointmentId === appointment._id ? notes : ""}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter any notes about the appointment..."
                      className="mt-2"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      onUpdateStatus(appointment._id, "completed", undefined, notes);
                      onSelectAppointment(null);
                    }}
                  >
                    Mark as Completed
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}