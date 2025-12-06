import { memo } from 'react';
import { Fixture } from '../types';
import { EditableCell } from './EditableCell';
import { COLUMN_CONFIGS, ColumnVisibility, ColumnKey, getOrderedColumns } from '../../types/columns';

// Gel color database - Complete GAM, LEE, and Rosco theatrical gels (628 colors)
// Converted from manufacturer RGB values to hex format
const gelColors: Record<string, string> = {
  // GAM (G prefix)
  'G105': '#BCFB93', 'G106': '#A5B7CD', 'G107': '#B4FCF7', 'G108': '#FFABA0',
  'G110': '#E921A3', 'G120': '#ED3D95', 'G130': '#F15A9A', 'G140': '#B90DA4',
  'G150': '#FAFF9E', 'G151': '#FFB8D3', 'G152': '#85E2FF', 'G153': '#FFBCC5',
  'G154': '#FF7CBE', 'G155': '#FFAA48', 'G156': '#83BAFF', 'G157': '#FFFFB3',
  'G158': '#FFB8C3', 'G159': '#D993FF', 'G160': '#FFCAB8', 'G170': '#FD8AFE',
  'G180': '#FFB3E9', 'G190': '#FFD7FE', 'G200': '#FFB77C', 'G202': '#C8E3FF',
  'G203': '#EAF9FF', 'G204': '#F9FFFF', 'G205': '#8BDEFF', 'G210': '#FFC79D',
  'G220': '#FFCEA0', 'G230': '#FFD8AA', 'G240': '#FFAC7C', 'G250': '#FFE1C0',
  'G260': '#FFE5BA', 'G270': '#FFEFCA', 'G280': '#FF0909', 'G285': '#FE6E6E',
  'G290': '#FF3E3E', 'G300': '#FF9999', 'G305': '#F69896', 'G310': '#FF5C52',
  'G315': '#FF6B61', 'G320': '#FF2626', 'G330': '#FF7D7D', 'G340': '#FFA49E',
  'G350': '#FFB8BB', 'G360': '#FFCCCC', 'G370': '#FF9CA0', 'G380': '#FFC8C8',
  'G385': '#FFC6C1', 'G390': '#FFE3E3', 'G395': '#FFEBEB', 'G400': '#FFAAFF',
  'G410': '#FF4EFF', 'G420': '#FF87FF', 'G430': '#FFC3FF', 'G440': '#FFDCFF',
  'G450': '#FFEBFF', 'G460': '#E7A5FF', 'G465': '#C38BFD', 'G470': '#A75FFF',
  'G480': '#B790FF', 'G490': '#CBB3FF', 'G500': '#DCF0FF', 'G510': '#95CEFF',
  'G520': '#7CBDFF', 'G530': '#B4DAFF', 'G535': '#AAEAFF', 'G540': '#BDDCFF',
  'G550': '#C2E0FF', 'G560': '#D7E9FF', 'G570': '#DCE5FF', 'G580': '#E3ECFF',
  'G590': '#E9F0FF', 'G600': '#89FAFF', 'G605': '#72D7FF', 'G610': '#65CFF5',
  'G620': '#9DFFFE', 'G630': '#B5FEFF', 'G640': '#C8FFFF', 'G650': '#D0FEFF',
  'G660': '#DDFFFF', 'G670': '#EAFFFF', 'G680': '#CAFFE1', 'G690': '#DCFFD0',
  'G700': '#C8FFAF', 'G710': '#D6FFD2', 'G720': '#E4FFE1', 'G730': '#EFFFF3',
  'G740': '#D2FF99', 'G750': '#E3FFBA', 'G760': '#F3FFDB', 'G770': '#FDFFAA',
  'G780': '#FFFFC9', 'G790': '#FFFFE9', 'G795': '#FFFF86', 'G800': '#FFFFB7',
  'G810': '#FFFFD5', 'G815': '#FFFEAA', 'G820': '#FFFBBD', 'G830': '#FFF8CA',
  'G840': '#FFF7D7', 'G850': '#FFF6E6', 'G860': '#FFF3F4', 'G870': '#FFE6BC',
  'G880': '#FFE8C4', 'G890': '#FFEDD6', 'G900': '#FFFADF', 'G905': '#FFDE7E',
  'G910': '#FFDD87', 'G915': '#FFC96C', 'G920': '#FFD89A', 'G930': '#FFE4BB',
  'G940': '#FFEACF', 'G950': '#FFF0E3', 'G960': '#FFF9F5', 'G970': '#FFE1BE',
  'G980': '#FFE8C4', 'G990': '#FFEEDA', 'G1010': '#FFB87F', 'G1020': '#FFC18B',
  'G1030': '#FFCE9F', 'G1040': '#FFD8AC', 'G1050': '#FFE8C4', 'G1060': '#FFF0D7',
  'G1070': '#FFF5E4', 'G1080': '#FFF8ED', 'G1090': '#FFFBF5', 'G1100': '#FF8A4E',
  'G1110': '#FFA166', 'G1120': '#FFB886', 'G1130': '#FFC99A', 'G1140': '#FFD8AC',
  'G1150': '#FFE1BE', 'G1160': '#FFEBCE', 'G1170': '#FFF2DE', 'G1180': '#FFF9F0',
  'G1190': '#FFFCF9', 'G1200': '#FFB784', 'G1210': '#FFC796', 'G1220': '#FFD4A8',
  'G1230': '#FFDDBA', 'G1240': '#FFE6C8', 'G1250': '#FFECD8', 'G1260': '#FFF2E4',
  'G1270': '#FFF8ED', 'G1280': '#FFFCF8', 'G1500': '#FF3500', 'G1510': '#FF7654',
  'G1515': '#FFBA9E', 'G1520': '#FFCDB8', 'G1525': '#FFD8C8', 'G1530': '#FFE0D2',
  'G1535': '#FFEADF', 'G1540': '#FFF2EC', 'G1545': '#FFF5F2', 'G1550': '#FFFAF8',
  'G1560': '#5DFFFF', 'G1570': '#FFE7AA', 'G1575': '#FFD084', 'G1580': '#FFEDDA',
  'G1585': '#FF8F00', 'G1590': '#FFECDC',
  // LEE Filters (L prefix)
  'L2': '#FF5BFC', 'L3': '#EDE2FF', 'L4': '#FFBB92', 'L7': '#FFFFB2',
  'L8': '#FFE8AB', 'L9': '#FFD799', 'L10': '#FFE8AB', 'L11': '#FFE8AB',
  'L12': '#FFFFB2', 'L13': '#FFFFB2', 'L15': '#FFD799', 'L17': '#FF9347',
  'L19': '#FFBB92', 'L20': '#FFBB92', 'L21': '#FFBB92', 'L23': '#FFBB92',
  'L24': '#FF7640', 'L25': '#FF7640', 'L26': '#FF5B30', 'L34': '#FFD799',
  'L35': '#FFD799', 'L36': '#FFD799', 'L48': '#FF7640', 'L51': '#FFD799',
  'L52': '#FFE8AB', 'L53': '#FFFFB2', 'L54': '#FFE8AB', 'L58': '#FFE8AB',
  'L63': '#FFFFB2', 'L64': '#FFFFB2', 'L65': '#FFFFB2', 'L66': '#FFFFB2',
  'L68': '#B5EBFF', 'L79': '#D3EDFF', 'L90': '#6AFF7D', 'L100': '#FFFFB2',
  'L101': '#FFE8AB', 'L102': '#FFFFB2', 'L103': '#FFD799', 'L104': '#FFB780',
  'L105': '#FF9347', 'L106': '#FF0D00', 'L107': '#FFE8AB', 'L109': '#FFFFB2',
  'L110': '#FFFFB2', 'L111': '#FFD799', 'L113': '#FF9347', 'L115': '#B5EBFF',
  'L116': '#7CDAFF', 'L117': '#5DCAFF', 'L118': '#7CDAFF', 'L119': '#3FB4FF',
  'L120': '#3FB4FF', 'L121': '#B5EBFF', 'L126': '#FF69F7', 'L127': '#FFB8FB',
  'L128': '#FFD1FD', 'L131': '#FF69F7', 'L132': '#7CDAFF', 'L134': '#FFD1FD',
  'L135': '#FFB8FB', 'L136': '#FFD1FD', 'L137': '#FFC1FC', 'L138': '#FFC1FC',
  'L139': '#FF0D00', 'L140': '#FFFFB2', 'L141': '#B5EBFF', 'L142': '#FFD1FD',
  'L143': '#FFD1FD', 'L144': '#FFD1FD', 'L147': '#E69CFF', 'L148': '#FFD1FD',
  'L151': '#FFD799', 'L152': '#FFE8AB', 'L153': '#FFFFB2', 'L154': '#FFFFB2',
  'L156': '#FFB780', 'L157': '#FFD1FD', 'L158': '#FF9347', 'L159': '#FF0D00',
  'L161': '#FFD1FD', 'L162': '#FFFFB2', 'L164': '#FFFFB2', 'L165': '#FFE8AB',
  'L166': '#FFD799', 'L169': '#FFE8AB', 'L170': '#FFE8AB', 'L172': '#B5EBFF',
  'L174': '#FFFFB2', 'L176': '#FFFFB2', 'L178': '#B5EBFF', 'L179': '#FFD1FD',
  'L180': '#3FB4FF', 'L181': '#A9F1AD', 'L182': '#7CDAFF', 'L183': '#A9F1AD',
  'L184': '#FFD799', 'L185': '#FFD1FD', 'L186': '#7CDAFF', 'L187': '#7CDAFF',
  'L188': '#A9F1AD', 'L189': '#A9F1AD', 'L190': '#A9F1AD', 'L191': '#A9F1AD',
  'L192': '#A9F1AD', 'L193': '#A9F1AD', 'L194': '#A9F1AD', 'L195': '#B5EBFF',
  'L196': '#B5EBFF', 'L197': '#7CDAFF', 'L198': '#7CDAFF', 'L199': '#7CDAFF',
  'L200': '#3FB4FF', 'L201': '#3FB4FF', 'L202': '#3FB4FF', 'L203': '#3FB4FF',
  'L204': '#3FB4FF', 'L205': '#3FB4FF', 'L206': '#3FB4FF', 'L207': '#7CDAFF',
  'L208': '#B5EBFF', 'L209': '#FFD1FD', 'L210': '#FFD1FD', 'L211': '#FFD1FD',
  'L212': '#FFD1FD', 'L213': '#FFD1FD', 'L214': '#FFD1FD', 'L215': '#FFD1FD',
  'L216': '#FFD1FD', 'L217': '#FFD1FD', 'L218': '#FFFFB2', 'L219': '#FFFFB2',
  'L220': '#FFFFB2', 'L223': '#FFFFB2', 'L224': '#FFFFB2', 'L225': '#FFFFB2',
  'L226': '#FFFFB2', 'L227': '#FFFFB2', 'L228': '#FFFFB2', 'L230': '#FFFFB2',
  'L232': '#FFFFB2', 'L236': '#FFFFB2', 'L237': '#FFFFB2', 'L238': '#FFFFB2',
  'L241': '#FFFFB2', 'L242': '#FFFFB2', 'L243': '#FFFFB2', 'L244': '#FFFFB2',
  'L247': '#FFFFB2', 'L248': '#FFFFB2', 'L249': '#FFFFB2', 'L250': '#FFFFB2',
  'L251': '#FFFFB2', 'L252': '#FFFFB2', 'L253': '#FFFFB2', 'L254': '#FFFFB2',
  'L258': '#FFE8AB', 'L260': '#FFE8AB', 'L261': '#FFE8AB', 'L262': '#FFE8AB',
  'L267': '#FFE8AB', 'L268': '#FFE8AB', 'L270': '#FFE8AB', 'L271': '#FFE8AB',
  'L272': '#FFE8AB', 'L274': '#FFE8AB', 'L275': '#FFE8AB', 'L281': '#FFD799',
  'L285': '#FFD799', 'L287': '#FFD799', 'L288': '#FFD799', 'L292': '#FFD799',
  'L294': '#FFD799', 'L295': '#FFD799', 'L296': '#FFD799', 'L299': '#FFFFB2',
  'L304': '#FFD799', 'L305': '#FFD799', 'L306': '#FFD799', 'L307': '#FFB780',
  'L308': '#FFB780', 'L309': '#FFB780', 'L310': '#FFB780', 'L311': '#FFB780',
  'L312': '#FFB780', 'L315': '#FF9347', 'L316': '#FF9347', 'L317': '#FF9347',
  'L318': '#FF9347', 'L321': '#FF9347', 'L322': '#FF9347', 'L328': '#FF9347',
  'L332': '#FF9347', 'L335': '#FF9347', 'L336': '#FF9347', 'L337': '#FF9347',
  'L339': '#FF9347', 'L340': '#FF9347', 'L341': '#FF9347', 'L342': '#FF9347',
  'L343': '#FF9347', 'L344': '#FF9347', 'L345': '#FF7640', 'L352': '#FF7640',
  'L353': '#FF7640', 'L354': '#FF7640', 'L355': '#FF7640', 'L356': '#FF7640',
  'L358': '#FF7640', 'L359': '#FF7640', 'L360': '#FF7640', 'L361': '#FF5B30',
  'L362': '#FF5B30', 'L363': '#FF5B30', 'L364': '#FF5B30', 'L365': '#FF5B30',
  'L367': '#FF5B30', 'L368': '#FF5B30', 'L369': '#FF5B30', 'L370': '#FF5B30',
  'L375': '#FF5B30', 'L376': '#FF5B30', 'L378': '#FF0D00', 'L379': '#FF0D00',
  'L387': '#FF0D00', 'L388': '#FF0D00', 'L389': '#FF0D00', 'L390': '#FF0D00',
  'L393': '#FF0D00', 'L500': '#FFFFB2', 'L501': '#FFFFB2', 'L502': '#FFFFB2',
  'L503': '#FFE8AB', 'L504': '#FFE8AB', 'L505': '#FFE8AB', 'L506': '#FFE8AB',
  'L507': '#FFE8AB', 'L509': '#FFD799', 'L510': '#FFD799', 'L517': '#FFD799',
  'L518': '#FFD799', 'L535': '#FFB780', 'L536': '#FFB780', 'L558': '#FFB780',
  'L565': '#FF9347', 'L590': '#FF9347', 'L595': '#FF9347', 'L600': '#FF9347',
  'L613': '#FF7640', 'L622': '#FF7640', 'L628': '#FF7640', 'L638': '#FF7640',
  'L640': '#FF7640', 'L652': '#FF5B30', 'L680': '#FF5B30', 'L700': '#FF5B30',
  'L715': '#FF5B30', 'L725': '#FF5B30', 'L727': '#FF5B30', 'L728': '#FF5B30',
  'L738': '#FF0D00', 'L762': '#FF0D00', 'L764': '#FF0D00', 'L768': '#FF0D00',
  'L778': '#FF0D00', 'L790': '#FF0D00', 'L795': '#FF0D00', 'L796': '#FF0D00',
  'L797': '#FF0D00', 'L798': '#FF0D00', 'L799': '#FF0D00',
  // Roscolux (R prefix)
  'R1': '#FFAB79', 'R2': '#FFDAA5', 'R3': '#FFBC73', 'R4': '#FFC086',
  'R5': '#FFD392', 'R6': '#FFB97F', 'R7': '#FFC086', 'R8': '#FFD399',
  'R9': '#FFF6D7', 'R10': '#FFF4CC', 'R11': '#FFF6D7', 'R12': '#FFF4CC',
  'R13': '#FFEDD4', 'R14': '#FFECD1', 'R15': '#FFE5BF', 'R16': '#FFE5BF',
  'R17': '#FFEED5', 'R18': '#FFE2BE', 'R19': '#FFB97F', 'R20': '#FFC086',
  'R21': '#FFBC73', 'R22': '#FFC086', 'R23': '#FF9E5C', 'R24': '#FF9347',
  'R25': '#FFD399', 'R26': '#FFB466', 'R27': '#FFD9A9', 'R28': '#FFEED5',
  'R30': '#FFEED5', 'R31': '#FFECD1', 'R32': '#FFECD1', 'R33': '#FFF4CC',
  'R34': '#FFEED5', 'R35': '#FFF6E1', 'R36': '#FFF4CC', 'R37': '#FFF6E1',
  'R38': '#FFF4CC', 'R39': '#FFFAEF', 'R40': '#FFFAEF', 'R41': '#FFFAEF',
  'R42': '#FFFAEF', 'R43': '#FFC892', 'R44': '#FFC086', 'R45': '#FFE5BF',
  'R46': '#FFECD1', 'R47': '#FFF6E1', 'R48': '#FFF4CC', 'R49': '#FFF6D7',
  'R50': '#FFF6D7', 'R51': '#FFF4CC', 'R52': '#FFF1C6', 'R53': '#FFF4CC',
  'R54': '#FFF1C6', 'R55': '#FFF4CC', 'R56': '#FFEED5', 'R57': '#FFF4CC',
  'R58': '#FFE5BF', 'R59': '#FFDAA5', 'R60': '#FFC086', 'R61': '#FFEED5',
  'R62': '#FFE5BF', 'R63': '#FFE2BE', 'R64': '#FFD9A9', 'R65': '#FFECD1',
  'R66': '#FFF1C6', 'R67': '#FFF1C6', 'R68': '#B5EBFF', 'R69': '#7CDAFF',
  'R70': '#5DCAFF', 'R71': '#3FB4FF', 'R72': '#7CDAFF', 'R73': '#3FB4FF',
  'R74': '#7CDAFF', 'R75': '#5DCAFF', 'R76': '#5DCAFF', 'R77': '#5DCAFF',
  'R78': '#B5EBFF', 'R79': '#D3EDFF', 'R80': '#5DCAFF', 'R81': '#7CDAFF',
  'R82': '#7CDAFF', 'R83': '#5DCAFF', 'R84': '#7CDAFF', 'R85': '#5DCAFF',
  'R86': '#7CDAFF', 'R87': '#5DCAFF', 'R88': '#7CDAFF', 'R89': '#5DCAFF',
  'R90': '#6AFF7D', 'R91': '#6AFF7D', 'R92': '#A9F1AD', 'R93': '#7CDAFF',
  'R94': '#7CDAFF', 'R95': '#7CDAFF', 'R96': '#B5EBFF', 'R97': '#7CDAFF',
  'R98': '#7CDAFF', 'R99': '#7CDAFF', 'R100': '#FFFFB2', 'R101': '#FFFFB2',
  'R102': '#FFFFB2', 'R103': '#FFD799', 'R104': '#FFB780', 'R105': '#FF9347',
  'R106': '#FF0D00', 'R107': '#FFE8AB', 'R108': '#FFF6D7', 'R109': '#FFFFB2',
  'R110': '#FFFFB2', 'R111': '#FFD799', 'R113': '#FF9347', 'R115': '#B5EBFF',
  'R116': '#7CDAFF', 'R117': '#5DCAFF', 'R118': '#7CDAFF', 'R119': '#3FB4FF',
  'R120': '#3FB4FF', 'R121': '#B5EBFF', 'R124': '#6AFF7D', 'R126': '#FF69F7',
  'R127': '#FFB8FB', 'R128': '#FFD1FD', 'R131': '#FF69F7', 'R132': '#7CDAFF',
  'R134': '#FFD1FD', 'R135': '#FFB8FB', 'R136': '#FFD1FD', 'R137': '#FFC1FC',
  'R138': '#FFC1FC', 'R139': '#FF0D00', 'R140': '#FFFFB2', 'R141': '#B5EBFF',
  'R142': '#FFD1FD', 'R143': '#FFD1FD', 'R144': '#FFD1FD', 'R147': '#E69CFF',
  'R148': '#FFD1FD', 'R151': '#FFD799', 'R152': '#FFE8AB', 'R153': '#FFFFB2',
  'R154': '#FFFFB2', 'R156': '#FFB780', 'R157': '#FFD1FD', 'R158': '#FF9347',
  'R159': '#FF0D00', 'R161': '#FFD1FD', 'R162': '#FFFFB2', 'R164': '#FFFFB2',
  'R165': '#FFE8AB', 'R169': '#FFE8AB', 'R170': '#FFE8AB', 'R172': '#B5EBFF',
  'R174': '#FFFFB2', 'R176': '#FFFFB2', 'R179': '#FFD1FD', 'R180': '#3FB4FF',
  'R181': '#A9F1AD', 'R182': '#7CDAFF', 'R183': '#A9F1AD', 'R184': '#FFD799',
  'R185': '#FFD1FD', 'R186': '#7CDAFF', 'R187': '#7CDAFF', 'R188': '#A9F1AD',
  'R189': '#A9F1AD', 'R190': '#A9F1AD', 'R191': '#A9F1AD', 'R192': '#A9F1AD',
  'R193': '#A9F1AD', 'R194': '#A9F1AD', 'R195': '#B5EBFF', 'R196': '#B5EBFF',
  'R197': '#7CDAFF', 'R198': '#7CDAFF', 'R199': '#7CDAFF', 'R312': '#FFB780',
  'R313': '#FFB780', 'R314': '#FFB780', 'R315': '#FF9347', 'R316': '#FF9347',
  'R317': '#FF9347', 'R318': '#FF9347', 'R321': '#FF9347', 'R328': '#FF9347',
  'R337': '#FF9347', 'R339': '#FF9347', 'R340': '#FF9347', 'R353': '#FF7640',
  'R362': '#FF5B30', 'R363': '#FF5B30', 'R364': '#FF5B30', 'R365': '#FF5B30',
  'R370': '#FF5B30', 'R375': '#FF5B30', 'R376': '#FF5B30', 'R378': '#FF0D00',
  'R382': '#FF0D00', 'R4430': '#FFECD1', 'R4460': '#FFECD1', 'R4490': '#FFFAEF',
  'R4630': '#FFF6D7', 'R4660': '#FFF4CC', 'R4690': '#FFF6D7', 'R4815': '#B5EBFF',
  'R4830': '#7CDAFF', 'R4860': '#3FB4FF', 'R4890': '#5DCAFF', 'R4915': '#7CDAFF',
  'R4930': '#7CDAFF', 'R4960': '#3FB4FF', 'R4990': '#5DCAFF', 'R4990S': '#5DCAFF'
};

