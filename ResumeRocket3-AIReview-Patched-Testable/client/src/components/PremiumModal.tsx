import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Crown, Star, Zap, Users, Shield, Headphones } from "lucide-react";

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PremiumModal({ isOpen, onClose }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    monthly: {
      price: 29,
      period: 'month',
      savings: null
    },
    yearly: {
      price: 199,
      period: 'year',
      savings: 'Save $149'
    }
  };

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Unlimited Resume Analysis",
      description: "Analyze as many resumes as you need with advanced AI insights"
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Advanced ATS Optimization",
      description: "Deep ATS compatibility analysis with industry-specific recommendations"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Multiple Industry Templates",
      description: "Access to 50+ professional templates across all industries"
    },
    {
      icon: <Crown className="h-5 w-5" />,
      title: "Personal Branding Suite",
      description: "LinkedIn optimization, cover letter generation, and portfolio building"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Interview Preparation",
      description: "AI-powered interview questions and practice sessions"
    },
    {
      icon: <Headphones className="h-5 w-5" />,
      title: "Priority Support",
      description: "Direct access to career consultants and priority customer support"
    }
  ];

  const handleUpgrade = () => {
    // In a real app, this would integrate with Stripe or another payment processor
    window.open('https://pierlineconsultation.com/contact', '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Upgrade to Premium
              </span>
            </div>
            <p className="text-gray-600 text-base font-normal">
              Unlock the full power of AI-driven career optimization
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Selection */}
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                {plans.yearly.savings && (
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                    {plans.yearly.savings}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* Pricing Card */}
          <Card className="border-2 border-primary bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="text-4xl font-bold text-gray-900">
                  ${plans[selectedPlan].price}
                  <span className="text-lg font-normal text-gray-600">
                    /{plans[selectedPlan].period}
                  </span>
                </div>
                {selectedPlan === 'yearly' && (
                  <div className="text-sm text-green-600 font-medium">
                    That's just $16.58/month!
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleUpgrade}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base"
              >
                <Crown className="h-5 w-5 mr-2" />
                Upgrade to Premium
              </Button>
              
              <p className="text-xs text-gray-500 mt-2">
                30-day money-back guarantee • Cancel anytime
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-center mb-4">Free vs Premium</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Free Plan</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>3 resume analyses per month</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Basic ATS scoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>1 industry template</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Email support</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Premium Plan</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Unlimited resume analyses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Advanced ATS optimization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>50+ professional templates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Personal branding suite</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Interview preparation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Priority support & consultation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center space-y-2">
            <div className="flex justify-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>Secure Payment</span>
              </span>
              <span className="flex items-center space-x-1">
                <Check className="h-4 w-4" />
                <span>30-Day Guarantee</span>
              </span>
              <span className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>10,000+ Happy Users</span>
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}