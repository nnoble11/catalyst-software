"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FounderSignupPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    school: "",
    graduationYear: "",
    roleTitle: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: "founder",
          full_name: formData.fullName,
          school: formData.school,
          graduation_year: formData.graduationYear
            ? parseInt(formData.graduationYear)
            : null,
          role_title: formData.roleTitle,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Founder Account</CardTitle>
          <CardDescription>
            Join Catalyst Labs and showcase your startup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Jane Smith"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@university.edu"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  placeholder="MIT"
                  value={formData.school}
                  onChange={(e) => updateField("school", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="graduationYear">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  placeholder="2026"
                  value={formData.graduationYear}
                  onChange={(e) => updateField("graduationYear", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleTitle">Your Role</Label>
              <Input
                id="roleTitle"
                placeholder="CEO, CTO, etc."
                value={formData.roleTitle}
                onChange={(e) => updateField("roleTitle", e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Are you an investor?{" "}
            <Link
              href="/signup/vc"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up as an Investor
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
