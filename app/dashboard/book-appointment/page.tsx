"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function BookAppointmentPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [selectedRepresentative, setSelectedRepresentative] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      router.push("/login");
    } else {
      setToken(storedToken);
    }
  }, [router]);

  const session = useQuery(api.auth.verifySession, token ? { token } : "skip");
  const representatives = useQuery(api.availability.getAllRepresentativesWithAvailability);
  const availableSlots = useQuery(
    api.appointments.getAvailableSlots,
    selectedRepresentative && selectedDate
      ? { 
          representativeId: selectedRepresentative as Id<"representatives">, 
          date: selectedDate 
        }
      : "skip"
  );

  const createAppointment = useMutation(api.appointments.createAppointment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.userId) {
      toast.error("Please login to book an appointment");
      return;
    }

    if (!selectedRepresentative || !selectedDate || !selectedTime || !purpose || !description) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await createAppointment({
        userId: session.userId,
        representativeId: selectedRepresentative as Id<"representatives">,
        requestedDate: selectedDate,
        requestedTime: selectedTime,
        purpose,
        description,
      });

      if (result.success) {
        toast.success(result.message);
        router.push("/dashboard");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to create appointment");
    }
  };

  const getAvailableDays = (representative: any) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return representative.availability
      .map((avail: any) => days[avail.dayOfWeek])
      .join(", ");
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isDateAvailable = (date: string, representative: any) => {
    const dayOfWeek = new Date(date).getDay();
    return representative.availability.some((avail: any) => avail.dayOfWeek === dayOfWeek);
  };

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Book an Appointment</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Schedule Your Appointment</CardTitle>
            <CardDescription>
              Select an embassy representative and choose your preferred time slot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Representative Selection */}
              <div className="space-y-2">
                <Label htmlFor="representative">Embassy Representative</Label>
                <Select value={selectedRepresentative} onValueChange={setSelectedRepresentative}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a representative" />
                  </SelectTrigger>
                  <SelectContent>
                    {representatives?.map((rep) => (
                      <SelectItem key={rep._id} value={rep._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {rep.user.fullName} - {rep.title}
                          </span>
                          <span className="text-sm text-gray-500">
                            {rep.department} | Available: {getAvailableDays(rep)}
                          </span>
                          <span className="text-xs text-gray-400">
                            Specializations: {rep.specializations.join(", ")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              {selectedRepresentative && (
                <div className="space-y-2">
                  <Label htmlFor="date">Appointment Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const rep = representatives?.find(r => r._id === selectedRepresentative);
                      if (rep && isDateAvailable(e.target.value, rep)) {
                        setSelectedDate(e.target.value);
                        setSelectedTime(""); // Reset time when date changes
                      } else {
                        toast.error("Representative is not available on this day");
                      }
                    }}
                    min={getMinDate()}
                    className="w-full"
                  />
                  {selectedRepresentative && (
                    <p className="text-sm text-gray-500">
                      Available days: {representatives?.find(r => r._id === selectedRepresentative) && 
                        getAvailableDays(representatives.find(r => r._id === selectedRepresentative)!)}
                    </p>
                  )}
                </div>
              )}

              {/* Time Selection */}
              {selectedDate && availableSlots && (
                <div className="space-y-2">
                  <Label>Select Time Slot</Label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant={selectedTime === slot ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(slot)}
                          className="w-full"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {slot}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No available slots for this date</p>
                  )}
                </div>
              )}

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit</Label>
                <Input
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g., Visa Application, Document Verification"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide details about your appointment request..."
                  rows={4}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Book Appointment
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}