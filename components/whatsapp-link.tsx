import { MessageCircle } from "lucide-react";
import { env } from "@/src/shared/env";

export function WhatsAppLink({ orderNumber }: { orderNumber?: string }) {
  const message = orderNumber ? `Hola, quiero consultar mi pedido #${orderNumber}.` : "Hola, quiero ayuda para personalizar un producto.";
  return (
    <a className="whatsapp-link" href={`https://wa.me/${env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" aria-label="Contactar por WhatsApp">
      <MessageCircle size={23} /><span>¿Te ayudamos?</span>
    </a>
  );
}
