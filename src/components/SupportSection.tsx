import { AlertTriangle, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SupportSection = () => {
  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-lg">Need Help?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Our support team is here to assist you with any questions or concerns.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-blue-200">
        <div className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
          <div>
            <p className="font-medium text-sm text-foreground">Email Support</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get help via email - response within 24 hours
            </p>
          </div>
          <a href="mailto:support@uteelpay.com">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Us
            </Button>
          </a>
        </div>

        <div className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
          <div>
            <p className="font-medium text-sm text-foreground">WhatsApp Support</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chat with us for instant assistance
            </p>
          </div>
          <a href="https://wa.me/2349022334478" target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </a>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-700 font-medium">Account Closure</p>
              <p className="text-xs text-amber-600 mt-1">
                For account deletion or deactivation requests, please contact our support team 
                to ensure proper verification and data protection compliance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div>
            <p className="font-medium text-sm text-foreground">Join Our Channel</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get daily promo codes and exclusive updates
            </p>
          </div>
          <a href="https://whatsapp.com/channel/0029Vb77x43It5rpyEOK2N1y" target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Channel
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};