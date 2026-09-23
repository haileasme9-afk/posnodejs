import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            width={20}
            height={20}
            {...props}
        >
            {children}
        </svg>
    );
}

export function DashboardIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
            <rect x="13.5" y="3" width="7.5" height="4.5" rx="1.6" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
            <rect x="13.5" y="10.5" width="7.5" height="10.5" rx="1.6" />
        </Svg>
    );
}

export function CartIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
            <path d="M2.5 3h2.2l2.3 11.2a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.55L21 7H6" />
        </Svg>
    );
}

export function BoxIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M20.5 7.8v8.4a1.6 1.6 0 0 1-.85 1.42l-7 3.6a1.6 1.6 0 0 1-1.46 0l-7-3.6A1.6 1.6 0 0 1 3.5 16.2V7.8a1.6 1.6 0 0 1 .85-1.42l7-3.6a1.6 1.6 0 0 1 1.46 0l7 3.6A1.6 1.6 0 0 1 20.5 7.8Z" />
            <path d="m3.8 6.9 8.2 4.2 8.2-4.2M12 11.1V21" />
        </Svg>
    );
}

export function ReceiptIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M5 3.5h14v17l-2.3-1.5-2.35 1.5L12 19l-2.35 1.5L7.3 19 5 20.5Z" />
            <path d="M9 8.5h6M9 12.5h6" />
        </Svg>
    );
}

export function LayersIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
            <path d="m4 12 8 4.3 8-4.3M4 16.4l8 4.3 8-4.3" />
        </Svg>
    );
}

export function UsersIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <circle cx="9.5" cy="8" r="3.4" />
            <path d="M3 20a6.5 6.5 0 0 1 13 0" />
            <path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.5M18 14.4A6.5 6.5 0 0 1 21.5 20" />
        </Svg>
    );
}

export function SettingsIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <circle cx="12" cy="12" r="3.1" />
            <path d="M19.4 14.6a1.5 1.5 0 0 0 .3 1.65l.05.05a1.85 1.85 0 1 1-2.6 2.6l-.06-.05a1.5 1.5 0 0 0-1.64-.3 1.5 1.5 0 0 0-.9 1.37V20a1.85 1.85 0 1 1-3.7 0v-.1a1.5 1.5 0 0 0-.98-1.37 1.5 1.5 0 0 0-1.64.3l-.05.05a1.85 1.85 0 1 1-2.6-2.6l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H4a1.85 1.85 0 1 1 0-3.7h.1a1.5 1.5 0 0 0 1.37-.98 1.5 1.5 0 0 0-.3-1.64l-.05-.05a1.85 1.85 0 1 1 2.6-2.6l.05.05a1.5 1.5 0 0 0 1.65.3h.07A1.5 1.5 0 0 0 10.4 4.1V4a1.85 1.85 0 1 1 3.7 0v.1a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.05a1.85 1.85 0 1 1 2.6 2.6l-.05.05a1.5 1.5 0 0 0-.3 1.65v.07a1.5 1.5 0 0 0 1.37.9H21a1.85 1.85 0 1 1 0 3.7h-.1a1.5 1.5 0 0 0-1.5.98Z" />
        </Svg>
    );
}

export function SearchIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <circle cx="11" cy="11" r="6.6" />
            <path d="m20 20-3.6-3.6" />
        </Svg>
    );
}

export function MenuIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M4 7h16M4 12h16M4 17h16" />
        </Svg>
    );
}

export function CloseIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M6 6l12 12M18 6 6 18" />
        </Svg>
    );
}

export function PlusIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M12 5v14M5 12h14" />
        </Svg>
    );
}

export function MinusIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M5 12h14" />
        </Svg>
    );
}

export function TrashIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M4 7h16M9.5 7V4.8h5V7M6.5 7l.8 12.2a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5L17.5 7" />
            <path d="M10.5 11v6M13.5 11v6" />
        </Svg>
    );
}

export function AlertIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M10.3 4.3 2.9 17.1a1.9 1.9 0 0 0 1.65 2.85h14.9A1.9 1.9 0 0 0 21.1 17L13.7 4.3a1.95 1.95 0 0 0-3.4 0Z" />
            <path d="M12 9.5v4M12 17h.01" />
        </Svg>
    );
}

export function CheckIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="m4.5 12.5 5 5 10-11" />
        </Svg>
    );
}

export function ArrowUpRightIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M7 17 17 7M9 7h8v8" />
        </Svg>
    );
}

export function CashIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <rect x="2.5" y="6" width="19" height="12" rx="2" />
            <circle cx="12" cy="12" r="2.6" />
            <path d="M6 12h.01M18 12h.01" />
        </Svg>
    );
}

export function CardIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
            <path d="M2.5 10h19M6 15h4" />
        </Svg>
    );
}

export function PhoneIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <rect x="6" y="2.5" width="12" height="19" rx="2.4" />
            <path d="M11 18.5h2" />
        </Svg>
    );
}

export function StoreIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M4 9.5V20h16V9.5" />
            <path d="M3 9.5 5 4h14l2 5.5a3 3 0 0 1-5.5 1.6 3 3 0 0 1-5 0 3 3 0 0 1-5.5-1.6Z" />
            <path d="M10 20v-5.5h4V20" />
        </Svg>
    );
}

export function BellIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M18 9a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16S18 14 18 9Z" />
            <path d="M13.7 19a2 2 0 0 1-3.4 0" />
        </Svg>
    );
}

export function PrinterIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M7 9V3.5h10V9" />
            <rect x="3.5" y="9" width="17" height="7.5" rx="2" />
            <path d="M7 14h10v6.5H7z" />
        </Svg>
    );
}

export function LogoutIcon(props: IconProps) {
    return (
        <Svg {...props}>
            <path d="M14 20H6.5A1.5 1.5 0 0 1 5 18.5v-13A1.5 1.5 0 0 1 6.5 4H14" />
            <path d="M17 8.5 20.5 12 17 15.5M20 12H9.5" />
        </Svg>
    );
}
