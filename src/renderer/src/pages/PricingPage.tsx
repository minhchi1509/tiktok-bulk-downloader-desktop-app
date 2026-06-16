import { Card, Button, Chip } from '@heroui/react'
import {
  ArrowLeft,
  QrCode,
  Check,
  Mail,
  Zap,
  Shield,
  Headphones,
  Copy,
  CreditCard
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PaypalIcon } from '@renderer/assets/icons'
import { useState } from 'react'
import { EAppRoutes } from '@renderer/constants/route.constant'
import { TechcombankQrImage } from '@renderer/assets/images'

const CONTACT_EMAIL = 'minhchico300kc@gmail.com'
const PAYPAL_URL = 'https://paypal.me/minhchi1509'

const PLAN_FEATURES = [
  'Bulk download TikTok videos & photos',
  'Multi-URL batch download',
  'High-speed concurrent downloads',
  'Support for downloading videos added to Tiktok shop cart',
  'All filename format options',
  'Priority support via email'
]

const PricingPage = () => {
  const navigate = useNavigate()
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      /* Clipboard API may not be available */
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 animate-fade-in relative">
      {/* Back Button */}
      <div className="absolute top-0 left-0">
        <Button
          onClick={() => navigate(EAppRoutes.HOME)}
          variant="tertiary"
          className="font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-10 pt-2">
        <Chip variant="primary" color="accent" size="sm" className="mb-4">
          Simple Pricing
        </Chip>
        <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-cyan-500">
          Unlock Full Access
        </h1>
        <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
          Get unlimited access to all features with a single, affordable monthly plan.
        </p>
      </div>

      {/* Pricing Card */}
      <Card className="max-w-125 mx-auto mb-10 border-2 border-blue-500/30 dark:border-cyan-500/30 relative overflow-visible">
        {/* Popular Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Chip color="accent" variant="primary" size="sm" className="font-bold shadow-lg">
            <Zap size={12} className="mr-1" />
            Monthly Plan
          </Chip>
        </div>

        <Card.Content className="p-8 pt-10 text-center">
          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-cyan-500">
                99K
              </span>
              <span className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                VNĐ / month
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">≈ $4 USD / month</p>
          </div>

          {/* Features */}
          <div className="space-y-3 text-left mb-8">
            {PLAN_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/15 dark:bg-cyan-500/15 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-blue-500 dark:text-cyan-400" />
                </div>
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Shield size={14} />
            <span>Secure payment</span>
          </div>
        </Card.Content>
      </Card>

      {/* Payment Methods */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-center mb-2">Choose Payment Method</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6">
          Select your preferred way to subscribe
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* PayPal */}
          <Card className="hover:scale-[1.02] transition-all duration-300 border border-transparent hover:border-blue-500/30">
            <Card.Content className="p-6 text-center flex flex-col h-full">
              <div className="bg-blue-300/20 dark:bg-blue-600/20 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <PaypalIcon width={26} height={26} />
              </div>

              <h3 className="text-xl font-bold mb-2">PayPal</h3>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 flex-1">
                International payment via PayPal. Secure and trusted worldwide.
              </p>

              <div className="bg-zinc-200/40 dark:bg-zinc-700/40 p-3 rounded-lg mb-5">
                <p className="font-semibold text-sm">paypal.me/minhchi1509</p>
              </div>

              <Button
                onClick={() => window.open(PAYPAL_URL, '_blank')}
                variant="primary"
                size="lg"
                className="w-full font-bold"
              >
                <CreditCard size={18} />
                Pay via PayPal
              </Button>
            </Card.Content>
          </Card>

          {/* Techcombank QR */}
          <Card className="hover:scale-[1.02] transition-all duration-300 border border-transparent hover:border-green-500/30">
            <Card.Content className="p-6 text-center flex flex-col h-full">
              <div className="bg-success/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="text-success h-7 w-7" />
              </div>

              <h3 className="text-xl font-bold mb-2">Bank Transfer (QR)</h3>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-5 flex-1">
                Chuyển khoản qua QR Techcombank. Nhanh chóng và tiện lợi!
              </p>

              {/* QR Code */}
              <div className="bg-white p-2 rounded-lg border border-divider border-dashed mb-4 mx-auto w-40 h-40 flex items-center justify-center overflow-hidden">
                <img
                  src={TechcombankQrImage}
                  alt="Techcombank QR"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2 text-left">
                <div className="bg-zinc-200/40 dark:bg-zinc-700/40 p-2.5 rounded-lg text-sm">
                  <span className="font-semibold text-default-700">Bank: </span>
                  <span className="text-default-600">Techcombank</span>
                </div>
                <div className="bg-zinc-200/40 dark:bg-zinc-700/40 p-2.5 rounded-lg text-sm">
                  <span className="font-semibold text-default-700">Account holder: </span>
                  <span className="text-default-600">NGUYEN MINH CHI</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Post-Payment Instructions */}
      <Card className="max-w-3xl mx-auto border border-blue-500/20 dark:border-cyan-500/20 bg-blue-50/50 dark:bg-blue-950/20">
        <Card.Content className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/15 dark:bg-cyan-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Headphones size={20} className="text-blue-500 dark:text-cyan-400" />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">After Payment</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Once you&apos;ve completed the payment, please contact me via email to receive your{' '}
                <span className="font-semibold text-blue-500 dark:text-cyan-400">
                  API Secret Key
                </span>
                . Include your payment receipt for faster processing.
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-zinc-200/60 dark:bg-zinc-700/60 px-4 py-2.5 rounded-lg">
                  <Mail size={16} className="text-blue-500 dark:text-cyan-400 shrink-0" />
                  <span className="font-mono text-sm font-semibold">{CONTACT_EMAIL}</span>
                </div>

                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={handleCopyEmail}
                  className="font-medium"
                >
                  {isCopied ? (
                    <>
                      <Check size={14} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default PricingPage
