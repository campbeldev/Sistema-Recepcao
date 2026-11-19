// As peças do Carbon que a plataforma usa, vindas do bundle do kit (CampbelUI.Carbon).
// Só existe o que está listado aqui: importar outra peça do '@carbon/react' quebra o build,
// de propósito. Peça nova é pedido ao mantenedor do campbel-ui, não improviso na tela.
// IconIndicator e ShapeIndicator ainda são "preview" no Carbon 1.117.0; o kit os expõe sem o prefixo.
type ModuloCarbon = typeof import('@carbon/react') & {
  IconIndicator: typeof import('@carbon/react').preview__IconIndicator
  ShapeIndicator: typeof import('@carbon/react').preview__ShapeIndicator
}

const K = (window as unknown as { CampbelUI: { Carbon: ModuloCarbon } }).CampbelUI.Carbon

export const {
  Button,
  Column,
  ComboBox,
  DataTableSkeleton,
  DatePicker,
  DatePickerInput,
  Dropdown,
  Form,
  Grid,
  IconButton,
  IconIndicator,
  InlineLoading,
  InlineNotification,
  Layer,
  Link,
  Modal,
  NumberInput,
  OverflowMenu,
  OverflowMenuItem,
  PasswordInput,
  ProgressIndicator,
  ProgressStep,
  RadioButton,
  RadioButtonGroup,
  Select,
  SelectItem,
  ShapeIndicator,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  Tag,
  TextArea,
  TextInput,
  Tile,
  ToastNotification,
} = K
