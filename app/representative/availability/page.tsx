"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

interface BreakTime {
  start: string;
  end: string;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakTimes: BreakTime[];
}

export default function ManageAvailabilityPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState("30");
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>([]);
  const [newBreakStart, setNewBreakStart] = useState("");
  const [newBreakEnd, setNewBreakEnd] = useState("");

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

  // Get current availability
  const currentAvailability = useQuery(
    api.availability.getRepresentativeAvailability,
    representativeProfile?._id ? { representativeId: representativeProfile._id } : "skip"
  );

  const setAvailability = useMutation(api.availability.setAvailability);
  const deleteAvailability = useMutation(api.availability.deleteAvailability);

  const daysOfWeek = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
  ];

  const handleAddBreak = () => {
    if (newBreakStart && newBreakEnd) {
      setBreakTimes([...breakTimes, { start: newBreakStart, end: newBreakEnd }]);
      setNewBreakStart("");
      setNewBreakEnd("");
    }
  };

  const handleRemoveBreak = (index: number) => {
    setBreakTimes(breakTimes.filter((_, i) => i !== index));
  };

  const handleSaveAvailability = async () => {
    if (!representativeProfile?._id || !selectedDay) {
      toast.error("Please select a day");
      return;
    }

    try {
      const result = await setAvailability({
        representativeId: representativeProfile._id,
        dayOfWeek: parseInt(selectedDay),
        startTime,
        endTime,
        slotDuration: parseInt(slotDuration),
        breakTimes,
      });

      if (result.success) {
        toast.success(result.message);
        // Reset form
        setSelectedDay("");
        setStartTime("09:00");
        setEndTime("17:00");
        setSlotDuration("30");
        setBreakTimes([]);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to save availability");
    }
  };

  const handleDeleteAvailability = async (dayOfWeek: number) => {
    if (!representativeProfile?._id) return;

    try {
      const result = await deleteAvailability({
        representativeId: representativeProfile._id,
        dayOfWeek,
      });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to delete availability");
    }
  };

  const loadAvailabilityForDay = (dayOfWeek: string) => {
    const availability = currentAvailability?.find(a => a.dayOfWeek === parseInt(dayOfWeek));
    if (availability) {
      setStartTime(availability.startTime);
      setEndTime(availability.endTime);
      setSlotDuration(availability.slotDuration.toString());
      setBreakTimes(availability.breakTimes);
    } else {
      // Reset to defaults
      setStartTime("09:00");
      setEndTime("17:00");
      setSlotDuration("30");
      setBreakTimes([]);
    }
  };

  if (!session || session.user.role !== "representative") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/representative/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Manage Availability</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Current Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Current Availability</CardTitle>
              <CardDescription>
                Your weekly schedule for appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentAvailability && currentAvailability.length > 0 ? (
                <div className="space-y-2">
                  {currentAvailability.map((slot) => {
                    const day = daysOfWeek.find(d => d.value === slot.dayOfWeek.toString());
                    return (
                      <div key={slot._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="font-medium w-24">{day?.label}</span>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{slot.startTime} - {slot.endTime}</span>
                            <span className="mx-2">|</span>
                            <span>{slot.slotDuration} min slots</span>
                            {slot.breakTimes.length > 0 && (
                              <>
                                <span className="mx-2">|</span>
                                <span>{slot.breakTimes.length} break(s)</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAvailability(slot.dayOfWeek)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  No availability set. Add your available days below.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Set Availability</CardTitle>
              <CardDescription>
                Configure your availability for a specific day
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Day Selection */}
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select 
                  value={selectedDay} 
                  onValueChange={(value) => {
                    setSelectedDay(value);
                    loadAvailabilityForDay(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Configuration */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slot Duration (minutes)</Label>
                  <Select value={slotDuration} onValueChange={setSlotDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Break Times */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Break Times</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={newBreakStart}
                      onChange={(e) => setNewBreakStart(e.target.value)}
                      placeholder="Start"
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={newBreakEnd}
                      onChange={(e) => setNewBreakEnd(e.target.value)}
                      placeholder="End"
                      className="w-32"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBreak}
                      disabled={!newBreakStart || !newBreakEnd}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {breakTimes.length > 0 && (
                  <div className="space-y-2">
                    {breakTimes.map((breakTime, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          Break: {breakTime.start} - {breakTime.end}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBreak(index)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveAvailability}
                disabled={!selectedDay}
                className="w-full"
              >
                Save Availability
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}