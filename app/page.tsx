import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Shield, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-4">
          Schedule Embassy Appointments with Ease
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Book appointments with embassy representatives quickly and securely. 
          Upload your documents and manage your appointments all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Login
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose Bookings?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Calendar className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Easy Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Book appointments with embassy representatives at your convenience
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Secure Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload and store your documents securely with encrypted storage
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Real-time Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get instant notifications about your appointment status
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Expert Support</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect with qualified embassy representatives for your needs
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of users who trust Bookings for their embassy appointments
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-12">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Bookings. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}