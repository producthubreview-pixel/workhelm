"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileSchema,
  type ProfileFormValues,
  passwordSchema,
  type PasswordFormValues,
  BUSINESS_CATEGORIES,
  TIMEZONES,
} from "@/lib/settings-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Lock,
  CreditCard,
  Building2,
  Check,
  Loader2,
  ExternalLink,
  AlertTriangle,
  FileText,
} from "lucide-react";

type BillingStatus = {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  trialRemaining: number | null;
  hasPaymentMethod: boolean;
  stripeConfigured: boolean;
  email: string;
};

type BillingHistoryItem = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  invoicePdf: string | null;
  periodStart: string | null;
  periodEnd: string | null;
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [leadCount, setLeadCount] = useState(0);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      businessName: "",
      phone: "",
      logoUrl: "",
      address: "",
      businessCategory: "",
      timezone: "America/Chicago",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Fetch user data and billing status
  const fetchData = useCallback(async () => {
    try {
      // Fetch billing status
      const statusRes = await fetch("/api/billing/status");
      if (statusRes.ok) {
        const data = await statusRes.json();
        setBillingStatus(data);

        // Pre-fill profile form
        const profileRes = await fetch("/api/settings/profile");
        if (profileRes.ok) {
          const profile = await profileRes.json();
          profileForm.reset({
            name: profile.name || "",
            businessName: profile.businessName || "",
            phone: profile.phone || "",
            logoUrl: profile.image || "",
            address: profile.address || "",
            businessCategory: profile.businessCategory || "",
            timezone: profile.timezone || "America/Chicago",
          });
        }
      }

      // Fetch lead count
      const leadsRes = await fetch("/api/leads?limit=1");
      if (leadsRes.ok) {
        const leads = await leadsRes.json();
        setLeadCount(leads.length);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, [profileForm]);

  // Fetch billing history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/billing/history");
      if (res.ok) {
        const data = await res.json();
        setBillingHistory(data.invoices || []);
      }
    } catch (err) {
      console.error("Failed to load billing history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchHistory();
  }, [fetchData, fetchHistory]);

  // Handle billing success/cancelled from Stripe redirect
  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") {
      toast({ title: "Subscription activated!", description: "Your payment was successful." });
      fetchData();
    } else if (billing === "cancelled") {
      toast({ title: "Checkout cancelled", description: "You can subscribe anytime.", variant: "destructive" });
    }
  }, [searchParams, toast, fetchData]);

  // Save profile
  const onProfileSubmit = async (values: ProfileFormValues) => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast({ title: "Profile saved", description: "Your settings have been updated." });
      } else {
        const err = await res.json();
        toast({ title: "Failed to save", description: err.error || "Something went wrong.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  };

  // Change password
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast({ title: "Password changed", description: "Your password has been updated successfully." });
        passwordForm.reset();
      } else {
        const err = await res.json();
        toast({ title: "Failed", description: err.error || "Could not change password.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to change password.", variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Start checkout
  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data.error || "Could not start checkout.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to start checkout.", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Open customer portal
  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data.error || "Could not open billing portal.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to open billing portal.", variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const isTrialing = billingStatus?.subscriptionStatus === "trialing";
  const isSubscribed = billingStatus?.subscriptionStatus === "active";
  const isStripeReady = billingStatus?.stripeConfigured;
  const isNearLimit = billingStatus?.plan === "STARTER" && leadCount >= 225;
  const isNearFreeLimit = billingStatus?.plan === "FREE" && leadCount >= 4;

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Plan limit banner */}
      {isNearLimit && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              You&apos;re approaching your Starter plan limit ({leadCount}/250 leads).
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Upgrade to Pro for unlimited leads and more features.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setActiveTab("subscription")}
            >
              View Plans
            </Button>
          </div>
        </div>
      )}

      {/* Free plan limit banner */}
      {isNearFreeLimit && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              You&apos;re approaching your Free plan limit ({leadCount}/5 leads).
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Upgrade to Starter or Pro for more leads and full features.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setActiveTab("subscription")}
            >
              View Plans
            </Button>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-3 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Password
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Billing
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Business Profile
              </CardTitle>
              <CardDescription>Update your business information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Services" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/logo.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="businessCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BUSINESS_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time Zone *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIMEZONES.map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                  {tz}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={profileLoading}>
                      {profileLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" /> Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Min 8 characters" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <div className="space-y-6">
            {/* Current Plan Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Subscription
                </CardTitle>
                <CardDescription>Manage your plan and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isStripeReady ? (
                  <div className="bg-gray-50 border rounded-lg p-6 text-center">
                    <CreditCard className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Billing Setup in Progress</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Add your Stripe keys to the environment variables to enable subscriptions.
                      Set <code className="bg-gray-200 px-1 rounded">STRIPE_SECRET_KEY</code>,{" "}
                      <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>,
                      and price IDs to activate billing.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Trial banner */}
                    {isTrialing && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-blue-800">
                              Your 14-day free trial ends on {formatDate(billingStatus?.trialEndsAt || null)}.
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                              {billingStatus?.trialRemaining
                                ? `${billingStatus.trialRemaining} day${billingStatus.trialRemaining > 1 ? "s" : ""} remaining. Add a payment method to continue.`
                                : "Add a payment method to continue using WorkHelm."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Active subscription */}
                    {isSubscribed && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">
                              You&apos;re on the{" "}
                              <Badge variant="default" className="ml-1 bg-green-600">
                                {billingStatus?.plan}
                              </Badge>{" "}
                              plan.
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                              Manage your payment methods and invoices from the Stripe billing portal.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manage billing button */}
                    {(isSubscribed || billingStatus?.hasPaymentMethod) && (
                      <Button
                        variant="outline"
                        onClick={handlePortal}
                        disabled={portalLoading}
                        className="w-full sm:w-auto"
                      >
                        {portalLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" /> Manage Billing
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Plan Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>Choose the plan that fits your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Free — always available */}
                  <div className={`border rounded-xl p-6 ${billingStatus?.plan === "FREE" ? "border-primary ring-1 ring-primary" : ""}`}>
                    <h3 className="text-lg font-bold text-gray-900">Free</h3>
                    <p className="text-3xl font-bold mt-2">
                      $0<span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {[
                        "1 user",
                        "Up to 5 leads",
                        "Lead & customer management",
                      ].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={billingStatus?.plan === "FREE" ? "outline" : "default"}
                      disabled={billingStatus?.plan === "FREE"}
                    >
                      {billingStatus?.plan === "FREE" ? "Current Plan" : "Downgrade to Free"}
                    </Button>
                  </div>

                  {/* Starter & Pro */}
                    <>
                      {/* Starter */}
                      <div className={`border rounded-xl p-6 ${billingStatus?.plan === "STARTER" ? "border-primary ring-1 ring-primary" : ""}`}>
                        <h3 className="text-lg font-bold text-gray-900">Starter</h3>
                        <p className="text-3xl font-bold mt-2">
                          $29<span className="text-sm font-normal text-gray-500">/mo</span>
                        </p>
                        <ul className="mt-4 space-y-2">
                          {[
                            "2 user seats",
                            "Up to 250 leads",
                            "Lead & customer management",
                            "Estimate tracking",
                            "Follow-up reminders",
                            "Sales pipeline (kanban)",
                            "Message templates",
                            "Basic reports",
                          ].map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500 shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full mt-6"
                          variant={billingStatus?.plan === "STARTER" ? "outline" : "default"}
                          disabled={billingStatus?.plan === "STARTER" || checkoutLoading || !isStripeReady}
                          onClick={() => handleCheckout("starter")}
                        >
                          {billingStatus?.plan === "STARTER"
                            ? "Current Plan"
                            : !isStripeReady
                              ? "Coming Soon"
                              : checkoutLoading
                                ? "Loading..."
                                : "Choose Starter"}
                        </Button>
                      </div>

                      {/* Pro */}
                      <div className={`border rounded-xl p-6 bg-gradient-to-b from-primary/5 to-white ${billingStatus?.plan === "PRO" ? "border-primary ring-1 ring-primary" : "border-primary/30"}`}>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">Pro</h3>
                          <Badge className="bg-primary text-white">Popular</Badge>
                        </div>
                        <p className="text-3xl font-bold mt-2">
                          $59<span className="text-sm font-normal text-gray-500">/mo</span>
                        </p>
                        <ul className="mt-4 space-y-2">
                          {[
                            "Up to 5 user seats",
                            "Unlimited leads",
                            "Everything in Starter",
                            "Priority support",
                            "Advanced reporting (coming soon)",
                            "Custom templates (coming soon)",
                          ].map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                              <Check className="h-4 w-4 text-green-500 shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                        <Button
                          className="w-full mt-6"
                          variant={billingStatus?.plan === "PRO" ? "outline" : "default"}
                          disabled={billingStatus?.plan === "PRO" || checkoutLoading || !isStripeReady}
                          onClick={() => handleCheckout("pro")}
                        >
                          {billingStatus?.plan === "PRO"
                            ? "Current Plan"
                            : !isStripeReady
                              ? "Coming Soon"
                              : checkoutLoading
                                ? "Loading..."
                                : billingStatus?.plan === "STARTER"
                                  ? "Upgrade to Pro"
                                  : "Choose Pro"}
                        </Button>
                      </div>
                    </>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            {isStripeReady && billingStatus?.hasPaymentMethod && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Billing History
                  </CardTitle>
                  <CardDescription>Recent invoices and payments</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="text-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Loading invoices...</p>
                    </div>
                  ) : billingHistory.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No billing history yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {billingHistory.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(invoice.date)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {invoice.periodStart && invoice.periodEnd
                                ? `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="capitalize">
                              {invoice.status}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-900">
                              ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                            </span>
                            {invoice.invoicePdf && (
                              <a
                                href={invoice.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
