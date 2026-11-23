import type { GrupoDoMenu, ItemDoMenu } from 'campbel-ui'
import type { Perfil } from './comum/sessao'

// O menu da Casca: um grupo por módulo, com o nome e a descrição de cada tela.
// `perfis` diz quem vê o item; sem `perfis`, vê quem entra na Plataforma.

type Item = ItemDoMenu & { perfis?: Perfil[] }
type Grupo = { titulo: string; itens: Item[] }

const MENU: Grupo[] = [
  {
    titulo: 'Recepção',
    itens: [
      {
        nome: 'Início',
        endereco: '/',
        descricao: 'Os lembretes de hoje e as reuniões de hoje e dos próximos dias, com a sala e quem recebe.',
      },
      {
        nome: 'Reuniões',
        endereco: '/reunioes',
        descricao: 'As reuniões marcadas nas salas, com quem recebe, quem participa e a situação de cada uma.',
      },
      {
        nome: 'Contatos',
        endereco: '/contatos',
        descricao: 'As pessoas que participam das reuniões, com a empresa, o e-mail e os telefones.',
      },
      {
        nome: 'Lembretes',
        endereco: '/lembretes',
        descricao: 'O que a recepção precisa lembrar de fazer, para quem e em que dia.',
      },
      {
        nome: 'Ramais',
        endereco: '/ramais',
        descricao: 'As pessoas da empresa, com o setor, o ramal, o e-mail, o celular e o dia do aniversário.',
      },
      {
        nome: 'Almoço',
        endereco: '/almoco',
        descricao: 'O cardápio de hoje, o pedido de cada pessoa e o PDF para o restaurante.',
      },
      {
        nome: 'Relatório',
        endereco: '/relatorio',
        descricao: 'As reuniões de um mês numa planilha, com a sala, a situação, quem recebeu e quem participou.',
      },
      {
        nome: 'Usuários',
        endereco: '/usuarios',
        descricao: 'As contas de acesso ao sistema, com o perfil de cada uma.',
        perfis: ['ADMIN'],
      },
    ],
  },
]

export function menuDe(perfil: Perfil): GrupoDoMenu[] {
  return MENU.map((grupo) => ({
    titulo: grupo.titulo,
    itens: grupo.itens.filter((item) => !item.perfis || item.perfis.includes(perfil)),
  })).filter((grupo) => grupo.itens.length > 0)
}