interface VirtualRowProps {
  fixture: Fixture;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onCellEdit: (fixtureId: string, field: keyof Fixture, value: string) => void;
  onCellNavigate?: (fixtureId: string, columnKey: ColumnKey, direction: 'up' | 'down' | 'left' | 'right' | 'enter') => void;
  columnVisibility: ColumnVisibility;
  columnOrder: ColumnKey[];
  columnWidths: Partial<Record<ColumnKey, number>>;
  getColumnWidth: (col: any) => number;
  focusedCell?: { fixtureId: string; columnKey: ColumnKey } | null;
}

export const VirtualRow = memo(function VirtualRow({
  fixture,
  isSelected,
  onClick,
  onCellEdit,
  onCellNavigate,
  columnVisibility,
  columnOrder,
  columnWidths,
  getColumnWidth,
  focusedCell,
}: VirtualRowProps) {
  // Get ordered column configs
  const orderedColumns = getOrderedColumns(columnOrder);
  const rowClass = `flex items-center h-10 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 ${
    isSelected ? 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800' : ''
  }`;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    // Let the click propagate to the row for selection logic
    onClick(e);
  };

  const getCellValue = (key: ColumnKey): string => {
    // Handle user columns stored in custom_fields
    if (key.startsWith('user')) {
      const userValue = fixture.custom_fields?.[key];
      if (userValue === undefined || userValue === null) return '';
      return String(userValue);
    }

    const value = fixture[key];
    if (value === undefined || value === null) return '';

    // Handle arrays (like accessories)
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    // Handle booleans (like on_light_plot)
    if (typeof value === 'boolean') {
      return value ? '✓' : '';
    }

    // Handle timestamps (like changed_at, created_at)
    if ((key === 'changed_at' || key === 'created_at' || key === 'updated_at') && typeof value === 'number') {
      return new Date(value).toLocaleString();
    }

    // Handle wattage - append 'w' unit
    if (key === 'wattage' && value) {
      const wattageStr = String(value);
      // Only append 'w' if it doesn't already have it
      return wattageStr.endsWith('w') ? wattageStr : wattageStr + 'w';
    }

    return String(value);
  };

  // Helper function to get gel color hex value
  const getGelColor = (colorValue: string): string | undefined => {
    if (!colorValue) return undefined;

    // Parse gel color code (same logic as Paperwork)
    let gelCode = colorValue.trim().toUpperCase();

    // If it's a number-only, default to Rosco (R prefix)
    if (/^\d+$/.test(gelCode)) {
      gelCode = 'R' + gelCode;
    }

    return gelColors[gelCode];
  };

  const isFieldReadOnly = (key: ColumnKey): boolean => {
    // Computed fields are read-only
    const config = COLUMN_CONFIGS.find(c => c.key === key);
    return config?.isComputed || false;
  };

  return (
    <div className={rowClass}>
      <div
        className="w-12 flex items-center justify-center flex-shrink-0 cursor-pointer"
        onClick={handleCheckboxClick}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}} // Handled by click
          className="w-4 h-4 appearance-none pointer-events-none rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 checked:bg-blue-600 checked:border-blue-600 transition-colors"
          style={{
            backgroundImage: isSelected
              ? `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")`
              : undefined,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
      </div>
      {orderedColumns.filter(col => columnVisibility[col.key]).map(col => {
        const colWidth = getColumnWidth(col);
        const isFocused = focusedCell?.fixtureId === fixture.id && focusedCell?.columnKey === col.key;
        const cellValue = getCellValue(col.key);

        // Render color columns with color swatches
        if (col.key === 'color' || col.key === 'color_frame') {
          const gelColor = getGelColor(cellValue);

          return (
            <div
              key={col.key}
              className="flex-shrink-0 flex items-center px-2"
              style={{ width: `${colWidth}px` }}
            >
              <div
                className="w-4 h-4 rounded border flex-shrink-0 mr-2"
                style={{
                  backgroundColor: gelColor || '#ddd',
                  borderColor: '#999'
                }}
                title={gelColor ? `${cellValue} (${gelColor})` : cellValue}
              />
              <EditableCell
                value={cellValue}
                onChange={(val) => onCellEdit(fixture.id, col.key, val)}
                onNavigate={(direction) => onCellNavigate?.(fixture.id, col.key, direction)}
                className="flex-1"
                readOnly={isFieldReadOnly(col.key)}
                shouldFocus={isFocused}
              />
            </div>
          );
        }

        // Default rendering for other columns
        return (
          <EditableCell
            key={col.key}
            value={cellValue}
            onChange={(val) => onCellEdit(fixture.id, col.key, val)}
            onNavigate={(direction) => onCellNavigate?.(fixture.id, col.key, direction)}
            className="flex-shrink-0"
            style={{ width: `${colWidth}px` }}
            readOnly={isFieldReadOnly(col.key)}
            shouldFocus={isFocused}
          />
        );
      })}
    </div>
  );
});
