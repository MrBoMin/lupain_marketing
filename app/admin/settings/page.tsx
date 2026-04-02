"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ChevronLeft, CreditCard, Loader2, Save } from "lucide-react"

interface PaymentInfo {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  additional_info: string | null
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    additional_info: "",
  })

  useEffect(() => {
    fetchPaymentInfo()
  }, [])

  const fetchPaymentInfo = async () => {
    const supabase = createClient()
    
    // Check if admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      router.push("/dashboard")
      return
    }

    // Get payment info
    const { data } = await supabase
      .from("payment_info")
      .select("*")
      .eq("is_active", true)
      .single()

    if (data) {
      setPaymentInfo(data)
      setFormData({
        bank_name: data.bank_name,
        account_name: data.account_name,
        account_number: data.account_number,
        additional_info: data.additional_info || "",
      })
    }

    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()

      if (paymentInfo) {
        // Update existing
        const { error } = await supabase
          .from("payment_info")
          .update({
            bank_name: formData.bank_name,
            account_name: formData.account_name,
            account_number: formData.account_number,
            additional_info: formData.additional_info || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentInfo.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from("payment_info")
          .insert({
            bank_name: formData.bank_name,
            account_name: formData.account_name,
            account_number: formData.account_number,
            additional_info: formData.additional_info || null,
          })

        if (error) throw error
      }

      toast.success("Payment information saved!")
      fetchPaymentInfo()
    } catch (error) {
      toast.error("Failed to save payment information")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-6 py-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Configure your platform settings</p>
        </div>

        {/* Payment Information */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Payment Information</h2>
                <p className="text-sm text-muted-foreground">
                  Bank details shown to students during enrollment
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bank">Bank Name *</Label>
                <Input
                  id="bank"
                  placeholder="e.g., KBZ Bank"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  placeholder="Account holder name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  placeholder="1234567890"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Additional Instructions</Label>
                <textarea
                  id="additionalInfo"
                  placeholder="e.g., Please include your email in the transfer note"
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-base transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 resize-none"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}


