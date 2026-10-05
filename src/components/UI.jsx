import React from "react";
import {
  Crown,
  Swords,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Map,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Minus,
  X,
  Check,
  CheckCircle2,
  Shield,
  Flag,
  Star,
  Volume2,
  VolumeX,
  Bell,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Compass,
  Play,
  Pause,
  Save,
  HelpCircle,
  Wheat,
  Trees,
  Mountain,
  Coins,
  Gem,
  Landmark,
  Castle,
  Hammer,
  Anvil,
  Store,
  BrickWall,
  GraduationCap,
  Package,
  Ship,
  Crosshair,
  Focus,
  ShieldCheck,
  Heart,
  Route,
  Droplets,
  Pickaxe,
  Sword,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Move,
  Target,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  User,
  Menu,
  Globe,
  ScrollText,
  TriangleAlert,
  LoaderCircle,
  Send,
  Sun,
  Home,
  ChevronsUp,
  Info,
  CheckCheck,
  Flame,
  Award,
  Timer,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  Sparkles,
  RefreshCw,
  Trash2,
  ShieldPlus,
  Footprints,
  Beef,
  Drumstick,
  Axe,
} from "lucide-react";
const icons = {
  Crown,
  Swords,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Map,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Minus,
  X,
  Check,
  CheckCircle2,
  Shield,
  Flag,
  Star,
  Volume2,
  VolumeX,
  Bell,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Compass,
  Play,
  Pause,
  Save,
  HelpCircle,
  Wheat,
  Trees,
  Mountain,
  Coins,
  Gem,
  Landmark,
  Castle,
  Hammer,
  Anvil,
  Store,
  BrickWall,
  GraduationCap,
  Package,
  Ship,
  Crosshair,
  Focus,
  ShieldCheck,
  Heart,
  Route,
  Droplets,
  Pickaxe,
  Sword,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Move,
  Target,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  User,
  Menu,
  Globe,
  ScrollText,
  TriangleAlert,
  LoaderCircle,
  Send,
  Sun,
  Home,
  ChevronsUp,
  Info,
  CheckCheck,
  Flame,
  Award,
  Timer,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  Sparkles,
  RefreshCw,
  Trash2,
  ShieldPlus,
  Footprints,
  Beef,
  Drumstick,
  Axe,
};
export function Icon({ name, size = 20, ...props }) {
  const C = icons[name] || Shield;
  return <C size={size} strokeWidth={1.6} {...props} />;
}
export function Button({
  children,
  icon,
  variant = "",
  className = "",
  ...props
}) {
  return (
    <button className={`btn ${variant} ${className}`} {...props}>
      {icon && <Icon name={icon} size={17} />}
      <span>{children}</span>
    </button>
  );
}
export const RESOURCE_ICONS = {
  food: "Wheat",
  wood: "Trees",
  stone: "Mountain",
  gold: "Coins",
  silver: "Gem",
  meat: "Beef",
};
export function Cost({ cost = {}, resources = {} }) {
  return (
    <div className="cost">
      {Object.entries(cost).map(([r, v]) => (
        <span
          key={r}
          className={`${r} ${resources[r] < v ? "insufficient" : ""}`}
        >
          <Icon name={RESOURCE_ICONS[r]} size={14} />
          {v}
        </span>
      ))}
    </div>
  );
}
export function Modal({
  title,
  kicker = "DAWN OF WARRIORS",
  children,
  onClose,
  wide = false,
  className = "",
}) {
  const ref = React.useRef();
  React.useEffect(() => {
    const prev = document.activeElement;
    ref.current?.focus();
    const fn = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll(
          'button:not(:disabled),input,select,a[href],[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", fn);
    return () => {
      window.removeEventListener("keydown", fn);
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""} ${className}`}
      >
        <header className="modal-header">
          <div>
            <span className="eyebrow">{kicker}</span>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-btn close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="X" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function Portrait({ character, large = false }) {
  if (!character || character.class === "Commander")
    return (
      <div className={`portrait ${large ? "large" : ""}`}>
        <img
          src="/assets/commander.jpg"
          alt={character?.name || "Commander Aelius Valerius"}
        />
      </div>
    );
  const c = character.appearance.color;
  const helm =
    character.class === "Spearman" || character.class === "Elite guard";
  const bow = ["Archer", "Crossbowman"].includes(character.class);
  const cav = character.class.toLowerCase().includes("cavalry");
  return (
    <div
      className={`portrait illustrated ${large ? "large" : ""}`}
      style={{ "--faction": c }}
    >
      <svg
        viewBox="0 0 120 130"
        role="img"
        aria-label={`${character.name}, ${character.appearance.armor}`}
      >
        <defs>
          <linearGradient id={`bg-${character.id}`} x2="1" y2="1">
            <stop stopColor={c} />
            <stop offset="1" stopColor="#182b2d" />
          </linearGradient>
        </defs>
        <rect width="120" height="130" fill={`url(#bg-${character.id})`} />
        <circle
          cx="60"
          cy="48"
          r="36"
          fill="none"
          stroke="#e7cd92"
          opacity=".18"
        />
        <path d="M15 130Q16 86 43 81H77Q106 91 110 130" fill={c} />
        <path d="M35 92L60 105 87 92 94 130H27Z" fill="#787f70" />
        <path d="M45 80V64H76V81L61 93Z" fill="#b79570" />
        <path
          d="M42 34Q60 19 80 36L78 65Q62 84 45 66Z"
          fill={
            ["shen"].includes(character.civilization) ? "#c4a881" : "#c8af8b"
          }
        />
        <path
          d="M41 47L42 31Q60 17 80 32L82 50 76 45 73 33 48 34 47 48Z"
          fill="#3f4237"
        />
        {helm ? (
          <>
            <path
              d="M36 47V34Q59 7 85 34V49L76 46 70 32 48 33 45 48Z"
              fill="#afb298"
            />
            <path d="M55 20L61 4 68 20" fill={c} />
            <path
              d="M35 48L41 67 47 71 45 45M81 45L76 72 85 66 86 47"
              fill="#a5a78b"
            />
          </>
        ) : (
          <path
            d="M44 32Q61 13 78 31L80 37 43 38Z"
            fill={bow ? "#9e9f7d" : "#b2ab8a"}
          />
        )}
        <path d="M48 49H55M66 49H73" stroke="#43493d" strokeWidth="2" />
        <path
          d="M54 65Q62 68 68 64"
          fill="none"
          stroke="#796349"
          strokeWidth="2"
        />
        <path d="M63 47L61 58H66" fill="none" stroke="#967854" />
        <path d="M39 94L81 122M83 94L43 122" stroke="#baab82" strokeWidth="4" />
        <circle cx="61" cy="107" r="7" fill="#bca46a" />
        {bow ? (
          <path
            d="M105 31Q79 77 105 118M105 31V118"
            stroke="#d4b77c"
            strokeWidth="3"
            fill="none"
          />
        ) : (
          <>
            <path d="M19 113V25" stroke="#b7bda8" strokeWidth={helm ? 3 : 6} />
            <path d="M17 25L20 7 24 25Z" fill="#d6dac7" />
            <path d="M12 88H28" stroke="#9c855b" strokeWidth="4" />
          </>
        )}
        {cav && <path d="M98 126L93 91 105 76 118 92 117 130" fill="#554d3d" />}
        <path d="M0 127H120" stroke="#c1a570" strokeWidth="6" />
      </svg>
    </div>
  );
}
export function Empty({ icon = "Info", children }) {
  return (
    <div className="empty">
      <Icon name={icon} size={36} />
      <p>{children}</p>
    </div>
  );
}
