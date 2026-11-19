import { useEffect, useState } from 'react'

// O endereço da tela é o # da página: /plataforma/#/funcionarios.

function lerEndereco(): string {
  const caminho = window.location.hash.replace(/^#/, '').split('?')[0]
  return caminho === '' ? '/' : caminho.replace(/\/+$/, '') || '/'
}

export function useEndereco(): string {
  const [endereco, setEndereco] = useState(lerEndereco)
  useEffect(() => {
    const aoMudar = () => setEndereco(lerEndereco())
    window.addEventListener('hashchange', aoMudar)
    return () => window.removeEventListener('hashchange', aoMudar)
  }, [])
  return endereco
}

export function irPara(endereco: string) {
  window.location.hash = endereco
}

// Parâmetros depois do endereço: #/recibos?funcionario=12
export function parametro(nome: string): string | null {
  const consulta = window.location.hash.split('?')[1] ?? ''
  return new URLSearchParams(consulta).get(nome)
}
