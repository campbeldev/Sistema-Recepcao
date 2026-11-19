import { Link } from '@carbon/react'
import './LinkDoWhatsapp.css'

// O endereço do wa.me para um número do Brasil: só os dígitos, com o 55 na frente
// quando o número vem só com o DDD (10 ou 11 dígitos).
export function enderecoDoWhatsapp(numero: string): string | undefined {
  const digitos = numero.replace(/\D/g, '')
  if (digitos.length === 10 || digitos.length === 11) return `https://wa.me/55${digitos}`
  if (digitos.length >= 12) return `https://wa.me/${digitos}`
  return undefined
}

// O WhatsApp do contato como link que abre a conversa (WhatsApp Web no computador, o app no celular).
// Número que não dá para entender fica como texto.
export function LinkDoWhatsapp({ numero }: { numero: string }) {
  const endereco = enderecoDoWhatsapp(numero)
  if (!endereco) return <>{numero}</>
  return (
    <Link
      className="recepcao-whatsapp"
      href={endereco}
      target="_blank"
      rel="noopener noreferrer"
      title="Abrir a conversa no WhatsApp"
      onClick={(evento) => evento.stopPropagation()}
    >
      {numero}
    </Link>
  )
}
