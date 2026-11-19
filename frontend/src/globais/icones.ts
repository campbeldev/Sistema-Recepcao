// Os ícones do @carbon/icons-react que a plataforma usa, vindos do bundle do kit (CampbelUI.Icones).
type ModuloIcones = typeof import('@carbon/icons-react')

const I = (window as unknown as { CampbelUI: { Icones: ModuloIcones } }).CampbelUI.Icones

export const {
  Add,
  CheckmarkOutline,
  Close,
  Delivery,
  Notification,
  ShipmentDelivery,
  ShoppingCart,
  Switcher,
  Time,
  TrashCan,
  UserAvatar,
} = I
